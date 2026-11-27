import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

/** 拖入文件时的「松开以打开」遮罩。 */
@Component({
  selector: 'app-file-drag-overlay',
  imports: [TranslocoPipe],
  template: `
    @if (active()) {
      <div
        class="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-(--app-overlay-scrim)"
        aria-live="polite"
      >
        <p class="rounded-md bg-(--app-overlay-card) px-5 py-2.5 text-sm text-(--app-fg)">
          {{ 'drag.releaseToOpen' | transloco }}
        </p>
      </div>
    }
  `,
})
export class FileDragOverlay {
  readonly active = input.required<boolean>();
}
