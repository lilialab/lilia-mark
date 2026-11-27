import { Component, effect, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideX } from '@lucide/angular';

import { AppButton } from '@/app/shared/directives/app-button';

/**
 * 通用模态框：固定遮罩；Esc / 右上角 × 关闭；顶栏标题；中间可滚动；可选底栏投影。
 * 底栏：`<div appModalFooter>…</div>`。
 */
@Component({
  selector: 'app-modal',
  imports: [AppButton, LucideX, TranslocoPipe],
  templateUrl: './app-modal.html',
})
export class AppModal {
  readonly open = input.required<boolean>();
  readonly title = input.required<string>();
  /** 默认 i18n `dialog.close` */
  readonly closeLabel = input<string | undefined>(undefined);
  /** 面板最大宽度等，默认 max-w-lg */
  readonly panelClass = input('max-w-lg');
  /** 遮罩层额外 class（如 z-40）；默认 z-30 */
  readonly overlayClass = input('');
  readonly closed = output<void>();

  constructor() {
    effect((onCleanup) => {
      if (!this.open()) {
        return;
      }

      const onKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          this.closed.emit();
        }
      };

      window.addEventListener('keydown', onKeyDown, true);
      onCleanup(() => {
        window.removeEventListener('keydown', onKeyDown, true);
      });
    });
  }
}
