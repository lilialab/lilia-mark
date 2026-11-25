//! 编辑器会话 IPC。

use tauri::AppHandle;

use super::persist::{self, EditorSession};

/// 从应用数据目录读取编辑器会话；无文件或坏 JSON 时返回空会话。
#[tauri::command]
pub(crate) fn load_editor_session(app: AppHandle) -> Result<EditorSession, String> {
    persist::read(app)
}

/// 将编辑器会话写入应用数据目录。
#[tauri::command]
pub(crate) fn save_editor_session(app: AppHandle, session: EditorSession) -> Result<(), String> {
    persist::write(app, session)
}
