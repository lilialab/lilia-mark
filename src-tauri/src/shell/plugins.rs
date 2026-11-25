//! Builder 插件与 WebView 默认快捷键屏蔽。

use tauri::Manager;

use super::open_file::{open_path_in_running_app, paths_from_args};

/// 屏蔽 WebView 浏览器默认快捷键（Ctrl+P 等在 Win 上不会进到 JS）。
pub fn prevent_default() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    use tauri_plugin_prevent_default::Flags;

    #[cfg(debug_assertions)]
    let flags = Flags::keyboard().difference(Flags::DEV_TOOLS);
    #[cfg(not(debug_assertions))]
    let flags = Flags::keyboard();

    let builder = tauri_plugin_prevent_default::Builder::new().with_flags(flags);

    #[cfg(windows)]
    let builder = builder.platform(
        tauri_plugin_prevent_default::PlatformOptions::new().browser_accelerator_keys(false),
    );

    builder.build()
}

/// 桌面：单实例（含二次启动打开文件）与窗位记忆。
#[cfg(desktop)]
pub fn register_desktop(builder: tauri::Builder<tauri::Wry>) -> tauri::Builder<tauri::Wry> {
    builder
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(path) = paths_from_args(args).into_iter().next() {
                open_path_in_running_app(app, path);
                return;
            }

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_window_state::Builder::default().build())
}
