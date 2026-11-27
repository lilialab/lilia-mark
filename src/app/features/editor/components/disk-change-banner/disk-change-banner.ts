import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { AppButton } from '@/app/shared/directives/app-button';
import type { DiskChangeKind } from '@/app/types/disk-file-changed';

/** 活跃 tab 的磁盘变更横幅：删除提示 / 重载 / 冲突保留或用磁盘。 */
@Component({
  selector: 'app-disk-change-banner',
  imports: [AppButton, TranslocoPipe],
  templateUrl: './disk-change-banner.html',
  host: {
    class:
      'flex shrink-0 items-center gap-3 border-b border-(--app-warn-border) bg-(--app-warn-bg) px-3 py-2 text-sm text-(--app-warn-fg)',
  },
})
export class DiskChangeBanner {
  /** 由页面在非 null 时再挂载 */
  readonly diskChange = input.required<DiskChangeKind>();
  readonly dirty = input.required<boolean>();
  readonly reload = output<void>();
  readonly keepEdits = output<void>();
}
