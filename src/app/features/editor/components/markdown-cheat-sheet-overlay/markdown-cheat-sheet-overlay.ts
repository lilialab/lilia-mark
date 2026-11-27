import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { AppModal } from '@/app/shared/ui/app-modal';

import { markdownCheatSheetIds } from '../../help/markdown-cheat-sheet';

/** Markdown 常用标记速查（只读）。 */
@Component({
  selector: 'app-markdown-cheat-sheet-overlay',
  imports: [AppModal, TranslocoPipe],
  templateUrl: './markdown-cheat-sheet-overlay.html',
})
export class MarkdownCheatSheetOverlay {
  readonly open = input.required<boolean>();
  readonly closed = output<void>();
  readonly ids = markdownCheatSheetIds;
}
