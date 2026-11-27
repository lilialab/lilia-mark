import { Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { AppModal } from '@/app/shared/ui/app-modal';
import { getLastStartupTiming } from '@/app/utils/startup-timing';

/** 冷启动耗时（临时调试；上线前可整段删除） */
@Component({
  selector: 'app-startup-timing-overlay',
  imports: [AppModal, TranslocoPipe],
  templateUrl: './startup-timing-overlay.html',
})
export class StartupTimingOverlay {
  readonly open = input.required<boolean>();
  readonly closed = output<void>();

  /** 打开时再读一次，避免启动完成前为空 */
  readonly rows = computed(() => {
    if (!this.open()) {
      return [];
    }
    return getLastStartupTiming();
  });
}
