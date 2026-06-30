# Release: code-drift-fix + Process Improvements

**Date:** 2026-06-29
**Branch:** main
**Session:** code-drift-fix
**Task type:** DOCUMENT + DEV-TIME CI CHECK（无版本发布、无部署、无运行时代码变更）

---

## Release

### 交付物

| 交付物 | 位置 | 状态 |
|--------|------|------|
| Spec | `docs/superomni/specs/spec-main-code-drift-fix-20260629.md` | ✅ |
| Plan | `docs/superomni/plans/plan-main-code-drift-fix-20260629.md` | ✅ |
| Plan review | `docs/superomni/reviews/plan-review-main-code-drift-fix-20260629.md` | ✅ APPROVED_WITH_NOTES |
| Execution | `docs/superomni/executions/execution-main-code-drift-fix-20260629.md` | ✅ |
| Code review | `docs/superomni/reviews/code-review-main-code-drift-fix-20260629.md` | ✅ APPROVED_WITH_NOTES (P1#1 hardened) |
| QA | `docs/superomni/reviews/qa-main-code-drift-fix-20260629.md` | ✅ LOW risk, 0 bugs |
| Evaluation | `docs/superomni/evaluations/evaluation-main-code-drift-fix-20260629.md` | ✅ APPROVED, 11/11 AC |
| Release | `docs/superomni/releases/release-main-code-drift-fix-20260629.md` | ✅ 本文件 |

### 内容变更摘要

完成 feishu-doc-align (20260629) vibe 流程 release 产物里 Next Sprint 遗留的代码漂移修复 + 落地回顾提出的 3 条 Process Improvements：

1. **漂移清理**：删除废弃空目录 `docs/superomni/retros/.gitkeep`（v0.5.8 起废弃，内容并入 release 产物；代码声明的生活路径是 `harness-audits/`）。
2. **镜像歧义消除**：`docs/AGENTS.md` 加 blockquote 明确"agent 库参考、非 CLAUDE.md 配置镜像"；`docs/DESIGN.md:91` 给废弃 retros/ 引用加 v0.5.8 retirement 注释（保留历史决策日志）。
3. **权威源集中**：`docs/SKILL-DATA-FLOW.md` 新增 `## Convention: Declaration Precedence & Doc-Alignment Discipline` 节，集中写入 3 条 Process Improvements（声明优先于磁盘 / 定量声明 pin 口径 / forbidden-token 用 drifted 表述）；brainstorm + plan-review 的 `.tmpl` 各加一行指针（DRY——引用不复制），`.md` 由 `gen-skill-docs.js` 重新生成（非手编）。
4. **可执行防护**：`lib/check-workflow-contract.js` 新增 Section 3——`docs/superomni/` 每个顶层子目录须被某 skill 的 `produces:` 声明覆盖，否则报 drift error（空 `DECLARATION_ALLOWLIST` 豁免废弃遗留；backslash 归一化的 `startsWith`）。把"声明优先"从文档约定升级为 CI 可执行结构不变量。

### 最终 Diff（8 modified + 1 deleted）

| Status | File |
|--------|------|
| M | docs/AGENTS.md |
| M | docs/DESIGN.md |
| M | docs/SKILL-DATA-FLOW.md |
| M | lib/check-workflow-contract.js |
| M | skills/brainstorm/SKILL.md |
| M | skills/brainstorm/SKILL.md.tmpl |
| M | skills/plan-review/SKILL.md |
| M | skills/plan-review/SKILL.md.tmpl |
| D | docs/superomni/retros/.gitkeep |

### Version / Tag / Deploy
- **无版本 bump**（文档 + dev-time CI 检查任务，非代码发布；package.json 仍 v0.6.11）
- **无 git tag**（无语义版本变更）
- **无部署**（无运行时代码；CI 检查脚本随下次 commit 生效）
- 代码零运行时变更：`git diff HEAD` 仅含 docs + 1 个 dev-time CI 脚本 + 4 个 skill 文档

### CI Gate Evidence
- `node lib/check-workflow-contract.js` → exit 0（含新 Section 3："checked 9 top-level subdirs, allowlist size 0"）+ REFLECT gate 满足（本 release 产物存在）
- `node lib/check-skill-docs.js` → exit 0（"28 generated files, 27 templates"，.md↔.tmpl 零漂移）
- `node lib/check-plan-content.js` → exit 0（"1 destructive step, all preceded by careful"——Pre-Destructive Gate 真正生效）
- 独立 evaluator（planner-reviewer evaluation mode）裁决 APPROVED，11/11 acceptance criteria 满足

### Rollback Plan
所有改动小而隔离，按 milestone 可独立回滚：

| Change | Rollback command |
|--------|------------------|
| M1 (retros delete) | `git checkout HEAD -- docs/superomni/retros/.gitkeep` |
| M2 (AGENTS.md + DESIGN.md) | `git checkout HEAD -- docs/AGENTS.md docs/DESIGN.md` |
| M3 (SKILL-DATA-FLOW + 2 .tmpl + 2 regenerated .md) | `git checkout HEAD -- docs/SKILL-DATA-FLOW.md skills/brainstorm/SKILL.md.tmpl skills/brainstorm/SKILL.md skills/plan-review/SKILL.md.tmpl skills/plan-review/SKILL.md` |
| M4 (contract script §3) | `git checkout HEAD -- lib/check-workflow-contract.js` |

核选项：`git checkout HEAD -- .` 恢复全部（无运行时 load-bearing 代码，仅 docs + dev-time CI 检查）。无数据迁移、无 schema、无外部依赖。任何 milestone 边界可安全回滚。

### Deployment Evidence
- 无部署（dev-time CI 检查脚本 + docs，随 git commit 生效）
- 独立 evaluator + QA + code-review 三重验证通过

---

## Retrospective

### What went well

1. **plan-review 救场再次生效**：strategy + engineering 双模式 review 亲自复核代码，抓到 M4 插入 anchor 行号错误（line 241 实为 evaluations-loop close，应为 improvements-loop close line 255）——若按初稿插入会破坏 errors[] 累积顺序。还发现 `docs/DESIGN.md:91` 同类漂移在 guard 范围外，主动加 M2.2 boil-the-lake。
2. **writing-plans Phase 5 自审抓到 generator 误判**：planner-reviewer planning-mode 初稿断言"无 generator 脚本需手工 dual-edit .tmpl+.md"，但 Phase 5 验证 prerequisite 时发现 `lib/gen-skill-docs.js` 存在且 `check-skill-docs.js:126` 强制 .md↔.tmpl 一致——手工 dual-edit 会破坏 CI。改为"只编辑 .tmpl + scoped 重新生成 .md"，更简单更安全。这正是 Phase 5 prerequisite 验证的价值。
3. **独立 evaluator + QA 经验性测试闭环**：QA 用"突变磁盘状态 + 观察 exit code + 清理"经验性测了 5 个边界（null-produces / loose-file / substring-prefix / allowlist-exempt / un-declared-dir），把 code-review P1#2（allowlist-exempt 路径无测试）经验性闭合。独立 evaluator 自己重跑 9 条验证命令 + 自建负向测试，APPROVED。
4. **Pre-Destructive Gate 真正生效**：M1 的 `git rm` 是破坏性操作，`check-plan-content.js` 确认 Step 1.1 的 `careful` 满足 gate（1 destructive step preceded by careful），不是 no-op。

### Slowdowns / Friction

1. **Pre-Destructive Gate linter 的解析规则极其隐式**：`check-plan-content.js` 要求 `### Step N:` 带冒号、`**How:**` 独占行（内容不能在同一行）、destructive 模式须在 How 的纯文本行（非 fence、非行内反引号）。初稿用 `#### Step` + `- **How:** 内联` + `git rm 在反引号里`，linter 静默 no-op（报"0 destructive steps"），直到逐字段 debug 才发现。根因：linter 的 `extractHow` 丢弃 `**How:**` 同行内容、`findDestructiveInHow` 不跳过行内反引号。教训：plan 格式必须严格匹配 linter 的解析假设，否则 gate 是假生效。
2. **Edit 工具在 Windows 引入 CRLF**：编辑 LF-only 的文件后变成 CRLF（5 个文件），被 git `CRLF will be replaced` 警告 + node 字节检查抓到。根因：Edit 工具按平台写 CRLF。教训：Windows 上 Edit 后须验行尾，`.gitattributes` pin LF 的文件需显式归一化。
3. **C: 盘 0 字节阻断 npm**：`npm run` 全 ENOSPC（npm-cache 在 C:）。缓解：所有命令改 `node lib/<script>.js` 直调 + TEMP/npm_config_cache 重定向到 D:。但 plan 初稿只把它当"环境注"，plan-review 把它提升为 P0-D 风险登记项——正确，因为 node 仍写 %TEMP%（C:），gen-skill-docs writeFileSync 可能中途截断 .md。
4. **REFLECT gate 在写 evaluation 后、写 release 前临时失败**：写完 evaluation artifact 后 contract check 退出 1（"has evaluation but missing release"）。这是契约的正确行为（evaluation 须跟 release），但意味着 release artifact 必须在本阶段写完才能让 gate 回绿——顺序耦合值得知晓。

### Process Improvements

1. **plan 格式须匹配 linter 解析假设**：`check-plan-content.js` 的 Pre-Destructive Gate 对 plan 格式有隐式要求（`### Step N:` 冒号、`**How:**` 独占行、destructive 纯文本）。建议在 `writing-plans` SKILL.md 的 plan 模板里显式标注这些格式约束，或给 linter 加一条"扫描到 0 steps 时警告可能格式不匹配"。当前是 silent no-op，最危险。
2. **Windows Edit 后验行尾**：项目 `.gitattributes` pin LF，但 Edit 工具在 Windows 写 CRLF。建议在 executing-plans 的 step verification 里加一条"编辑 .gitattributes-pinned 文件后用 node 字节检查确认 LF"，或给 check-skill-docs 的 CRLF advisory 扩展到 .tmpl 源文件（目前只查 generated .md）。
3. **disk-space 风险须进风险登记**：环境约束（C: 满）不能只当注，须作为 P0 风险登记项并附缓解步骤（重定向 TEMP/cache、直调 node entrypoint）。plan-review 把 P0-D 提升的做法应成为标准。

### Tacit Gap Mining

- **隐藏假设**：Pre-Destructive Gate 的"生效"依赖 plan 格式精确匹配 linter 的正则假设。linter 报"passed"不等于 gate 真在保护——只有当它报"N destructive step(s)"且 N>0 时才证明它在工作。这是项目特有的"linter 静默 no-op"陷阱：格式错位让 gate 失效但不报错。建议在 `writing-plans` 文档里显式说明"验证 gate 生效的方法：确认 linter 报告的 destructive step 计数与你预期的破坏性步骤数一致"。
- **声明优先 vs 磁盘优先**：本任务正是落地这条约定。新贡献者易把磁盘目录当真相（如 feishu-doc-align spec 阶段误判 retros/）。Section 3 guard 现在把这条约定机械化：磁盘子目录须有 produces: 声明，否则 CI 失败。

### Next Sprint

- **codify 经验性测试**：把 QA 的 5 个边界测试 + allowlist-exempt 测试固化成 `test:contract` npm script（建临时目录、断言 exit code、清理），锁定负向 + allowlist 路径。
- **对称 produces→dir 检查**：Section 3 目前只查 dir→produces（单方向）。对称检查 produces→dir 能抓"skill 声明了 produces 路径但磁盘从未 bootstrap 该目录"。
- **mechanize forbidden-token-as-drifted-expression**：Convention 第 3 条目前是 advisory。考虑在 `check-skill-docs.js` 加一条检查：doc-alignment plan 的 forbidden-token 列表禁 drifted 表述而非裸词（这条较难自动化，可能保持 advisory）。
- **plan-content linter 静默 no-op 防护**：给 `check-plan-content.js` 加"扫描到 0 steps 时警告可能格式不匹配"，防止 plan 格式错位让 Pre-Destructive Gate 假生效。

---

**Status: DONE** — code-drift-fix 全流程完成（THINK→PLAN→REVIEW→BUILD→VERIFY→RELEASE 六阶段闭环），release artifact 含 ## Release + ## Retrospective 两段。feishu-doc-align vibe 流程遗留的 Next Sprint 项 + 3 条 Process Improvements 全部落地。
