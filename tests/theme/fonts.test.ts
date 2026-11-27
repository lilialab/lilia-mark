import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isValidFontSize, MAX_FONT_SIZE, MIN_FONT_SIZE, parseFontSizeInput } from '@/theme/fonts';

describe('isValidFontSize', () => {
  it('accepts integers in 8–72', () => {
    assert.equal(isValidFontSize(MIN_FONT_SIZE), true);
    assert.equal(isValidFontSize(16), true);
    assert.equal(isValidFontSize(MAX_FONT_SIZE), true);
  });

  it('rejects non-integer and out of range', () => {
    assert.equal(isValidFontSize(16.5), false);
    assert.equal(isValidFontSize(0), false);
    assert.equal(isValidFontSize(MIN_FONT_SIZE - 1), false);
    assert.equal(isValidFontSize(MAX_FONT_SIZE + 1), false);
  });
});

describe('parseFontSizeInput', () => {
  it('accepts integers in 8–72', () => {
    assert.equal(parseFontSizeInput(String(MIN_FONT_SIZE)), MIN_FONT_SIZE);
    assert.equal(parseFontSizeInput('16'), 16);
    assert.equal(parseFontSizeInput(' 24 '), 24);
    assert.equal(parseFontSizeInput(String(MAX_FONT_SIZE)), MAX_FONT_SIZE);
  });

  it('rejects empty, non-integer, and out of range', () => {
    assert.equal(parseFontSizeInput(''), null);
    assert.equal(parseFontSizeInput('   '), null);
    assert.equal(parseFontSizeInput('16.5'), null);
    assert.equal(parseFontSizeInput('abc'), null);
    assert.equal(parseFontSizeInput('0'), null);
    assert.equal(parseFontSizeInput('-8'), null);
    assert.equal(parseFontSizeInput(String(MIN_FONT_SIZE - 1)), null);
    assert.equal(parseFontSizeInput(String(MAX_FONT_SIZE + 1)), null);
  });
});
