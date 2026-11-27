import type { OnDestroy } from '@angular/core';
import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { selectAll } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { Compartment, EditorState, type Extension, Transaction } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { TranslocoPipe } from '@jsverse/transloco';

import type { FormatTextChange } from '@/app/lib/tauri/format';
import { openTextPath } from '@/app/lib/tauri/fs';
import type { IndentSize } from '@/app/types/app-settings';
import type { EditorCaretStatus } from '@/app/utils/editor-status';
import { readEditorCaretStatus } from '@/app/utils/editor-status';
import { sameFilePath } from '@/app/utils/path';

import { baseExtensions } from './editor-extensions';
import { type FormatDocumentResult, formatEditorDocument } from './format-document';
import { loadLanguageExtension } from './language-registry';

function indentExtensions(size: number): Extension {
  return [EditorState.tabSize.of(size), indentUnit.of(' '.repeat(size))];
}

/** CodeMirror 宿主：按 path 读盘（null=未命名）；脏 / 光标 / 保存请求经 output 上报。 */
@Component({
  selector: 'app-code-editor',
  imports: [TranslocoPipe],
  templateUrl: './code-editor.html',
  styleUrl: './code-editor.css',
  // CM 自造 DOM 无 _ngcontent；关封装，靠 .code-editor 隔离
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'relative block h-full min-h-0',
  },
})
export class CodeEditor implements OnDestroy {
  /** 对应 EditorTab.id；供页面 viewChildren 定位 */
  readonly tabId = input.required<string>();
  /** 已落盘路径；未命名为 null */
  readonly path = input.required<string | null>();
  /** 语言 / 高亮用路径（含 untitled.ext） */
  readonly languagePath = input.required<string>();
  /** 空格缩进宽度（由设置页传入） */
  readonly indentSize = input.required<IndentSize>();
  /** 保存 / 格式化忙碌文案；与 opening 合并为蒙版 */
  readonly busyMessage = input<string | null>(null);

  readonly dirty = output<void>();
  readonly caretStatus = output<EditorCaretStatus>();
  readonly ready = output<void>();
  readonly loadError = output<unknown>();
  readonly pathResolved = output<string>();
  /** 空文档粘贴正文（供未命名嗅探后缀） */
  readonly emptyPaste = output<string>();
  /** Mod-s */
  readonly saveRequest = output<void>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);

  private view: EditorView | null = null;
  private languageCompartment: Compartment | null = null;
  private indentCompartment: Compartment | null = null;
  private hydrating = false;

  /** 读盘中；未命名保持 false（构造里读不了 required input，在 mount 里设） */
  readonly opening = signal(false);
  private readonly mounted = signal(false);

  constructor() {
    afterNextRender(
      () => {
        this.mount();
      },
      { injector: this.injector },
    );

    effect(() => {
      const size = this.indentSize();
      const view = this.view;
      const compartment = this.indentCompartment;
      if (!view || !compartment) {
        return;
      }
      view.dispatch({
        effects: compartment.reconfigure(indentExtensions(size)),
      });
    });

    effect(() => {
      const languagePath = this.languagePath();
      const view = this.view;
      const compartment = this.languageCompartment;
      if (!view || !compartment) {
        return;
      }
      void this.applyLanguage(view, languagePath, compartment);
    });

    effect(() => {
      const busy = this.busyMessage() !== null || this.opening();
      if (!this.mounted() || !busy) {
        return;
      }
      this.view?.contentDOM.blur();
    });
  }

  /** 读正文；未挂载为 null */
  getDoc(): string | null {
    return this.view?.state.doc.toString() ?? null;
  }

  /** 整篇替换 */
  setDoc(content: string): void {
    const view = this.view;
    if (!view) {
      return;
    }
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    });
  }

  /** 差量写回（格式化 diff） */
  applyChanges(changes: FormatTextChange[]): void {
    const view = this.view;
    if (!view || changes.length === 0) {
      return;
    }
    view.dispatch({ changes });
  }

  /**
   * 整篇格式化；未挂载返回 null。
   * 不在此改 editable；忙碌蒙版由 busyMessage 控制。
   */
  async formatDocument(
    languagePath: string,
    indentSize: number,
  ): Promise<FormatDocumentResult | null> {
    const view = this.view;
    if (!view) {
      return null;
    }
    return formatEditorDocument({
      languagePath,
      indentSize,
      readDoc: () => view.state.doc.toString(),
      isDocUnchanged: (before) => this.view === view && view.state.doc.toString() === before,
      applyChanges: (changes) => {
        if (this.view === view) {
          view.dispatch({ changes });
        }
      },
    });
  }

  focus(): void {
    this.view?.focus();
  }

  /** 聚焦并全选 */
  selectAllInView(): void {
    const view = this.view;
    if (!view) {
      return;
    }
    view.focus();
    selectAll(view);
  }

  getCaretStatus(): EditorCaretStatus | null {
    return this.view ? readEditorCaretStatus(this.view.state) : null;
  }

  private mount(): void {
    const parent = this.host.nativeElement.querySelector('.code-editor');
    if (!(parent instanceof HTMLElement)) {
      return;
    }
    const languageCompartment = new Compartment();
    const indentCompartment = new Compartment();
    this.languageCompartment = languageCompartment;
    this.indentCompartment = indentCompartment;

    const path = this.path();

    const view = new EditorView({
      doc: '',
      parent,
      extensions: [
        ...baseExtensions,
        indentCompartment.of(indentExtensions(this.indentSize())),
        languageCompartment.of([]),
        keymap.of([
          {
            key: 'Mod-s',
            run: () => {
              this.saveRequest.emit();
              return true;
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !this.hydrating) {
            this.dirty.emit();
          }
          if (update.docChanged || update.selectionSet) {
            this.caretStatus.emit(readEditorCaretStatus(update.state));
          }
        }),
        EditorView.domEventHandlers({
          paste: (event, editorView) => {
            if (editorView.state.doc.length !== 0) {
              return false;
            }
            const text = event.clipboardData?.getData('text/plain') ?? '';
            if (text.length > 0) {
              this.emptyPaste.emit(text);
            }
            return false;
          },
        }),
      ],
    });
    this.view = view;
    this.mounted.set(true);
    this.caretStatus.emit(readEditorCaretStatus(view.state));

    if (path === null) {
      this.ready.emit();
    } else {
      this.opening.set(true);
      void this.hydrate(view, path);
    }

    void this.applyLanguage(view, this.languagePath(), languageCompartment);
  }

  private async hydrate(view: EditorView, filePath: string): Promise<void> {
    this.opening.set(true);
    try {
      const file = await openTextPath(filePath);
      if (this.view !== view) {
        return;
      }

      this.hydrating = true;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: file.content },
        annotations: [Transaction.addToHistory.of(false)],
      });
      this.hydrating = false;

      if (!sameFilePath(filePath, file.path)) {
        this.pathResolved.emit(file.path);
      }
      this.ready.emit();
    } catch (error) {
      if (this.view === view) {
        this.loadError.emit(error);
      }
    } finally {
      if (this.view === view) {
        this.opening.set(false);
      }
    }
  }

  private async applyLanguage(
    view: EditorView,
    path: string,
    languageCompartment: Compartment,
  ): Promise<void> {
    const extension = await loadLanguageExtension(path);
    if (this.view !== view) {
      return;
    }
    view.dispatch({
      effects: languageCompartment.reconfigure(extension),
    });
  }

  ngOnDestroy(): void {
    this.view?.destroy();
    this.view = null;
    this.languageCompartment = null;
    this.indentCompartment = null;
  }
}
