import { Component, ElementRef, inject, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  LucideFilePlus,
  LucideFolderOpen,
  LucideKeyboard,
  LucideMenu,
  LucideSave,
  LucideSettings,
} from '@lucide/angular';

import { EditorStore } from '@/app/features/editor/editor.store';
import { AppButton } from '@/app/shared/directives/app-button';

import { AppMenuItem } from './app-menu-item';

/** 编辑器应用菜单；会话动作走 EditorStore，需对话框的 IO 经 output 交给页面。 */
@Component({
  selector: 'app-menu',
  imports: [
    AppButton,
    AppMenuItem,
    LucideFilePlus,
    LucideFolderOpen,
    LucideKeyboard,
    LucideMenu,
    LucideSave,
    LucideSettings,
    TranslocoPipe,
  ],
  templateUrl: './app-menu.html',
  host: {
    class: 'relative shrink-0 self-center',
    '(click)': 'onHostClick($event)',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
    '(window:keydown)': 'onWindowKeyDown($event)',
  },
})
export class AppMenu {
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly editorStore = inject(EditorStore);
  readonly open = signal(false);
  readonly iconSize = 16;

  readonly openFile = output<void>();
  readonly saveAs = output<void>();
  readonly settings = output<void>();
  readonly shortcuts = output<void>();
  readonly cheatSheet = output<void>();
  readonly startupTiming = output<void>();
  readonly checkUpdate = output<void>();

  toggle(): void {
    this.open.update((value) => !value);
  }

  /** 点到菜单项后收起 */
  onHostClick(event: MouseEvent): void {
    if (!this.open()) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('[role="menuitem"]')) {
      this.open.set(false);
    }
  }

  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.open()) {
      return;
    }
    const root = this.host.nativeElement;
    if (!root.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  onWindowKeyDown(event: KeyboardEvent): void {
    if (this.open() && event.key === 'Escape') {
      this.open.set(false);
    }
  }
}
