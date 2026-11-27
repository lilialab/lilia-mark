import { DestroyRef, inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { destroyCurrentWindow, onWindowCloseRequested } from '@/app/lib/tauri/fs';

import { ConfirmDialogService } from './confirm-dialog.service';
import { EditorStore } from './editor.store';
import { EditorIoService } from './editor-io.service';

/**
 * 关窗口未保存确认：有脏则 preventDefault → 确认 → 可选保存后 destroy。
 */
@Injectable()
export class EditorUnsavedCloseService {
  private readonly editorStore = inject(EditorStore);
  private readonly editorIo = inject(EditorIoService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const ready = onWindowCloseRequested(async (event) => {
      const dirtyCount = this.editorStore.tabs().filter((tab) => tab.dirty).length;
      if (dirtyCount === 0) {
        return;
      }
      event.preventDefault();
      const shouldClose = await this.decideClose(dirtyCount);
      if (shouldClose) {
        await destroyCurrentWindow();
      }
    });
    this.destroyRef.onDestroy(() => {
      void ready.then((unlisten) => unlisten());
    });
  }

  private async decideClose(count: number): Promise<boolean> {
    const result = await this.confirmDialog.confirm({
      message: this.transloco.translate('dialog.discardUnsavedTabs', { count }),
      primaryLabel: this.transloco.translate('dialog.save'),
      secondaryLabel: this.transloco.translate('dialog.discard'),
    });
    if (result === 'cancel') {
      return false;
    }
    if (result === 'secondary') {
      return true;
    }
    return await this.editorIo.saveAllDirtyTabs();
  }
}
