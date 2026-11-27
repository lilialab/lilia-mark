import { LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import type { Extension } from '@codemirror/state';

import { fileExtension, fileName } from '@/app/utils/path';

const markdownExtensions = new Set(['md', 'markdown']);
const htmlExtensions = new Set(['html', 'htm']);

/** 当前是否提供 Markdown 预览（仅 .md / .markdown） */
export function supportsMarkdownPreview(path: string): boolean {
  return markdownExtensions.has(fileExtension(path));
}

/** 是否用系统默认应用打开预览（.html / .htm） */
export function supportsHtmlBrowserOpen(path: string): boolean {
  return htmlExtensions.has(fileExtension(path));
}

/** 预览层是否有可展示内容 */
export function supportsPreviewPanel(path: string): boolean {
  return supportsMarkdownPreview(path) || supportsHtmlBrowserOpen(path);
}

/** 是否有整文件语法高亮 */
export function hasEditorHighlight(path: string): boolean {
  if (supportsMarkdownPreview(path)) {
    return true;
  }
  return LanguageDescription.matchFilename(languages, fileName(path)) !== null;
}

/** 底栏语言名；无匹配为 Plain Text（S4 底栏会用） */
export function languageDisplayName(path: string): string {
  if (supportsMarkdownPreview(path)) {
    return 'Markdown';
  }
  const description = LanguageDescription.matchFilename(languages, fileName(path));
  return description?.name ?? 'Plain Text';
}

/**
 * 按路径按需加载语言扩展。
 * Markdown 围栏走 language-data 懒加载表；其它按文件名匹配。
 */
export async function loadLanguageExtension(path: string): Promise<Extension> {
  if (supportsMarkdownPreview(path)) {
    const { markdown } = await import('@codemirror/lang-markdown');
    return markdown({ codeLanguages: languages });
  }

  const description = LanguageDescription.matchFilename(languages, fileName(path));
  if (!description) {
    return [];
  }
  return description.load();
}
