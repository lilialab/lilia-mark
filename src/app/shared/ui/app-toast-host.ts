import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  LucideCircleAlert,
  LucideCircleCheck,
  LucideInfo,
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';

import { AppButton } from '@/app/shared/directives/app-button';

import { AppToast } from './app-toast';

/** 顶栏 toast 列表宿主；由 `app-root` 挂载。 */
@Component({
  selector: 'app-toast-host',
  imports: [
    AppButton,
    LucideCircleAlert,
    LucideCircleCheck,
    LucideInfo,
    LucideTriangleAlert,
    LucideX,
    TranslocoPipe,
  ],
  templateUrl: './app-toast-host.html',
  host: {
    class: 'pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 p-3',
    'aria-live': 'polite',
  },
})
export class AppToastHost {
  readonly appToast = inject(AppToast);
  readonly iconSize = 18;

  runAction(id: string, run: () => void): void {
    run();
    this.appToast.dismiss(id);
  }
}
