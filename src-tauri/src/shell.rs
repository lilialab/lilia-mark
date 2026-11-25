//! 桌面壳：打开文件、导航守卫、启动计时与 Builder 装配。

mod commands;
pub(crate) mod navigation_guard;
mod open_file;
pub(crate) mod plugins;
pub(crate) mod startup;
mod startup_timing;

pub(crate) use commands::{get_native_startup_timing, take_pending_open_path};
pub(crate) use open_file::PendingOpenPath;
pub(crate) use startup_timing::StartupTiming;
