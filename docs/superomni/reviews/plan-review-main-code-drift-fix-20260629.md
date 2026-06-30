# Plan Review — code-drift-fix + Process Improvements

- **Plan**: `docs/superomni/plans/plan-main-code-drift-fix-20260629.md`
- **Spec**: `docs/superomni/specs/spec-main-code-drift-fix-20260629.md`
- **Date**: 2026-06-29
- **Phases completed**: 1 (Strategy), 2 (Design — skipped, 纯文档+CI 脚本无 UI), 3 (Engineering)

---

## STRATEGY REVIEW

| 维度 | 结论 |
|------|------|
| Premises | **EXPLICIT** — 3 条全部亲自复核：(a) retros/ 是 v0.5.8 废弃遗留（git ls-files 仅 .gitkeep；SKILL-DATA-FLOW.md:33；CHANGELOG:448），harness-audits/ 是生活路径（harness-engineering/SKILL.md:12 produces:）✓；(b) docs/AGENTS.md 确无 mirror 注释（grep 0 命中）✓；(c) 3 条 Process Improvements 确未编码（repo-wide grep 仅命中本 session 的 plan/spec）✓ |
| Scope | **RIGHT-SIZED** — 5 milestone，~45min，每个可独立 rollback。YAGNI 显式（不动 audit-repo-invariants / 不改 retrospective 措辞 / 不动 'retro' back-compat parse） |
| Alternatives | **CONSIDERED** — spec Key Design Decisions 表 6 行 + 用户拍板 3 项（全面落地 / SKILL-DATA-FLOW 权威源 / allowlist 豁免）均忠实继承 |
| DRY | **REUSES** — 无既有 dir-vs-frontmatter 覆盖检查（check-workflow-contract.js §1 做 produces/consumes linkage、§2 做 artifact presence，均非 dir 覆盖；audit-repo-invariants 是 grep-only）。§3 填补真实空白 |
| Risks (top 3) | ① C: 盘近满（<100MB），node entrypoint 仍写 %TEMP%，gen-skill-docs writeFileSync 可能中途 ENOSPC 截断 .md（P0-D）② DESIGN.md:91 同类漂移在 guard 范围外（P1，已加 M2.2 修复）③ allowlist 仅覆盖废弃目录，新 bootstrap 目录须先声明 produces:（P1，已加 workflow note） |
| Strategy mode | **HOLD SCOPE** — scope 正确，不扩不缩；2 处文档收紧 + 1 处 anchor 修正打入 plan |

---

## ENGINEERING REVIEW — 逐条复核（含主审亲自复核代码）

**决定性问题：Section 3 guard 首次运行会通过吗？**
**YES**——前提 M1 在 M4 前删除 retros/（plan 正确排序，allowlist 为空正是因为 retros/ 已删）。亲自从 `skills/*/SKILL.md` frontmatter 读出 produces: 与磁盘 10 个顶层子目录逐一映射：

| 磁盘子目录 | 覆盖它的 produces: | Skill |
|---|---|---|
| evaluations/ | evaluations/evaluation-*.md | verification |
| executions/ | executions/execution-*.md | executing-plans |
| improvements/ | improvements/improvement-*.md | self-improvement |
| plans/ | plans/plan-*.md | writing-plans |
| releases/ | releases/release-*.md | release |
| reviews/ | reviews/review-*.md | code-review + plan-review |
| specs/ | specs/spec-*.md | brainstorm + office-hours |
| style-profiles/ | style-profiles/<scope>.md | style-capture |
| subagents/ | subagents/subagent-*.md | subagent-development |
| retros/ | 无——M1 删除前不存在，M4 运行时已删 | (v0.5.8 废弃) |

**未覆盖目录：0**（M1 后）。注：harness-audits/ 与 production-readness/ 被 produces: 声明但磁盘不存在，fs.readdirSync 看不到，不会触发失败。`startsWith(prefix)` 逻辑对所有 produces 模式形状正确（含非模板的 style-profiles/<scope>.md）。

**复核确认（file:line 证据）：**
- `allProducePatterns` 在插入点 in-scope，entries 为 `{skill, pattern}`（check-workflow-contract.js:127）✓
- `errors[]` in-scope，流入 `totalErrors`（:274）→ `process.exit(1)`（:282）✓
- `docsRoot = docs/superomni`（:9）✓
- `gen-skill-docs.js` scoped 形式（argv[2] 单文件）只重新生成该 skill（:91,98-104），覆盖 .md（:77）✓
- `check-skill-docs.js:126` 强制 .md↔.tmpl 一致，失败 exit 1（:136）✓
- 指针文本无 `{{PREAMBLE*}}` token，generator 透传不改写 ✓
- Pre-Destructive Gate：`node lib/check-plan-content.js` → exit 0，"1 destructive step(s), all preceded by 'careful' step" ✓；Step 1.1 body 含 `careful`，Step 1.2 How 含 `git rm`（纯文本行，非 fence 非反引号）✓
- 基线：`check-workflow-contract.js` / `check-skill-docs.js` / `check-plan-content.js` 均 exit 0 ✓

---

## P0 STRUCTURAL ISSUES（阻断执行）

无 P0 阻断。Section 3 guard 首次运行通过（produces:→dir 映射完整，0 未覆盖）；Pre-Destructive Gate 真正生效（非 no-op）；基线全绿。

---

## P1 RECOMMENDATIONS（执行前修，已全部打入 plan）

### P1-A — M4 插入 anchor 行号错误（描述错，代码块正确）
plan 初稿说"insert between line 241 and line 257"。亲自复核：line 241 仅是 evaluations 循环 close；improvements 循环运行 243-255，line 255 才是 close。在 241 插入会把 §3 放在 improvements 循环前，破坏 errors[] 累积顺序与 console 顺序。**修订**：anchor 改为"improvements-loop close (line 255) 与 summary console.log (line 257) 之间"。代码块本身无需改。✅ 已打入 plan Step 4.1。

### P1-B — plan/spec 目录枚举不完整（不影响 guard 正确性，仅认知模型）
plan/spec 枚举顶层子目录时漏了 style-profiles/（确被 style-capture produces: 覆盖），并列入了 production-readiness/ + harness-audits/（声明但磁盘不存在）。guard 用 fs.readdirSync（磁盘真相），所以 style-profiles/ 在范围内、另两个不在。无需 action，执行者知晓即可。

### P1-C — Overview net-effect 措辞过强
初稿"the exact drift class becomes mechanically impossible"对 docs/superomni/ 子目录为真，但 docs/DESIGN.md:91 同类漂移在 guard 范围外。**修订**：Overview 加 caveat 限定范围；并新增 M2.2 修复 DESIGN.md:91（boil-the-lake，P2）。✅ 已打入 plan。

### P1-D — allowlist 仅覆盖废弃目录，新 bootstrap 目录无 escape
DECLARATION_ALLOWLIST 注释只提"retired-but-kept"。新 artifact 类型 mid-bootstrap 会 hard-fail 且无文档化逃生路径。**修订**：M4 Notes 加 bootstrap workflow 约定"新 artifact 类型须先声明 produces: 再建磁盘目录"。✅ 已打入 plan。

### P0-D（提升为 P0 风险登记项）— C: 盘近满
原仅作"Environment constraint"注。提升为 P0-D：node 仍写 %TEMP%（C:），gen-skill-docs writeFileSync 可能中途 ENOSPC 截断 .md。**修订**：M3 前清理 C: 空间或重定向 TEMP/npm cache 到 D:；node 写失败按 P0-D 处理而非代码 bug。✅ 已打入 plan 风险登记。

---

## ACCEPTANCE CRITERIA COVERAGE
spec 三组 acceptance criteria（漂移修复 / 权威源+指针 / 可执行防护）全部映射到 plan milestone，无孤儿。新增 M2.2 覆盖 DESIGN.md:91 漂移（spec 未显式列但属同类，P2 boil-the-lake）。

---

## Decision Audit Trail

| # | Phase | Decision | Type | Principle | Rationale |
|---|-------|----------|------|-----------|-----------|
| 1 | Strategy | HOLD SCOPE（4 处补丁打入 plan） | M | P6 | scope 正确，问题是执行质量 + anchor + 同类漂移 |
| 2 | Eng | §3 anchor 241→255（improvements close） | M | P5 | 代码是真相，errors[] 累积顺序不可破 |
| 3 | Eng | 新增 M2.2 修 DESIGN.md:91 | M | P2 | 同类漂移在 blast radius 内，1 行成本 |
| 4 | Eng | allowlist 加 bootstrap workflow note | M | P5 | 让 guard 的工作流契约完整 |
| 5 | Strategy | C: 盘风险提升 P0-D | M | P1 | 最高频失败模式，须显式登记 |
| 6 | Strategy | Overview net-effect 加 caveat | T | P5 | 措辞须与可衡量成功标准一致 |

---

## TASTE DECISIONS — AUTO-RESOLVED

1. **DESIGN.md:91 处理方式**：选"加 v0.5.8 retirement 注释"而非"删除整行" — P5 — rationale: 它是 Decision-5 历史决策日志，删行丢失历史；注释既修正事实又保留决策痕迹。
2. **M2.2 是否纳入本 session**：选"纳入"而非"留给未来 session" — P2 — rationale: 同类漂移、1 行成本、在 blast radius 内；boil-the-lake 优于留尾巴。
3. **P0-D 缓解强度**：选"清理 C: / 重定向 TEMP"而非"假设 node entrypoint 免疫" — P1 — rationale: <100MB 不足以假设免疫，gen-skill-docs 截断 .md 会级联破坏 check-skill-docs。

---

```
PLAN REVIEW COMPLETE
════════════════════════════════════════
Phases completed:     1, 2 (skipped), 3
Issues found:         0 P0 + 4 P1 + 1 P0-D(提升)
Decisions made:       6 mechanical, 3 taste — all auto-resolved
Plan status:          APPROVED_WITH_NOTES

Revisions applied (已打入 plan):
  - P1-A: M4 §3 anchor 241→255（improvements-loop close）
  - P1-C: Overview net-effect 加范围 caveat + 新增 M2.2 修 DESIGN.md:91
  - P1-D: M4 Notes 加 allowlist bootstrap workflow 约定
  - P0-D: C: 盘近满提升为风险登记项，附缓解步骤
  - 同步: M5 diff 列表加 docs/DESIGN.md（8 modified + 1 deleted）；rollback 表 M2 含 DESIGN.md；Success Criteria 加 DESIGN.md 项

Taste decisions auto-resolved:
  - DESIGN.md:91 加 retirement 注释（非删除）— 保留历史决策痕迹
  - M2.2 纳入本 session（非留尾巴）— boil-the-lake
  - P0-D 清理 C:/重定向 TEMP（非假设免疫）— 防级联截断

Status: DONE
════════════════════════════════════════
```

关键执行提示（给 executing-plans）：
- **M4 anchor 已修正为 line 255**（improvements-loop close），不要用 241。
- **M1 必须在 M4 前**完成（allowlist 为空正是因 retros/ 已删；顺序倒置会让 guard 在 M4 误报 retros/）。
- **M3 前先处理 P0-D**（清理 C: 或重定向 TEMP），否则 gen-skill-docs writeFileSync 可能 ENOSPC 截断 .md。
- **M3 只编辑 .tmpl**，用 scoped `node lib/gen-skill-docs.js <tmpl-path>` 重新生成对应 .md，勿手编 .md。
