# NPM/NPX 安装架构说明

## 问题：原架构的三层转换问题

用户问：npm 和 npx 安装需要 setup 脚本吗？

**答案：不再需要。** 现已完全重写为纯 Node.js 实现。

原问题：
```
npm install
├─ postinstall.js (Node.js)
│  ├─ setup.ps1 (PowerShell)  ← 不必要的中间层
│  │  └─ setup (Bash)         ← CRLF/LF 行尾问题、路径转换失败
│  │     └─ 系统操作（ln, cp 等）
```

导致问题：
- ❌ Windows 上 WSL bash 无法识别 Windows 路径
- ❌ CRLF 行尾导致 bash 脚本执行失败
- ❌ 三层转换代码复杂，难以诊断问题

## 解决方案：纯 Node.js 实现

新架构（简洁清晰）：
```
npm install
└─ postinstall.js (Node.js)
   └─ lib/setup.js (纯 Node.js)
      └─ 系统操作（fs, path, os 模块）
```

优势：
- ✅ 无 shell 依赖
- ✅ 完全跨平台（Windows/Linux/macOS）
- ✅ 无路径/行尾转换问题
- ✅ 更清晰的错误诊断
- ✅ 更快的执行速度

## 文件结构

| 文件 | 用途 | 状态 |
|------|------|------|
| `lib/postinstall.js` | npm 钩子脚本（简化) | ✅ 新 |
| `lib/setup.js` | 核心安装器（600+ 行纯 Node.js）| ✅ 新 |
| `lib/ensure-setup-lf.js` | 行尾转换工具（可选）| 可选 |
| `setup.ps1` | PowerShell 手动运行脚本 | 可选 |
| `setup` | 原始 Bash 脚本 | 可选（向后兼容）|

## 使用方式

### 全局安装（自动检测平台）
```bash
npm install -g superomni
```

### 项目级安装（npx）
```bash
cd my-project
SUPEROMNI_TARGET_DIR=. npx superomni
```

### 手动安装
```bash
# 全局安装（所有平台）
node lib/setup.js

# 仅安装 Claude Code
node lib/setup.js --only claude

# 模拟运行，不实际创建文件
node lib/setup.js --dry-run --verbose
```

## 工作流程

### npm 安装流程（全局）
1. `npm install -g superomni`
2. npm 触发 `postinstall` 钩子
3. postinstall.js 执行 `node lib/setup.js`
4. lib/setup.js 根据检测到的平台（Claude/Codex/Gemini/Copilot）创建符号链接或配置文件
5. 全局安装目录：
   - ~/.claude/skills/superomni（符号链接）
   - ~/.agents/skills/superomni（符号链接）
   - ~/.gemini/skills/superomni（符号链接）
   - ~/.claude/commands/（命令符号链接）
   - ~/.claude/hooks/superomni-hooks.json（钩子配置）

### npx 安装流程（项目级）
1. `cd my-project && npx superomni` 
2. npm 设置 `INIT_CWD` 环境变量（指向项目目录）
3. postinstall.js 检测到 `INIT_CWD` 并传递给 setup.js
4. lib/setup.js 在项目目录创建本地配置：
   - .superomni/（完整的 skills/agents/commands 副本）
   - CLAUDE.md（Claude Code 配置）
   - AGENTS.md（Codex 配置）
   - GEMINI.md（Gemini 配置）
   - .github/copilot-instructions.md（GitHub Copilot 配置）

## npm 脚本

```json
{
  "scripts": {
    "setup": "node lib/setup.js",
    "ensure:lf": "node lib/ensure-setup-lf.js",
    "postinstall": "node lib/ensure-setup-lf.js && node lib/postinstall.js"
  }
}
```

## 版本支持

- ✅ Windows 10/11
- ✅ Windows WSL（WSL1/WSL2）
- ✅ Linux（所有发行版）
- ✅ macOS（Intel/Apple Silicon）
- ✅ Node.js 12+（npm 6+ 中 postinstall 支持）

## 迁移指南

如果用户之前使用 `bash setup` 或 `npm run setup`：

**旧方式（已过时）：**
```bash
bash setup --only claude
```

**新方式（推荐）：**
```bash
npm run setup -- --only claude
# 或
node lib/setup.js --only claude
```

## 故障排除

### 安装失败
检查诊断日志：
```bash
cat ~/.omni-skills/logs/postinstall-*.log
```

### 跳过 postinstall
```bash
SUPER_OMNI_SKIP_POSTINSTALL=1 npm install
```

### 手动运行
```bash
node lib/setup.js --verbose
SUPEROMNI_TARGET_DIR=. node lib/setup.js  # 项目级
```

## 架构决策

为什么选择纯 Node.js 而不是 Bash？

1. **跨平台**：Bash 需要 WSL/Git Bash/native bash 的复杂检测
2. **可靠性**：避免行尾、路径分隔符、shell 引用等问题
3. **简洁**：一层代码而不是三层包装
4. **性能**：少一个进程开销
5. **诊断**：直接的错误堆栈跟踪而不是 shell 错误

## 验证清单

- [x] postinstall.js 只调用 Node.js setup.js
- [x] lib/setup.js 实现所有安装逻辑
- [x] Windows 全局安装测试 ✓
- [x] Windows 项目级安装测试 ✓
- [x] 配置文件生成正确
- [x] 无 shell 依赖
- [x] 错误诊断日志完整
