//! 应用设置域：持久化与默认稿。

mod commands;
mod persist;

pub(crate) use commands::{default_app_settings, load_app_settings, save_app_settings};
