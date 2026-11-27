import { DestroyRef, inject, Injectable } from '@angular/core';

/** Ctrl/Cmd + 这些键：刷新 / 打印 / 源码 / 书签 / 缩放（查找交给编辑器） */
const BLOCKED_KEYS = new Set(['r', 'p', 'u', 'd', '+', '=', '-', '_', '0']);
const BLOCKED_CODES = new Set([
  'KeyR',
  'KeyP',
  'KeyU',
  'KeyD',
  'Equal',
  'Minus',
  'Digit0',
  'NumpadAdd',
  'NumpadSubtract',
  'Numpad0',
]);

/**
 * 前端侧屏蔽常见浏览器默认快捷键；Win 上原生加速键另见 prevent_default。
 * 与 `EditorPage` 同生命周期（providers）。
 */
@Injectable()
export class EditorBlockBrowserShortcutsService {
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'F5') {
        event.preventDefault();
        return;
      }
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }
      const key = event.key.toLowerCase();
      if (BLOCKED_KEYS.has(key) || BLOCKED_CODES.has(event.code)) {
        event.preventDefault();
      }
    };

    const onWheel = (event: WheelEvent): void => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('wheel', onWheel, true);
    });
  }
}
