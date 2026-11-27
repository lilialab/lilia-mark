import en from '@/app/i18n/locales/en.json';
import zh from '@/app/i18n/locales/zh.json';

type Params = Record<string, string | number>;

/** CM 面板在 Angular DI 外；可注入 Transloco 等翻译函数 */
export type SearchPanelTranslate = (key: string, params?: Params) => string;

const panelStrings = {
  en: en.searchPanel,
  zh: zh.searchPanel,
} as const;

type PanelKey = keyof typeof en.searchPanel;

function activeLang(): keyof typeof panelStrings {
  return document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
}

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, name: string) => String(params[name] ?? `{{${name}}}`),
  );
}

function leafKey(key: string): string {
  return key.startsWith('searchPanel.') ? key.slice('searchPanel.'.length) : key;
}

function builtinTranslate(key: string, params?: Params): string {
  const leaf = leafKey(key) as PanelKey;
  const bag = panelStrings[activeLang()];
  const text = (bag[leaf] as string | undefined)
    ?? (panelStrings.en[leaf] as string | undefined)
    ?? key;
  return interpolate(text, params);
}

let override: SearchPanelTranslate | null = null;
const listeners = new Set<() => void>();
let langObserver: MutationObserver | null = null;

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function ensureLangObserver(): void {
  if (langObserver !== null || typeof MutationObserver === 'undefined') return;
  langObserver = new MutationObserver(() => notify());
  langObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang'],
  });
}

/** 可选：由 CodeEditor / EditorPage 注入 Transloco；传 null 恢复内置 locale */
export function setSearchPanelTranslate(fn: SearchPanelTranslate | null): void {
  override = fn;
  notify();
}

export function translateSearchPanel(key: string, params?: Params): string {
  return (override ?? builtinTranslate)(key, params);
}

/** language / override 变化时回调；返回取消订阅 */
export function subscribeSearchPanelI18n(listener: () => void): () => void {
  listeners.add(listener);
  ensureLangObserver();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && langObserver !== null) {
      langObserver.disconnect();
      langObserver = null;
    }
  };
}
