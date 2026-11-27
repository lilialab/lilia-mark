import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { errorMessage } from '@/app/utils/error-message';

describe('errorMessage', () => {
  it('reads Error.message', () => {
    assert.equal(errorMessage(new Error('boom')), 'boom');
  });

  it('stringifies non-Error values', () => {
    assert.equal(errorMessage('plain'), 'plain');
    assert.equal(errorMessage(42), '42');
  });
});
