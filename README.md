# Claude Code HUD (Fixed) v1.4.0

Real-time status HUD for Claude Code: context usage, cost, cache hit rate, and task progress.

**This is a fixed version** that properly handles Windows paths with backslashes, colons, and spaces.

---

## 📦 安装方式

### 方式 1：VS Code 扩展面板（推荐）

1. 打开 VS Code
2. 按 `Ctrl+Shift+X` 打开 **Extensions** 面板
3. 搜索 `claude-code-hud-fixed`
4. 点击 **Install** 安装

### 方式 2：快速安装命令

在 VS Code 中按 `Ctrl+P`，粘贴以下命令并回车：

```
ext install LIMINXUE.claude-code-hud-fixed
```

### 方式 3：从 VSIX 文件安装

1. 从 [GitHub Releases](https://github.com/BOYGAGAGA/claude-code-hud/releases) 下载 `.vsix` 文件
2. 在 VS Code 中：Extensions 面板 → `...` → **Install from VSIX**
3. 选择下载的 `.vsix` 文件

### 方式 4：命令行安装

```bash
code --install-extension LIMINXUE.claude-code-hud-fixed
```

### 使用方式

1. 打开任意项目，启动 **Claude Code**
2. HUD 会自动检测会话并显示数据
3. 点击左侧 Activity Bar 的 🤖 图标打开 HUD 面板
4. 底部状态栏会实时显示关键指标

---

## 🔗 链接

| 链接 | URL |
|------|-----|
| **Marketplace** | https://marketplace.visualstudio.com/items?itemName=LIMINXUE.claude-code-hud-fixed |
| **GitHub** | https://github.com/BOYGAGAGA/claude-code-hud |

---

## v1.4.0 更新日志 (2026-06-27)

### ✨ 新功能
- **会话切换器**：下拉菜单选择不同会话，不再只显示单一会话
- 多个会话时显示下拉选择框
- 单个会话时显示会话标题
- 点击 📌 可取消固定会话

### 🐛 修复
- Tasks 面板自动刷新：新一轮任务开始时自动清除旧任务

## v1.3.4 更新日志 (2026-06-27)

### 🐛 修复
- **Tasks 面板自动刷新**：新一轮任务开始时，自动清除旧任务，只显示当前轮次
- 智能检测新任务：当超过半数任务为新内容时，判定为新一轮

## v1.3.2 更新日志 (2026-06-27)

### 🎨 新增
- **扩展 Logo**：添加自定义图标，提升 Marketplace 展示效果

## v1.3.1 更新日志 (2026-06-27)

### 🐛 修复
- **Agent 任务识别增强**：支持更多 Agent 任务格式
  - `Agent-X: task`
  - `[Agent-X] task`
  - `Agent X: task`
  - `agent-x: task`（不区分大小写）

## v1.3.0 更新日志 (2026-06-27)

### ✨ 新功能
- **多 Agent 任务追踪**：支持 Workflow 多 Agent 并行任务
- **Agent 面板**：独立显示每个 Agent 的任务进度
- 所有 Agent 的任务自动聚合到 Agents 面板

### 📊 Agent 面板示例
```
🤖 Agents (5/8)
┌─ Agent-A ──────────────────────────┐
│ Agent-A ██████████ 100% (2/2)      │
│   ██████████ 100% 扫描文件结构     │
│   ██████████ 100% 分析目录层次     │
└────────────────────────────────────┘
┌─ Agent-B ──────────────────────────┐
│ Agent-B █████░░░░░  50% (1/2)      │
│   ██████████ 100% 收集项目信息     │
│   ░░░░░░░░░░   0% 运行静态分析     │
└────────────────────────────────────┘
```

## v1.2.0 更新日志 (2026-06-27)

### ✨ 新功能
- **自动识别模型上下文大小**：MiMo = 1M, DeepSeek V4 = 1M
- **自动适配 API 价格**：40+ 模型全覆盖
- **DeepSeek V4 最新定价**（2026-06-27 官方价格）
- **MiMo-V2.5 最新定价**（2026-06-24 官方价格）

### 🐛 修复
- Windows 路径编码问题（支持 `\`、`:`、空格）

### 🗑️ 移除
- 工具调用统计模块（简化界面）

## v1.0.0 - 初始版本 (2026-06-27)

### ✨ 核心功能
- 实时监控 Claude Code 会话状态
- 上下文用量追踪
- 缓存命中率显示
- 会话费用计算
- 任务进度追踪
- 7 天费用统计
- 状态栏快捷显示

### ✨ 新功能
- **自动识别模型上下文大小**：根据模型名称自动匹配正确的上下文窗口
- **自动适配 API 价格**：根据模型自动使用正确的定价
- **支持 30+ 模型**：覆盖主流国内外模型

### 🐛 修复
- 修复 Windows 路径编码问题（支持 `\`、`:`、空格）
- 修复 MiMo-V2.5 系列上下文大小（128K → 1M）
- 修复 DeepSeek V4 系列定价（最新 2026-06-27 官方价格）

### 📊 支持的模型定价

#### Anthropic Claude
| 模型 | Input/1M | Output/1M | Context |
|------|----------|-----------|---------|
| Claude Opus 4 | $15.00 | $75.00 | 200K |
| Claude Sonnet 4 | $3.00 | $15.00 | 200K |
| Claude Haiku 3.5 | $0.80 | $4.00 | 200K |

#### DeepSeek (2026-06-27 最新)
| 模型 | Input/1M | Input(缓存)/1M | Output/1M | Context |
|------|----------|----------------|-----------|---------|
| deepseek-v4-flash | ¥1 ($0.14) | ¥0.02 ($0.003) | ¥2 ($0.28) | **1M** |
| deepseek-v4-pro | ¥3 ($0.42) | ¥0.025 ($0.004) | ¥6 ($0.83) | **1M** |

#### 小米 MiMo (2026-06-24 最新)
| 模型 | Input/1M | Input(缓存)/1M | Output/1M | Context |
|------|----------|----------------|-----------|---------|
| mimo-v2.5-pro | $0.435 (¥3) | $0.0036 (¥0.025) | $0.87 (¥6) | **1M** |
| mimo-v2.5 | $0.14 (¥1) | $0.0028 (¥0.02) | $0.28 (¥2) | **1M** |

#### 国产模型
| 厂商 | 模型 | Input/1M | Output/1M | Context |
|------|------|----------|-----------|---------|
| 通义千问 | qwen-max | $0.56 (¥4) | $2.22 (¥16) | 128K |
| 通义千问 | qwen-plus | $0.11 (¥0.8) | $0.28 (¥2) | 128K |
| 通义千问 | qwen-turbo | $0.04 (¥0.3) | $0.08 (¥0.6) | 128K |
| 智谱 GLM | glm-4 | ¥100 | ¥100 | 128K |
| 智谱 GLM | glm-4-flash | 免费 | 免费 | 128K |
| Minimax | abab6.5 | ¥10 | ¥10 | 200K |
| 百度文心 | ernie-4.0 | ¥120 | ¥120 | 128K |
| 百度文心 | ernie-speed | 免费 | 免费 | 128K |
| 月之暗面 | kimi-128k | ¥12.5 | ¥12.5 | 128K |
| 阶跃星辰 | step-2 | ¥5 | ¥5 | 16K |
| 商汤 | sensechat-5 | ¥0.9 | ¥0.9 | 128K |
| 百川 | baichuan4 | ¥10 | ¥10 | 128K |
| 零一万物 | yi-lightning | ¥1 | ¥1 | 128K |
| 讯飞星火 | spark-max | ¥5 | ¥5 | 128K |
| 讯飞星火 | spark-lite | 免费 | 免费 | 128K |
| 腾讯混元 | hunyuan-pro | ¥3 | ¥3 | 128K |
| 腾讯混元 | hunyuan-lite | 免费 | 免费 | 128K |

#### OpenAI
| 模型 | Input/1M | Output/1M | Context |
|------|----------|-----------|---------|
| GPT-4o | $2.50 | $10.00 | 128K |
| o1 | $15.00 | $60.00 | 200K |
| o3-mini | $1.10 | $4.40 | 200K |

### 🗑️ 移除
- 移除工具调用统计模块（简化界面）

## Features

- **Context Window** — Progress bar + percentage showing current token consumption
- **Cache Hit Rate** — Hit rate progress bar with color coding (green/yellow/gray)
- **Session Cost** — Breakdown by Input/Output/Cache Write/Cache Read
- **Session Bloat** — Track conversation rounds and cost efficiency
- **Tool Usage** — Statistics for all tools used in the session
- **Task Progress** — Parse TodoWrite records to show task status
- **Daily Spend** — 7-day cost chart with budget warnings
- **Status Bar** — Real-time display in VS Code status bar

## Installation

### From VSIX file
1. Open VS Code Extensions panel
2. Click "..." → "Install from VSIX..."
3. Select the `claude-code-hud-fixed-1.0.0.vsix` file

### From command line
```bash
code --install-extension claude-code-hud-fixed-1.0.0.vsix
```

## Usage

1. Open a project in VS Code
2. Start a Claude Code session
3. The HUD will automatically detect the session and display stats
4. Click the robot icon 🤖 in the Activity Bar to open the HUD panel
5. Click the status bar item to jump to the HUD panel

## Commands

- `Claude Code HUD: Show Panel` — Open the HUD panel
- `Claude Code HUD: Refresh` — Force refresh
- `Claude Code HUD: Preview Mode (Mock Data)` — Show demo data
- `Claude Code HUD: Exit Preview Mode` — Return to live data

## Configuration

The extension creates a config file at `~/.claude/claude-code-hud.json` with the following options:

```json
{
  "contextLimit": null,        // null = auto-detect (Opus 4.x = 1M, others = 200K)
  "refreshInterval": 3000,     // Refresh interval in milliseconds
  "inputCostPer1M": 3.0,       // Input token cost per 1M tokens (USD)
  "outputCostPer1M": 15.0,     // Output token cost per 1M tokens (USD)
  "cacheWriteCostPer1M": 3.75, // Cache write cost per 1M tokens (USD)
  "cacheReadCostPer1M": 0.30,  // Cache read cost per 1M tokens (USD)
  "dailyCostWarning": null,    // Daily cost warning threshold (yellow)
  "dailyCostLimit": null       // Daily cost limit (red)
}
```

## Fixes in This Version

- **Windows Path Encoding**: Fixed path matching to handle `\`, `:`, and spaces in Windows paths
- **Path Normalization**: Improved project directory detection with proper encoding

## License

MIT

---

**by BOYGAGA**
