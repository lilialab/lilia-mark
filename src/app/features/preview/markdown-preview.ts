import { Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { openExternalUrl } from '@/app/lib/tauri/opener';
import { isHttpUrl } from '@/app/utils/external-url';

import { renderMarkdown } from './render-markdown';
/** Markdown → HTML 预览；链接仅 http(s) 走系统浏览器。 */
@Component({
  selector: 'app-markdown-preview',
  template: `<div class="markdown-preview" [innerHTML]="html()"></div>`,
  styleUrl: './markdown-preview.css',
  // innerHTML 节点无 _ngcontent；关封装，靠 .markdown-preview 隔离
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'block',
    '(click)': 'onPreviewClick($event)',
    '(auxclick)': 'onPreviewClick($event)',
  },
})
export class MarkdownPreview {
  readonly source = input.required<string>();

  private readonly sanitizer = inject(DomSanitizer);

  readonly html = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(renderMarkdown(this.source()))
  );

  onPreviewClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const anchor = target.closest('a');
    if (!anchor) {
      return;
    }
    event.preventDefault();
    const href = anchor.href;
    if (!isHttpUrl(href)) {
      return;
    }
    void openExternalUrl(href);
  }
}
