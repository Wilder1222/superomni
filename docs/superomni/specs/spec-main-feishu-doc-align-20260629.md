# 飞书文档《superomni-ude 的 Harness 实践》重组重写 — Spec

## Problem

飞书文档 `DEDGwbF4EiFKMtk9Ikscg3HDnae`（标题：《superomni-ude的Harness 实践》）是 superomni 框架面向读者的架构文档。当前有两个层次的问题：

1. **讲不清楚**：文档偏"论辩式"（反复论证"不是模型不够聪明是系统不够严谨"），对初次读者缺少清晰的"What——这个项目给我什么、装上之后发生什么"入口；How 部分把 9 个解法并列罗列，读者拼不出"一次完整 sprint 从 /vibe 到 release 实际发生了什么"。没有履行"讲清 What/Why/How"的职责。

2. **事实漂移**：8 处事实断言与当前代码不符（agent 数、preamble 文件、行数、hook 机制、入库策略、AGENTS.md 镜像表述、渲染器等），读者照文档找不到代码，How 部分不可信。**注：原文档对 `harness-audits/` 的引用本就与代码一致（harness-engineering 的生活产物路径），非漂移，不应误改。**

用户诉求：**从功能逻辑和设计层面讲清当前项目的作用、优势、工作原理**，重组为 What / Why / How 三幕，兼顾新读者（讲解层）与维护者（参考层），优势用对比驱动表达。

## Goals

- 文档重组为 **What → Why → How 三幕结构**，让初次读者能读出"项目是什么 / 为什么这样设计 / 怎么工作"
- **What 幕**：讲清 superomni 的作用（围绕 agent 的 harness 框架）、给谁用、装上之后发生什么（一次 `/vibe` 触发什么）、核心优势（对比传统单 prompt / 裸 agent 方式）
- **Why 幕**：保留并精炼 7 痛点 + 6 原则的立论，回答"为什么需要 harness 工程"
- **How 幕**：用"一次 sprint 端到端走读"（/vibe → 检测阶段 → THINK…RELEASE → 产物链）串联 9 个解法机制，让读者看到实际运行原理；附维护者参考层（文件位置 / 机制细节 / 设计取舍）
- **所有事实断言与 `main` 分支代码一致**（8 处漂移全部修正，见下表）
- 理念立论（7 痛点本质 / 6 原则 / "工程师设计-Agent执行"哲学）保留，但重新组织进三幕结构

## Non-Goals (YAGNI)

- **不**改动代码——本任务只改飞书文档，代码是 source of truth
- **不**把文档写成使用手册 / API reference（保留架构文档定位，参考层只放关键机制）
- **不**引入代码里没有的设计（test-writer 不补"规划中"，直接不出现；`docs/AGENTS.md` 作为 agent 库参考文档可在参考层如实提及，但不再作为"CLAUDE.md 配置镜像"表述）
- **不**改变 superomni 框架本身的设计——文档描述现状，不设计新功能
- **不**追求原文一字不动——重组允许重排章节、改写过渡段

## Proposed Solution

**全文重组重写**，用飞书 MCP `update-doc` 的 `overwrite` 模式交付（因属结构性重组，局部 replace 无法承载三幕重排；overwrite 前已 fetch 全文备份，原文媒体/评论风险已评估——见 Open Questions）。

### 三幕结构设计

```
引子：工程化的转向（精炼保留，作为全文开场）

第一幕 WHAT —— superomni 是什么
  1.1 一句话定义：围绕 agent 的 harness 框架
  1.2 给谁用：应用工程师 / 框架设计者 / 技术管理者（三类读者各取所需）
  1.3 装上之后发生什么：/vibe 触发 → 检测阶段 → 6 阶段流水线 → 产物入库
  1.4 核心优势（对比驱动）：
      对比表"裸 agent / 单 prompt 工程 / superomni"三栏
      维度：输出确定性 / 跨会话延续 / 判断盲区防护 / 作用域控制 / 失败反馈利用

第二幕 WHY —— 为什么需要 harness 工程
  2.1 7 个本质痛点（保留，精炼表述）—— LLM 内生属性，换更强模型解决不了
  2.2 6 大原则（保留）—— 上下文即一切 / 工具精简 / 持续评估 / 信号驱动 / 简单优于巧妙 / 文档即合约
  2.3 核心论断：工程师设计系统，Agent 执行（保留第四章哲学，精简入此）

第三幕 HOW —— 怎么工作
  3.1 端到端走读：一次 sprint 的完整生命周期
      /vibe auto "feature" → brainstorm 出 spec → 用户审批 →
      writing-plans 出 plan → plan-review → executing-plans(派发 subagent) →
      code-review→qa→verification → release(含 retrospective)
      用真实产物文件名串联（spec-main-xxx / plan-main-xxx / ...）
  3.2 9 个解法机制（重组进 How，每个解法对应"解决哪个痛点 + 怎么落地"）：
      ① 6 阶段强制流水线（产物契约表）
      ② 铁律与硬/软规范分层（preamble 三文件：core 内联 / ref 按需）
      ③ Skills 三段式分层加载
      ④ when_to_use + "不适用"边界声明
      ⑤ 5 个 Agent 专长分工（mode dispatch 机制）
      ⑥ docs/superomni/ 永久产物 = 外部记忆（全入库策略）
      ⑦ self-improvement + harness-engineering 双重反思
      ⑧ Hooks 级 Guardrails（launcher.js 跨平台 + session-start.sh）
      ⑨ CLAUDE.md 项目配置（单文件，非镜像）
  3.3 维护者参考层（附录性质）：
      - 目录结构速查（skills/ agents/ lib/ hooks/ docs/superomni/）
      - 渲染机制（gen-skill-docs 三版本 + preamble 宏展开）
      - 跨平台 hook 机制（launcher.js → bash 调度）
      - 量化指标（28 skill / 5 agent / 6255 行 / 6 阶段 + 观察期）

第四幕 局限与演进（保留第六章，精简）
  - 当前局限（含"软规范是 prompt 信仰"等，事实校正后）
  - 演进方向（短期/中期/长期）

总结：7 个核心洞察（保留）
```

### 9 处事实修正（嵌入 How 与参考层，硬性约束）

| # | 原错误 | 修正为 |
|---|--------|--------|
| 1 | 6 agent 含 test-writer | **5 agent**：planner-reviewer / explorer / frontend-designer / refactoring-agent / doc-writer |
| 2 | preamble.md(60) + preamble-soft.md(79) | **preamble.md(135) + preamble-core.md(15,内联) + preamble-ref.md(127,按需)** |
| 3 | SKILL.md 7231 行 / 平均 258 | **6255 行 / 平均 223** |
| 4 | bash+node 双版本 hook | **launcher.js(Node 跨平台入口) + session-start.sh(单 bash)** |
| 5 | build-skills byte-identical | **gen-skill-docs.{js,.sh,.ps1} 三版本，宏展开生成 SKILL.md** |
| 6 | workflow 引用 11 处 | **9 处** |
| 7 | 审计类 gitignore | **全入库 tracked，.gitignore 无 superomni 规则** |
| 8 | "CLAUDE.md + AGENTS.md 镜像"表述（解法9 整段镜像论） | **项目配置仅 CLAUDE.md；docs/AGENTS.md 是 agent 库参考文档（非配置镜像）**。删除解法9 镜像论，CLAUDE.md 作为唯一项目配置；参考层可如实提及 docs/AGENTS.md 的 agent 库参考用途 |
| 9 | ~~harness-audits/ 目录~~ | **原文此处正确，非漂移**：harness-engineering 产物路径 = `harness-audits/`（与代码 `produces:` / setup.js / CLAUDE.md 一致）；retrospective 内容 v0.5.8 起并入 `releases/release-*.md`（无独立 retros/ 目录）。原文档若已用 harness-audits/ 则保留，**不误改为 retros/** |

> **Fact 9 修订说明（plan-review P0-1 救场）**：spec 初稿误把废弃的 `retros/` 当真相、把代码生活路径 `harness-audits/` 当漂移。经复核 `skills/harness-engineering/SKILL.md:12` `produces:` + `CHANGELOG.md:448`（retros/ v0.5.8 废弃），确认 `harness-audits/` 才是代码声明的生活路径。故 Fact 9 从"修正项"降级为"原文正确，仅须补述 retrospective 并入 release 产物"。

### 对比驱动优势表（What 幕核心，预览）

| 维度 | 裸 agent / 单 prompt | superomni |
|------|---------------------|-----------|
| 输出确定性 | 同输入不同输出，靠 prompt 碰运气 | 6 阶段流水线 + 产物契约，结构可比较可审计 |
| 跨会话延续 | 每次冷启动，丢失上文 | docs/superomni/ 全入库，grep 历史产物续跑 |
| 判断盲区防护 | agent 自评"我做完了" | 多 agent 职责分离 + 独立 reviewer + 显式状态 |
| 作用域控制 | 顺手改多，scope 蔓延 | careful gate + scope 锁 + 阶段产物界定边界 |
| 失败反馈利用 | 失败诊断不复用 | improvement/retro 入库，未来 sprint grep 检索 |
| 工具选择 | 工具列表长，随机命中 | when_to_use + "不适用"消歧 + 28skill/5agent 精简 |

## Key Design Decisions

| Decision | Choice | Rationale | Principle Applied |
|----------|--------|-----------|-------------------|
| 文档结构 | 重组为 What/Why/How 三幕 | 用户明确要求；三幕让初次读者建立完整心智模型 | 完整性 |
| 读者定位 | 讲解层 + 参考层兼顾 | 用户确认"两者兼顾"；新读者读前三幕，维护者查参考层 | 完整性 |
| 优势表达 | 对比驱动（vs 裸 agent） | 用户确认；对比让优势可感知，不空谈 | 显式优于巧妙 |
| 交付方式 | update-doc overwrite | 结构重组无法用局部 replace 承载；overwrite 前已 fetch 备份 | （飞书工具约束）|
| 事实基准 | 以代码为准 | 代码是 source of truth；用户三连确认 | 文档即合约 |
| 缺失项 | test-writer / AGENTS.md 不出现 | 代码没有就不写；用户确认删除 | YAGNI |
| 入库策略 | 全入库 | 实际就是全入库；可 grep 审计性优先 | 信号驱动 |
| 理念立论 | 保留但重组进三幕 | 立论仍成立，重排而非重写 | DRY（复用原文论述）|
| How 串联 | 端到端 sprint 走读 | 并列解法拼不出全貌；走读让机制串成流程 | 显式优于巧妙 |

## Acceptance Criteria

**结构（What/Why/How）**
- [ ] 文档有清晰的三幕分界：WHAT（项目是什么/给谁用/装上发生什么/优势）/ WHY（7痛点+6原则+哲学）/ HOW（端到端走读+9解法+参考层）
- [ ] What 幕含对比驱动优势表（裸 agent vs superomni，≥5 维度）
- [ ] How 幕含一次 sprint 端到端走读，用真实产物文件名串联 6 阶段
- [ ] 维护者参考层含目录速查 / 渲染机制 / 跨平台 hook / 量化指标

**事实正确（8 处漂移全部修正 + Fact 9 原文正确保留）**
- [ ] agent = 5（无 test-writer）
- [ ] preamble = preamble.md + preamble-core.md(15) + preamble-ref.md(127)，无 preamble-soft.md
- [ ] SKILL.md = 6255 行 / 平均 223
- [ ] hook = launcher.js + session-start.sh，无"双版本等价"对照
- [ ] 渲染器 = gen-skill-docs 三版本（build-skills 是 legacy，文档不命名 legacy 脚本）
- [ ] workflow 引用 = 9（vibe SKILL.md 内引用数，文档须说明口径）
- [ ] 入库 = 全入库，无 gitignore 平衡论述
- [ ] 项目配置仅 CLAUDE.md；无"AGENTS.md 镜像"表述；docs/AGENTS.md 作为 agent 库参考可如实提及
- [ ] harness-engineering 产物路径 = harness-audits/（原文正确保留）；retrospective 内容并入 releases/release-*.md（补述，非独立 retros/ 目录）

**质量**
- [ ] 理念立论（7 痛点 / 6 原则 / 工程师设计-Agent执行 / 7 洞察）保留
- [ ] 更新后重新 fetch，8 处漂移逐一可被代码验证为真；Fact 9 不被误改
- [ ] 初次读者能从文档答出：项目作用 / 装上发生什么 / 一次 sprint 怎么跑 / 优势在哪

## Resolved Decisions（用户已拍板）

1. **交付方式 = 直接 overwrite**：不查评论，直接重写。用户接受 overwrite 风险。
2. **代码内部漂移不在本任务范围**：`harness-engineering` skill frontmatter 的 `harness-audits/` vs `retros/` 不一致由用户后续单独处理。**文档统一用 `harness-audits/`（代码生活路径），retrospective 内容表述为并入 release 产物。**
3. **标题改为强调"研发工作流实践"**：新标题定为 **《superomni：围绕 Agent 的研发工作流实践——What / Why / How》**。这个定位比纯"harness 工程"更贴近用户视角——文档要突出 superomni 作为**一套研发工作流**的属性（6 阶段流水线 = 研发流程的工程化），而非只讲抽象的 agent 约束机制。What 幕叙事以此为锚：superomni 是把软件研发流程（思考→规划→评审→构建→验证→发布）工程化为 agent 可执行流水线的实践框架。

## plan-review 修订记录（P0 救场）

plan-review 工程审查发现 spec 初稿 2 处 P0 事实反转，已修正：
- **P0-1（Fact 9 反转）**：spec 初稿误把废弃 `retros/` 当真相。经复核代码，`harness-audits/` 是 harness-engineering 生活产物路径，retros/ v0.5.8 已废弃（内容并入 release）。Fact 9 降级为"原文正确，仅补述"。
- **P0-2（Fact 8 过校正）**：spec 初稿"无 AGENTS.md"过校正。实际 `docs/AGENTS.md` 存在且是 v0.6.11 agent 库参考。Fact 8 改为"配置仅 CLAUDE.md + docs/AGENTS.md 是参考（非镜像）"。
- **P1**：M4 前 fetch 原文持久化作 rollback 备份；Fact 5 build-skills legacy 说明；Fact 6 workflow 口径说明；forbidden-token 收紧为 drifted 表述。

## Open Questions

无。所有决策已由用户拍板。
