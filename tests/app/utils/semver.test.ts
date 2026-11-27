import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isNewerSemver, parseSemver } from '@/app/utils/semver';

describe('parseSemver', () => {
  it('parses plain and v-prefixed versions', () => {
    assert.deepEqual(parseSemver('0.2.1'), [0, 2, 1]);
    assert.deepEqual(parseSemver('v1.0.0'), [1, 0, 0]);
    assert.deepEqual(parseSemver('V2.3.4-extra'), [2, 3, 4]);
  });

  it('returns null for invalid input', () => {
    assert.equal(parseSemver(''), null);
    assert.equal(parseSemver('latest'), null);
    assert.equal(parseSemver('1.0'), null);
  });
});

describe('isNewerSemver', () => {
  it('compares major.minor.patch', () => {
    assert.equal(isNewerSemver('0.2.2', '0.2.1'), true);
    assert.equal(isNewerSemver('v0.3.0', '0.2.9'), true);
    assert.equal(isNewerSemver('0.2.1', '0.2.1'), false);
    assert.equal(isNewerSemver('0.2.0', '0.2.1'), false);
  });

  it('returns false when either side is unparsable', () => {
    assert.equal(isNewerSemver('nope', '0.2.1'), false);
    assert.equal(isNewerSemver('0.2.2', 'nope'), false);
  });
});
