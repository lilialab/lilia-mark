import { inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { AppSettingsStore } from '@/app/app-settings.store';
import { supportsDocumentFormat } from '@/app/features/code-editor/format-document';
import { pickSaveTextFile, pickTextFile, writeTextFile } from '@/app/lib/tauri/fs';
import { AppToast } from '@/app/shared/ui/app-toast';
import { LARGE_DOC_MAX_LENGTH } from '@/app/utils/doc-limits';
import { errorMessage } from '@/app/utils/error-message';
import { fileName } from '@/app/utils/path';
import { tabLanguagePath } from '@/app/utils/untitled';

import { EditorStore } from './editor.store';

/** 按 tab 读 CM 正文；未就绪为 null */
export type EditorDocReader = (tabId: string) => string | null;

/** 格式化写回；未挂载为 null */
export type EditorFormatFn = (
  tabId: string,
  languagePath: string,
  indentSize: number,
) => Promise<'formatted' | 'unchanged' | 'unsupported' | null>;

/** 页面注入的编辑器桥（读正文 / 格式化 / 预览刷新） */
export interface EditorIoBridge {
  getDoc: EditorDocReader;
  format: EditorFormatFn;
  afterFormat: (tabId: string) => void;
}

/**
 * 开改存 / 格式化编排（非 Store）：文件对话框 + 写盘 + busy。
 * 与 `EditorPage` 同生命周期（providers）。
 */
@Injectable()
export class EditorIoService {
  private readonly editorStore = inject(EditorStore);
  private readonly settingsStore = inject(AppSettingsStore);
  private readonly transloco = inject(TranslocoService);
  private readonly appToast = inject(AppToast);

  private readonly formattingIds = signal(new Set<string>());
  private readonly savingIds = signal(new Set<string>());

  private bridge: EditorIoBridge | null = null;

  /** 由 EditorPage 绑定 CM 桥 */
  bindBridge(bridge: EditorIoBridge): void {
    this.bridge = bridge;
  }

  /** 读 tab 正文；未绑定或未挂载为 null */
  readDoc(tabId: string): string | null {
    return this.bridge?.getDoc(tabId) ?? null;
  }

  busyMessage(tabId: string): string | null {
    if (this.formattingIds().has(tabId)) {
      return this.transloco.translate('editor.busyFormatting');
    }
    if (this.savingIds().has(tabId)) {
      return this.transloco.translate('editor.busySaving');
    }
    return null;
  }

  async openFile(): Promise<void> {
    try {
      const path = await pickTextFile();
      if (path === null) {
        return;
      }
      this.editorStore.focusOrOpenPath(path);
    } catch (error) {
      this.reportOpenError(error);
    }
  }

  /** 打开路径（拖入 / 外部打开） */
  openPath(path: string): void {
    this.editorStore.focusOrOpenPath(path);
  }

  async save(): Promise<void> {
    const tab = this.editorStore.activeTab();
    if (!tab) {
      return;
    }
    if (tab.path === null) {
      await this.saveTabAs(tab.id);
      return;
    }
    await this.saveTab(tab.id, { requireReadyError: true });
  }

  async saveAs(): Promise<void> {
    const id = this.editorStore.activeId();
    if (id === null) {
      return;
    }
    await this.saveTabAs(id);
  }

  /** 有路径则保存，未命名则另存为 */
  async saveTabOrAs(tabId: string): Promise<boolean> {
    const tab = this.editorStore.tabs().find((item) => item.id === tabId);
    if (!tab) {
      return false;
    }
    if (tab.path === null) {
      return await this.saveTabAs(tabId);
    }
    return await this.saveTab(tabId, { requireReadyError: true });
  }

  /** 退出前保存全部脏标签（含未命名）；任一取消/失败则 false */
  async saveAllDirtyTabs(): Promise<boolean> {
    const dirtyIds = this.editorStore.tabs().filter((tab) => tab.dirty).map((tab) => tab.id);
    for (const id of dirtyIds) {
      if (!(await this.saveTabOrAs(id))) {
        return false;
      }
    }
    return true;
  }

  /**
   * 保存已落盘脏标签。成功 true。
   * 写盘期间正文又变则保持 dirty。
   */
  async saveTab(
    tabId: string,
    options?: { requireReadyError?: boolean },
  ): Promise<boolean> {
    const tab = this.editorStore.tabs().find((item) => item.id === tabId);
    if (!tab?.dirty || tab.path === null) {
      return true;
    }
    if (this.savingIds().has(tabId)) {
      return false;
    }

    await this.formatTabBeforeSave(tabId);

    const getDoc = this.bridge?.getDoc;
    if (!getDoc) {
      return false;
    }
    const content = getDoc(tabId);
    if (content === null) {
      if (options?.requireReadyError) {
        this.appToast.error(
          this.transloco.translate('toast.saveFailed'),
          this.transloco.translate('toast.editorNotReady'),
        );
      }
      return false;
    }

    this.addBusy(this.savingIds, tabId);
    try {
      await writeTextFile(tab.path, content);
      const latest = getDoc(tabId);
      if (latest !== null && latest !== content) {
        return true;
      }
      this.editorStore.markSaved(tabId);
      return true;
    } catch (error) {
      this.appToast.error(
        this.transloco.translate('toast.saveFailed'),
        errorMessage(error),
      );
      return false;
    } finally {
      this.removeBusy(this.savingIds, tabId);
    }
  }

  /** 另存为；取消或失败 false */
  async saveTabAs(tabId: string): Promise<boolean> {
    const tab = this.editorStore.tabs().find((item) => item.id === tabId);
    if (!tab) {
      return false;
    }
    if (this.savingIds().has(tabId)) {
      return false;
    }

    await this.formatTabBeforeSave(tabId);

    const getDoc = this.bridge?.getDoc;
    if (!getDoc) {
      return false;
    }
    const content = getDoc(tabId);
    if (content === null) {
      this.appToast.error(
        this.transloco.translate('toast.saveFailed'),
        this.transloco.translate('toast.editorNotReady'),
      );
      return false;
    }

    this.addBusy(this.savingIds, tabId);
    const defaultName = tab.path === null
      ? `${this.transloco.translate('editor.untitled')}.${tab.untitledExt}`
      : fileName(tab.path);
    try {
      const path = await pickSaveTextFile(defaultName);
      if (path === null) {
        return false;
      }
      await writeTextFile(path, content);
      const latest = getDoc(tabId);
      const clearDirty = latest === null || latest === content;
      this.editorStore.promotePath(tabId, path, clearDirty);
      return true;
    } catch (error) {
      this.appToast.error(
        this.transloco.translate('toast.saveFailed'),
        errorMessage(error),
      );
      return false;
    } finally {
      this.removeBusy(this.savingIds, tabId);
    }
  }

  /** Shift+Alt+F：活跃 tab 整篇格式化 */
  async formatActiveDocument(): Promise<void> {
    const tab = this.editorStore.activeTab();
    if (!tab) {
      return;
    }
    const tabId = tab.id;
    if (this.formattingIds().has(tabId)) {
      return;
    }
    const languagePath = tabLanguagePath(tab);
    if (!supportsDocumentFormat(languagePath)) {
      this.appToast.error(this.transloco.translate('toast.formatUnsupported'));
      return;
    }
    const format = this.bridge?.format;
    if (!format) {
      return;
    }
    const indentSize = this.settingsStore.indentSize();
    this.addBusy(this.formattingIds, tabId);
    try {
      const result = await format(tabId, languagePath, indentSize);
      if (result === null) {
        this.appToast.error(
          this.transloco.translate('toast.formatFailed'),
          this.transloco.translate('toast.editorNotReady'),
        );
        return;
      }
      this.bridge?.afterFormat(tabId);
    } catch (error) {
      this.appToast.error(
        this.transloco.translate('toast.formatFailed'),
        errorMessage(error),
      );
    } finally {
      this.removeBusy(this.formattingIds, tabId);
    }
  }

  reportOpenError(error: unknown): void {
    this.appToast.error(
      this.transloco.translate('toast.openFailed'),
      errorMessage(error),
    );
  }

  reportStatus(message: string): void {
    this.appToast.warning(message);
  }

  reportOpenFailed(detailKey: 'invalidPath' | 'openWithSystemFailed'): void {
    const titleKey = detailKey === 'invalidPath' ? 'toast.cannotOpen' : 'toast.openFailed';
    this.appToast.error(
      this.transloco.translate(titleKey),
      this.transloco.translate(`toast.${detailKey}`),
    );
  }

  /** 设置开启且体积未超限时，保存前格式化；失败只报错，仍继续存 */
  private async formatTabBeforeSave(tabId: string): Promise<void> {
    if (this.formattingIds().has(tabId)) {
      return;
    }
    const tab = this.editorStore.tabs().find((item) => item.id === tabId);
    const bridge = this.bridge;
    if (!tab || !bridge) {
      return;
    }
    const settings = this.settingsStore.settings();
    if (!settings?.formatOnSave) {
      return;
    }
    const languagePath = tabLanguagePath(tab);
    if (!supportsDocumentFormat(languagePath)) {
      return;
    }
    const doc = bridge.getDoc(tabId);
    if (doc === null || doc.length > LARGE_DOC_MAX_LENGTH) {
      return;
    }

    this.addBusy(this.formattingIds, tabId);
    try {
      await bridge.format(tabId, languagePath, settings.indentSize);
      bridge.afterFormat(tabId);
    } catch (error) {
      this.appToast.error(
        this.transloco.translate('toast.formatFailed'),
        errorMessage(error),
      );
    } finally {
      this.removeBusy(this.formattingIds, tabId);
    }
  }

  private addBusy(target: typeof this.savingIds, tabId: string): void {
    const next = new Set(target());
    next.add(tabId);
    target.set(next);
  }

  private removeBusy(target: typeof this.savingIds, tabId: string): void {
    const next = new Set(target());
    next.delete(tabId);
    target.set(next);
  }
}
