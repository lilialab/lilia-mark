import { Component } from '@angular/core';

import { AppButton } from '@/app/shared/directives/app-button';

/**
 * 编辑器应用菜单内部项：投影图标（`[appMenuItemIcon]`）与文案。
 * 无图标时仍占位，保证文字对齐。
 */
@Component({
  selector: 'app-menu-item',
  imports: [AppButton],
  templateUrl: './app-menu-item.html',
})
export class AppMenuItem {}
