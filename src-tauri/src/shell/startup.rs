//! 冷启动：记下待打开路径；运行期 Ready / 系统 Opened。

use tauri::{App, AppHandle, RunEvent};

use super::startup_timing::mark_window_visible;

/// setup：Win/Linux 冷启动参数写入待打开路径。
pub fn setup(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(any(windows, target_os = "linux"))]
    {
        use super::open_file::{paths_from_args, remember_open_path};

        if let Some(path) = paths_from_args(std::env::args()).into_iter().next() {
            remember_open_path(app.handle(), path);
        }
    }
    #[cfg(not(any(windows, target_os = "linux")))]
    let _ = app;

    Ok(())
}

/// 应用事件循环：窗口可见计时；Apple 平台处理 Opened URL。
pub fn on_run_event(app: &AppHandle, event: RunEvent) {
    if let RunEvent::Ready = &event {
        mark_window_visible(app);
    }

    #[cfg(any(target_os = "macos", target_os = "ios"))]
    if let RunEvent::Opened { urls } = event {
        use super::open_file::open_path_in_running_app;

        if let Some(path) = urls
            .into_iter()
            .filter_map(|url| url.to_file_path().ok())
            .next()
        {
            open_path_in_running_app(app, path);
        }
    }
}
