import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { sniffUntitledExt } from '@/app/utils/sniff-untitled-ext';

describe('sniffUntitledExt', () => {
  it('returns null for empty or markdown-like text', () => {
    assert.equal(sniffUntitledExt(''), null);
    assert.equal(sniffUntitledExt('   '), null);
    assert.equal(sniffUntitledExt('# Title\n\nHello'), null);
    assert.equal(sniffUntitledExt('plain text'), null);
  });

  it('detects JSON objects and arrays', () => {
    assert.equal(sniffUntitledExt('{"a":1}'), 'json');
    assert.equal(sniffUntitledExt('[\n  1,\n  2\n]'), 'json');
    assert.equal(sniffUntitledExt('\uFEFF{"a":1}'), 'json');
  });

  it('ignores JSON primitives', () => {
    assert.equal(sniffUntitledExt('"hello"'), null);
    assert.equal(sniffUntitledExt('42'), null);
    assert.equal(sniffUntitledExt('true'), null);
    assert.equal(sniffUntitledExt('null'), null);
  });

  it('detects HTML documents', () => {
    assert.equal(sniffUntitledExt('<!DOCTYPE html><html></html>'), 'html');
    assert.equal(sniffUntitledExt('<html lang="en"></html>'), 'html');
    assert.equal(sniffUntitledExt('<head><title>x</title></head>'), 'html');
    assert.equal(sniffUntitledExt('<body><p>x</p></body>'), 'html');
  });

  it('does not treat arbitrary tags as HTML', () => {
    assert.equal(sniffUntitledExt('<div>hi</div>'), null);
  });

  it('detects XML declarations', () => {
    assert.equal(sniffUntitledExt('<?xml version="1.0"?><root/>'), 'xml');
  });

  it('returns null for invalid JSON looking like braces', () => {
    assert.equal(sniffUntitledExt('{not json'), null);
  });
});
