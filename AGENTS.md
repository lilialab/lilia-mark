# LiliaMark Agent 指南

跨平台本地 Markdown 编辑预览（Tauri 2 + Rust + Angular + CodeMirror 6）。桌面应用，不为浏览器单独降级。产品范围以 [README.md](README.md) 为准。

## 读文件

读多少由任务决定，不由文件大小决定。

Grep / Glob 定位 → 再 Read。按下方「任务入口」定点读；禁止全仓 explore、整目录 Read、全仓 subagent，或一次串读 editor + preview + tauri 全链路。大范围探查（多文件、一条链路）交给 subagent，主上下文只收结论。

- **评审改动**：读改动本身（`git diff` 或改动处），不整读文件 —— 未改动的部分不是评审对象。
- **评审整体设计 / 可读性**：整读目标文件（或整套模块）再下结论。
- 提问没点明范围时（「你觉得怎么样」）：按最小够用读，并说明读了什么范围。

理由：`read` 不受 spill 保护（上限 `readLimit` 2000 行 / `readMaxBytes` 51200 字节），读进来的内容此后每轮都要重发。

## 代码导航

文件不存在时按此路径新增，不要另起一套目录。空目录不预先创建。

| 层级 | 路径 |
|------|------|
| 路由 / 功能域 | `src/app/features/`（`*.page` + 域内模块；实质单页） |
| 可复用 UI | `src/app/shared/ui/`（组件）、`src/app/shared/directives/`（指令）；域内 `components/` |
| 编辑器装配 | `src/app/features/editor/`（`editor.page` + `EditorStore` + 菜单/tab/底栏等壳）；`src/app/features/code-editor/`（CM 宿主） |
| 预览 | `src/app/features/preview/`（markdown-it → HTML；预览宿主） |
| 主题色 | `src/theme/`（固定 Catppuccin Macchiato；`--ctp-*` 与 `--app-*` / `--md-*`） |
| 桌面 IO 封装 | `src/app/lib/tauri/`（唯一裸 `invoke` 出口） |
| 共享类型 | `src/app/types/` |
| 纯函数 | `src/app/utils/`（无 I/O，不依赖 Tauri / DOM） |
| Rust 命令 | `src-tauri/src/`（文件 IO；耗时计算如文档 format + diff） |
| 单测 | `tests/` 镜像 `src/app/`；**不**在 `src/` 内 co-locate |

- 有预览语义的逻辑放 `src/app/features/preview/`，不要塞进 `src/app/utils/`。
- **耗时工作优先放 Rust**（阻塞池 / async command + 前端 loading）：不卡 WebView 主线程，用户仍可感知进度。文件 IO 与「格式化文档」（JSON / Markdown 的 format + diff）已按此做。轻量、强交互、或预览链路仍留前端；预览用的 Markdown→HTML 在 `src/app/features/preview/`，未成瓶颈前不要搬进 Rust。

## 任务入口

引用一律用仓库根全路径。

| 任务 | 先读 |
|------|------|
| 产品范围 / 第一版做什么 | `README.md` |
| 主界面 / 编辑页 | `src/app/features/editor/` |
| 源码高亮（CM） | `src/app/features/code-editor/` |
| Markdown 渲染、图片路径 | `src/app/features/preview/` |
| 打开 / 保存 / 监听 / 设置 / 格式化 | `src/app/lib/tauri/`，再进 `src-tauri/src/` |
| 纯函数单测 | `tests/` 里与源文件对应的用例 |

## 命令与环境

- 沙箱只放行工作区写入：pnpm 加 `COREPACK_HOME=/tmp/corepack`，dprint 加 `DPRINT_CACHE_DIR=/tmp/dprint-cache`（默认 `~/.cache` 会被拦）；Windows 可用 `%LOCALAPPDATA%\Temp\…` 等价路径
- 命令：`pnpm format`、`pnpm lint`、`pnpm test`、`pnpm start`、`pnpm tauri dev`、`pnpm tauri build`
- dprint 插件用 `node_modules` 里的 wasm（见 `dprint.json`）。Windows 上 `npm:@dprint/...` 会因路径里的 `:` 解析失败，不要改回
- `pnpm tauri` 走 `scripts/tauri.mjs`：`dev` 时合并 `tauri.dev.conf.json`
- 边界：签名密钥和系统 WebView 依赖由用户自己装；代理只跑上面列出的命令

### 改完验收

每轮改完业务代码（含样式 / i18n / Rust 命令等），在收工前必须：

1. `pnpm format`
2. `pnpm lint`（失败则修好再结束；不要留给用户）
3. 若动了纯函数或其测试：跑对应 `pnpm test …`

纯问答、只改文档（如仅 `AGENTS.md` / `CHANGELOG.md`）且无代码变动时，可不跑上述命令。

## 分层

| 层级 | 职责 | 禁止 |
|------|------|------|
| 共用 UI | 纯展示 | `invoke`、调 `lib/tauri`、解析 Markdown |
| Store | **状态**（如 tabs / settings）；少碰 IO | 文件对话框、写盘流程、裸 `invoke` |
| 功能域 Service | **过程编排**（开改存、会话恢复落盘等）；改 Store + 调 `lib/tauri` | 塞进 Store；裸 `invoke` |
| `src/app/features/preview/` | 原文 → HTML；预览宿主 | 裸 `invoke`；编辑页编排壳 |
| `src/app/lib/tauri/` | 打开、读取、保存、监听、格式化等 invoke 封装 | 业务分支、渲染 |
| Rust 命令 | 文件 IO；耗时计算（如文档 format + diff）；可加 loading | 预览 HTML、碰 UI |

- Store = 是什么；Service = 做什么。编辑页 `providers` 同时挂 `EditorStore` 与 page 级 Service（如 `EditorSessionService` / `EditorIoService`），勿再拆「SaveStore」镜像状态。

- 编辑是源码高亮，不是富文本。不要加格式化工具栏、选区装饰、ProseMirror / TipTap
- CodeMirror 自拼精简 extensions + `@codemirror/lang-markdown` 和一套主题；不要用整包 `basicSetup`，不要换 Monaco，也不要自己写高亮层
- 预览用 markdown-it。第一版不上 KaTeX、Mermaid、目录树、滚动同步
- 相对路径图片经 Tauri 资源协议交给 WebView，不把裸文件路径写进 `<img>`
- 要超出 README「第一版」时，先跟用户确认

## 代码风格

- 格式：[`dprint.json`](dprint.json)。改完跑 format / lint，见上方「改完验收」。冲突时可读性优先。
- 分层见「代码导航」，此处不重复。
- **可读性优先于防御性**：难读比偶发错误更糟。不为「万一」加多余分支、mirror state、双重解析、重复校验；边界校验只放在真正边界（Tauri 命令、文件对话框、外部路径），内层信任上游。能用类型、命名、单测表达的，不用运行时 `if` 堆砌。
- 用户对代码风格 / 实现提出异议或质疑时（如「这样写有问题吗」「我不太喜欢」「为什么不…」）：优先对照社区主流做法与共识强弱（主流约定 / 常见偏好 / 有争议）来评估，再说明本仓库现有约定。不要默认维护现状或只给个人偏好；本仓与社区冲突时先讲清差异，再让用户决定跟谁。

细则：

- **文件名 kebab-case**（`markdown-preview.ts`、`editor-tab.ts`、`app-settings.ts`）。组件配套 `.ts` / `.html` / `.css` 同 stem。标识符仍用 PascalCase / camelCase；`tests/` 镜像路径同步
- 优先 ES2015+（async/await、解构、可选链等）
- 跨目录 import 用 `@/`（`tsconfig` → `src/*`）；同目录 / 子路径仍可用 `./`
- import 顺序：`node:` → 外部包 → `@/` → `./`（`eslint-plugin-simple-import-sort`，组间空行）
- Store：类型 `<Domain>Store`；inject 字段同名小驼峰（`editorStore` / `settingsStore`），勿裸 `store`
- `import type`；数组写 `T[]`
- 可选字段扁平：`key: value | undefined`；勿 `...(cond ? { key } : {})`
- 默认值用 `??`；布尔组合或空串也要 fallback 时用 `||`
- `src/app/lib/tauri/`、纯工具函数的 export 补简短中文 JSDoc
- 列表：`map` / `filter` / `reduce` / `flatMap`；顺序副作用或 `await` → `for...of`；禁用 `for...in`、破坏性 `sort` / `reverse` / `splice`（用 `toSorted` 等 / `.at()`）
- **拆分与分段 banner**：先判断拆不拆，banner 不替代拆分。有独立职责/复用/嵌套过深 → 抽组件、服务或域内模块；只出现一次且拆了更难读、或「将来可能复用」的提前拆 → 不拆。仍合在一处且偏长（约 ≥100～150 行或多段逻辑）→ 加 banner；短文件、单线薄封装不加。格式：

```
/* -------------------------------------------------------------------------- */
/* Section name                                                               */
/* -------------------------------------------------------------------------- */
```

## 测试

改纯函数：同步更新 `tests/` 对应用例。依赖系统 WebView 或真实文件系统的路径不强制 E2E。
