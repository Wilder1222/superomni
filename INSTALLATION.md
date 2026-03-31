# npm/npx 安装系统 — 用户指南

## 简答：npm 安装需要 setup 脚本吗？

**不需要。** npm 会自动运行 postinstall 钩子，它会自动调用 Node.js 设置程序。

```bash
npm install -g superomni    # 完全自动，无需额外步骤
```

## 架构概览

```
┌─────────────────────────────────────┐
│    npm install -g superomni         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  postinstall.js (npm 钩子)          │
│  ✓ 检测 npx 还是全局安装            │
│  ✓ 转发 INIT_CWD 到 setup.js        │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  lib/setup.js (纯 Node.js)          │
│  ✓ 检测平台（Claude/Codex/等）     │
│  ✓ 创建符号链接或复制文件           │
│  ✓ 生成配置文件（CLAUDE.md 等）    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  ~/.claude/skills/superomni         │ (全局)
│  ~/.agents/skills/superomni         │ (Codex)
│  ~/.gemini/skills/superomni         │ (Gemini)
│  或 .superomni/ + CLAUDE.md         │ (项目级)
└─────────────────────────────────────┘
```

## 快速开始

### 全局安装（推荐用于开发机）
```bash
npm install -g superomni
# 自动安装到：
#   ~/.claude/skills/superomni
#   ~/.agents/skills/superomni
#   ~/.gemini/skills/superomni
```

### 项目级安装（推荐用于团队项目）
```bash
# 方式 1: npx（自动）
cd my-project
npx superomni

# 方式 2: 手动
SUPEROMNI_TARGET_DIR=. npx superomni

# 结果：在项目中创建
#   .superomni/       (所有skills/agents/commands)
#   CLAUDE.md
#   AGENTS.md
#   GEMINI.md
#   .github/copilot-instructions.md
```

## 常见任务

### 仅安装 Claude Code
```bash
node lib/setup.js --only claude
```

### 跳过某个平台
```bash
node lib/setup.js --skip gemini
```

### 模拟运行（不修改系统）
```bash
node lib/setup.js --dry-run
```

### CLI 帮助
```bash
node lib/setup.js --help
```

## 故障排除

### "postinstall: setup failed"
1. 检查 Node.js 版本：`node --version`（需要 v12+）
2. 查看诊断日志：`cat ~/.omni-skills/logs/postinstall-*.log`
3. 手动运行：`node lib/setup.js --verbose`

### 跳过 postinstall
```bash
# 如果安装卡住
SUPER_OMNI_SKIP_POSTINSTALL=1 npm install -g superomni
```

### 重新运行设置
```bash
npm run setup              # 全局
SUPEROMNI_TARGET_DIR=. npm run setup  # 项目级
```

## 文件说明

| 文件 | 作用 |
|------|------|
| `lib/postinstall.js` | npm 触发的钩子，调用 setup.js |
| `lib/setup.js` | 核心安装器（600+ 行） |
| `.superomni/` | 项目级安装时创建的目录 |
| `CLAUDE.md` / `AGENTS.md` / 等 | 平台配置文件 |

## 环境变量

| 变量 | 含义 | 示例 |
|------|------|------|
| `SUPEROMNI_TARGET_DIR` | 项目级安装目标 | `SUPEROMNI_TARGET_DIR=. npx superomni` |
| `SUPER_OMNI_SKIP_POSTINSTALL` | 跳过 npm postinstall | `SUPER_OMNI_SKIP_POSTINSTALL=1 npm i` |

## 以前的方式 vs 现在

| 之前 | 现在 |
|------|------|
| `npm install -g` → `npm run setup` | `npm install -g`（自动） |
| `bash setup` | `node lib/setup.js` |
| 需要 bash/GNU tools | 仅需 Node.js |
| CRLF/LF 问题 | 无（使用 Node.js fs） |

## 技术细节

### 为什么使用纯 Node.js？
- ✅ 跨平台：Windows/Linux/macOS 无差异
- ✅ 可靠：不依赖 bash/PowerShell 版本
- ✅ 快速：少一层进程开销
- ✅ 清晰：直接的错误堆栈跟踪

### 对 setup bash 脚本的影响
原来的 `setup` bash 脚本：
- 仍在代码库中（向后兼容）
- npm install 不再使用它
- 可手动运行：`bash setup --verbose`
- 可通过 `npm run setup` 间接调用

### 测试
```bash
# 全局安装测试
npm install -g .
$PROFILE  # 检查 shell 是否加载 superomni

# 项目级安装测试
SUPEROMNI_TARGET_DIR=. npx .
ls -la .superomni/  # 检查文件是否存在
cat CLAUDE.md        # 检查配置
```

## 获取帮助

```bash
# 查看所有选项
node lib/setup.js --help

# 详细输出
node lib/setup.js --verbose

# 模拟运行
node lib/setup.js --dry-run --verbose
```
