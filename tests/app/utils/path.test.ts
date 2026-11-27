import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fileExtension, fileName, sameFilePath } from '@/app/utils/path';

describe('sameFilePath', () => {
  it('treats Windows paths as case-insensitive and separator-insensitive', () => {
    assert.equal(sameFilePath('C:\\Docs\\note.md', 'c:/Docs/note.md'), true);
  });

  it('keeps POSIX paths case-sensitive', () => {
    assert.equal(sameFilePath('/Users/me/Note.md', '/Users/me/note.md'), false);
    assert.equal(sameFilePath('/Users/me/note.md', '/Users/me/note.md'), true);
  });
});

describe('fileName', () => {
  it('takes the last segment for Windows and POSIX paths', () => {
    assert.equal(fileName('C:\\Docs\\note.md'), 'note.md');
    assert.equal(fileName('/Users/me/note.md'), 'note.md');
  });

  it('returns the input when there is no separator', () => {
    assert.equal(fileName('note.md'), 'note.md');
  });
});

describe('fileExtension', () => {
  it('returns lowercase extension without the dot', () => {
    assert.equal(fileExtension('C:\\Docs\\Note.MD'), 'md');
    assert.equal(fileExtension('/Users/me/a.json'), 'json');
  });

  it('returns empty for no extension or leading-dot names', () => {
    assert.equal(fileExtension('Makefile'), '');
    assert.equal(fileExtension('.gitignore'), '');
  });
});
