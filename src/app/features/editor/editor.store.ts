import { moveItemInArray } from '@angular/cdk/drag-drop';
import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import type { DiskChangeKind } from '@/app/types/disk-file-changed';
import type { EditorSession } from '@/app/types/editor-session';
import type { EditorTab } from '@/app/types/editor-tab';
import { resolveActiveTabId } from '@/app/utils/editor-session';
import type { EditorCaretStatus } from '@/app/utils/editor-status';
import {
  createTabId,
  updateTab,
  withDiskChange,
  withDiskReload,
  withoutDiskChange,
  withSaved,
} from '@/app/utils/editor-tab';
import { sameFilePath } from '@/app/utils/path';
import { DEFAULT_UNTITLED_EXT, isDefaultUntitled, isUntitled } from '@/app/utils/untitled';

interface EditorStoreState {
  tabs: EditorTab[];
  activeId: string | null;
  /** 活跃 tab 光标；无活跃或未就绪为 null（非 EditorView） */
  caretStatus: EditorCaretStatus | null;
}

function nextStateAfterClose(
  tabs: EditorTab[],
  activeId: string | null,
  id: string,
): Pick<EditorStoreState, 'tabs' | 'activeId'> | null {
  const index = tabs.findIndex((tab) => tab.id === id);
  if (index < 0) {
    return null;
  }
  const next = tabs.filter((tab) => tab.id !== id);
  let nextActive = activeId;
  if (activeId === id) {
    const neighbor = next[index] ?? next[index - 1] ?? null;
    nextActive = neighbor?.id ?? null;
  }
  return { tabs: next, activeId: nextActive };
}

/**
 * 编辑会话：tabs / activeId。
 * 由 `EditorPage` providers 提供（非 root）；勿放入 EditorView。
 */
export const EditorStore = signalStore(
  withState<EditorStoreState>({
    tabs: [],
    activeId: null,
    caretStatus: null,
  }),
  withComputed(({ tabs, activeId }) => ({
    activeTab: computed(() => {
      const id = activeId();
      if (id === null) {
        return null;
      }
      return tabs().find((tab) => tab.id === id) ?? null;
    }),
  })),
  withMethods((store) => ({
    newUntitled(): void {
      const tab: EditorTab = {
        id: createTabId(),
        path: null,
        untitledExt: DEFAULT_UNTITLED_EXT,
        dirty: false,
        diskChange: null,
        docEpoch: 0,
      };
      patchState(store, {
        tabs: [...store.tabs(), tab],
        activeId: tab.id,
        caretStatus: null,
      });
    },

    /** 已打开同路径则激活；否则新建 tab */
    focusOrOpenPath(path: string): void {
      const existing = store.tabs().find((tab) =>
        tab.path !== null && sameFilePath(tab.path, path)
      );
      if (existing) {
        patchState(store, { activeId: existing.id, caretStatus: null });
        return;
      }
      const tab: EditorTab = {
        id: createTabId(),
        path,
        untitledExt: DEFAULT_UNTITLED_EXT,
        dirty: false,
        diskChange: null,
        docEpoch: 0,
      };
      patchState(store, {
        tabs: [...store.tabs(), tab],
        activeId: tab.id,
        caretStatus: null,
      });
    },

    setActive(id: string): void {
      if (!store.tabs().some((tab) => tab.id === id)) {
        return;
      }
      patchState(store, { activeId: id, caretStatus: null });
    },

    /** 标签拖拽排序（CDK previousIndex → currentIndex） */
    reorderTabs(fromIndex: number, toIndex: number): void {
      if (fromIndex === toIndex) {
        return;
      }
      const next = store.tabs().slice();
      moveItemInArray(next, fromIndex, toIndex);
      patchState(store, { tabs: next });
    },

    /** 启动恢复：仅已落盘路径；未命名不入会话 */
    restoreFromSession(session: EditorSession): void {
      const tabs: EditorTab[] = session.paths.map((path) => ({
        id: createTabId(),
        path,
        untitledExt: DEFAULT_UNTITLED_EXT,
        dirty: false,
        diskChange: null,
        docEpoch: 0,
      }));
      patchState(store, {
        tabs,
        activeId: resolveActiveTabId(tabs, session.activePath),
        caretStatus: null,
      });
    },

    setCaretStatus(status: EditorCaretStatus | null): void {
      patchState(store, { caretStatus: status });
    },

    /** 移除标签（脏确认由页面 / Io 编排后再调） */
    closeTab(id: string): void {
      const activeId = store.activeId();
      const next = nextStateAfterClose(store.tabs(), activeId, id);
      if (!next) {
        return;
      }
      patchState(store, activeId === id ? { ...next, caretStatus: null } : next);
    },

    markDirty(id: string): void {
      const tab = store.tabs().find((item) => item.id === id);
      if (!tab || tab.dirty) {
        return;
      }
      patchState(store, {
        tabs: updateTab(store.tabs(), id, (item) => ({ ...item, dirty: true })),
      });
    },

    markSaved(id: string): void {
      patchState(store, {
        tabs: updateTab(store.tabs(), id, withSaved),
      });
    },

    /** 外部磁盘变更：同路径 tab 打标（自写抑制在 Rust） */
    applyDiskChange(path: string, kind: DiskChangeKind): void {
      patchState(store, {
        tabs: withDiskChange(store.tabs(), path, kind),
      });
    },

    /** 冲突时保留编辑，只清磁盘标记 */
    keepEdits(id: string): void {
      patchState(store, {
        tabs: updateTab(store.tabs(), id, withoutDiskChange),
      });
    },

    /** 用磁盘版：清脏 + 清标记 + 递增 docEpoch 触发 CM 重挂读盘 */
    reloadFromDisk(id: string): void {
      const tab = store.tabs().find((item) => item.id === id);
      if (!tab || tab.diskChange !== 'modify') {
        return;
      }
      patchState(store, {
        tabs: updateTab(store.tabs(), id, withDiskReload),
      });
    },

    resolvePath(id: string, path: string): void {
      patchState(store, {
        tabs: updateTab(store.tabs(), id, (tab) => ({ ...tab, path })),
      });
    },

    /** 另存为后切到新路径；正文未再变则清脏 */
    promotePath(id: string, path: string, clearDirty: boolean): void {
      patchState(store, {
        tabs: updateTab(
          store.tabs(),
          id,
          (tab) => clearDirty ? withSaved({ ...tab, path }) : { ...tab, path },
        ),
      });
    },

    removeTab(id: string): void {
      const activeId = store.activeId();
      const next = nextStateAfterClose(store.tabs(), activeId, id);
      if (!next) {
        return;
      }
      patchState(store, activeId === id ? { ...next, caretStatus: null } : next);
    },

    setUntitledExt(id: string, ext: string): void {
      const tab = store.tabs().find((item) => item.id === id);
      if (!isUntitled(tab) || tab.untitledExt === ext) {
        return;
      }
      patchState(store, {
        tabs: updateTab(
          store.tabs(),
          id,
          (item) => isUntitled(item) ? { ...item, untitledExt: ext } : item,
        ),
      });
    },

    /** 活跃 tab 改后缀（底栏弹框） */
    setActiveUntitledExt(ext: string): void {
      const tab = store.activeTab();
      if (!isUntitled(tab) || tab.untitledExt === ext) {
        return;
      }
      patchState(store, {
        tabs: updateTab(
          store.tabs(),
          tab.id,
          (item) => isUntitled(item) ? { ...item, untitledExt: ext } : item,
        ),
      });
    },

    /** 空文档粘贴嗅探：仅默认 md 未命名时改后缀 */
    applySniffedExt(id: string, ext: string): void {
      if (ext === DEFAULT_UNTITLED_EXT) {
        return;
      }
      const tab = store.tabs().find((item) => item.id === id);
      if (!isDefaultUntitled(tab)) {
        return;
      }
      patchState(store, {
        tabs: updateTab(
          store.tabs(),
          id,
          (item) => isDefaultUntitled(item) ? { ...item, untitledExt: ext } : item,
        ),
      });
    },
  })),
);
