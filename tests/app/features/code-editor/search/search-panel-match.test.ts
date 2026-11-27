import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SearchQuery } from '@codemirror/search';
import { EditorState } from '@codemirror/state';

import { locateSearchMatches } from '@/app/features/code-editor/search/search-panel-match';

function stateWith(doc: string, head: number) {
  return EditorState.create({
    doc,
    selection: { anchor: head, head },
  });
}

describe('locateSearchMatches', () => {
  it('returns zeros for empty / invalid query', () => {
    const state = stateWith('abc abc', 0);
    assert.deepEqual(locateSearchMatches(state, new SearchQuery({ search: '' }), 0), {
      total: 0,
      current: 0,
      capped: false,
    });
    assert.equal(
      locateSearchMatches(state, new SearchQuery({ search: '(', regexp: true }), 0).total,
      0,
    );
  });

  it('counts matches and current index', () => {
    const state = stateWith('foo bar foo', 8);
    const query = new SearchQuery({ search: 'foo' });
    assert.deepEqual(locateSearchMatches(state, query, 8), {
      total: 2,
      current: 2,
      capped: false,
    });
  });

  it('caps at limit', () => {
    const state = stateWith('aaaa', 0);
    const query = new SearchQuery({ search: 'a' });
    assert.deepEqual(locateSearchMatches(state, query, 0, 2), {
      total: 2,
      current: 1,
      capped: true,
    });
  });
});
