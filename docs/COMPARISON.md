# 三项目设计对比分析报告

## superomni vs obra/superpowers vs garrytan/gstack

**版本：** superomni v0.3.0 / superpowers latest / gstack latest  
**生成日期：** 2026-03-27  
**作者：** superomni 项目分析

---

## 目录

1. [项目背景与定位](#1-项目背景与定位)
2. [核心哲学对比](#2-核心哲学对比)
3. [架构设计对比](#3-架构设计对比)
4. [技能体系对比](#4-技能体系对比)
5. [安装与平台支持](#5-安装与平台支持)
6. [各项目核心优势详析](#6-各项目核心优势详析)
7. [superomni 的问题与不足](#7-superomni-的问题与不足)
8. [总结对比矩阵](#8-总结对比矩阵)

---

## 1. 项目背景与定位

### obra/superpowers

**创始人：** Jesse Vincent（Prime Radiant）

**定位：** 一个面向 AI 编码助手的完整软件开发工作流框架，以"技能"（skill）为核心，用结构化的行为规范驱动 Claude Code 等 AI 代理完成从设计到发布的全流程。

**背景：** superpowers 是最早将"组合式技能"思想引入 Claude Code 的框架之一。已上架 Claude 官方 Marketplace（`/plugin install superpowers@claude-plugins-official`），拥有 Discord 社区支持，来源于 Prime Radiant 工程实践。

**核心主张：**
> *"Your coding agent just has Superpowers."* — 技能自动激活，不需要用户记忆命令或手动触发。

---

### garrytan/gstack

**创始人：** Garry Tan（Y Combinator 总裁 & CEO）

**定位：** 一个将 Claude Code 变成"虚拟工程团队"的生产力框架，强调并行冲刺（10-15 parallel sprints）、产品视角（CEO/YC Office Hours）、真实浏览器 QA（Playwright），以及跨模型 Second Opinion（OpenAI Codex）。

**背景：** gstack 来自 Garry Tan 个人的极限生产力实践——60 天内生产 60 万行代码，每天 10,000-20,000 行，用于运营 YC 的内部工具。这不是理论框架，而是一个经过实战检验的工程工厂。

**核心主张：**
> *"That is not a copilot. That is a team."* — 每个斜杠命令背后是一位专家（CEO、设计师、安全官、工程师）。

---

### superomni

**创始人：** Wilder1222

**定位：** 融合 superpowers 方法论与 gstack 工程完整性原则的统一框架，核心哲学是"Plan Lean, Execute Complete"（计划精简，执行完整），支持 Claude Code、Cursor、Codex、Gemini CLI、OpenCode 等多平台。

**背景：** superomni 明确将自己定位为"融合体"——从 superpowers 吸收方法论驱动的工作流，从 gstack 吸收工程完整性与决策原则，同时加入原创的 PROACTIVE 模式切换、状态协议（Status Protocol）和多平台支持。

**核心主张：**
> *"Plan with YAGNI. Execute with completeness."* — 在计划阶段保持极简，在执行阶段追求完整。

---

## 2. 核心哲学对比

| 维度 | superpowers | gstack | superomni |
|------|------------|--------|-----------|
| **核心哲学** | YAGNI（You Aren't Gonna Need It）+ TDD 驱动 | Boil the Lake（完整性廉价）+ 产品视角优先 | Plan Lean, Execute Complete（计划精简 + 执行完整） |
| **技能触发方式** | 自动触发（条件检测，强制工作流） | 手动调用斜杠命令 + 被动建议 | PROACTIVE 可切换（默认自动，可关闭为手动建议） |
| **工作流驱动** | 强制性：Agent 在任何任务前必须检查相关技能 | 建议性：7步冲刺流程（Think→Plan→Build→Review→Test→Ship→Reflect） | 建议性 + 可选强制：`workflow` 技能协调各技能的顺序 |
| **调试哲学** | 4阶段科学方法（Iron Law + 根因追溯） | Scope Lock + Pattern Table + Debug Report | 两者融合：4阶段 + Scope Lock + Pattern Table + Debug Report |
| **计划评审** | 轻量级子代理评审 | CEO→设计→工程 三阶段流水线 + Dual Voices（Claude+Codex） | 采用 gstack 三阶段流水线，移除 Codex 依赖，改用子代理协议 |
| **状态管理** | 无状态（Stateless） | `~/.gstack/` 持久化状态，含 config.yaml、JSONL 分析日志 | `~/.omni-skills/` 持久化状态，简化版 key=value 配置 |
| **测试文化** | RED-GREEN-REFACTOR 强制循环，在测试前写的代码必须删除 | 每个 Bug 修复必须生成回归测试；`/ship` 会引导建立测试框架 | 三条 TDD 铁律（删除未测试代码、Red Before Green），`executing-plans` 强制，`verification` 硬性门禁 |
| **产品视角** | 无（纯工程视角） | 核心特色：`/office-hours` 用 YC 方法质疑需求本身 | 有（`/office-hours` 技能，来自 gstack 启发） |

---

## 3. 架构设计对比

### 3.1 技术栈

| 维度 | superpowers | gstack | superomni |
|------|------------|--------|-----------|
| **安装依赖** | 无外部依赖（纯 Markdown） | **Bun v1.0+**（必须），Node.js（Windows），Playwright（`/browse` 功能） | Node.js（npm），纯 Bash 构建脚本，无运行时依赖 |
| **构建系统** | 无构建步骤，`.md` 直接使用 | 有构建步骤（`./setup` 生成 Codex/Gemini/OpenCode 适配文件） | 有构建步骤（`lib/gen-skill-docs.sh`，Bash+awk，将 `.tmpl` → `.md`） |
| **配置格式** | 无配置文件 | `~/.gstack/config.yaml`（YAML，功能丰富） | `~/.omni-skills/config`（key=value，极简） |
| **遥测** | 无 | **opt-in 远程遥测**（匿名，Supabase），本地 JSONL 日志 | **默认本地遥测**（JSONL，无网络调用） |
| **状态目录** | 无 | `~/.gstack/`（sessions、analytics、projects、debug-scope） | `~/.omni-skills/`（sessions、analytics、projects、debug-scope） |
| **浏览器能力** | 无 | **核心特色**：Playwright + 真实 Chrome 控制，`$B connect` headed 模式，Sidebar Agent | 无 |
| **跨模型能力** | 无 | `/codex` 调用 OpenAI Codex CLI 进行独立代码审查，交叉分析 | 无（roadmap 中有 Dual Voices 计划） |

### 3.2 技能架构模式

**superpowers 的技能架构：**
```
skill/SKILL.md          ← 直接可用的 Markdown 文件
skill/supporting-docs/  ← 辅助文档（如 root-cause-tracing.md）
```
- **优势**：零构建步骤，最简单，fork 即用
- **劣势**：无共享 preamble，每个技能是孤立的

**gstack 的技能架构：**
```
skills/<name>/SKILL.md  ← 构建后生成
setup                   ← 针对不同平台（Claude/Codex/Gemini/OpenCode）生成不同适配文件
```
- **优势**：平台适配最全面，setup 自动处理平台差异
- **劣势**：依赖 Bun，安装稍复杂

**superomni 的技能架构：**
```
skills/<name>/SKILL.md.tmpl  ← 源文件（带 {{PREAMBLE}} 宏）
skills/<name>/SKILL.md       ← 构建后生成（已提交，用户无需构建）
lib/preamble.md              ← 注入所有技能的共享 preamble
```
- **优势**：`{{PREAMBLE}}` 宏确保所有技能共享状态检测、PROACTIVE 逻辑和状态协议；预构建文件已提交，用户无需运行构建
- **劣势**：维护两套文件（`.tmpl` + `.md`），preamble 变更需要重建所有技能

### 3.3 分层架构

**superpowers 架构（2层）：**
```
Layer 1: Session Hook → 注入 using-superpowers 技能
Layer 2: Skill Protocol → 条件触发 → 执行 → 输出
```

**gstack 架构（4层）：**
```
Layer 1: Session Hook + setup 生成的平台适配
Layer 2: Skill Protocol + 斜杠命令注册
Layer 3: 共享基础设施（browse server、config、analytics、slug）
Layer 4: 跨模型层（/codex Second Opinion、Dual Voices）
```

**superomni 架构（4层）：**
```
Layer 1: Session Hook → PROACTIVE 检测 → 注入 using-skills
Layer 2: Skill Protocol → Preamble → Phase → Status Protocol
Layer 3: 共享基础设施（bin/config、bin/analytics-log、bin/slug）
Layer 4: Sub-Agent 层（subagent-development 技能）
```

---

## 4. 技能体系对比

### 4.1 技能数量

| 项目 | 技能数 | Agent 数 | 斜杠命令数 |
|------|--------|---------|-----------|
| superpowers | ~13 | 无独立 agents | ~13（每个技能一个触发） |
| gstack | ~28 | 集成在技能内（CEO、设计师、CSO 等角色） | ~28 |
| superomni | **28** | **8**（独立 agent 文件） | **9** |

### 4.2 技能覆盖对比

| 技能类别 | superpowers | gstack | superomni |
|---------|------------|--------|-----------|
| **需求澄清/产品验证** | ❌ | ✅ `/office-hours`（YC 6问强制质疑） | ✅ `/office-hours`（来自 gstack 启发） |
| **头脑风暴/设计** | ✅ `brainstorm` | ❌ | ✅ `brainstorm` |
| **计划编写** | ✅ `writing-plans` | ✅ `/plan-eng-review` | ✅ `writing-plans` |
| **CEO 计划评审** | ❌ | ✅ `/plan-ceo-review` | ✅（via `plan-review` 三阶段流水线） |
| **设计审查** | ❌ | ✅ `/plan-design-review` + `/design-consultation` + `/design-review` | ✅（via `plan-review` 的设计阶段） |
| **计划执行** | ✅ `executing-plans` | ✅（隐含在 build 阶段） | ✅ `executing-plans` |
| **子代理开发** | ✅ `subagent-driven-development`（两阶段审查） | ✅（并行冲刺 10-15） | ✅ `subagent-development` |
| **TDD 测试** | ✅ 强制 RED-GREEN-REFACTOR | ✅（每次 bug 修复生成回归测试） | ✅ 三条铁律（删除未测试代码、Red Before Green），全局强制 |
| **代码审查** | ✅ `requesting-code-review` | ✅ `/review`（Staff Engineer 角色） | ✅ `code-review` + `receiving-code-review` |
| **跨模型审查** | ❌ | ✅ `/codex`（OpenAI Codex 独立审查） | ❌（roadmap 中） |
| **QA/真实浏览器测试** | ❌ | ✅ `/qa`（Playwright 真实浏览器）+ `/qa-only` | ✅ `qa`（无真实浏览器） |
| **安全审计** | ❌ | ✅ `/cso`（OWASP Top 10 + STRIDE，17个误报排除） | ✅ `security-audit`（OWASP/STRIDE） |
| **系统调试** | ✅ `systematic-debugging`（4阶段） | ✅ `/investigate`（Scope Lock + Iron Law） | ✅ `systematic-debugging`（4阶段 + Scope Lock 融合） |
| **验证** | ✅ `verification-before-completion` | ❌（隐含） | ✅ `verification` |
| **发布** | ✅ `finishing-a-development-branch` | ✅ `/ship` + `/land-and-deploy` + `/canary` | ✅ `ship` + `finishing-branch` |
| **持续部署** | ❌ | ✅ `/land-and-deploy`（CI等待 + 生产验证）+ `/canary` | ❌ |
| **性能基准** | ❌ | ✅ `/benchmark`（Core Web Vitals） | ❌ |
| **文档同步** | ❌ | ✅ `/document-release`（自动更新所有文档） | ✅ `document-release` |
| **周回顾** | ❌ | ✅ `/retro`（团队感知 + 全局多项目） | ✅ `retro`（git 原语实现，无 gstack 基础设施依赖） |
| **Git Worktrees** | ✅ `using-git-worktrees` | ❌ | ✅ `git-worktrees` |
| **并行任务分发** | ✅ `dispatching-parallel-agents` | ✅（并行冲刺架构） | ✅ `dispatching-parallel` |
| **安全操作守卫** | ❌ | ✅ `/careful` + `/freeze` + `/guard` + `/unfreeze` | ✅ `careful` + `freeze` |
| **冲刺流水线协调** | ❌ | ✅（冲刺架构是 gstack 核心） | ✅ `workflow`（协调各技能顺序） |
| **技能创作** | ✅ `writing-skills` | ❌ | ✅ `writing-skills` + `agent-management` |
| **自动计划流水线** | ❌ | ✅ `/autoplan`（CEO→设计→工程一键评审） | ✅ `autoplan` |
| **技能索引/元技能** | ✅ `using-superpowers` | ❌（在 CLAUDE.md 中手动配置） | ✅ `using-skills`（会话启动时自动注入） |

---

## 5. 安装与平台支持

### 5.1 安装复杂度

| 维度 | superpowers | gstack | superomni |
|------|------------|--------|-----------|
| **最简安装** | `/plugin install superpowers@claude-plugins-official`（Claude 官方 Marketplace） | 一条 `git clone` + `./setup` 指令（粘贴给 Claude） | `/plugin marketplace add Wilder1222/superomni` 或 `npm install -g` |
| **依赖** | 无 | Bun v1.0+（必须） | Node.js（npm install 路径需要） |
| **官方 Marketplace** | ✅ 已上架 Claude 官方 Marketplace | ❌ | ❌（私有 marketplace） |
| **团队共享** | 无专门支持 | ✅ `cp -Rf ~/.claude/skills/gstack .claude/skills/gstack` 直接提交到 repo | ❌（无团队共享流程） |

### 5.2 平台兼容性

| 平台 | superpowers | gstack | superomni |
|------|------------|--------|-----------|
| Claude Code | ✅ 官方 | ✅ | ✅ |
| Cursor | ✅ | ✅ | ✅ |
| Codex | ✅ | ✅ | ✅ |
| Gemini CLI | ✅ | ✅ | ✅ |
| OpenCode | ✅ | ✅ | ✅ |
| VS Code (Cline) | ❓ | ❓ | ✅ |
| VS Code (Continue.dev) | ❓ | ❓ | ✅ |
| JetBrains | ❓ | ❓ | ✅ |
| **自动平台检测** | ❌ | ✅（`./setup --host auto`） | ✅（`./setup` 自动检测） |

---

## 6. 各项目核心优势详析

### 6.1 obra/superpowers 的核心优势

#### 优势 1：零依赖，极简架构
superpowers 是三个项目中安装门槛最低的。没有构建步骤，没有 Bun，没有 Node.js——纯 Markdown 文件，fork 即可使用。这使得它的维护成本极低，且不会因依赖版本问题产生故障。

**设计价值：** 对于只想"开箱即用"的用户，superpowers 是首选。

#### 优势 2：强制性工作流——技能是"法律"，不是"建议"
superpowers 最独特的设计决策：Agent **在任何任务前必须检查相关技能**。这不是"如果有需要就用"，而是"必须检查，必须遵循"。官方文档明确说：*"Mandatory workflows, not suggestions."*

```
Agent 在写代码前 → 强制检查 brainstorm
Agent 在测试前 → 强制遵循 RED-GREEN-REFACTOR
Agent 在代码审查后 → 强制检查 receiving-code-review
```

这种设计防止了 AI 的"偷懒"倾向——当技能是可选的时，AI 倾向于跳过它们。

#### 优势 3：最严格的 TDD 实践
superpowers 对 TDD 的执行最为严格：
- **在测试前编写的代码必须删除**，不是修改，而是**删除**
- RED → 看到失败 → GREEN → 看到通过 → REFACTOR 是完整闭环
- 测试必须验证行为，不得 mock 行为

这是三个项目中对测试文化最强硬的立场，防止了"假 TDD"（先写代码再补测试）。

#### 优势 4：官方 Marketplace 背书
已上架 Claude 官方插件市场，一条命令安装，是三个项目中唯一获得官方生态支持的。这意味着更广泛的用户可见性和官方质量背书。

#### 优势 5：Discord 社区生态
有活跃的 Discord 社区，这是 gstack 和 superomni 目前都缺乏的。社区能产生技能贡献、错误报告和最佳实践分享。

#### 优势 6：subagent-driven-development 的两阶段审查
superpowers 的子代理开发实现了**两阶段审查机制**（spec compliance 审查 + code quality 审查），比简单的任务分发更严格。每个子代理的输出先检查是否符合规范，再检查代码质量，防止子代理"创造性偏离"。

---

### 6.2 garrytan/gstack 的核心优势

#### 优势 1：真实浏览器 QA——最具差异化的能力
gstack 的 `/browse` + `/qa` 组合是三个项目中最强大、最独特的能力：
- **Playwright 真实 Chromium 控制**，不是 headless 模拟
- **`$B connect` headed 模式**：你可以在同一个 Chrome 窗口里看到 AI 每一步操作
- **Sidebar Agent**：在 Chrome 侧边栏用自然语言指挥 AI 操作浏览器
- **`$B handoff`**：遇到 CAPTCHA/MFA 时将控制权交给用户，完成后 AI 继续接管

这解决了纯文本 AI 最大的盲点——看不到 UI。`/qa` 让 Claude 能"看见问题"并自动修复，每次修复还会自动生成回归测试。

#### 优势 2：产品视角——YC Office Hours 方法论
`/office-hours` 是 gstack 最有 Garry Tan 个人色彩的技能：
- **6个强迫性问题**（Forcing Questions）质疑你的需求本身
- 不是帮你实现你说的，而是挑战你说的是否是你真正需要的
- 挑战前提，生成3种实现路径和工作量估算
- 设计文档自动传入下游技能

这是三个项目中唯一有"产品 CEO"视角的框架——其他两个都是纯工程视角。

#### 优势 3：跨模型审查——/codex Second Opinion
通过 OpenAI Codex CLI 对同一分支进行独立审查，三种模式：
- **review**：通过/失败评级
- **adversarial**：主动尝试破坏代码
- **consultation**：开放式咨询（会话持续性）

当 Claude（`/review`）和 Codex（`/codex`）都审查了同一分支，系统会自动生成**交叉模型分析**——哪些发现两个模型都有，哪些是各自独有的。这是规避单一模型盲点的最优方法。

#### 优势 4：完整的冲刺流水线——技能之间有数据流
gstack 最精妙的设计之一：**技能之间有数据传递**，不是孤立的命令：
- `/office-hours` 写设计文档 → `/plan-ceo-review` 读取它
- `/plan-eng-review` 写测试计划 → `/qa` 读取它
- `/review` 发现 bug → `/ship` 验证已修复

这是真正的流水线，而不是工具箱。没有信息在步骤之间丢失。

#### 优势 5：运营规模——600K 行代码的实战验证
gstack 不是理论设计，而是经过 Garry Tan 在 60 天内写出 60 万行生产代码验证的系统。每周 14 万行净增，140 万次 GitHub 贡献。这种规模的实战验证是其他两个项目无法匹配的。

#### 优势 6：/cso 安全审计的精度——17个误报排除
gstack 的 `/cso`（Chief Security Officer）技能不仅做 OWASP Top 10 + STRIDE，还内置了**17个已知误报排除规则**和 8/10+ 置信度门控。每个安全发现必须包含具体的利用场景（exploit scenario）。这比 superomni 的 `security-audit` 技能更精确、噪音更少。

#### 优势 7：持续部署与生产监控
`/land-and-deploy`（等待 CI + 验证生产健康）和 `/canary`（部署后监控循环，监测控制台错误和性能回归）将发布流程延伸到了"代码合并后"——这是 superomni 和 superpowers 都缺乏的能力。

#### 优势 8：团队共享机制
gstack 提供了将框架直接提交到仓库的机制（`cp -Rf ~/.claude/skills/gstack .claude/skills/gstack`），使得团队成员在 `git clone` 后立即可用，不需要额外的安装步骤。这在团队协作场景中极其重要。

---

### 6.3 superomni 的核心优势

#### 优势 1：哲学融合的优雅性——Plan Lean, Execute Complete
superomni 最有价值的原创贡献是解决了 superpowers（YAGNI）和 gstack（Boil the Lake）的哲学矛盾：

| 场景 | 应用哲学 |
|------|---------|
| 计划阶段 | YAGNI（不要设计你不需要的） |
| 执行阶段 | 完整性（你决定要构建的，完整地构建） |

这不是折中，而是真正的上下文适应——根据所处阶段应用不同原则。

#### 优势 2：PROACTIVE 模式切换
既不像 superpowers 那样强制触发（可能产生干扰），也不像 gstack 那样全靠手动，superomni 提供了可配置的中间路线：
- `proactive=true`：技能自动激活（superpowers 风格）
- `proactive=false`：Agent 建议但不自动运行（gstack 风格）

这为不同工作习惯的用户提供了选择。

#### 优势 3：独立 Agent 文件系统
superomni 是三个项目中唯一将"角色"提炼为**独立 Agent 文件**的框架（`agents/` 目录）：

| Agent | 专长 |
|-------|------|
| `code-reviewer` | 结构化代码审查 |
| `planner` | 任务分解与计划 |
| `debugger` | 根因分析 |
| `test-writer` | 行为验证测试 |
| `security-auditor` | OWASP 安全审计 |
| `architect` | 架构设计审查 |
| `ceo-advisor` | 产品策略与需求验证 |
| `designer` | UX 审查与 AI 劣质检测 |

这些 Agent 可以通过 `bin/agent-manager` 独立安装、创建和删除，也可以从 GitHub 安装社区 Agent。这是模块化程度最高的设计。

#### 优势 4：最广泛的平台支持声明
superomni 明确列出了 8 个平台（Claude Code、Cursor、Codex、Gemini CLI、OpenCode、VS Code Cline、VS Code Continue.dev、JetBrains），比 superpowers 和 gstack 的平台声明更全面。

#### 优势 5：完全本地的遥测
superomni 的遥测**默认本地**，不发送任何数据到外部服务器。相比之下，gstack 的遥测虽然是 opt-in，但一旦启用会发送到 Supabase。对于隐私敏感的企业用户，superomni 的遥测设计更友好。

#### 优势 6：6个决策原则的显式化
gstack 有决策原则，但分散在各技能文档中。superomni 将 6 个决策原则整合在 `ETHOS.md` 中并在各技能中引用，且明确了**冲突解决规则**：
- 策略阶段：原则 1、2 优先（完整性 + 全面修复）
- 工程阶段：原则 5、3 优先（显式 + 务实）
- 设计阶段：原则 5、1 优先（显式 + 完整性）

这种元原则（关于如何应用原则的原则）是 superomni 独有的。

#### 优势 7：技能创作的结构化支持
`writing-skills` 技能 + `bin/skill-manager search/install` + `bin/agent-manager create/install` 构成了完整的技能生态系统扩展路径。用户不仅可以使用内置技能，还可以发现（GitHub 搜索）、安装和创作新技能。

---

## 7. superomni 的问题与不足

### 7.1 功能缺口（与 gstack 对比）

#### ❌ 缺少真实浏览器 QA
superomni 的 `qa` 技能是纯文本的——没有真实浏览器控制能力。这意味着它无法：
- 点击 UI 元素，截图对比
- 在真实浏览器中验证端到端用户流程
- 自动检测视觉回归问题

**影响：** 对前端/全栈项目，测试覆盖严重不足。

**建议：** 集成 Playwright，或在 `qa` 技能中提供浏览器测试的结构化指引（可以引用 gstack 的 `/browse` 命令模式）。

#### ❌ 缺少跨模型 Second Opinion
superomni 没有调用其他模型（如 OpenAI Codex）进行独立代码审查的能力。gstack 的 `/codex` 三模式审查是发现 Claude 盲点的强力工具。

**影响：** 单一模型审查可能存在系统性盲点。

**建议：** Roadmap 中已提到"Dual Voices"，但需要推进实现。

#### ❌ 缺少持续部署与生产监控
没有等价于 gstack `/land-and-deploy` 和 `/canary` 的技能——发布后的 CI 等待、生产健康检查和错误监控都不在 superomni 的技能范围内。

**影响：** 对需要 CI/CD 自动化的项目，superomni 止步于"打开 PR"，而不是"验证生产可用"。

#### ❌ 缺少设计系统构建能力
gstack 的 `/design-consultation` 技能能从零构建完整设计系统（研究竞品、提出创意风险、生成逼真产品 mockup、输出 DESIGN.md）。superomni 的设计审查只存在于 `plan-review` 的一个阶段中，没有独立的设计系统构建能力。

#### ❌ 缺少性能基准测试
没有等价于 gstack `/benchmark` 的技能——Core Web Vitals 基准、页面加载时间对比、PR 前后性能回归检测都不存在。

#### ❌ 缺少团队共享机制
没有提供将 superomni 直接提交到项目仓库（供团队成员共享）的官方工作流。gstack 的 `cp -Rf` 模式非常实用，superomni 应该有类似的 `setup --team` 指令。

#### ❌ 缺少自动升级机制
没有等价于 gstack `/gstack-upgrade` 的自我更新命令。用户需要手动重新 `npm install` 才能获取更新，缺乏透明的"查看变更日志"流程。

### 7.2 工程质量问题

#### ❌ 无自动化测试套件
`docs/IMPLEMENTATION.md` 明确承认："There is no automated test suite currently. Testing is done manually." 这对于一个声称支持 TDD 的框架是严重的自我矛盾。

**影响：** 技能变更没有回归保护，平台兼容性没有自动验证，`preamble.md` 修改后的正确性依赖人工检查。

**建议：** 至少添加技能格式验证测试（YAML frontmatter 检查、`{{PREAMBLE}}` 展开验证、Iron Law 存在性检查）。

#### ❌ GitHub Actions CI 缺失
没有 CI 流水线。拉取请求没有自动化的质量关卡。Roadmap 中列为 v1.0.0 目标，但目前完全缺失。

#### ⚠️ SKILL.md.tmpl + SKILL.md 双文件维护负担
需要始终提交两套文件并保持同步，这给贡献者带来额外负担，且容易出现"忘记重建"导致的不一致问题。

**建议：** 在 CI 中添加"检测是否有未重建的 .tmpl 文件"的检查，防止不一致提交。

#### ⚠️ 版本文档不同步
`docs/DESIGN.md` 标注 "Version: 0.2.0"，但当前 `package.json` 是 0.3.0（截至本报告生成时）。文档滞后一个主版本。

**建议：** 在 `npm run build` 中自动更新文档版本号，或在 `ship` 技能的发布流程中包含文档版本同步检查。

### 7.3 哲学与设计层面的不足

#### ✅ TDD 已全局强制
**已修复。** superomni 的 TDD 现在具备：
- **三条铁律**：测试优先、删除未测试代码、Red Before Green 强制
- `executing-plans` 中每个代码步骤强制 TDD 流程
- `verification` 硬性门禁：新代码必须有测试才能报告 DONE
- `skills/test-driven-development/tdd-enforcement.md` 全局执行指南

与 superpowers 的差距已缩小至驱动强度等级。
#### ✅ 技能流水线数据传递已定义
**已修复。** `docs/SKILL-DATA-FLOW.md` 定义了所有技能的输入/输出合同，包括路径约定、所需 sections 和消费方式。`workflow` 技能现在在 THINK 阶段自动读取上次冲刺的改进行动。

#### ⚠️ plan-review 移除了 Dual Voices
gstack 的 `plan-ceo-review` 可以选配 Codex 进行独立验证（Dual Voices）。superomni 的 `plan-review` 移除了这一能力，改用子代理协议代替——但子代理终究是同一个模型，无法真正提供"不同视角"。

#### ⚠️ retro 技能功能有限
gstack 的 `/retro` 有**团队感知**（按人统计提交、shipping streaks、测试健康趋势）和**全局多项目**（`/retro global` 跨越所有项目和 AI 工具）。superomni 的 `retro` 只有基础的 git 日志分析，缺乏这些更深入的洞察。

### 7.4 生态系统差距

#### ❌ 无官方 Marketplace 上架
superpowers 在 Claude 官方插件市场有独立条目。gstack 虽然没有，但有更高的 GitHub 可见度（Garry Tan 的 YC 背书）。superomni 目前没有官方渠道背书，用户发现路径依赖直接分享 GitHub 链接。

#### ❌ 无社区支持渠道
没有 Discord、Slack 或论坛。这使得用户反馈回路不完整，社区驱动的技能贡献难以形成。

#### ❌ 无变更日志
`docs/IMPLEMENTATION.md` 中有 Roadmap，但没有正式的 CHANGELOG.md 记录每个版本的具体变更。gstack 有详细的 CHANGELOG，有助于用户了解升级内容。

---

## 8. 总结对比矩阵

### 8.1 综合能力矩阵

| 能力维度 | superpowers | gstack | superomni |
|---------|:-----------:|:------:|:---------:|
| 安装简便性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 零依赖 | ✅ | ❌（需要 Bun） | ⭐（需要 npm） |
| 官方 Marketplace | ✅ | ❌ | ❌ |
| TDD 严格性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 产品视角 | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 真实浏览器 QA | ❌ | ⭐⭐⭐⭐⭐ | ❌ |
| 安全审计深度 | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 跨模型审查 | ❌ | ⭐⭐⭐⭐⭐ | ❌ |
| 持续部署支持 | ❌ | ⭐⭐⭐⭐ | ❌ |
| 多平台支持 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 技能数量 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 独立 Agent 系统 | ❌ | ❌（集成在技能中） | ⭐⭐⭐⭐⭐ |
| 哲学融合 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 自动化测试 | ❌ | ⭐⭐⭐ | ❌ |
| 团队共享机制 | ⭐ | ⭐⭐⭐⭐⭐ | ⭐ |
| 社区生态 | ⭐⭐⭐⭐ | ⭐⭐ | ⭐ |
| 实战验证规模 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 遥测隐私性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 技能可扩展性 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 冲刺流水线 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

### 8.2 适用场景推荐

| 场景 | 推荐 | 理由 |
|------|------|------|
| **个人开发者，追求最简配置** | superpowers | 零依赖，官方 Marketplace，自动触发 |
| **初创公司 CEO，想极限提速** | gstack | YC Office Hours + 并行冲刺 + 真实浏览器 QA |
| **全栈工程师，强调 UI/UX 测试** | gstack | Playwright 浏览器控制是核心 |
| **需要团队共享框架的团队** | gstack | `cp -Rf` 一键团队安装 |
| **隐私敏感的企业/政府项目** | superomni | 完全本地遥测，无外部数据发送 |
| **多平台用户（JetBrains/Continue.dev）** | superomni | 最广泛的平台声明 |
| **想在现有框架基础上扩展技能** | superomni | Agent 文件系统 + bin/agent-manager 最灵活 |
| **严格 TDD 文化的团队** | superpowers | 最强硬的 TDD 执行（删除无测试的代码） |

### 8.3 superomni 优先改进路线图

基于本报告的分析，以下是对 superomni 的改进优先级建议：

**P0（核心功能缺口）：**
1. ✅ 添加自动化测试套件 — `lib/validate-skills.sh` + `npm test`
2. ✅ 添加 GitHub Actions CI — `.github/workflows/validate.yml`
3. ✅ 文档版本同步 — `docs/DESIGN.md` 版本已更新至 0.3.0
4. ✅ 添加 `CHANGELOG.md` — 版本历史已完整记录

**P0（新增 — 第一性原则）：**
5. ✅ 添加 `skills/self-improvement/` — 每次冲刺结束时的第一性原则自我评估技能
6. ✅ 在 `lib/preamble.md` 中添加 Performance Checkpoint — 每个技能的完成状态自检注入所有 29 个技能

**P1（竞争力差距）：**
7. ✅ TDD 全局强制 — 三条铁律（删除未测试代码、Red Before Green），`executing-plans` 强制 TDD，`verification` 硬性门禁，`tdd-enforcement.md` 指南
8. ✅ 自动升级机制 — `bin/superomni-cli upgrade/version/help`
9. ✅ 技能间数据传递约定 — `docs/SKILL-DATA-FLOW.md`
10. ✅ CI 改进 — `workflow_dispatch` 触发

**P2（长期差异化）：**
10. Dual Voices 实现（Claude + Codex 的 plan-review 共识）
11. 基础浏览器测试集成（不需要完整 Playwright，但需要有路径）
12. 社区渠道（Discord 或 GitHub Discussions）
13. 上架 Claude 官方 Marketplace

### 8.4 第一性原理融合说明

本报告触发的新增内容（`self-improvement` 技能和 preamble Performance Checkpoint）基于以下第一性原理推导：

**第一原理：一个系统如果不能衡量自身的表现，就无法持续改进。**

这推导出：
1. 每次技能执行结束时，必须有一个验证环节（Performance Checkpoint）——已注入所有 28 个技能
2. 每次冲刺结束时，必须有一个结构化的回顾机制（self-improvement 技能）——已实现
3. 改进动作必须是具体可验证的（3个行动项目，每个有验证标准）——已在 self-improvement 技能中定义

**推导链：**
```
目标: 持续提升 AI 辅助开发质量
  ↓
障碍: 没有反馈循环 → AI 重复相同错误
  ↓
解决: 每次执行都留下可审查的质量证据
  ↓
实现: Performance Checkpoint (preamble) + self-improvement (skill) + improvements/ (artifact)
```

---

## 附录：关键设计决策对比

### 技能触发哲学对比

```
superpowers: [触发条件] → 强制执行技能 → 不可跳过
gstack:      [用户命令] → 执行技能    → 被动建议
superomni:   [触发条件或用户命令] → 执行(proactive) 或 建议(reactive)
```

superomni 的 PROACTIVE 开关是三个框架中最灵活的设计，但也是最需要用户理解的设计——新用户可能不知道这个开关的存在和意义。

### 调试技能融合质量

superpowers 的调试：4阶段科学方法，强调根因追溯文档
gstack 的调试：Scope Lock（防止调试时的范围蔓延）+ Pattern Table（8种常见 bug 模式）+ Debug Report
superomni 的调试：两者融合，是三个框架中调试技能最完整的实现

### 计划评审深度

```
superpowers: 轻量评审（subagent 单次检查）
gstack:      CEO → 设计 → 工程（三阶段 + Dual Voices 可选）
superomni:   CEO → 设计 → 工程（三阶段，移除 Dual Voices）
```

superomni 的计划评审深度接近 gstack，但缺少跨模型验证。

---

*本文档基于 superomni v0.3.0、obra/superpowers 和 garrytan/gstack 的公开信息和代码库分析生成。*
