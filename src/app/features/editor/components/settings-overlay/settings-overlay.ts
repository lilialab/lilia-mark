import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { getVersion } from '@tauri-apps/api/app';

import { AppSettingsStore } from '@/app/app-settings.store';
import { AppButton } from '@/app/shared/directives/app-button';
import { AppModal } from '@/app/shared/ui/app-modal';
import { AppToast } from '@/app/shared/ui/app-toast';
import { type AppSettings, INDENT_SIZES } from '@/app/types/app-settings';
import { errorMessage } from '@/app/utils/error-message';
import { isValidFontSize, MAX_FONT_SIZE, MIN_FONT_SIZE } from '@/theme/fonts';

import { SettingsSection } from './settings-section';

const FIELD_CLASS =
  'w-full rounded border border-(--app-border) bg-(--app-bg) px-3 py-2 font-mono text-sm text-(--app-fg) outline-none focus:border-(--app-link)';

/** 设置浮层草稿：与落盘同形，不含词表（词表在后缀弹框改） */
type SettingsFormDraft = Omit<AppSettings, 'untitledExtensions'>;

/** 设置浮层：本地表单草稿，保存时写入 AppSettingsStore。 */
@Component({
  selector: 'app-settings-overlay',
  imports: [AppButton, AppModal, FormsModule, SettingsSection, TranslocoPipe],
  templateUrl: './settings-overlay.html',
})
export class SettingsOverlay {
  readonly open = input.required<boolean>();
  readonly closed = output<void>();

  private readonly settingsStore = inject(AppSettingsStore);
  private readonly transloco = inject(TranslocoService);
  private readonly appToast = inject(AppToast);

  readonly indentSizes = INDENT_SIZES;
  readonly minFontSize = MIN_FONT_SIZE;
  readonly maxFontSize = MAX_FONT_SIZE;
  readonly fieldClass = FIELD_CLASS;

  readonly draft = signal<SettingsFormDraft | null>(null);
  readonly saving = signal(false);
  readonly version = signal<string | null>(null);

  readonly localeOptions = [
    { value: 'system' as const, labelKey: 'settings.languageSystem' },
    { value: 'zh' as const, labelKey: 'settings.languageZh' },
    { value: 'en' as const, labelKey: 'settings.languageEn' },
  ];

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }
      const stored = this.settingsStore.settings();
      if (stored === null) {
        return;
      }
      const { untitledExtensions: _ext, ...form } = stored;
      this.draft.set(form);
    });

    effect((onCleanup) => {
      if (!this.open()) {
        return;
      }

      let cancelled = false;

      async function loadVersion(setVersion: (value: string | null) => void): Promise<void> {
        try {
          const next = await getVersion();
          if (!cancelled) {
            setVersion(next);
          }
        } catch {
          if (!cancelled) {
            setVersion(null);
          }
        }
      }

      void loadVersion((value) => this.version.set(value));

      onCleanup(() => {
        cancelled = true;
      });
    });
  }

  patchDraft(partial: Partial<SettingsFormDraft>): void {
    const current = this.draft();
    if (!current) {
      return;
    }
    this.draft.set({ ...current, ...partial });
  }

  /** number input 可能给出 null；非法时不写入草稿 */
  onFontSizeChange(value: number | null): void {
    if (value === null || !Number.isFinite(value)) {
      return;
    }
    this.patchDraft({ fontSize: value });
  }

  async save(): Promise<void> {
    const stored = this.settingsStore.settings();
    const draft = this.draft();
    if (stored === null || draft === null) {
      return;
    }

    if (!isValidFontSize(draft.fontSize)) {
      this.appToast.error(
        this.transloco.translate('toast.fontSizeInvalid', {
          min: MIN_FONT_SIZE,
          max: MAX_FONT_SIZE,
        }),
      );
      return;
    }

    const settings: AppSettings = {
      ...stored,
      ...draft,
    };

    this.saving.set(true);
    try {
      await this.settingsStore.save(settings);
      this.closed.emit();
    } catch (error) {
      this.appToast.error(
        this.transloco.translate('toast.saveFailed'),
        errorMessage(error),
      );
    } finally {
      this.saving.set(false);
    }
  }
}
