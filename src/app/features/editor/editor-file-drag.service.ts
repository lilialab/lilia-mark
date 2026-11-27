import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { classifyDropPaths, focusCurrentWindow, onDragDrop } from '@/app/lib/tauri/fs';

import { EditorIoService } from './editor-io.service';

/**
 * 窗口拖入打开编排；暴露 `active` 供遮罩。
 * 与 `EditorPage` 同生命周期（providers）。
 */
@Injectable()
export class EditorFileDragService {
  private readonly editorIo = inject(EditorIoService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly active = signal(false);

  constructor() {
    this.listen();
  }

  private listen(): void {
    let cancelled = false;
    const ready = onDragDrop((event) => {
      if (cancelled) {
        return;
      }
      if (event.type === 'enter') {
        this.active.set(true);
        return;
      }
      if (event.type === 'leave') {
        this.active.set(false);
        return;
      }
      if (event.type !== 'drop') {
        return;
      }
      this.active.set(false);
      void this.handleDrop(event.paths, () => cancelled);
    });

    this.destroyRef.onDestroy(() => {
      cancelled = true;
      this.active.set(false);
      void ready.then((unlisten) => unlisten());
    });
  }

  private async handleDrop(paths: string[], isCancelled: () => boolean): Promise<void> {
    try {
      await focusCurrentWindow();
      if (isCancelled()) {
        return;
      }
      const { files, hadDirectory } = await classifyDropPaths(paths);
      if (isCancelled()) {
        return;
      }
      if (hadDirectory) {
        this.editorIo.reportStatus(this.transloco.translate('toast.dropFilesOnly'));
      }
      for (const path of files) {
        if (isCancelled()) {
          return;
        }
        this.editorIo.openPath(path);
      }
    } catch (error) {
      if (!isCancelled()) {
        this.editorIo.reportOpenError(error);
      }
    }
  }
}
