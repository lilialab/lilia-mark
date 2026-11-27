import { DestroyRef, inject, Injectable } from '@angular/core';

import { AppSettingsStore } from '@/app/app-settings.store';
import { onWindowFocusChanged } from '@/app/lib/tauri/fs';
import { LARGE_DOC_MAX_LENGTH } from '@/app/utils/doc-limits';

import { EditorStore } from './editor.store';
import { EditorIoService } from './editor-io.service';

/**
 * 窗口失焦自动保存（受设置 `saveOnBlur` 控制）。
 * 仅已落盘脏 tab；跳过未命名与超大文档。
 */
@Injectable()
export class EditorSaveOnBlurService {
  private readonly editorStore = inject(EditorStore);
  private readonly editorIo = inject(EditorIoService);
  private readonly settingsStore = inject(AppSettingsStore);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const ready = onWindowFocusChanged((focused) => {
      if (!focused) {
        void this.onBlur();
      }
    });
    this.destroyRef.onDestroy(() => {
      void ready.then((unlisten) => unlisten());
    });
  }

  private async onBlur(): Promise<void> {
    if (!this.settingsStore.settings()?.saveOnBlur) {
      return;
    }
    const ids = this.editorStore
      .tabs()
      .filter((tab) => {
        if (!tab.dirty || tab.path === null) {
          return false;
        }
        const doc = this.editorIo.readDoc(tab.id);
        return doc !== null && doc.length <= LARGE_DOC_MAX_LENGTH;
      })
      .map((tab) => tab.id);

    for (const id of ids) {
      await this.editorIo.saveTab(id);
    }
  }
}
