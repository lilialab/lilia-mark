import { Injectable } from '@angular/core';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';
import { of } from 'rxjs';

import en from './locales/en.json';
import zh from './locales/zh.json';

/** 打包内联语言包（桌面离线可用，免 HTTP）。 */
@Injectable({ providedIn: 'root' })
export class TranslocoInlineLoader implements TranslocoLoader {
  getTranslation(lang: string) {
    const table: Translation = lang === 'zh' ? zh : en;
    return of(table);
  }
}
