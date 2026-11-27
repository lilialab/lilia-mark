import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucideX } from '@lucide/angular';

import { AppSettingsStore } from '@/app/app-settings.store';
import { ConfirmDialogService } from '@/app/features/editor/confirm-dialog.service';
import { EditorStore } from '@/app/features/editor/editor.store';
import { defaultAppSettings } from '@/app/lib/tauri/storage';
import { AppButton } from '@/app/shared/directives/app-button';
import { AppModal } from '@/app/shared/ui/app-modal';
import { AppToast } from '@/app/shared/ui/app-toast';
import { errorMessage } from '@/app/utils/error-message';
import { filterUntitledExtensions, normalizeUntitledExt } from '@/app/utils/untitled';

/** 未命名文档：底栏扩展名弹框（筛选 / 点选 / 添加 / 删除 / 恢复默认）。 */
@Component({
  selector: 'app-untitled-ext-modal',
  imports: [AppButton, AppModal, FormsModule, LucideX, TranslocoPipe],
  templateUrl: './untitled-ext-modal.html',
})
export class UntitledExtModal {
  readonly open = input.required<boolean>();
  readonly closed = output<void>();

  private readonly editorStore = inject(EditorStore);
  private readonly settingsStore = inject(AppSettingsStore);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly transloco = inject(TranslocoService);
  private readonly appToast = inject(AppToast);

  readonly query = signal('');

  readonly currentExt = computed(
    () => this.editorStore.activeTab()?.untitledExt ?? '',
  );

  readonly extensions = this.settingsStore.untitledExtensions;
  readonly filtered = computed(() => filterUntitledExtensions(this.query(), this.extensions()));
  readonly normalizedQuery = computed(() => normalizeUntitledExt(this.query()));
  readonly canAdd = computed(() => {
    const next = this.normalizedQuery();
    return next !== null && !this.extensions().includes(next);
  });
  readonly showChipRow = computed(() => this.filtered().length > 0 || this.canAdd());

  constructor() {
    effect(() => {
      if (this.open()) {
        this.query.set('');
      }
    });
  }

  selectExt(raw: string): void {
    const next = normalizeUntitledExt(raw);
    if (next === null) {
      return;
    }
    this.editorStore.setActiveUntitledExt(next);
    this.closed.emit();
  }

  async addExt(): Promise<void> {
    const next = this.normalizedQuery();
    if (!this.canAdd() || next === null) {
      return;
    }
    try {
      await this.settingsStore.patch({
        untitledExtensions: [...this.settingsStore.untitledExtensions(), next],
      });
      this.query.set('');
    } catch (error) {
      this.appToast.error(
        this.transloco.translate('toast.saveFailed'),
        errorMessage(error),
      );
    }
  }

  async removeExt(ext: string): Promise<void> {
    try {
      await this.settingsStore.patch({
        untitledExtensions: this.settingsStore.untitledExtensions().filter(
          (item) => item !== ext,
        ),
      });
    } catch (error) {
      this.appToast.error(
        this.transloco.translate('toast.saveFailed'),
        errorMessage(error),
      );
    }
  }

  async resetExtList(): Promise<void> {
    const result = await this.confirmDialog.confirm({
      message: this.transloco.translate('editor.untitledExtResetMessage'),
      primaryLabel: this.transloco.translate('editor.untitledExtResetConfirm'),
      secondaryLabel: this.transloco.translate('editor.untitledExtResetCancel'),
    });
    if (result !== 'primary') {
      return;
    }
    try {
      const defaults = await defaultAppSettings();
      await this.settingsStore.patch({
        untitledExtensions: defaults.untitledExtensions,
      });
      this.query.set('');
    } catch (error) {
      this.appToast.error(
        this.transloco.translate('toast.saveFailed'),
        errorMessage(error),
      );
    }
  }
}
