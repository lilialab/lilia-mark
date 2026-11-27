/** 语言偏好 → 已解析 locale（纯函数）。 */

export type AppLocale = 'zh' | 'en';
export type LocalePreference = 'system' | AppLocale;

/** 系统标签（如 `zh-CN`）→ 应用语言；非中回落英文。 */
export function localeFromSystemTag(tag: string): AppLocale {
  const lower = tag.toLowerCase();
  if (lower.startsWith('zh')) {
    return 'zh';
  }
  return 'en';
}

/** 按偏好解析界面语言。 */
export function resolveLocale(preference: LocalePreference, systemTag: string): AppLocale {
  if (preference === 'zh' || preference === 'en') {
    return preference;
  }
  return localeFromSystemTag(systemTag);
}
