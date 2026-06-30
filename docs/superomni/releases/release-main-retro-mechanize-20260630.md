# Release: retro-mechanize (回顾教训机械化锁死)

**Date:** 2026-06-30
**Branch:** main
**Session:** retro-mechanize
**Task type:** DOCUMENT + DEV-TIME CI CHECK（无版本发布、无部署、无运行时代码变更）

---

## Release

### 交付物

| 交付物 | 位置 | 状态 |
|--------|------|------|
| Spec | `docs/superomni/specs/spec-main-retro-mechanize-20260630.md` | ✅ |
| Plan | `docs/superomni/plans/plan-main-retro-mechanize-20260630.md` | ✅ |
| Plan review | `docs/superomni/reviews/plan-review-main-retro-mechanize-20260630.md` | ✅ APPROVED_WITH_NOTES (3 P0 已修) |
| Execution | `docs/superomni/executions/execution-main-retro-mechanize-20260630.md` | ✅ |
| Code review | `docs/superomni/reviews/code-review-main-retro-mechanize-20260630.md` | ✅ APPROVED_WITH_NOTES (P1.1 hardened) |
| QA | `docs/superomni/reviews/qa-main-retro-mechanize-20260630.md` | ✅ LOW risk, 0 bugs, 5 edge cases |
| Evaluation | `docs/superomni/evaluations/evaluation-main-retro-mechanize-20260630.md` | ✅ APPROVED, 13/13 AC |
| Release | `docs/superomni/releases/release-main-retro-mechanize-20260630.md` | ✅ 本文件 |

### 内容变更摘要

机械化锁死 code-drift-fix (20260629) sprint 回顾里的 3 条 Next Sprint 待办（第 4 条保持 advisory Non-Goal）：

1. **G1 — test:contract**：新增 `lib/test-contract.js`（仿 `test-generators.js`，3 测 positive/negative/allowlist-exempt，R1 marker-drift 守卫 + P1.1 SIGKILL crash-residue 守卫 + try/finally 自清理）+ `package.json` `test:contract` script。把 Section 3 的 dir→produces 覆盖检查从"QA 经验性测试"升级为可回归的自动化测试。
2. **G2 — Section 4 对称 produces→dir advisory**：`lib/check-workflow-contract.js` 加 Section 4——对每个 `produces:` 声明，若其目录磁盘不存在，发 **warning**（不报 error、不改 exit code）。把 Section 3 单方向（dir→produces）补成双向。当前预期 2 条 advisory（harness-audits + production-readiness，因 setup.js 只在 target-project gitignore bootstrap，源仓库缺它们是合法）。
3. **G3 — 0-steps advisory**：`lib/check-plan-content.js` 加 `console.warn`——post-cutoff plan 解析 0 steps 时提示"Pre-Destructive Gate 可能 silent no-op"。这是上 sprint 抓到的最危险陷阱（plan 格式错位让 gate 假生效但不报错）。advisory only，不改 exit code。

第 4 项（mechanize forbidden-token-as-drifted-expression 进 check-skill-docs.js）保持 advisory Non-Goal——语义复杂、误报风险高。

### 最终 Diff（3 modified + 1 new）

| Status | File |
|--------|------|
| M | lib/check-plan-content.js |
| M | lib/check-workflow-contract.js |
| M | package.json |
| NEW | lib/test-contract.js |

### Version / Tag / Deploy
- **无版本 bump**（文档 + dev-time CI 检查任务，非代码发布；package.json 仍 v0.6.11）
- **无 git tag**（无语义版本变更）
- **无部署**（无运行时代码；CI 检查脚本 + 测试随下次 commit 生效）
- 代码零运行时变更：`git diff HEAD -- lib/ package.json` 仅含 dev-time CI 脚本 + 测试

### CI Gate Evidence
- `node lib/test-contract.js` → exit 0（4/4 PASS：A positive / B negative×2 / C allowlist-exempt；含 R1 + P1.1 守卫）
- `node lib/check-workflow-contract.js` → exit 0（Section 4: "checked 13 produces, 2 missing disk dirs (advisory)" + REFLECT gate 满足）
- `node lib/check-plan-content.js` → exit 0（G3 对 2 个 Milestone 风格 plan 发 advisory——正确行为）
- `node lib/check-skill-docs.js` → exit 0（回归）
- 独立 evaluator（planner-reviewer evaluation mode）裁决 APPROVED，13/13 acceptance criteria 满足

### Rollback Plan
3 处改动 additive 且独立，按 milestone 可独立回滚：

| Change | Rollback command |
|--------|------------------|
| G1 (test-contract.js + package.json) | `git checkout -- package.json && rm lib/test-contract.js` |
| G2 (contract §4) | `git checkout -- lib/check-workflow-contract.js` |
| G3 (plan-content 0-steps) | `git checkout -- lib/check-plan-content.js` |

核选项：`git checkout HEAD -- lib/check-plan-content.js lib/check-workflow-contract.js package.json && rm lib/test-contract.js`。advisory-only 设计意味着部分回滚也安全（无跨依赖）。

### Deployment Evidence
- 无部署（dev-time CI 检查 + 测试，随 git commit 生效）
- 独立 evaluator + QA + code-review 三重验证通过

---

## Retrospective

### What went well

1. **plan-review engineering mode 抓到 3 个 P0**：strategy + engineering 双模式 review 亲自复核代码，抓到 3 个 plan 缺陷——(a) R1 marker-drift 守卫只在散文承诺、代码块缺失（照代码块执行会 ship 假 PASS test harness）；(b) M4 负向测试 temp plan 文件名 `...-NEG-TEST.md` 被 extractDate exempt（作者误读自己的正则，日期埋在文件名中间不在 .md 后缀）；(c) M3/M4 期望"无新 warning"与实际矛盾（2 个 Milestone 风格 plan 解析 0 steps 会触发 advisory）。这 3 个都是 plan-vs-code 一致性问题，正是 review 的价值。
2. **G3 advisory 正确自我诊断**：G3 落地后，check-plan-content.js 对 feishu-doc-align + retro-mechanize（本 plan 自身）发 advisory——因为这俩 plan 用 `### Milestone N` 非 `### Step N:`，Pre-Destructive Gate 对它们确实是 no-op。advisory 正确提示了这个事实。G3 闭环验证了它自己在检测 silent-no-op。
3. **code-review + QA 闭环 P1**：code-review 标 P1.1（Test C SIGKILL 窗口的 dirty-state 残留），立即加 top-of-Test-C 守卫（断言源文件 DECLARATION_ALLOWLIST 为空）；QA 经验性测 5 个边界（含 pre-existing TEST_DIR 残留→Test A 正确大声失败），0 bug。
4. **独立 evaluator APPROVED**：自跑 9 条验证 + 自建负向测试，13/13 AC 满足，无 spec-implementation drift。

### Slowdowns / Friction

1. **execSync 成功时丢弃 stderr（plan 未预见）**：负向测试用 `execSync(stdio:"pipe")` 捕获输出，但 `console.warn` 写 stderr，execSync 成功时只返回 stdout → 负向测试初判 FAIL（warning 未在 out 里）。根因：Node execSync 的 stderr 语义。修复：命令加 `2>&1` 合并 stderr 到 stdout。这是 plan 没预见的——execSync 的 stderr 丢弃行为。教训：用 execSync 捕获 stderr 输出（如 console.warn/console.error）时，exit-0 路径须显式 `2>&1`。
2. **Edit 工具在 Windows 再次引入 CRLF（recurring）**：上 sprint 已踩过，本 sprint 又中招——check-plan-content.js + package.json 被 Edit 写成 CRLF（HEAD 是 LF）。用 node 脚本归一化回 LF。这是 **recurring friction**——Edit 工具在 Windows 默认写 CRLF，每次编辑 .gitattributes-pinned LF 文件后须验行尾。
3. **REFLECT gate 顺序耦合（recurring）**：写完 evaluation 后、写 release 前，contract check 临时退出 1（"has evaluation but missing release"）。上 sprint 同样踩过。这是契约的正确行为（evaluation 须跟 release），但 release artifact 必须在本阶段写完才回绿。
4. **plan-reviewer planning mode 初稿 3 个 P0**：planning mode 产出的 plan 初稿有 3 个 code-vs-prose / plan-vs-repo 一致性问题。planning mode 倾向于"散文承诺但不入代码块" + "断言 repo 状态但未实证"。须 Phase 5 自审 + plan-review engineering mode 实证复核才能抓到。

### Process Improvements

1. **execSync stderr 捕获规范**：用 execSync 捕获被测脚本 stderr 输出时，须在 exit-0 路径用 `2>&1`（或 `stdio:"pipe"` + 读 `err.stderr` 仅对 exit≠0 有效）。建议在 test-contract.js / test-generators.js 的注释里说明这个 gotcha。
2. **Edit 工具 CRLF 防护**：项目 `.gitattributes` pin LF，但 Edit 工具在 Windows 写 CRLF。建议 executing-plans 的 step verification 加一条"编辑 .gitattributes-pinned 文件后用 node 字节检查确认 LF"，或给 check-skill-docs 的 CRLF advisory 扩展到 .tmpl 源文件 + lib/ 脚本（目前只查 generated .md）。
3. **plan-review engineering mode 实证复核须强制**：planning mode 初稿易出 code-vs-prose / plan-vs-repo 一致性问题。plan-review 的 engineering mode 亲自跑命令实证是抓这些问题的关键——上 sprint + 本 sprint 都靠它救场。应保持 engineering mode 的"实证复核"强度，不降级为纯阅读。

### Tacit Gap Mining

- **隐藏假设：execSync 成功返回 = 完整输出**。实际上 execSync 成功时只返回 stdout，stderr 被丢弃。测试若断言 stderr 内容（如 console.warn），exit-0 路径会假阴性。这是 Node child_process 的 tacit 语义，新贡献者写测试易踩。
- **隐藏假设：plan 文件名日期位置**。extractDate 正则要求文件名以 `-<8digits>.md` 结尾，日期埋在中间（如 `...-20260630-NEG-TEST.md`）会被 exempt。这是 linter 的 tacit 解析假设，plan 作者易误判。
- **Milestone 风格 plan 的 linter 兼容性**：`### Milestone N` 不是 linter 接受的 step 头（仅 `### Step N:` 是）。G3 advisory 现在能检测到这点，但根因是 plan 模板（writing-plans SKILL.md 用 `### Step N:`）与某些 plan 的实际写法（`### Milestone N`）不一致。

### Next Sprint

- **array-produces 守卫**（QA E3b，pre-existing latent）：Section 3+4 的 `.startsWith`/`.replace` 假设 produces 是字符串；未来 skill 用 `produces: [a,b]`（YAML 数组）会崩。加 `typeof p.pattern === "string"` 守卫。
- **Test D for Section 4 advisory**：注入一个无磁盘目录的 produces 声明，断言 warning + exit 0。关闭 implicit-coverage gap。
- **P1.2 case-fold**：Section 4 `subdirs.includes(dir)` 在大小写不敏感 FS 上 case-sensitive（latent；当前无 mismatch）。
- **codify 0-steps 负向测试进 test-contract.js**：把本 sprint 的临时 `lib/_neg-test.js`（已删）逻辑并入 test-contract.js 作为第 5 测。
- **迁移 2 个 Milestone 风格 plan 到 `### Step N:`**：让 G3 advisory 对 feishu-doc-align + retro-mechanize 静默（它们确实是 no-op，但迁移后 gate 真正生效）。或 broaden parsePlan 接受 `### (Step|Milestone) N:`。
- **mechanize forbidden-token-as-drifted-expression**（保持 advisory，未来探索）：语义复杂、误报风险高。

---

**Status: DONE** — retro-mechanize 全流程完成（THINK→PLAN→REVIEW→BUILD→VERIFY→RELEASE 六阶段闭环），release artifact 含 ## Release + ## Retrospective 两段。code-drift-fix sprint 回顾的 3 条 Next Sprint 待办机械化锁死完成，第 4 条保持 advisory。
