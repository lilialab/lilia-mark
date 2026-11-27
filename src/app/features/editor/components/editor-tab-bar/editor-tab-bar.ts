import { CdkDrag, type CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, inject, output, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { EditorStore } from '@/app/features/editor/editor.store';
import { fileName } from '@/app/utils/path';

import { EditorTabItem } from './editor-tab-item';

/** 标签条：横向拖拽排序；右侧投影挂菜单。 */
@Component({
  selector: 'app-editor-tab-bar',
  imports: [CdkDrag, CdkDropList, EditorTabItem, TranslocoPipe],
  templateUrl: './editor-tab-bar.html',
  styleUrl: './editor-tab-bar.css',
  host: {
    class: 'flex min-h-9 min-w-0 shrink-0 items-stretch bg-(--app-bg-raised) pr-1',
  },
})
export class EditorTabBar {
  readonly editorStore = inject(EditorStore);
  private readonly transloco = inject(TranslocoService);
  /** 关标签请求（脏确认由页面处理） */
  readonly closeTab = output<string>();

  /** 松手瞬间禁 transition，避免清 transform / 重排插值成「冲一下」 */
  readonly settling = signal(false);

  readonly items = computed(() => {
    const untitled = this.transloco.translate('editor.untitled');
    return this.editorStore.tabs().map((tab) => ({
      id: tab.id,
      title: tab.path === null
        ? `${untitled}.${tab.untitledExt}`
        : fileName(tab.path),
      dirty: tab.dirty,
      diskChange: tab.diskChange !== null,
    }));
  });

  drop(event: CdkDragDrop<unknown>): void {
    this.settling.set(true);
    this.editorStore.reorderTabs(event.previousIndex, event.currentIndex);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.settling.set(false);
      });
    });
  }
}
