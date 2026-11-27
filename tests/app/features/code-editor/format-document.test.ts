import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  formatKindForPath,
  supportsDocumentFormat,
} from '@/app/features/code-editor/format-document';

describe('formatKindForPath', () => {
  it('maps json / jsonc / md / markdown', () => {
    assert.equal(formatKindForPath('a.json'), 'json');
    assert.equal(formatKindForPath('a.jsonc'), 'json');
    assert.equal(formatKindForPath('a.md'), 'markdown');
    assert.equal(formatKindForPath('a.markdown'), 'markdown');
  });

  it('returns null for unsupported', () => {
    assert.equal(formatKindForPath('a.txt'), null);
    assert.equal(formatKindForPath('a.ts'), null);
  });
});

describe('supportsDocumentFormat', () => {
  it('matches formatKindForPath', () => {
    assert.equal(supportsDocumentFormat('x.md'), true);
    assert.equal(supportsDocumentFormat('x.txt'), false);
  });
});
