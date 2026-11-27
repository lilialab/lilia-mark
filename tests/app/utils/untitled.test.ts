import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  filterUntitledExtensions,
  isDefaultUntitled,
  isUntitled,
  normalizeUntitledExt,
  parseUntitledExt,
  tabLanguagePath,
} from '@/app/utils/untitled';

describe('normalizeUntitledExt', () => {
  it('normalizes known and custom extensions', () => {
    assert.equal(normalizeUntitledExt('MD'), 'md');
    assert.equal(normalizeUntitledExt('.json'), 'json');
    assert.equal(normalizeUntitledExt('rs'), 'rs');
    assert.equal(normalizeUntitledExt('tar.gz'), 'tar.gz');
  });

  it('rejects empty or illegal values', () => {
    assert.equal(normalizeUntitledExt(''), null);
    assert.equal(normalizeUntitledExt('...'), null);
    assert.equal(normalizeUntitledExt('a/b'), null);
    assert.equal(normalizeUntitledExt('a b'), null);
  });
});

describe('parseUntitledExt', () => {
  it('falls back to md when normalize fails', () => {
    assert.equal(parseUntitledExt(''), 'md');
    assert.equal(parseUntitledExt('a/b'), 'md');
  });
});

describe('filterUntitledExtensions', () => {
  const extensions = ['md', 'html', 'json', 'jsonc'] as const;

  it('returns all when query empty', () => {
    assert.deepEqual(filterUntitledExtensions('', extensions), [...extensions]);
    assert.deepEqual(filterUntitledExtensions('  ', extensions), [...extensions]);
  });

  it('filters by prefix and strips leading dot', () => {
    assert.deepEqual(filterUntitledExtensions('j', extensions), ['json', 'jsonc']);
    assert.deepEqual(filterUntitledExtensions('.ht', extensions), ['html']);
  });
});

describe('isUntitled / isDefaultUntitled', () => {
  it('detects untitled and default-md untitled', () => {
    assert.equal(isUntitled(undefined), false);
    assert.equal(isUntitled({ path: 'C:\\a.md', untitledExt: 'md' }), false);
    assert.equal(isUntitled({ path: null, untitledExt: 'json' }), true);

    assert.equal(isDefaultUntitled(undefined), false);
    assert.equal(isDefaultUntitled({ path: null, untitledExt: 'md' }), true);
    assert.equal(isDefaultUntitled({ path: null, untitledExt: 'json' }), false);
    assert.equal(isDefaultUntitled({ path: 'C:\\a.md', untitledExt: 'md' }), false);
  });
});

describe('tabLanguagePath', () => {
  it('returns real path when present', () => {
    assert.equal(tabLanguagePath({ path: 'C:\\a.md', untitledExt: 'txt' }), 'C:\\a.md');
  });

  it('builds untitled pseudo-path from extension', () => {
    assert.equal(tabLanguagePath({ path: null, untitledExt: 'json' }), 'untitled.json');
    assert.equal(tabLanguagePath({ path: null, untitledExt: 'rs' }), 'untitled.rs');
  });
});
