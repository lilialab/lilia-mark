import { DestroyRef, inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { checkAppUpdate } from '@/app/lib/app-update';
import { openExternalUrl } from '@/app/lib/tauri/opener';
import { AppToast } from '@/app/shared/ui/app-toast';

const AUTO_CHECK_DELAY_MS = 2500;

/**
 * 启动后自动检查更新；菜单可手动检查。
 * 有新版本时 toast + 打开 Release 页；自动检查失败静默。
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateCheckService {
  private readonly appToast = inject(AppToast);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private autoStarted = false;

  /** 在编辑页构造时调用一次，启动延迟自动检查 */
  startAutoCheck(): void {
    if (this.autoStarted) {
      return;
    }
    this.autoStarted = true;
    const timer = window.setTimeout(() => {
      void this.run('auto');
    }, AUTO_CHECK_DELAY_MS);
    this.destroyRef.onDestroy(() => {
      window.clearTimeout(timer);
    });
  }

  checkForUpdates(): void {
    void this.run('manual');
  }

  private async run(mode: 'auto' | 'manual'): Promise<void> {
    const result = await checkAppUpdate();

    if (result.status === 'update-available') {
      this.appToast.info(
        this.transloco.translate('toast.updateAvailable', { version: result.latestVersion }),
        {
          description: this.transloco.translate('toast.updateAvailableHint'),
          durationMs: 20_000,
          action: {
            label: this.transloco.translate('toast.updateOpen'),
            run: () => {
              void openExternalUrl(result.releaseUrl);
            },
          },
        },
      );
      return;
    }

    if (mode === 'auto') {
      return;
    }

    if (result.status === 'up-to-date') {
      this.appToast.success(
        this.transloco.translate('toast.updateUpToDate', { version: result.currentVersion }),
      );
      return;
    }

    this.appToast.error(
      this.transloco.translate('toast.updateCheckFailed'),
      result.reason,
    );
  }
}
