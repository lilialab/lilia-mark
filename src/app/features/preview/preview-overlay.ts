import { Component, effect, input, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import {
  supportsHtmlBrowserOpen,
  supportsMarkdownPreview,
} from '@/app/features/code-editor/language-registry';
import { AppButton } from '@/app/shared/directives/app-button';

import { MarkdownPreview } from './markdown-preview';

const PREVIEW_MOTION_MS = 200;

/** 预览覆盖层：Markdown 内渲 / HTML 提示外开 / 其它不支持。 */
@Component({
  selector: 'app-preview-overlay',
  imports: [AppButton, MarkdownPreview, TranslocoPipe],
  templateUrl: './preview-overlay.html',
  styleUrl: './preview-overlay.css',
})
export class PreviewOverlay {
  readonly open = input.required<boolean>();
  /** 判类型用（已落盘为真实 path，未命名为 untitled.ext） */
  readonly languagePath = input.required<string>();
  /** 磁盘路径；未命名为 null，供 HTML「用浏览器打开」 */
  readonly filePath = input.required<string | null>();
  readonly source = input.required<string>();
  /** 由页面执行打开；返回 Promise 以便按钮 loading */
  readonly openHtml = input.required<() => Promise<void>>();

  readonly mounted = signal(false);
  readonly opening = signal(false);

  constructor() {
    effect(() => {
      const open = this.open();
      if (open) {
        this.mounted.set(true);
        return;
      }
      if (!this.mounted()) {
        return;
      }

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) {
        this.mounted.set(false);
        return;
      }

      const hide = window.setTimeout(() => {
        this.mounted.set(false);
      }, PREVIEW_MOTION_MS);
      return () => {
        window.clearTimeout(hide);
      };
    });
  }

  showMarkdown(): boolean {
    return supportsMarkdownPreview(this.languagePath());
  }

  showHtmlOpen(): boolean {
    const path = this.filePath();
    return path !== null && supportsHtmlBrowserOpen(path);
  }

  async onOpenInBrowser(): Promise<void> {
    this.opening.set(true);
    try {
      await this.openHtml()();
    } finally {
      this.opening.set(false);
    }
  }
}
