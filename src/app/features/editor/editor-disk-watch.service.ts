import { DestroyRef, effect, inject, Injectable } from '@angular/core';

import { onDiskFileChanged, syncWatchedFiles } from '@/app/lib/tauri/fs';

import { EditorStore } from './editor.store';

/**
 * 磁盘监听编排（非 Store）：同步已打开路径 + 变更打标。
 * 自写抑制在 Rust；与 `EditorPage` 同生命周期（providers）。
 */
@Injectable()
export class EditorDiskWatchService {
  private readonly editorStore = inject(EditorStore);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.syncPathsOnTabsChange();
    this.listenDiskChanges();
  }

  /** 已落盘 tab 路径变化时同步 Rust 监听表 */
  private syncPathsOnTabsChange(): void {
    effect(() => {
      const paths = this.editorStore
        .tabs()
        .map((tab) => tab.path)
        .filter((path): path is string => path !== null);
      void syncWatchedFiles(paths);
    });
  }

  private listenDiskChanges(): void {
    let cleaned = false;
    let unlisten: (() => void) | undefined;
    void onDiskFileChanged((payload) => {
      this.editorStore.applyDiskChange(payload.path, payload.kind);
    }).then((fn) => {
      if (cleaned) {
        fn();
        return;
      }
      unlisten = fn;
    });
    this.destroyRef.onDestroy(() => {
      cleaned = true;
      unlisten?.();
    });
  }
}
