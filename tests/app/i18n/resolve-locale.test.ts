import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { localeFromSystemTag, resolveLocale } from '@/app/i18n/resolve-locale';

describe('resolveLocale', () => {
  it('maps system tags', () => {
    assert.equal(localeFromSystemTag('zh-CN'), 'zh');
    assert.equal(localeFromSystemTag('en-US'), 'en');
  });

  it('honors explicit preference', () => {
    assert.equal(resolveLocale('zh', 'en-US'), 'zh');
    assert.equal(resolveLocale('en', 'zh-CN'), 'en');
    assert.equal(resolveLocale('system', 'zh-TW'), 'zh');
  });
});
