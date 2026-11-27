import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { boldEditForRange } from '@/app/features/code-editor/markdown/markdown-bold';

describe('boldEditForRange', () => {
  it('inserts **** at empty caret', () => {
    assert.deepEqual(boldEditForRange('hello', 2, 2), {
      changes: { from: 2, insert: '****' },
      anchor: 4,
      head: 4,
    });
  });

  it('wraps selection with **', () => {
    assert.deepEqual(boldEditForRange('say hi', 4, 6), {
      changes: { from: 4, to: 6, insert: '**hi**' },
      anchor: 6,
      head: 8,
    });
  });

  it('unwraps when selection includes **', () => {
    assert.deepEqual(boldEditForRange('**hi**', 0, 6), {
      changes: { from: 0, to: 6, insert: 'hi' },
      anchor: 0,
      head: 2,
    });
  });

  it('unwraps when selection is surrounded by **', () => {
    assert.deepEqual(boldEditForRange('**hi**', 2, 4), {
      changes: { from: 0, to: 6, insert: 'hi' },
      anchor: 0,
      head: 2,
    });
  });
});
