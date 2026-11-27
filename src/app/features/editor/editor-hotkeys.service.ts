import { DestroyRef, inject, Injectable } from '@angular/core';

import { closeCurrentWindow } from '@/app/lib/tauri/fs';

import { ConfirmDialogService } from './confirm-dialog.service';
import { EditorStore } from './editor.store';
import { EditorIoService } from './editor-io.service';

/** 依赖页面状态 / viewChildren 的快捷键动作 */
export interface EditorHotkeyHandlers {
  /** Esc：预览是否打开 */
  isPreviewOpen: () => boolean;
  closePreview: () => void;
  togglePreview: () => void;
  /** Mod+W：关活跃 tab（含脏确认） */
  closeActiveTab: () => void | Promise<void>;
  /** Mod+A：编辑区外时聚焦并全选 */
  selectAllInEditor: () => void;
}

interface HotkeyBinding {
  mod?: boolean;
  shift?: boolean;
  alt?: boolean;
  code: string;
  run: () => void;
  when?: (event: KeyboardEvent) => boolean;
}

function shouldKeepNativeSelectAll(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  if (target.closest('.cm-editor')) {
    return true;
  }
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return true;
  }
  if (target instanceof HTMLElement && target.isContentEditable) {
    return true;
  }
  return false;
}

/** 修饰键按「要/不要」全等匹配，避免 Mod+S 吃掉 Mod+Shift+S。 */
function matchesBinding(event: KeyboardEvent, binding: HotkeyBinding): boolean {
  const wantsMod = binding.mod === true;
  const wantsShift = binding.shift === true;
  const wantsAlt = binding.alt === true;
  const hasMod = event.ctrlKey || event.metaKey;

  if (wantsMod !== hasMod || wantsShift !== event.shiftKey || wantsAlt !== event.altKey) {
    return false;
  }
  if (event.code !== binding.code) {
    return false;
  }
  return binding.when?.(event) ?? true;
}

/**
 * 编辑页应用级快捷键（window capture）。
 * 与 `EditorPage` 同生命周期；页面相关动作经 `bindHandlers` 接入。
 */
@Injectable()
export class EditorHotkeysService {
  private readonly editorStore = inject(EditorStore);
  private readonly editorIo = inject(EditorIoService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  private handlers: EditorHotkeyHandlers | null = null;

  /** 由 EditorPage 绑定预览 / 关 tab / 全选 */
  bindHandlers(handlers: EditorHotkeyHandlers): void {
    this.handlers = handlers;
  }

  constructor() {
    this.listen();
  }

  private listen(): void {
    const onKeyDown = (event: KeyboardEvent): void => {
      const handlers = this.handlers;
      if (!handlers) {
        return;
      }

      if (
        event.key === 'Escape'
        && handlers.isPreviewOpen()
        && this.confirmDialog.request() === null
      ) {
        event.preventDefault();
        handlers.closePreview();
        return;
      }

      const bindings: HotkeyBinding[] = [
        {
          alt: true,
          shift: true,
          code: 'KeyF',
          run: () => {
            void this.editorIo.formatActiveDocument();
          },
        },
        {
          mod: true,
          shift: true,
          code: 'KeyS',
          run: () => {
            void this.editorIo.saveAs();
          },
        },
        {
          mod: true,
          code: 'KeyN',
          run: () => {
            this.editorStore.newUntitled();
          },
        },
        {
          mod: true,
          code: 'KeyS',
          run: () => {
            void this.editorIo.save();
          },
        },
        {
          mod: true,
          code: 'KeyE',
          run: () => {
            handlers.togglePreview();
          },
        },
        {
          mod: true,
          code: 'KeyW',
          run: () => {
            void handlers.closeActiveTab();
          },
        },
        {
          mod: true,
          code: 'KeyQ',
          run: () => {
            void closeCurrentWindow();
          },
        },
        {
          mod: true,
          code: 'KeyA',
          run: () => {
            handlers.selectAllInEditor();
          },
          when: (e) => !shouldKeepNativeSelectAll(e.target),
        },
      ];

      for (const binding of bindings) {
        if (!matchesBinding(event, binding)) {
          continue;
        }
        event.preventDefault();
        binding.run();
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('keydown', onKeyDown, true);
    });
  }
}
