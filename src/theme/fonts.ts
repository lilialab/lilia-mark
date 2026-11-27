import type { AppSettings } from '@/app/types/app-settings';

export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 72;

/** 是否为 8–72 的整数字号 */
export function isValidFontSize(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_FONT_SIZE && value <= MAX_FONT_SIZE;
}

/** 8–72 的正整数则返回；否则 null（字符串输入校验） */
export function parseFontSizeInput(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const n = Number(trimmed);
  return isValidFontSize(n) ? n : null;
}

/** 把字体栈与字号写到 html（调用方保证 fontFamily 非空） */
export function applyAppFonts(settings: AppSettings): void {
  const root = document.documentElement.style;
  root.setProperty('--app-font', settings.fontFamily.trim());
  root.setProperty('--app-font-size', `${settings.fontSize}px`);
}
