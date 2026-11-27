/** 持久化的编辑器会话（仅路径，不含正文） */
export interface EditorSession {
  paths: string[];
  activePath: string | null;
}
