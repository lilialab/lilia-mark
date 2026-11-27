import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { taskToggleEditForLine } from '@/app/features/code-editor/markdown/markdown-task';

describe('taskToggleEditForLine', () => {
  it('toggles unchecked to checked', () => {
    assert.deepEqual(taskToggleEditForLine('- [ ] buy milk'), {
      from: 2,
      to: 5,
      insert: '[X]',
    });
  });

  it('toggles checked to unchecked', () => {
    assert.deepEqual(taskToggleEditForLine('- [X] buy milk'), {
      from: 2,
      to: 5,
      insert: '[ ]',
    });
    assert.equal(taskToggleEditForLine('- [x] buy milk')?.insert, '[ ]');
  });

  it('supports *, + and ordered list markers', () => {
    assert.equal(taskToggleEditForLine('  * [ ] a')?.insert, '[X]');
    assert.equal(taskToggleEditForLine('+ [X] b')?.insert, '[ ]');
    assert.deepEqual(taskToggleEditForLine('12. [ ] c'), {
      from: 4,
      to: 7,
      insert: '[X]',
    });
  });

  it('returns null for non-task lines', () => {
    assert.equal(taskToggleEditForLine('- not a task'), null);
    assert.equal(taskToggleEditForLine('plain text'), null);
    assert.equal(taskToggleEditForLine('- [] missing space'), null);
  });
});
