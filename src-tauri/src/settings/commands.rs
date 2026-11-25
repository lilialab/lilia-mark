//! 应用设置 IPC。

use tauri::AppHandle;

use super::persist::{self, AppSettings};

/// 读取设置；合并缺省后始终写回完整文件。
#[tauri::command]
pub(crate) fn load_app_settings(app: AppHandle) -> Result<AppSettings, String> {
    persist::load(app)
}

/// 将设置写入应用配置目录。
#[tauri::command]
pub(crate) fn save_app_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    persist::save(app, settings)
}

/// 返回内置默认设置（`default_settings.json`），不读写磁盘。
#[tauri::command]
pub(crate) fn default_app_settings() -> AppSettings {
    persist::defaults()
}
