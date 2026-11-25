//! LiliaMark 桌面端：命令注册与文件打开生命周期。

mod format;
mod fs;
mod ipc_bytes;
mod session;
mod settings;
mod shell;

use format::format_document_text;
use fs::{
    classify_drop_paths, read_text_file, sync_watched_files, write_text_file, FileWatchState,
};
use session::{load_editor_session, save_editor_session};
use settings::{default_app_settings, load_app_settings, save_app_settings};
use shell::{
    get_native_startup_timing, take_pending_open_path, PendingOpenPath, StartupTiming,
};

/// 启动 Tauri：单实例、文件关联打开、注册读写命令。
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = shell::plugins::register_desktop(builder);
    }

    builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(shell::plugins::prevent_default())
        .plugin(shell::navigation_guard::init())
        .manage(StartupTiming::new())
        .manage(PendingOpenPath::new())
        .manage(FileWatchState::new())
        .setup(shell::startup::setup)
        .invoke_handler(tauri::generate_handler![
            // shell
            take_pending_open_path,
            get_native_startup_timing,
            // fs
            classify_drop_paths,
            read_text_file,
            write_text_file,
            sync_watched_files,
            // session
            load_editor_session,
            save_editor_session,
            // settings
            load_app_settings,
            save_app_settings,
            default_app_settings,
            // format
            format_document_text,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(shell::startup::on_run_event);
}
