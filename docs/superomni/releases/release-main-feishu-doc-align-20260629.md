# Release: 飞书文档重组重写

**Date:** 2026-06-29
**Branch:** main
**Session:** feishu-doc-align
**Task type:** DOCUMENT REWRITE（无代码变更、无版本发布、无部署）

---

## Release

### 交付物

| 交付物 | 位置 | 状态 |
|--------|------|------|
| 飞书文档（live）| `DEDGwbF4EiFKMtk9Ikscg3HDnae` | ✅ overwrite 成功，标题已更新 |
| 本地 body（源）| `docs/superomni/plans/feishu-body-feishu-doc-align-20260629.md` | ✅ 完整三幕内容 |
| Spec | `docs/superomni/specs/spec-main-feishu-doc-align-20260629.md` | ✅ |
| Plan | `docs/superomni/plans/plan-main-feishu-doc-align-20260629.md` | ✅ |
| Plan review | `docs/superomni/reviews/plan-review-main-feishu-doc-align-20260629.md` | ✅ |
| Execution | `docs/superomni/executions/execution-main-feishu-doc-align-20260629.md` | ✅ |
| Evaluation | `docs/superomni/evaluations/evaluation-main-feishu-doc-align-20260629.md` | ✅ APPROVED |

### 标题变更
- 原：《superomni-ude的Harness 实践》
- 新：《superomni：围绕 Agent 的研发工作流实践——What / Why / How》

### 内容变更摘要
- 重组为 What / Why / How 三幕结构（原为论辩式 6 章并列）
- WHAT 幕：项目定义 / 给谁用 / 装上发生什么 / 对比优势表（6 维度，裸 agent vs superomni）
- WHY 幕：7 痛点 + 6 原则 + "工程师设计-Agent执行"哲学
- HOW 幕：一次 sprint 端到端走读（真实文件名串联）+ 9 解法机制 + 维护者参考层
- 8 处事实漂移全部修正 + Fact 9 原文正确保留

### 8 处事实修正
1. agent 6→5（删 test-writer）
2. preamble-soft.md → preamble-core.md(15) + preamble-ref.md(127) + preamble.md(135)
3. SKILL.md 7231→6255 行，平均 258→223
4. bash+node 双版本 hook → launcher.js + session-start.sh
5. build-skills byte-identical → gen-skill-docs.{js,sh,ps1} 三版本（build-skills legacy）
6. workflow 引用 11→9 个 SKILL.md
7. 审计类 gitignore → 全入库 tracked
8. CLAUDE.md+AGENTS.md 镜像 → 配置仅 CLAUDE.md + docs/AGENTS.md 是 agent 库参考
9. （Fact 9 原文正确）harness-audits/ 保留，retrospective 并入 release 产物

### Version / Tag / Deploy
- **无版本 bump**（文档任务，非代码发布）
- **无 git tag**（无语义版本变更）
- **无部署**（飞书文档 overwrite 即为交付，已由 update-doc 完成）
- 代码零变更：`git diff HEAD --name-only`（排除 .md）为空

### Rollback Plan
- 飞书文档：原文已在 spec 阶段 fetch 备份到对话上下文（36219 chars 完整 markdown）。若需恢复原文，可从备份重新 overwrite。
- 新内容确定性：body 文件持久化在 `docs/superomni/plans/feishu-body-feishu-doc-align-20260629.md`，可随时 re-issue overwrite。

### Deployment Evidence
- `update-doc` overwrite 返回 `success: true`，`message: "文档更新成功（overwrite模式）"`
- M5 re-fetch 服务端内容（27947 chars）确认：标题已更新 + 9 facts 在 live 内容为真 + 四幕结构完整
- 独立 evaluator（planner-reviewer evaluation mode）裁决 APPROVED

---

## Retrospective

### What went well

1. **plan-review 救场成功**：工程审查在执行前抓到 spec 初稿 2 处 P0 事实反转（Fact 9 retros/ 反转、Fact 8 AGENTS.md 过校正），避免了把新错误发布到飞书。这正印证了流水线 P0 防护的价值——独立 reviewer 在破坏性操作（overwrite）前拦截了错误。
2. **重算定量声明**：plan-review 的 P1 风险点（"信任 spec 数字未重算"）在 M1 触发——重算发现 Fact 6 的"9 处"口径不明，pin 死为可复现口径（9 个 SKILL.md 引用 workflow）。若不重算会把口径模糊的数字写进文档。
3. **三幕重组达成用户诉求**：用户要求"讲清 What/Why/How + 强调研发工作流实践"，最终文档从论辩式重组成读者导向的三幕，WHAT 幕的对比驱动优势表让"优势"可感知。
4. **破坏性操作防护到位**：M4 在 overwrite 前先 fetch 原文备份 + careful gate 枚举 blast radius，让 rollback 前提可验证（plan-review P1-1 要求）。

### Slowdowns / Friction

1. **spec 阶段事实核实不够深**：初稿把磁盘存在的 `retros/` 目录当真相，未查 harness-engineering 的 `produces:` 字段和 CHANGELOG 的废弃记录。根因：只看"磁盘有什么"没看"代码声明什么"。幸亏 plan-review 兜住，但 spec 阶段就应查 frontmatter `produces:` 与 CHANGELOG 废弃条目。
2. **workflow 计数口径一开始就模糊**：spec 初稿写"9 处"但没说清口径，重算时出现 8/10/24/9/6 五个不同数字。浪费了一轮核实。教训：凡写"X 处引用"必须当场 pin 口径（grep 命令）。
3. **plan forbidden-token 列表过严**：把裸 `build-skills` 列为 forbidden，但 build-skills 是 legacy 脚本、文档可合法提及。M3 自检时触发误报，需判断是误报而非真错。教训：forbidden token 应是"drifted 表述"而非"裸词"，避免误伤合法引用。

### Process Improvements

1. **事实核实清单化**：涉及"代码里有什么"的断言，spec 阶段必须查三类源：(a) 磁盘文件存在性，(b) frontmatter `produces:`/`consumes:` 声明，(c) CHANGELOG 废弃/迁移记录。三者不一致时以代码声明为准。这应纳入 brainstorm/explorer 的核实协议。
2. **定量声明当场 pin 口径**：任何"N 处/X 个"断言，spec 阶段就写明 grep 命令与口径，避免下游重算时口径漂移。
3. **forbidden-token 用 drifted 表述**：文档对齐任务的 forbidden 列表，应禁"错误表述"（如"AGENTS.md 镜像"）而非"裸词"（如"AGENTS.md"），避免误伤合法引用。

### Tacit Gap Mining

- **隐藏假设**：spec 阶段隐含"磁盘目录名 = 真相"，但 superomni 的产物路径由 skill frontmatter `produces:` 声明，磁盘目录可能是废弃遗留或未 bootstrap。这是项目特有的"声明优先于磁盘"约定，新贡献者易踩。建议在 docs/superomni/ 的 README 或 SKILL-DATA-FLOW 里显式说明"产物路径以 skill produces: 声明为准"。

### Next Sprint

- 修复代码内部漂移：`harness-engineering` skill frontmatter 的 `produces: harness-audits/` 与磁盘 `retros/` 目录不一致（用户已确认自行处理）。本任务文档统一用 `harness-audits/`，但代码侧的 `retros/` 废弃目录与 setup.js bootstrap 逻辑仍需清理。
- 考虑给 docs/AGENTS.md 加一行注释明确"本文件是 agent 库参考，非 CLAUDE.md 配置镜像"，防止未来再次混淆。

---

**Status: DONE** — 飞书文档重组重写全流程完成（THINK→PLAN→REVIEW→BUILD→VERIFY→RELEASE 六阶段闭环），release artifact 含 ## Release + ## Retrospective 两段。
