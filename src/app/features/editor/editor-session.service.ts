import { effect, inject, Injectable, signal } from '@angular/core';

import { loadEditorSession, saveEditorSession } from '@/app/lib/tauri/storage';
import { editorSessionFromTabs } from '@/app/utils/editor-session';
import { reportStartupTiming, startupMark } from '@/app/utils/startup-timing';

import { EditorStore } from './editor.store';

/**
 * 编辑会话编排（非 Store）：启动恢复 + 变更落盘。
 * 与 `EditorPage` 同生命周期（providers）。
 */
@Injectable()
export class EditorSessionService {
  private readonly editorStore = inject(EditorStore);

  /** 已恢复（或跳过）；此前不写盘、不显示空态 */
  readonly ready = signal(false);

  constructor() {
    void this.restore();
    this.persistOnChange();
  }

  /** 启动读盘恢复标签；完成后才允许空态与会话写盘。 */
  private async restore(): Promise<void> {
    try {
      const session = await loadEditorSession();
      this.editorStore.restoreFromSession(session);
    } catch (error) {
      console.error(error);
    } finally {
      this.ready.set(true);
      startupMark('session-done');
      void reportStartupTiming();
    }
  }

  /**
   * 会话落盘：依赖 `ready` + `tabs` + `activeId`。
   * 恢复完成前不写；之后标签增删/排序/切换/路径变化都会保存（未命名不入 paths）。
   */
  private persistOnChange(): void {
    effect(() => {
      if (!this.ready()) {
        return;
      }
      const session = editorSessionFromTabs(
        this.editorStore.tabs(),
        this.editorStore.activeId(),
      );
      void saveEditorSession(session);
    });
  }
}
