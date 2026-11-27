import { Component, computed, inject, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideX } from '@lucide/angular';

import { EditorStore } from '@/app/features/editor/editor.store';
import { AppButton } from '@/app/shared/directives/app-button';

export interface EditorTabItemModel {
  id: string;
  title: string;
  dirty: boolean;
  diskChange: boolean;
}

const BASE_CLASS = 'group flex max-w-48 shrink-0 cursor-pointer items-center gap-1.5 px-3 text-sm';

/** 单个标签：标题、脏点、关闭（关闭经 output，脏确认在页面）。 */
@Component({
  selector: 'app-editor-tab-item',
  imports: [AppButton, LucideX, TranslocoPipe],
  templateUrl: './editor-tab-item.html',
  host: {
    '[class]': 'hostClass()',
    role: 'tab',
    '[attr.aria-selected]': 'active()',
    tabindex: '-1',
  },
})
export class EditorTabItem {
  readonly editorStore = inject(EditorStore);
  readonly tab = input.required<EditorTabItemModel>();
  readonly closeRequest = output<string>();

  readonly active = computed(() => this.tab().id === this.editorStore.activeId());

  readonly hostClass = computed(() =>
    this.active()
      ? `${BASE_CLASS} bg-(--app-bg) text-(--app-fg)`
      : `${BASE_CLASS} bg-transparent text-(--app-muted) hover:bg-(--app-surface)`
  );

  close(event: Event): void {
    event.stopPropagation();
    this.closeRequest.emit(this.tab().id);
  }
}
