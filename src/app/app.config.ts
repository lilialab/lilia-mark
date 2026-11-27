import {
  type ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';

import { routes } from './app.routes';
import { AppSettingsStore } from './app-settings.store';
import { resolveLocale } from './i18n/resolve-locale';
import { TranslocoInlineLoader } from './i18n/transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideTransloco({
      config: {
        availableLangs: ['zh', 'en'],
        defaultLang: resolveLocale('system', navigator.language),
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoInlineLoader,
    }),
    provideAppInitializer(() => inject(AppSettingsStore).load()),
  ],
};
