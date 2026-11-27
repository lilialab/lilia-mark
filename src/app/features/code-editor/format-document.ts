import { formatDocumentText, type FormatTextChange } from '@/app/lib/tauri/format';
import { fileExtension } from '@/app/utils/path';

export type FormatKind = 'json' | 'markdown';

export type FormatDocumentResult = 'formatted' | 'unchanged' | 'unsupported';

/** 当前路径是否支持整篇格式化（与 Rust `format_kind_for_path` 对齐） */
export function formatKindForPath(path: string): FormatKind | null {
  const ext = fileExtension(path);
  if (ext === 'json' || ext === 'jsonc') {
    return 'json';
  }
  if (ext === 'md' || ext === 'markdown') {
    return 'markdown';
  }
  return null;
}

/** 是否支持整篇格式化（JSON / Markdown，经 Rust） */
export function supportsDocumentFormat(path: string): boolean {
  return formatKindForPath(path) !== null;
}

interface FormatDocumentOptions {
  languagePath: string;
  indentSize: number;
  /** 读当前正文 */
  readDoc: () => string;
  /** 竞态：await 后正文是否仍为 before */
  isDocUnchanged: (before: string) => boolean;
  /** 写回 CM 差量 */
  applyChanges: (changes: FormatTextChange[]) => void;
}

/**
 * 经 Tauri 在 Rust 侧格式化 + diff，再写回编辑器。
 * 忙碌态由上层蒙版负责。
 */
export async function formatEditorDocument(
  options: FormatDocumentOptions,
): Promise<FormatDocumentResult> {
  if (!formatKindForPath(options.languagePath)) {
    return 'unsupported';
  }

  const before = options.readDoc();
  const { changes } = await formatDocumentText(
    options.languagePath,
    before,
    options.indentSize,
  );

  if (!options.isDocUnchanged(before)) {
    return 'unchanged';
  }

  if (changes.length === 0) {
    return 'unchanged';
  }

  options.applyChanges(changes);
  return 'formatted';
}
