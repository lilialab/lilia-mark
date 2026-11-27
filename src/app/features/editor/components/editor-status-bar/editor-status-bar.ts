import { Component, computed, effect, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { AppSettingsStore } from '@/app/app-settings.store';
import { languageDisplayName } from '@/app/features/code-editor/language-registry';
import { UntitledExtModal } from '@/app/features/editor/components/untitled-ext-modal/untitled-ext-modal';
import { EditorStore } from '@/app/features/editor/editor.store';
import { tabLanguagePath } from '@/app/utils/untitled';

/** 编辑器底栏：语言（未命名可点改后缀）/ 缩进 / 选区 / 字符 / 行 / 光标。 */
@Component({
  selector: 'app-editor-status-bar',
  imports: [TranslocoPipe, UntitledExtModal],
  templateUrl: './editor-status-bar.html',
})
export class EditorStatusBar {
  readonly editorStore = inject(EditorStore);
  private readonly settingsStore = inject(AppSettingsStore);

  readonly extModalOpen = signal(false);
  readonly indentSize = this.settingsStore.indentSize;

  readonly languageName = computed(() => {
    const tab = this.editorStore.activeTab();
    if (!tab) {
      return null;
    }
    return languageDisplayName(tabLanguagePath(tab));
  });

  constructor() {
    effect(() => {
      if (this.editorStore.activeTab()?.path !== null) {
        this.extModalOpen.set(false);
      }
    });
  }

  openExtModal(): void {
    if (this.editorStore.activeTab()?.path !== null) {
      return;
    }
    this.extModalOpen.set(true);
  }
}
