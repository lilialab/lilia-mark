import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { AppButton } from '@/app/shared/directives/app-button';

import { AppModal } from './app-modal';

/** 应用内确认：× / Esc / 遮罩 = 取消；主 / 次按钮由调用方命名。 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [AppButton, AppModal, TranslocoPipe],
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  readonly open = input.required<boolean>();
  /** 默认 i18n `dialog.title` */
  readonly title = input<string | undefined>(undefined);
  readonly message = input.required<string>();
  readonly primaryLabel = input.required<string>();
  readonly secondaryLabel = input.required<string>();
  readonly closeLabel = input<string | undefined>(undefined);

  readonly primary = output<void>();
  readonly secondary = output<void>();
  readonly cancelled = output<void>();
}
