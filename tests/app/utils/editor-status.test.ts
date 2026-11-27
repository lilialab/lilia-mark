import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { EditorState } from '@codemirror/state';

import { readEditorCaretStatus } from '@/app/utils/editor-status';

describe('readEditorCaretStatus', () => {
  it('reads length, lines, and 1-based caret from an empty doc', () => {
    const state = EditorState.create({ doc: '' });
    assert.deepEqual(readEditorCaretStatus(state), {
      line: 1,
      col: 1,
      chars: 0,
      lines: 1,
      selectedChars: 0,
    });
  });

  it('reports caret on a later line and selection size', () => {
    const state = EditorState.create({
      doc: 'ab\ncde',
      selection: { anchor: 2, head: 6 },
    });
    assert.deepEqual(readEditorCaretStatus(state), {
      line: 2,
      col: 4,
      chars: 6,
      lines: 2,
      selectedChars: 4,
    });
  });
});
