import { catppuccinMacchiato } from '@catppuccin/codemirror';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { foldKeymap, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { search, searchKeymap } from '@codemirror/search';
import { EditorState, type Extension } from '@codemirror/state';
import {
  crosshairCursor,
  drawSelection,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { highlightActiveLineExclusive } from './activeLineHighlight';
import { editorFoldGutter } from './foldGutter';
import { markdownBoldKeymap } from './markdown/markdownBold';
import { markdownTaskKeymap } from './markdown/markdownTask';
import { createVscodeSearchPanel } from './search/searchPanel';

/**
 * Markdown 语义挂稳定 class，样式走 CSS（特异性高于主题 StyleModule，
 * 才能盖掉 tags.heading 蓝 / tags.url 青绿等冲突）。
 */
const markdownHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.heading1, class: 'cm-md-h1' },
    { tag: tags.heading2, class: 'cm-md-h2' },
    { tag: tags.heading3, class: 'cm-md-h3' },
    { tag: tags.heading4, class: 'cm-md-h4' },
    { tag: tags.heading5, class: 'cm-md-h5' },
    { tag: tags.heading6, class: 'cm-md-h6' },
    { tag: tags.strong, class: 'cm-md-strong' },
    { tag: tags.url, class: 'cm-md-url' },
    { tag: tags.monospace, class: 'cm-md-code' },
  ]),
);

/** 编辑器静态装配：行号 / 折叠 / 主题 / Markdown 语义色 / 搜索 / keymap（不含语言） */
export const baseExtensions: Extension[] = [
  lineNumbers(),
  editorFoldGutter,
  highlightSpecialChars(),
  history(),
  drawSelection(),
  EditorState.allowMultipleSelections.of(true),
  rectangularSelection(),
  crosshairCursor(),
  catppuccinMacchiato,
  markdownHighlight,
  highlightActiveLineExclusive(),
  search({ top: true, createPanel: createVscodeSearchPanel }),
  keymap.of([
    indentWithTab,
    ...markdownBoldKeymap,
    ...markdownTaskKeymap,
    ...searchKeymap,
    ...foldKeymap,
    ...defaultKeymap,
    ...historyKeymap,
  ]),
];
