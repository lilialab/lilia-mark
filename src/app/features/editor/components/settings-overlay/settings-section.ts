import { Component, input } from '@angular/core';

/**
 * 设置浮层分段：可选顶部分割线、标题、说明；主体投影。
 */
@Component({
  selector: 'app-settings-section',
  templateUrl: './settings-section.html',
})
export class SettingsSection {
  readonly title = input<string | undefined>(undefined);
  readonly hint = input<string | undefined>(undefined);
  /** 默认带顶部分割；首段设为 false */
  readonly divided = input(true);
}
