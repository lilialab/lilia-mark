import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  decodeTextChanges,
  decodeUtf8Buffer,
  encodeFormatRequest,
  encodePathContent,
} from '@/app/lib/tauri/ipc-bytes';

describe('ipcBytes', () => {
  it('encodePathContent prefixes utf-8 path', () => {
    const encoded = encodePathContent('中文.md', 'hi');
    const view = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength);
    const pathLen = view.getUint32(0, true);
    const pathBytes = encoded.subarray(4, 4 + pathLen);
    const path = new TextDecoder().decode(pathBytes);
    const content = new TextDecoder().decode(encoded.subarray(4 + pathLen));
    assert.equal(path, '中文.md');
    assert.equal(content, 'hi');
  });

  it('encodeFormatRequest keeps content as trailing bytes', () => {
    const encoded = encodeFormatRequest('a.json', 2, '{"a":1}');
    const view = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength);
    let offset = 0;
    const pathLen = view.getUint32(offset, true);
    offset += 4 + pathLen;
    assert.equal(view.getUint32(offset, true), 2);
    offset += 4;
    assert.equal(new TextDecoder().decode(encoded.subarray(offset)), '{"a":1}');
  });

  it('decodeTextChanges reads le frame', () => {
    const insert = new TextEncoder().encode('你好');
    const buf = new Uint8Array(4 + 4 + 4 + 4 + insert.length);
    const view = new DataView(buf.buffer);
    view.setUint32(0, 1, true);
    view.setUint32(4, 10, true);
    view.setUint32(8, 12, true);
    view.setUint32(12, insert.length, true);
    buf.set(insert, 16);
    assert.deepEqual(decodeTextChanges(buf.buffer), [{ from: 10, to: 12, insert: '你好' }]);
  });

  it('decodeUtf8Buffer', () => {
    assert.equal(decodeUtf8Buffer(new TextEncoder().encode('abc').buffer), 'abc');
  });
});
