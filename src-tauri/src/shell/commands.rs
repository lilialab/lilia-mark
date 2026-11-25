//! 桌面壳 IPC：待打开路径与启动计时。

use tauri::State;

use super::open_file::PendingOpenPath;
use super::startup_timing::{NativeStartupTiming, StartupTiming};

/// 取出并清空冷启动待打开路径。
#[tauri::command]
pub(crate) fn take_pending_open_path(state: State<'_, PendingOpenPath>) -> Option<String> {
    state.take()
}

#[tauri::command]
pub(crate) fn get_native_startup_timing(
    state: State<'_, StartupTiming>,
) -> NativeStartupTiming {
    state.snapshot()
}
