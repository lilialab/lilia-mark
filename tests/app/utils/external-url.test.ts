import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isHttpUrl, normalizeHttpUrl } from '@/app/utils/external-url';

describe('isHttpUrl', () => {
  it('accepts http(s)', () => {
    assert.equal(isHttpUrl('https://example.com/a'), true);
    assert.equal(isHttpUrl('http://localhost:1420'), true);
  });

  it('rejects other schemes and junk', () => {
    assert.equal(isHttpUrl('javascript:alert(1)'), false);
    assert.equal(isHttpUrl('mailto:a@b.c'), false);
    assert.equal(isHttpUrl('not a url'), false);
  });
});

describe('normalizeHttpUrl', () => {
  it('strips autolink brackets', () => {
    assert.equal(normalizeHttpUrl('<https://example.com>'), 'https://example.com/');
  });

  it('returns null when not http(s)', () => {
    assert.equal(normalizeHttpUrl('ftp://example.com'), null);
  });
});
