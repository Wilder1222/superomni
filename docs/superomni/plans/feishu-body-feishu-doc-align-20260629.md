# superomni：围绕 Agent 的研发工作流实践——What / Why / How

> **本文定位**：从功能逻辑与设计层面，讲清 superomni 是什么（What）、为什么这样设计（Why）、怎么工作（How）。写给三类读者——应用工程师（用它跑研发）、框架设计者（借鉴机制）、技术管理者（评估投入产出）。维护者可在第三幕参考层查文件位置与机制细节。

---

## 引子：从"调 prompt"到"工程化研发流程"

行业在 agent 工程化上已完成一次关键转向：不是写更聪明的提示词，而是设计 agent 周围的系统；不是让 agent 自主决策，而是工程师把研发流程固化成 agent 可执行的流水线。

**superomni 把这个理念落地为一套研发工作流实践框架**——它把软件研发的标准环节（思考 → 规划 → 评审 → 构建 → 验证 → 发布）工程化为 6 阶段强制流水线，每阶段产出可审计的产物，由分工明确的 agent 在边界内执行。

核心论断：**不是模型不够聪明，是围绕 agent 的研发系统不够严谨。**

---

# 第一幕 WHAT —— superomni 是什么

## 1.1 一句话定义

superomni 是一个**围绕 LLM agent 的研发工作流实践框架**：用 6 阶段流水线 + 铁律 + 永久产物 + 多 agent 分工，把不可靠的模型判断收敛成可审计的研发交付。它不追求"更聪明的 agent"，而追求"agent 在严谨的研发框架内工作"。

## 1.2 给谁用

| 读者 | 从本文获得什么 |
|------|---------------|
| 应用工程师 | 一套可直接 `/vibe` 启动的研发流水线，让 agent 写代码有边界、可回溯 |
| 框架/平台设计者 | 9 个可借鉴的 harness 机制（流水线 / 铁律 / 分层加载 / 产物契约 等） |
| 技术管理者 | 评估"投资 agent 框架"vs"投资更强模型"的 ROI 依据 |

## 1.3 装上之后发生什么

一次 `/vibe auto "feature"` 触发的完整流程：

```
/vibe auto "feature"
    ↓
THINK    brainstorm  → 产出 spec-*.md（唯一人工关卡：用户审批 spec）
    ↓
PLAN     writing-plans → 产出 plan-*.md
    ↓
REVIEW   plan-review  → 产出 review-*.md（可阻断）
    ↓
BUILD    executing-plans → 派发 subagent → 产出 execution-*.md
    ↓
VERIFY   code-review → qa → verification → 产出 evaluation-*.md
    ↓
RELEASE  release     → 产出 release-*.md（含 retrospective 段）
```

- `/vibe` 是统一入口，**它自己不执行工作**，只检测当前阶段（扫描 `docs/superomni/` 产物）并路由到对应 skill
- **唯一人工关卡**在 THINK（spec 审批）；其余阶段在 `DONE` 状态自动推进
- 每阶段必须产出固定 artifact，产物缺失则不进入下一阶段

## 1.4 核心优势（对比驱动）

| 维度 | 裸 agent / 单 prompt 工程 | superomni |
|------|--------------------------|-----------|
| 输出确定性 | 同输入不同输出，靠 prompt 碰运气 | 6 阶段流水线 + 产物契约，结构可比较可审计 |
| 跨会话延续 | 每次冷启动，丢失上文 | `docs/superomni/` 全入库，grep 历史产物续跑 |
| 判断盲区防护 | agent 自评"我做完了" | 多 agent 职责分离 + 独立 reviewer + 显式状态（DONE_WITH_CONCERNS / BLOCKED）|
| 作用域控制 | 顺手改多，scope 蔓延 | careful gate + scope 锁 + 阶段产物界定边界 |
| 失败反馈利用 | 失败诊断不复用 | improvement / harness-audit 入库，未来 sprint grep 检索 |
| 工具选择 | 工具列表长，模型随机命中 | `when_to_use` + "不适用"消歧 + 28 skill / 5 agent 精简 |

**一句话**：裸 agent 把研发质量赌在模型每次都做对；superomni 把研发质量建立在外部确定性机制上，模型只需在边界内执行。

---

# 第二幕 WHY —— 为什么需要 harness 工程

## 2.1 LLM Agent 的 7 个本质痛点

这 7 类问题都是 LLM 概率推理 + 序列生成模式的**内生属性**，换更强的模型解决不了，只能靠工程化机制收敛。

| 痛点 | 内生属性 | 工程对策类别 |
|------|---------|-------------|
| P1 概率性推理 | 自回归生成带温度 | 流水线 + 铁律 |
| P2 上下文窗口稀缺 | 窗口固定且位置敏感 | 分层加载 + 外部产物 |
| P3 无持久记忆 | 无状态函数 f(prompt)→output | 文件系统 + 会话延续机制 |
| P4 判断力盲区 | confidence 与正确性脱钩 | 多 agent 职责分离 + 显式状态 |
| P5 工具选择菜单困境 | 工具越多命中率越低 | 工具精简 + 边界声明 |
| P6 失败反馈不被利用 | 会话独立，诊断不复用 | 反思产物入库 |
| P7 作用域蔓延 | 训练偏好"完整性" | scope 锁 + 破坏性 gate |

**共同规律**：7 类问题都需要把决策从模型内部卸载到模型外部的确定性机制——这正是 harness 工程的本质。

## 2.2 Harness 工程的 6 大原则

| 原则 | 设计哲学 | superomni 落地 |
|------|---------|---------------|
| 上下文即一切 | 推理质量 = 上下文质量 | 分层 preamble（core 内联 / ref 按需）+ SessionStart 注入 |
| 工具精简、更具表达力 | 工具数量是上下文成本 | 28 skill / 5 agent；命名描述对象而非动作 |
| 持续评估 | 每阶段都是评估关卡 | 6 阶段 + 观察期，每阶段可阻断 |
| 信号驱动迭代 | 失败是 harness 信号 | 3-failure → harness-engineering；反思结构化入库 |
| 简单优于巧妙 | 显式 10 行 > 聪明 200 行 | 6 阶段 / 4 状态 / mode 字符串派发 |
| 文档即合约 | 文档可被 grep / lint / 校验 | frontmatter 必填 + 产物命名约定 + source-of-truth 声明 |

## 2.3 核心论断：工程师设计系统，Agent 执行

```
工程师做的事（确定性，写一次运行无数次）：   Agent 做的事（概率性，在边界内运行）：
  设计 6 阶段流水线                             在阶段内执行任务
  设计铁律（hard-rules）                        遵守铁律
  设计工具（skill / agent）                     选择工具
  设计产物结构（docs/superomni/）               产出 artifact
  设计反思机制                                   反思并记录
```

三大威力：
1. **确定性吸收概率性**——流水线/状态/工具集是确定的，阶段内判断是概率的，系统不依赖 agent 永远正确
2. **外部记忆吸收无状态**——`docs/superomni/` 持久，每次会话起始 grep 历史产物续跑
3. **多 agent 分工吸收判断盲区**——不让一个 agent 自评，工具集差异化实现物理隔离

---

# 第三幕 HOW —— 怎么工作

## 3.1 端到端走读：一次 sprint 的完整生命周期

以真实产物文件名串联（session slug = `feature-xxx`，date = 20260629）：

1. **`/vibe auto "feature"`** → vibe 扫描 `docs/superomni/`，无现存产物，判定从 THINK 起步
2. **THINK**：`brainstorm` skill 与用户结构化对话 → 产出 `specs/spec-main-feature-xxx-20260629.md` → **用户审批**（唯一人工关卡）
3. **PLAN**：`writing-plans` skill 派发 planner-reviewer（planning mode）→ 产出 `plans/plan-main-feature-xxx-20260629.md`（≤7 milestone）
4. **REVIEW**：`plan-review` skill 派发 planner-reviewer（strategy + engineering mode）→ 产出 `reviews/plan-review-main-feature-xxx-20260629.md` → 发现问题则 NEEDS_REVISION 回到 PLAN
5. **BUILD**：`executing-plans` skill 按 wave 派发 subagent → 产出 `executions/execution-main-feature-xxx-20260629.md`
6. **VERIFY**：`code-review` → `qa` → `verification` 三件套 → 产出 `evaluations/evaluation-main-feature-xxx-20260629.md`
7. **RELEASE**：`release` skill → 产出 `releases/release-main-feature-xxx-20260629.md`（含 retrospective 段，retrospective 自 v0.5.8 起并入 release 产物）

每个阶段产物都全入库 git tracked，未来 sprint 可 grep 同 session slug 聚合完整审计链。

## 3.2 9 个解法机制（每个 = 解决哪个痛点 + 怎么落地）

### 解法 1：6 阶段强制流水线（解决 P1 / P4 / P7）

| 阶段 | 必产出 | 下一阶段消费 |
|------|--------|-------------|
| THINK | `specs/spec-*.md` | spec 是 plan 输入 |
| PLAN | `plans/plan-*.md` | plan 是 review 输入 |
| REVIEW | `reviews/plan-review-*.md` | review 是 build 输入（可阻断）|
| BUILD | `executions/execution-*.md` | execution 是 verify 输入 |
| VERIFY | `evaluations/evaluation-*.md` | evaluation 是 release 输入 |
| RELEASE | `releases/release-*.md` | release 含 retrospective 段 |

- artifact 强制（非建议）：产物缺失则不进入下一阶段
- 每阶段可暂停（`DONE_WITH_CONCERNS` / `BLOCKED` / `NEEDS_CONTEXT`）
- REVIEW 用 6 决策原则 auto-resolve taste 决策，不新增人工关卡

### 解法 2：铁律与硬/软规范分层（解决 P1 / P2）

项目级规则按加载方式分两层，文件结构为 **`preamble.md` + `preamble-core.md` + `preamble-ref.md`**：

| 层级 | 文件 | 加载方式 | 内容 |
|------|------|---------|------|
| Core（硬规范）| `lib/preamble-core.md`（15 行）| 每个 SKILL.md 渲染时**强制内联** | 状态协议、自动推进、输出目录、TACIT-DENSE、反谄媚、telemetry |
| Ref（深参考）| `lib/preamble-ref.md`（127 行）| 通过链接引用，按需 Read | 环境检测、会话连续性、问题确认、上下文窗口管理、TACIT-DENSE 详解 |
| 兼容入口 | `lib/preamble.md`（135 行）| 旧 `{{PREAMBLE}}` token 兼容 | 旧渲染器 fallback |

铁律例子：没有根因调查不得修复（systematic-debugging）；Red→Green→Refactor 不可跳步（test-driven-development）；破坏性操作必须经 careful gate；EnterPlanMode → brainstorm（项目级路由）。

**为什么 core 极简内联（15 行）**：硬规范是决策必备，占用上下文成本值得；反谄媚等核心价值不能延迟加载，否则模型在"接近 DONE"时会跳过 Read 退化到通用回应。

### 解法 3：Skills 三段式分层加载（解决 P2 / P5 / P3）

```
skills/<name>/
├── SKILL.md         # 入口元规范（平均 223 行，可 1 次 Read 加载）
├── reference.md     # 详细参考（完整脚本 / 格式 / 示例）
└── playbook.md      # 实战手册（可选）
```

入口 SKILL.md 通过 `[详见](reference.md#锚点)` 显式链接，模型按需 Read。入口必须自包含（不读 reference 也能完成简单任务），reference 仅复杂场景需要。

### 解法 4：when_to_use + "不适用"边界声明（解决 P5 / P4）

每个 SKILL.md frontmatter 含 `when_to_use` + 反向"不适用"声明，显式指向其他 skill。例：`verification` 不适用"对代码本身做质量评审（用 code-review）"；`code-review` 不适用"最终我完成了的自检（用 verification）"。

`using-skills/SKILL.md` 顶部含完成态决策矩阵，区分接近完成时 4 个 P1 skill 边界：

| 审查对象 | 用 skill | 触发时机 |
|---------|---------|---------|
| 计划是否合理 | `plan-review` | PLAN 后 BUILD 前 |
| 已写代码质量 | `code-review` | BUILD 完成，提 PR 前 |
| 测试覆盖 | `qa` | code-review 之后 |
| 是否对齐 spec | `verification` | 报 DONE 前 |

### 解法 5：5 个 Agent 专长分工（解决 P4）

项目有 **5 个 agent**（28 skill，但 agent 精简）：

| Agent | 工具集 | 职责 |
|-------|--------|------|
| `planner-reviewer` | Read / Grep / Glob / Write / Bash | 6 模式合一：planning / strategy / engineering / evaluation / security / code-review |
| `explorer` | Read / Grep / Glob / Bash（只读）| 探索 + evidence gathering（无 Edit/Write 权限）|
| `frontend-designer` | Read / Grep / Glob / Write / Bash | UI/UX 评审（10 维度评分 + AI Slop 检测）|
| `refactoring-agent` | Read / Grep / Glob / Edit / Bash | 行为保持的重构（tests-first 协议）|
| `doc-writer` | Read / Grep / Glob / Write / Bash | diff-driven 文档生成 |

- **mode dispatch 机制**：派发 skill 在 prompt 中指定 mode 字符串（如 `mode: planning`），同一 agent 在不同 mode 下用不同 system prompt 倾向
- **物理隔离胜过指令约束**：`explorer` 故意没有 Edit/Write 工具，架构上保证它不会越界——这是工具集设计，不靠 prompt 警告
- **evaluator ↔ code-reviewer 边界互锁**：planner-reviewer 在 evaluation 模式查"产出是否对齐 spec/plan"（每论断须有证据），在 code-review 模式查"代码本身质量/安全"（P0/P1/P2 分层），职责不重叠

### 解法 5 补充：专业 Agent 预定义与自动派发的原理

解法 5 讲了"5 个 agent 分工"，这里展开两个核心机制：**agent 如何被预定义**（让它在该出现时出现、不该出现时不越界）与**派发如何自动发生**（skill 如何在运行时决定派谁、何时派、并行还是串行）。

#### 5.1 预定义：每个 agent 是一份"身份契约"

每个 agent 文件（`agents/<name>.md`）的 frontmatter 是一份预定义契约，由 4 个字段固化其边界：

| 字段 | 作用 | 例子（explorer）|
|------|------|----------------|
| `name` | 唯一标识，skill 通过它派发 | `explorer` |
| `description` | 一句话专长，供主线程选 agent 时匹配 | "Read-only isolated-context repo exploration and evidence gathering" |
| `tools` | **工具集白名单——物理边界** | `[Read, Grep, Glob, Bash]`（无 Edit/Write）|
| `when_to_invoke` | **正向声明**（被谁派发）+ **反向声明**（不派发场景）| 被 systematic-debugging/investigate/executing-plans 派发；不派发于"改文件→用 refactoring-agent""跑测试→用 qa""安全审计→用 planner-reviewer security mode"|

**预定义的三个设计原理：**

1. **工具集即物理边界（解决 P4/P7）** — `explorer` 的 `tools` 不含 Edit/Write，架构上保证它无法修改文件。这是"物理隔离胜过指令约束"的落地：不靠 prompt 警告"不要写文件"，而是工具集里根本没有写工具。同理 `refactoring-agent` 有 Edit 但无 Write（只能改已有文件，不能新建），`planner-reviewer` 有 Write（要产出 review 报告）。工具集差异本身就是职责分工。

2. **`when_to_invoke` 双向声明（解决 P5）** — 与 skill 的"不适用"段同理：正向声明让派发 skill 知道"何时该叫我"，反向声明让其他 skill 知道"何时该叫别人"。例如 explorer 反向声明"安全审计→用 planner-reviewer security mode"，避免主线程在安全场景误派 explorer。

3. **专长聚焦的 system prompt（解决 P4）** — 每个 agent 的 system prompt 围绕一类任务优化（doc-writer 围绕"diff-driven 文档同步"，frontend-designer 围绕"10 维度 UX 评分 + AI Slop 检测"），比通用 agent 命中率高。agent 在隔离上下文运行，不污染主线程。

#### 5.2 自动派发：skill 在运行时如何决定派谁

派发不是主线程临场决定，而是**由 skill 声明 + 触发条件自动发生**。两层机制：

**第一层：skill frontmatter 的 `dispatch-agent:` 字段（静态契约）**

消费 agent 的 skill 在自己 frontmatter 声明默认派发目标，建立"skill→agent"的静态映射：

| Skill | `dispatch-agent` | 派发时机 |
|-------|------------------|---------|
| `plan-review` | planner-reviewer | Phase 1（strategy mode）+ Phase 3（engineering mode）|
| `code-review` | planner-reviewer | 主审查（code-review mode）+ 安全敏感 diff（security mode，自动）|
| `verification` | planner-reviewer | evaluation mode（独立裁决）|
| `refactoring` | refactoring-agent | Phase 4 |
| `document-release` | doc-writer | RELEASE stage |
| `executing-plans` | （多 agent）| 按 wave + 按步骤类型动态派发 |

这让派发关系可被 lint 校验（`check-workflow-contract`），不依赖模型记忆"谁该派谁"。

**第二层：运行时触发条件（动态路由）**

派发的真正发生由 skill 体内的**触发条件**驱动，分三种模式：

| 派发模式 | 触发条件 | 例子 |
|---------|---------|------|
| **阶段强制派发** | skill 到达固定 Phase 必派 | plan-review Phase 1 必派 planner-reviewer（strategy mode）|
| **条件自动派发** | 检测到特定 pattern 自动派，无需显式请求 | code-review 检测到 security-sensitive pattern → 自动派 planner-reviewer（security mode）；≥3 个 P1/P2 结构问题 → 自动派 refactoring-agent |
| **wave 并行派发** | executing-plans 分析步骤依赖，独立步骤同 wave 并行派 | Wave 1 并行派 4 个 sub-agent，Wave 2 派依赖 Wave 1 的步骤 |

**第三层：planner-reviewer 的 mode 路由（一 agent 多角色）**

`planner-reviewer` 是特殊的"多模式合一"agent——同一 agent 文件，6 种 mode 各有独立 Iron Law 与输出块。派发 skill 在 prompt 中指定 mode 字符串（如 `mode: engineering`）来路由：

| Mode | Iron Law | 输出块 |
|------|----------|--------|
| planning | ≤7 milestone，否则拆子计划 | `PLAN COMPLETE` |
| strategy（CEO lens）| 先问"用户真正的问题是什么" | `CEO ADVISOR REVIEW` |
| engineering（架构）| 每个架构决策须记录理由 | `ARCHITECTURE REVIEW` |
| evaluation | 每个论断须有证据 | `EVALUATION REPORT`（APPROVED/...）|
| security（OWASP+CVE）| 不批准有 P0 安全问题的代码 | `SECURITY AUDIT REPORT` |
| code-review | 正确性→安全→测试→质量→blast radius→架构 | `CODE REVIEW` |

**为什么是 mode 字符串而非 6 个独立 agent**：6 个 reviewer 角色共享同一套"框架词汇"（6 决策原则、mechanical/taste 判分、file:line 证据要求），mode 只是切换"看什么"。合一避免了 6 个独立 reviewer agent 的边界扯皮（"这个该 strategy 看还是 engineering 看"），且降低派发上下文成本。这呼应原则 5（简单优于巧妙）：mode 字符串派发 > 复杂 agent schema。

#### 5.3 wave 并行派发机制（executing-plans 核心）

BUILD 阶段的 `executing-plans` 是派发最密集的 skill，其派发逻辑是"依赖分析 → wave 分组 → 并行执行 → 评估关卡"：

1. **依赖分析**：扫描 plan 所有 step，标注每个 step 依赖谁。规则：一个 step 独立 = 其输出不被同 wave 任何 step 需要。
2. **wave 分组**：无依赖的 step 进同一 wave，目标每 wave 5–10 个并行 step（不强行把依赖步骤塞进同 wave 凑数）。
3. **并行派发**：同 wave 的 step 同时派发 sub-agent（独立上下文），等全部完成才进下一 wave。
4. **评估关卡**：每 wave 结束跑 evaluation gate——产出对不对、有无回归、是否满足下游 step 的输入契约。gate FAIL 不进下一 wave。

**并行 vs 串行的判定**：步骤有依赖（A 的输出是 B 的输入）→ 串行（不同 wave）；步骤独立（互不需要输出）→ 并行（同 wave）。这让 wall-clock = 最慢单链路，而非所有 step 之和。

**派发链的端到端例子**（一次 sprint 的 agent 派发轨迹）：
```
THINK   brainstorm         — 主线程执行，不派 agent
PLAN    writing-plans      — 派 planner-reviewer (planning mode) → PLAN COMPLETE
REVIEW  plan-review        — 派 planner-reviewer (strategy + engineering mode)
                          + 若 UI：派 frontend-designer (design review)
BUILD   executing-plans    — 按 wave 派 sub-agent（独立 step 并行）
                          + UI step 后：派 frontend-designer (quality gate)
VERIFY  code-review        — 派 planner-reviewer (code-review mode)
                          + 安全敏感 diff：自动派 planner-reviewer (security mode)
                          + ≥3 结构问题：自动派 refactoring-agent
        qa                 — 主线程补测试
        verification       — 派 planner-reviewer (evaluation mode) → APPROVED/...
RELEASE document-release   — 派 doc-writer (diff-driven 文档同步)
```

#### 5.4 设计原理小结

| 机制 | 解决的痛点 | 核心原理 |
|------|-----------|---------|
| 工具集白名单 | P4/P7 | 物理边界 > 指令约束（explorer 无 Write 工具）|
| when_to_invoke 双向声明 | P5 | 正向+反向消歧，避免误派 |
| dispatch-agent 静态契约 | P3/P6 | 派发关系可 lint，不靠模型记忆 |
| 条件自动派发 | P4 | 检测 pattern 自动派（安全/重构），不依赖临场判断 |
| mode 字符串路由 | P5 | 一 agent 多角色，避免边界扯皮 |
| wave 并行派发 | P2 | 独立 step 并行，降 wall-clock；依赖分析保证正确性 |
| 隔离上下文运行 | P2/P4 | sub-agent 不污染主线程，独立 reviewer 防自评盲区 |

**一句话**：agent 预定义把"谁做什么、不能做什么"固化成 frontmatter 契约（工具集=物理边界）；自动派发把"何时派谁"从主线程临场判断卸载到 skill 声明 + 触发条件 + 依赖分析——派发关系可 lint、可并行、可审计，模型只需在 agent 边界内执行。

### 解法 6：docs/superomni/ 永久产物 = 外部记忆（解决 P3 / P6）

所有 skill 产物按类型写入固定目录，**全部 git tracked 入库**（`.gitignore` 无 superomni 规则）：

```
docs/superomni/
├── specs/          # THINK 产物
├── plans/          # PLAN 产物
├── reviews/        # REVIEW 产物
├── executions/     # BUILD 产物
├── evaluations/    # VERIFY 产物
├── releases/       # RELEASE 产物（含 retrospective 段）
├── harness-audits/ # harness-engineering 审计产物
└── improvements/   # 反思报告
```

- **为何全入库（而非 gitignore 审计类）**：agent 跨会话 grep 审计链的完整性优先于仓库体积——`docs/superomni/` 本就是审计目录，全入库让任何历史产物都可被未来 sprint grep 检索
- 命名约定 `<type>-[branch]-[session]-[date].md`，同 session slug 的产物可聚合完整审计链
- retrospective 内容自 v0.5.8 起并入 `releases/release-*.md`（无独立 retros 目录）

### 解法 7：self-improvement + harness-engineering 双重反思（解决 P6）

| Skill | 范围 | 触发 |
|-------|------|------|
| `self-improvement`（process / retro / framework）| 流程质量 / sprint 回顾 / 任务级改进 | sprint 末尾 |
| `harness-engineering` | agent 框架本身健康（上下文效率 / 工具空间 / 评估关卡 / 反馈回路）| 3-failure 模式 / 主动审计 |

两层避免反思泛化：任务级反思解决"这次 sprint 做得好不好"，框架级反思解决"框架本身有没有结构性问题"。反思产物入库到 `improvements/` 与 `harness-audits/`，未来 sprint 的 plan-review 阶段自动 grep 历史 improvement 识别重复模式。

### 解法 8：Hooks 级 Guardrails（基础设施防护）

在 SessionStart hook 中做**确定性检查**（模型无关）：

| 检查项 | 实现位置 |
|--------|---------|
| 版本号一致性 | `hooks/session-start.sh` 读 package.json，无硬编码 |
| BOM/CRLF 检测 | `lib/check-skill-docs.js` 全仓 lint |
| Skill 渲染 drift | `node lib/check-skill-docs.js` |
| Skill 自动重渲 | preamble-core.md mtime > SKILL.md → 触发 |

**跨平台 hook 设计**：`hooks/launcher.js`（Node 跨平台入口）+ `hooks/session-start.sh`（单 bash 脚本）。launcher.js 用 Node 处理 Windows/Unix 路径差异，统一 spawn bash 执行 session-start.sh——比"双语言等价版本"更简单（呼应原则 5：简单优于巧妙）。hook 是 100% 确定性脚本，与 careful skill（模型判断）互补：hook 守基础设施，skill 守决策质量。

### 解法 9：CLAUDE.md 项目配置（解决 P3）

项目配置文件为 **`CLAUDE.md`**（Claude Code 主线程读取的真实来源）。另存在 `docs/AGENTS.md`，它是 **agent 库参考文档**（agent 清单与用途说明，v0.6.11），**非 CLAUDE.md 的配置镜像**。

- 协议真实来源：`lib/preamble-core.md`（硬规范）+ `lib/preamble-ref.md`（深参考），修改协议改 preamble，不直接改 CLAUDE.md
- 修改一次 preamble，28 个 SKILL.md 通过 gen-skill-docs 自动同步
- CLAUDE.md 含 source-of-truth 声明，防 maintainer 漂移

## 3.3 维护者参考层

### 目录结构速查

```
skills/          28 个 skill（行为规范：应该如何做）
agents/          5 个 agent（执行者：具体由谁做）
lib/             preamble-core.md / preamble-ref.md / gen-skill-docs.{js,sh,ps1} / check-skill-docs.js
hooks/           launcher.js + session-start.sh + hooks.json
docs/superomni/  产物目录（全入库）
bin/             build-skills（legacy 渲染器，已 supersede）
```

### 渲染机制

`lib/gen-skill-docs.{js,.sh,.ps1}` 三版本渲染器（wired into `package.json` `gen-skills` / `gen-skills:bash` / `gen-skills:ps` 脚本），从模板展开宏生成 SKILL.md：
- `{{PREAMBLE_CORE}}` → 展开 `lib/preamble-core.md`（内联）
- `{{PREAMBLE_REF_LINK}}` → 展开为指向 `lib/preamble-ref.md` 的固定 markdown 链接

`bin/build-skills` 是 legacy 渲染器（用旧 `{{PREAMBLE}}` token + `preamble.md`），已被 gen-skill-docs 取代但仍在磁盘。

### 跨平台 hook 机制

`hooks/launcher.js`（Node 入口，`process.platform === 'win32' ? 'bash.exe' : 'bash'`）spawn `hooks/session-start.sh`。Node 处理路径，bash 执行逻辑——单一脚本，跨平台调度。

### 量化指标

| 指标 | 当前值 |
|------|--------|
| skills 目录数 | 28 |
| agent 总数 | 5 |
| 全仓 SKILL.md 总行数 | 6255（平均 223 / 个，可 1 次 Read 加载）|
| 流水线评估关卡 | 6 阶段 + 1 观察期（R1 监控）|
| 治理入口 | `/vibe` + `using-skills`（meta）|
| workflow skill 被引用 | 9 个 SKILL.md 引用 workflow skill |
| preamble-core 内联行数 | 15（硬规范极简）|
| preamble-ref 按需行数 | 127 |

---

# 第四幕 局限与演进

## 当前局限

| 局限 | 影响 |
|------|------|
| 软规范是 prompt engineering 信仰 | 模型可能跳过 Read `preamble-ref.md`，需观察期实证 |
| 运行时 enforcement 依赖 prompt | PreToolUse hook 拦截 EnterPlanMode 曾撤回，模型自律为主 |
| 跨平台 install 完整性 | Windows Dev Mode 关闭时 symlink 可能静默部分失败 |

## 演进方向

- **短期**：explorer prompt 加 ground-truth 强制；plan-review 加"scope ≤ 4 文件 → inline，否则派发"准则
- **中期**：Skill 自动迁移工具（适配其他 agent 平台）；失败模式数据库（reflection 结构化入库）
- **长期**：运行时 enforcement（PreToolUse 拦截非合规调用，需谨慎）；分布式 sprint（多 agent 真正并行）；harness 元学习（harness-audit 自动产出改进 PR）

---

# 总结：7 个核心洞察

1. **不是模型不够聪明，是围绕 agent 的系统不够严谨**——瓶颈在 harness 设计，而非模型本身
2. **7 个痛点都是 LLM 内生属性**——不能靠换更强模型解决，只能靠工程化机制
3. **9 个解法 = 把判断从模型卸载到外部确定性机制**——流水线 / 铁律 / 分层加载 / when_to_use / agent 分工 / 永久产物 / 双重反思 / hooks / 项目配置
4. **6 大原则**在项目中都有具体落地
5. **工程师设计系统，Agent 执行**——确定性部分由人写一次，概率性部分由 agent 在边界内运行
6. **物理隔离胜过指令约束**——explorer 没 Edit 权限是工具集设计，不靠 prompt 警告
7. **R1 风险靠观察期实证消解**——不是承诺"设计得很好"，而是观察实际行为，有退化就回滚

---

## 附录：核心参考

- **Harness 工程原则**：Anthropic Engineering — Effective context engineering / harnesses for long-running agents
- **开放标准**：Keep a Changelog 1.1.0 — https://keepachangelog.com
