//! 文件读写与磁盘监听。

mod commands;
mod watch;

pub(crate) use commands::{
    classify_drop_paths, read_text_file, sync_watched_files, write_text_file,
};
pub(crate) use watch::FileWatchState;
