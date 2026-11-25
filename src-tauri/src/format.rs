//! 文档格式化域：纯计算 + invoke。

mod commands;
pub(crate) mod doc;

pub(crate) use commands::format_document_text;
