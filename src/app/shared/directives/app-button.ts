import { Directive, input } from '@angular/core';

export type AppButtonVariant = 'default' | 'ghost' | 'menu';

const variantClass: Record<AppButtonVariant, string> = {
  default:
    'rounded border border-(--app-border) bg-(--app-surface) px-3 py-1.5 text-sm text-(--app-fg) hover:bg-(--app-surface-hover) disabled:cursor-not-allowed disabled:opacity-50',
  ghost:
    'rounded-sm text-sm text-(--app-muted) hover:bg-(--app-surface-hover) hover:text-(--app-fg) disabled:cursor-not-allowed disabled:opacity-50',
  menu: 'block w-full px-3 py-1.5 text-left text-sm text-(--app-fg) hover:bg-(--app-surface-hover)',
};

/** 统一按钮样式；挂在原生 `button` 上。默认不进 Tab 序，避免抢编辑器焦点。 */
@Directive({
  selector: 'button[appButton]',
  host: {
    type: 'button',
    '[class]': 'hostClass()',
    '[attr.tabindex]': 'tabFocusable() ? null : -1',
  },
})
export class AppButton {
  readonly variant = input<AppButtonVariant>('default');
  /** 对话框等需要键盘切换时设为 true */
  readonly tabFocusable = input(false);
  /** 额外 Tailwind 类（勿与宿主 `class` 混用，避免覆盖 variant） */
  readonly extraClass = input('');

  hostClass(): string {
    const extra = this.extraClass().trim();
    return extra ? `${variantClass[this.variant()]} ${extra}` : variantClass[this.variant()];
  }
}
