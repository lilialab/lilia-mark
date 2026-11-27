import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { EditorTab } from '@/app/types/editor-tab';
import {
  createTabId,
  updateTab,
  withDiskChange,
  withDiskReload,
  withoutDiskChange,
  withSaved,
} from '@/app/utils/editor-tab';

function tab(overrides: Partial<EditorTab> = {}): EditorTab {
  return {
    id: 'a',
    path: 'C:\\Docs\\note.md',
    untitledExt: 'md',
    dirty: false,
    diskChange: null,
    docEpoch: 0,
    ...overrides,
  };
}

describe('createTabId', () => {
  it('returns a non-empty id', () => {
    assert.ok(createTabId().length > 0);
  });
});

describe('updateTab', () => {
  it('updates only the matching id', () => {
    const tabs = [tab({ id: 'a' }), tab({ id: 'b', path: 'C:\\Docs\\other.md' })];
    const next = updateTab(tabs, 'a', (item) => ({ ...item, dirty: true }));
    assert.equal(next[0]?.dirty, true);
    assert.equal(next[1]?.dirty, false);
  });
});

describe('withSaved', () => {
  it('clears dirty', () => {
    assert.equal(withSaved(tab({ dirty: true })).dirty, false);
  });
});

describe('withDiskReload', () => {
  it('clears dirty and diskChange, and bumps docEpoch', () => {
    const next = withDiskReload(tab({ dirty: true, diskChange: 'modify', docEpoch: 2 }));
    assert.equal(next.dirty, false);
    assert.equal(next.diskChange, null);
    assert.equal(next.docEpoch, 3);
  });
});

describe('withoutDiskChange', () => {
  it('clears diskChange only', () => {
    const next = withoutDiskChange(tab({ diskChange: 'remove' }));
    assert.equal(next.diskChange, null);
  });
});

describe('withDiskChange', () => {
  it('marks matching path and leaves others alone', () => {
    const tabs = [
      tab({ id: 'a', path: 'C:\\Docs\\note.md' }),
      tab({ id: 'b', path: 'C:\\Docs\\other.md' }),
    ];
    const next = withDiskChange(tabs, 'c:/Docs/note.md', 'modify');
    assert.equal(next[0]?.diskChange, 'modify');
    assert.equal(next[1]?.diskChange, null);
  });

  it('skips untitled tabs', () => {
    const tabs = [tab({ id: 'a', path: null })];
    const next = withDiskChange(tabs, 'C:\\Docs\\note.md', 'modify');
    assert.equal(next[0]?.diskChange, null);
  });
});
