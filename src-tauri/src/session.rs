//! 编辑器会话：打开路径列表与当前标签持久化。

mod commands;
mod persist;

pub(crate) use commands::{load_editor_session, save_editor_session};
