import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { AppModal } from '@/app/shared/ui/app-modal';

import { editorHotkeyHintSections, modifierKeyLabel } from '../../help/editor-hotkey-hints';

/** 应用快捷键说明（只读，不可改键）。 */
@Component({
  selector: 'app-shortcuts-overlay',
  imports: [AppModal, TranslocoPipe],
  templateUrl: './shortcuts-overlay.html',
})
export class ShortcutsOverlay {
  readonly open = input.required<boolean>();
  readonly closed = output<void>();

  private readonly transloco = inject(TranslocoService);
  private readonly lang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  readonly sections = computed(() => {
    this.lang();
    const t = (key: string) => this.transloco.translate(key);
    return editorHotkeyHintSections(t, modifierKeyLabel());
  });
}
