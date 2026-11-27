import { computed, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { applyAppFonts } from '@/theme/fonts';

import { resolveLocale } from './i18n/resolve-locale';
import { loadAppSettings, saveAppSettings } from './lib/tauri/storage';
import type { AppLocalePreference, AppSettings } from './types/app-settings';

function parseLocale(value: string): AppLocalePreference {
  if (value === 'zh' || value === 'en' || value === 'system') {
    return value;
  }
  return 'system';
}

function normalize(settings: AppSettings): AppSettings {
  return {
    ...settings,
    locale: parseLocale(settings.locale),
  };
}

/**
 * 全局应用设置（已落盘）。
 * `load` / `save` 后同步字体 CSS 变量与 Transloco 语言。
 * 启动经 `provideAppInitializer` 阻塞 `load`；表单草稿仍在设置浮层本地。
 */
export const AppSettingsStore = signalStore(
  { providedIn: 'root' },
  withState({
    /** `load` 完成前为 null */
    settings: null as AppSettings | null,
  }),
  withComputed(({ settings }) => ({
    /** 未 load 时为空表 */
    untitledExtensions: computed(() => settings()?.untitledExtensions ?? []),
    /** 未 load 时默认 2 */
    indentSize: computed(() => settings()?.indentSize ?? 2),
  })),
  withMethods((store) => {
    const transloco = inject(TranslocoService);

    function applyToShell(settings: AppSettings): void {
      applyAppFonts(settings);
      const lang = resolveLocale(settings.locale, navigator.language);
      transloco.setActiveLang(lang);
      document.documentElement.lang = lang;
    }

    async function persist(next: AppSettings): Promise<void> {
      const settings = normalize(next);
      await saveAppSettings(settings);
      patchState(store, { settings });
      applyToShell(settings);
    }

    return {
      /** 从磁盘读取并应用到壳层 */
      async load(): Promise<void> {
        const settings = normalize(await loadAppSettings());
        patchState(store, { settings });
        applyToShell(settings);
      },

      /** 整份写入（设置浮层提交草稿） */
      async save(next: AppSettings): Promise<void> {
        await persist(next);
      },

      /** 合并写入当前已加载设置；未 load 完成则 no-op */
      async patch(partial: Partial<AppSettings>): Promise<void> {
        const current = store.settings();
        if (!current) {
          return;
        }
        await persist({ ...current, ...partial });
      },
    };
  }),
);
