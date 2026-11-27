import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { editorSessionFromTabs, resolveActiveTabId } from '@/app/utils/editor-session';

describe('editorSessionFromTabs', () => {
  it('maps paths and active path in tab order', () => {
    assert.deepEqual(
      editorSessionFromTabs(
        [
          { id: '1', path: 'a.md' },
          { id: '2', path: 'b.md' },
        ],
        '2',
      ),
      {
        paths: ['a.md', 'b.md'],
        activePath: 'b.md',
      },
    );
  });

  it('uses null activePath when empty or id missing', () => {
    assert.deepEqual(editorSessionFromTabs([], null), {
      paths: [],
      activePath: null,
    });
    assert.deepEqual(
      editorSessionFromTabs([{ id: '1', path: 'a.md' }], 'missing'),
      {
        paths: ['a.md'],
        activePath: null,
      },
    );
  });

  it('omits untitled tabs from persisted paths', () => {
    assert.deepEqual(
      editorSessionFromTabs(
        [
          { id: '1', path: null },
          { id: '2', path: 'a.md' },
        ],
        '1',
      ),
      {
        paths: ['a.md'],
        activePath: null,
      },
    );
  });
});

describe('resolveActiveTabId', () => {
  it('prefers matching active path, else first tab', () => {
    const tabs = [
      { id: '1', path: 'a.md' },
      { id: '2', path: 'b.md' },
    ];
    assert.equal(resolveActiveTabId(tabs, 'b.md'), '2');
    assert.equal(resolveActiveTabId(tabs, 'missing.md'), '1');
    assert.equal(resolveActiveTabId([], 'a.md'), null);
  });
});
