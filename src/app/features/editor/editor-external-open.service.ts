import { DestroyRef, effect, inject, Injectable } from '@angular/core';

import { onOpenFilePath, takePendingOpenPath } from '@/app/lib/tauri/fs';

import { EditorIoService } from './editor-io.service';
import { EditorSessionService } from './editor-session.service';

/**
 * 冷启动 pending + 运行中「打开方式」/二次实例。
 * 须在会话恢复完成后再听，避免与恢复 tabs 抢开。
 */
@Injectable()
export class EditorExternalOpenService {
  private readonly editorIo = inject(EditorIoService);
  private readonly editorSession = inject(EditorSessionService);
  private readonly destroyRef = inject(DestroyRef);

  private started = false;

  constructor() {
    effect(() => {
      if (!this.editorSession.ready() || this.started) {
        return;
      }
      this.started = true;
      this.startListening();
    });
  }

  private startListening(): void {
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    void (async () => {
      const fn = await onOpenFilePath((filePath) => {
        if (!cancelled) {
          this.editorIo.openPath(filePath);
        }
      });
      if (cancelled) {
        fn();
        return;
      }
      unlisten = fn;

      const pending = await takePendingOpenPath();
      if (pending && !cancelled) {
        this.editorIo.openPath(pending);
      }
    })();

    this.destroyRef.onDestroy(() => {
      cancelled = true;
      unlisten?.();
    });
  }
}
