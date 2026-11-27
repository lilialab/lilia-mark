import { Component, effect, inject, signal, viewChildren } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { AppSettingsStore } from '@/app/app-settings.store';
import { CodeEditor } from '@/app/features/code-editor/code-editor';
import { PreviewOverlay } from '@/app/features/preview/preview-overlay';
import { openLocalPath } from '@/app/lib/tauri/opener';
import { ConfirmDialog } from '@/app/shared/ui/confirm-dialog';
import type { EditorTab } from '@/app/types/editor-tab';
import type { EditorCaretStatus } from '@/app/utils/editor-status';
import { fileName } from '@/app/utils/path';
import { sniffUntitledExt } from '@/app/utils/sniff-untitled-ext';
import { markStartupUiReady } from '@/app/utils/startup-timing';
import { tabLanguagePath } from '@/app/utils/untitled';

import { AppUpdateCheckService } from './app-update-check.service';
import { AppMenu } from './components/app-menu/app-menu';
import { DiskChangeBanner } from './components/disk-change-banner/disk-change-banner';
import { EditorStatusBar } from './components/editor-status-bar/editor-status-bar';
import { EditorTabBar } from './components/editor-tab-bar/editor-tab-bar';
import { FileDragOverlay } from './components/file-drag-overlay/file-drag-overlay';
import { MarkdownCheatSheetOverlay } from './components/markdown-cheat-sheet-overlay/markdown-cheat-sheet-overlay';
import { SettingsOverlay } from './components/settings-overlay/settings-overlay';
import { ShortcutsOverlay } from './components/shortcuts-overlay/shortcuts-overlay';
import { StartupTimingOverlay } from './components/startup-timing-overlay/startup-timing-overlay';
import { ConfirmDialogService } from './confirm-dialog.service';
import { EditorStore } from './editor.store';
import { EditorBlockBrowserShortcutsService } from './editor-block-browser-shortcuts.service';
import { EditorDiskWatchService } from './editor-disk-watch.service';
import { EditorExternalOpenService } from './editor-external-open.service';
import { EditorFileDragService } from './editor-file-drag.service';
import { EditorHotkeysService } from './editor-hotkeys.service';
import { EditorIoService } from './editor-io.service';
import { EditorSaveOnBlurService } from './editor-save-on-blur.service';
import { EditorSessionService } from './editor-session.service';
import { EditorUnsavedCloseService } from './editor-unsaved-close.service';

/** 编辑页壳：接线 Store / 会话与 IO 服务 / 预览；会话状态在 EditorStore。 */
@Component({
  selector: 'app-editor-page',
  providers: [
    EditorStore,
    EditorSessionService,
    EditorIoService,
    EditorDiskWatchService,
    EditorFileDragService,
    EditorExternalOpenService,
    EditorSaveOnBlurService,
    EditorUnsavedCloseService,
    EditorHotkeysService,
    EditorBlockBrowserShortcutsService,
    ConfirmDialogService,
  ],
  imports: [
    AppMenu,
    CodeEditor,
    ConfirmDialog,
    DiskChangeBanner,
    EditorStatusBar,
    EditorTabBar,
    FileDragOverlay,
    MarkdownCheatSheetOverlay,
    PreviewOverlay,
    SettingsOverlay,
    ShortcutsOverlay,
    StartupTimingOverlay,
    TranslocoPipe,
  ],
  templateUrl: './editor.page.html',
  host: {
    class: 'relative flex h-full min-h-0 flex-col',
  },
})
export class EditorPage {
  readonly editorStore = inject(EditorStore);
  readonly settingsStore = inject(AppSettingsStore);
  readonly editorSession = inject(EditorSessionService);
  readonly editorIo = inject(EditorIoService);
  readonly fileDrag = inject(EditorFileDragService);
  readonly confirmDialog = inject(ConfirmDialogService);
  private readonly hotkeys = inject(EditorHotkeysService);
  private readonly updateCheck = inject(AppUpdateCheckService);
  private readonly transloco = inject(TranslocoService);
  private readonly editors = viewChildren(CodeEditor);

  readonly settingsOpen = signal(false);
  readonly shortcutsOpen = signal(false);
  readonly cheatSheetOpen = signal(false);
  readonly startupTimingOpen = signal(false);
  readonly previewOpen = signal(false);
  readonly previewSource = signal('');
  /** 供预览层 HTML「用浏览器打开」 */
  readonly openHtmlInBrowserFn = () => this.openHtmlInBrowser();

  constructor() {
    inject(EditorDiskWatchService);
    inject(EditorExternalOpenService);
    inject(EditorSaveOnBlurService);
    inject(EditorUnsavedCloseService);
    inject(EditorBlockBrowserShortcutsService);

    this.editorIo.bindBridge({
      getDoc: (tabId) => this.editorOf(tabId)?.getDoc() ?? null,
      format: (tabId, languagePath, indentSize) =>
        this.editorOf(tabId)?.formatDocument(languagePath, indentSize)
          ?? Promise.resolve(null),
      afterFormat: (tabId) => this.refreshPreviewIfOpen(tabId),
    });

    this.hotkeys.bindHandlers({
      isPreviewOpen: () => this.previewOpen(),
      closePreview: () => this.previewOpen.set(false),
      togglePreview: () => this.togglePreview(),
      closeActiveTab: () => {
        const id = this.editorStore.activeId();
        if (id === null) {
          return;
        }
        void this.onCloseTab(id);
      },
      selectAllInEditor: () => this.selectAllInActiveEditor(),
    });

    this.updateCheck.startAutoCheck();
    markStartupUiReady();
    this.syncActiveCaretFromEditors();
    this.syncPreviewSourceOnActiveTab();
  }

  checkForUpdates(): void {
    this.updateCheck.checkForUpdates();
  }

  languagePathFor(tab: EditorTab): string {
    return tabLanguagePath(tab);
  }

  busyMessageFor(tabId: string): string | null {
    return this.editorIo.busyMessage(tabId);
  }

  togglePreview(): void {
    const id = this.editorStore.activeId();
    if (id === null) {
      return;
    }
    if (!this.previewOpen()) {
      this.previewSource.set(this.editorOf(id)?.getDoc() ?? '');
    }
    this.previewOpen.update((open) => !open);
  }

  async openHtmlInBrowser(): Promise<void> {
    const path = this.editorStore.activeTab()?.path;
    if (path === null || path === undefined) {
      this.editorIo.reportOpenFailed('invalidPath');
      return;
    }
    const ok = await openLocalPath(path);
    if (!ok) {
      this.editorIo.reportOpenFailed('openWithSystemFailed');
    }
  }

  async onCloseTab(id: string): Promise<void> {
    const tab = this.editorStore.tabs().find((item) => item.id === id);
    if (!tab) {
      return;
    }
    if (tab.dirty) {
      const title = tab.path === null
        ? `${this.transloco.translate('editor.untitled')}.${tab.untitledExt}`
        : fileName(tab.path);
      const result = await this.confirmDialog.confirm({
        message: this.transloco.translate('dialog.discardChanges', { title }),
        primaryLabel: this.transloco.translate('dialog.save'),
        secondaryLabel: this.transloco.translate('dialog.discard'),
      });
      if (result === 'cancel') {
        return;
      }
      if (result === 'primary' && !(await this.editorIo.saveTabOrAs(id))) {
        return;
      }
    }
    this.editorStore.closeTab(id);
  }

  onReady(tabId: string): void {
    if (tabId !== this.editorStore.activeId()) {
      return;
    }
    this.editorStore.setCaretStatus(this.editorOf(tabId)?.getCaretStatus() ?? null);
    this.refreshPreviewIfOpen(tabId);
  }

  onCaretStatus(tabId: string, status: EditorCaretStatus): void {
    if (tabId !== this.editorStore.activeId()) {
      return;
    }
    this.editorStore.setCaretStatus(status);
  }

  onDirty(tabId: string): void {
    this.editorStore.markDirty(tabId);
    this.refreshPreviewIfOpen(tabId);
  }

  onPathResolved(tabId: string, path: string): void {
    this.editorStore.resolvePath(tabId, path);
  }

  onLoadError(tabId: string, error: unknown): void {
    this.editorIo.reportOpenError(error);
    this.editorStore.removeTab(tabId);
  }

  onEmptyPaste(tabId: string, text: string): void {
    const ext = sniffUntitledExt(text);
    if (ext === null) {
      return;
    }
    this.editorStore.applySniffedExt(tabId, ext);
  }

  /**
   * 底栏光标：依赖 `activeId` + `viewChildren(CodeEditor)`。
   * 切 tab / 编辑器挂载或销毁时，从对应宿主刷 `caretStatus`。
   */
  private syncActiveCaretFromEditors(): void {
    effect(() => {
      const id = this.editorStore.activeId();
      const editors = this.editors();
      if (id === null) {
        this.editorStore.setCaretStatus(null);
        return;
      }
      const editor = editors.find((e) => e.tabId() === id);
      this.editorStore.setCaretStatus(editor?.getCaretStatus() ?? null);
    });
  }

  /**
   * 预览正文：依赖 `previewOpen` + `activeId` + editors。
   * 无活跃 tab 时关预览；预览打开时随切 tab 刷新快照。
   */
  private syncPreviewSourceOnActiveTab(): void {
    effect(() => {
      const id = this.editorStore.activeId();
      const open = this.previewOpen();
      this.editors();
      if (id === null) {
        this.previewOpen.set(false);
        return;
      }
      if (!open) {
        return;
      }
      const doc = this.editorOf(id)?.getDoc();
      if (doc !== null && doc !== undefined) {
        this.previewSource.set(doc);
      }
    });
  }

  private selectAllInActiveEditor(): void {
    const id = this.editorStore.activeId();
    if (id === null) {
      return;
    }
    this.editorOf(id)?.selectAllInView();
  }

  private refreshPreviewIfOpen(tabId: string): void {
    if (!this.previewOpen() || tabId !== this.editorStore.activeId()) {
      return;
    }
    const doc = this.editorOf(tabId)?.getDoc();
    if (doc !== null && doc !== undefined) {
      this.previewSource.set(doc);
    }
  }

  private editorOf(tabId: string): CodeEditor | undefined {
    return this.editors().find((e) => e.tabId() === tabId);
  }
}
