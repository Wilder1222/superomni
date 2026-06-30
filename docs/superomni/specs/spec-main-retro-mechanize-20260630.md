# 回顾教训机械化锁死 — Spec

## Problem

code-drift-fix (20260629) sprint 的 release 回顾记录了 4 条 Next Sprint 待办，都是"回顾发现的问题未机械化锁死，会复发"。本 sprint 把其中 3 条可机械化的锁死，第 4 条保持 advisory。

**待办（已亲自复核当前代码状态）：**

1. **check-workflow-contract.js 无自动化测试（pre-existing gap）**：上轮 QA 用"突变磁盘状态 + 观察 exit code + 清理"经验性测了 Section 3 的 5 个边界（negative un-declared dir、allowlist-exempt、positive clean tree、null-produces、loose-file），但这些测试没有固化——下次改 contract 脚本时无法回归。`package.json` 有 `test:generators`（lib/test-generators.js）但无 `test:contract`。

2. **Section 3 只查 dir→produces（单方向）**：`lib/check-workflow-contract.js:257-278` 检查"磁盘子目录须被 produces: 覆盖"，但不反向检查"produces: 声明的目录是否在磁盘存在"。亲自复核：当前有 2 个 skill 声明了 produces 路径但源仓库磁盘无该目录——`harness-engineering`→`harness-audits/`、`production-readiness`→`production-readiness/`。这是合法状态（`setup.js:325,328` 只在 target-project gitignore 里声明这俩目录，源仓库未必产过该类型产物），所以对称检查须 advisory 不能 error。

3. **Pre-Destructive Gate 静默 no-op 陷阱（回顾最危险项）**：`lib/check-plan-content.js` 对 plan 格式有隐式要求（`### Step N:` 带冒号、`**How:**` 独占行、destructive 模式在纯文本行）。格式错位时 linter 报"0 destructive steps"——看起来 PASS 实则 gate 完全失效。上轮 sprint 的 plan 初稿就踩了这个坑（`#### Step` + 内联 `**How:**` + `git rm` 在反引号里），直到逐字段 debug 才发现。linter 当前对"0 steps"完全沉默，无任何提示。

4. **forbidden-token-as-drifted-expression 机械化**（回顾标记较难自动化）：Convention 第 3 条目前是 advisory 文档约定。机械化需在 `check-skill-docs.js` 识别 doc-alignment plan 的 forbidden-token 列表并判断"裸词 vs drifted 表述"——语义复杂、误报风险高。本 sprint **保持 advisory**，仅记录为未来探索。

## Goals

- **G1 — test:contract 锁定 Section 3 路径**：新增 `lib/test-contract.js` + `package.json` 的 `test:contract` script，固化上轮 QA 的 Section 3 经验测试（negative un-declared dir → exit 1、allowlist-exempt → exit 0、positive clean tree → exit 0）。测试须自清理（建临时目录、断言、rmdir），不污染工作树。
- **G2 — 对称 produces→dir advisory 检查**：在 `lib/check-workflow-contract.js` 加 Section 4（或并入 Section 3）——对每个 skill 的 produces: 声明路径，若其目录在磁盘不存在，发 **warning**（不报 error、不改 exit code），提示"declared produces path <X> has no corresponding disk dir (may be setup-bootstrapped in target projects, not a source-repo artifact)"。
- **G3 — plan-content 0-steps 警告**：在 `lib/check-plan-content.js` 加防护——扫描某 post-cutoff plan 得 0 steps 时，发 **warning**（不报 error、不改 exit code），提示"parsed 0 steps from <plan> — plan format may not match the linter's expected `### Step N:` structure; Pre-Destructive Gate may be a silent no-op on this plan"。

## Non-Goals (YAGNI)

- **不**机械化 forbidden-token-as-drifted-expression（第 4 项）——语义复杂、误报风险高，保持 advisory。仅在 release 回顾记录"已评估，保持 advisory"。
- **不**让对称 produces→dir 检查报 error——源仓库 legitimately 缺 setup-bootstrapped 目录，error 会破 CI。
- **不**让 plan-content 0-steps 报 error——可能有合法的无 step 的 plan（如纯叙述 plan），error 误伤风险。
- **不**测 check-workflow-contract.js 的 Section 1（produces/consumes linkage）或 Section 2（artifact presence）——上轮 QA 只经验性测了 Section 3，本 sprint 聚焦锁定已验证路径，不扩大 fixture 范围（用户拍板）。
- **不**改 Section 3 现有行为——只新增 Section 4 + test + plan-content 防护，不重构既有逻辑。
- **不**给 test:contract 接入 CI workflow（如 GitHub Actions）——只加 npm script，CI 接入是独立决策。

## Proposed Solution

三处独立改动，可并行：

### Step 1 — lib/test-contract.js + test:contract npm script
新建 `lib/test-contract.js`（仿 `lib/test-generators.js` 的自包含 node 脚本风格），用子进程跑 `node lib/check-workflow-contract.js` 并断言 exit code：
- **Test A (positive clean tree)**：当前工作树 → 期望 exit 0。
- **Test B (negative un-declared dir)**：`mkdir docs/superomni/__contract_test__/` → 期望 exit 1 + stderr 含 `__contract_test__` → `rmdir`。
- **Test C (allowlist-exempt)**：临时把 `DECLARATION_ALLOWLIST` 改为 `["__contract_test__"]` + `mkdir` 该目录 → 期望 exit 0 → 还原 allowlist + rmdir。（注：改 allowlist 须改源文件再还原，用 try/finally 保证还原。）
- 自清理：所有临时目录/文件改动在 finally 里还原，结束时 `git status` 不留痕。
- 输出：每测打印 PASS/FAIL + 总计；任一失败 exit 1。
- `package.json` 加 `"test:contract": "node lib/test-contract.js"`（紧跟 `test:generators` 之后，保持脚本区顺序）。

### Step 2 — lib/check-workflow-contract.js Section 4（对称 produces→dir advisory）
在 Section 3 之后加 Section 4：
- 遍历 `allProducePatterns`，对每个 `p.pattern` 用正则提取 `docs/superomni/<dir>/` 的 `<dir>` 段。
- 若该 `<dir>` 不在磁盘 `subdirs`（Section 3 已读出）中 → `warnings.push("declared produces path <p.pattern> (skill <p.skill>) has no corresponding disk dir docs/superomni/<dir>/ — may be setup-bootstrapped in target projects, not a source-repo artifact")`。
- **只 push 到 warnings，不 push 到 errors**——不改 exit code。
- 加 `console.log` 汇总："Section 4: checked N produces declarations, M missing disk dirs (advisory)."
- 当前预期：2 个 warning（harness-audits、production-readiness），exit 仍 0。

### Step 3 — lib/check-plan-content.js 0-steps 警告
在 `parsePlan` 返回后、destructive 检测前，加：
- 若 `steps.length === 0` 且该 plan 非 exempt（post-cutoff）→ `console.warn("[advisory] <plan>: parsed 0 steps — plan format may not match the linter's expected \`### Step N:\` structure; Pre-Destructive Gate may be a silent no-op on this plan. Verify the step headers use \`### Step N:\` (3 hashes, colon) and \`**How:**\` on its own line.")`。
- **只 warn，不 push 到 failures、不改 exit code**。
- 不影响现有 13 个 plan（它们都 parse 出 steps）；只在未来格式错位的 plan 上触发。

### Step 4 — 验证
- `node lib/test-contract.js` → 3 测全 PASS。
- `node lib/check-workflow-contract.js` → exit 0，输出含 "Section 4: ... 2 missing disk dirs (advisory)"，warnings 区含 harness-audits + production-readiness。
- `node lib/check-plan-content.js` → exit 0，无新增 warning（现有 plan 都有 steps）。
- 临时构造一个格式错位的 plan（`#### Step 1:` 4 hashes）放进 plans/ → 确认触发 0-steps warning → 删除。
- `git diff HEAD --name-only` → 仅 `lib/test-contract.js`（新）、`lib/check-workflow-contract.js`、`lib/check-plan-content.js`、`package.json`。

## Key Design Decisions

| Decision | Choice | Rationale | Principle Applied |
|----------|--------|-----------|-------------------|
| 对称检查严格度 | advisory warning（不 error） | 源仓库 legitimately 缺 setup-bootstrapped 目录；error 破 CI | 显式优于巧妙（warning 文字说明合法原因）|
| test:contract 范围 | 只测 Section 3 | 上轮 QA 已验证路径；最小可靠，不造多余 fixture | YAGNI |
| 0-steps 防护强度 | warning（不 error） | 可能有合法无 step plan；error 误伤；warning 提示足够 | 偏向行动（提示不阻断）|
| 第 4 项 forbidden-token | 保持 advisory | 语义复杂、误报风险高 | YAGNI |
| test 自清理 | try/finally + git status 验证 | 测试不能污染工作树 | 完整性 |
| Section 4 并入 vs 独立 | 独立 Section 4 | 与 Section 3（dir→produces）对称命名，可读 | 显式优于巧妙 |

## Acceptance Criteria

**G1 — test:contract**
- [ ] `lib/test-contract.js` 存在，含 3 测（positive / negative / allowlist-exempt）
- [ ] `package.json` 有 `"test:contract": "node lib/test-contract.js"`
- [ ] `node lib/test-contract.js` → 3 测全 PASS，exit 0
- [ ] 测试运行后 `git status --short` 无残留临时目录/文件（自清理验证）

**G2 — 对称 produces→dir advisory**
- [ ] `lib/check-workflow-contract.js` 有 Section 4（对称 produces→dir 检查）
- [ ] 对磁盘缺失的 produces 目录只 push warning，不 push error
- [ ] `node lib/check-workflow-contract.js` → exit 0，warnings 含 harness-audits + production-readiness 两条
- [ ] 输出含 "Section 4: ... advisory" 汇总行

**G3 — plan-content 0-steps 警告**
- [ ] `lib/check-plan-content.js` 对 post-cutoff 且 0-steps 的 plan 发 warning
- [ ] warning 只提示不报 error、不改 exit code
- [ ] `node lib/check-plan-content.js` → exit 0，现有 13 plan 不触发新 warning
- [ ] 临时格式错位 plan 能触发 warning（验证后删除）

**回归**
- [ ] `git diff HEAD --name-only` 仅含 `lib/test-contract.js`（新）+ `lib/check-workflow-contract.js` + `lib/check-plan-content.js` + `package.json`
- [ ] `node lib/check-workflow-contract.js` + `check-skill-docs.js` + `check-plan-content.js` + `test-contract.js` 全 exit 0

## Open Questions

无。所有 TASTE 决策已由用户拍板：
- 对称检查 = advisory warning
- test:contract = 只测 Section 3
- 0-steps 防护 = warning 不报错
- 第 4 项 forbidden-token = 保持 advisory（Non-Goal）
