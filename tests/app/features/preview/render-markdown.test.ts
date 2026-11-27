import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { renderMarkdown } from '@/app/features/preview/render-markdown';

describe('renderMarkdown', () => {
  it('renders a heading', () => {
    assert.ok(renderMarkdown('# Hello').includes('<h1>Hello</h1>'));
  });

  it('does not pass through raw HTML', () => {
    assert.ok(!renderMarkdown('<script>alert(1)</script>').includes('<script>'));
  });

  it('highlights fenced code with hljs classes', () => {
    const html = renderMarkdown('```js\nconst x = 1;\n```');
    assert.ok(html.includes('hljs'));
    assert.ok(html.includes('hljs-keyword'));
  });

  it('renders task list checkboxes as disabled', () => {
    const html = renderMarkdown('- [ ] todo\n- [x] done\n');
    assert.ok(html.includes('type="checkbox"'));
    assert.ok(html.includes('disabled'));
    assert.ok(html.includes('checked'));
    assert.ok(html.includes('todo'));
    assert.ok(html.includes('done'));
  });
});
