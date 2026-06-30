# Plan Review — 飞书文档重组重写计划

- **Plan**: `docs/superomni/plans/plan-main-feishu-doc-align-20260629.md`
- **Spec**: `docs/superomni/specs/spec-main-feishu-doc-align-20260629.md`
- **Date**: 2026-06-29
- **Phases completed**: 1 (Strategy), 2 (Design — skipped, 纯文档无 UI), 3 (Engineering)

---

## STRATEGY REVIEW

| 维度 | 结论 |
|------|------|
| Premises | 部分 implicit — "原 doc 已在 spec 阶段 fetch"未持久化到文件；"9 facts 完整"是假设 |
| Scope | RIGHT-SIZED — 6 milestone 合理 |
| Alternatives | overwrite vs segment-replace 已论证（结构重组须 overwrite）✓ |
| DRY | 复用 spec 三幕结构 / 9-fact 表 / 对比表 ✓；9-fact checklist 重复 3 处可接受 |
| Risks (top 3) | ① 定量声明 stale（信任 spec 数字未重算）② title 失败无 remedy ③ "9 facts"当穷尽 |
| Strategy mode | **HOLD SCOPE** — scope 正确，3 个执行质量补丁须打入 M1/M4/M6 |

---

## ENGINEERING REVIEW — 9-FACT 逐条复核（含主审亲自复核代码）

| # | Plan 声称 | 代码真相（亲自复核） | 结论 |
|---|----------|---------------------|------|
| 1 | 5 agent 无 test-writer | `agents/` = 5 文件，无 test-writer | ✅ 正确 |
| 2 | preamble.md(135)+core(15)+ref(127) 无 soft | `wc -l` 精确 135/15/127，无 preamble-soft.md | ✅ 正确 |
| 3 | 6255 行 / 平均 223 | 重算 `find skills -name SKILL.md \| xargs wc -l` = 6255 / 28 = 223.4 | ✅ 正确 |
| 4 | launcher.js + session-start.sh 无 dual | hooks/ = launcher.js + session-start.sh + hooks.json | ✅ 正确 |
| 5 | gen-skill-docs 三版本 无 build-skills | gen-skill-docs.{js,sh,ps1} 是当前渲染器；**但 `bin/build-skills` 存在（legacy）** | ⚠️ P1-2 |
| 6 | workflow 引用 9 非 11 | "9" = vibe SKILL.md 内 workflow 引用数；口径须文档内说明 | ⚠️ P1-3 |
| 7 | 全入库 无 gitignore 规则 | .gitignore 仅 node_modules/.DS_Store/Thumbs.db | ✅ 正确 |
| 8 | 仅 CLAUDE.md 无 AGENTS.md | 根目录无 AGENTS.md ✓；**但 `docs/AGENTS.md` 存在（v0.6.11 agent 库参考）** | ❌ P0-2 过校正 |
| 9 | retros/ 非 harness-audits/ | **反转**：harness-audits/ 是代码声明的生活路径；retros/ v0.5.8 已废弃 | ❌ P0-1 反转 |

---

## P0 STRUCTURAL ISSUES（阻断执行）

### P0-1 — Fact 9 反转：会发布新错误

**证据（亲自复核）：**
- `skills/harness-engineering/SKILL.md:12` `produces: "docs/superomni/harness-audits/..."`
- `lib/setup.js:328` bootstrap `docs/superomni/harness-audits/`
- `CLAUDE.md:102` `| Harness audits | docs/superomni/harness-audits/ | ... |`
- `CHANGELOG.md:448` "removed deprecated `retros/` row... standalone retro files deprecated in v0.5.8; retrospective content now lives inside release artifacts"
- 磁盘：`docs/superomni/harness-audits/` 目录不存在（setup.js 声明但未提交 .gitkeep）；`docs/superomni/retros/` 存在但是废弃遗留

**真相：**
- harness-engineering 产物路径 = `harness-audits/`（代码声明的生活路径）
- retrospective 内容 = **并入 `releases/release-*.md`**（v0.5.8 起无独立 retros/ 目录）

**spec 错误根因：** spec 阶段只看到磁盘有 `retros/` 就认定它是真相，未查 harness-engineering 的 `produces:` 字段和 CHANGELOG。这是 spec 阶段事实核实疏漏，plan-review 救场。

**修订：** Fact 9 改为"harness-engineering 产物 = `harness-audits/`；retrospective 内容并入 `releases/release-*.md`（无独立 retros/ 目录）"。原文档若用 `harness-audits/` 则本就正确，无需改；若用 `retros/` 才需改。

### P0-2 — Fact 8 过校正：docs/AGENTS.md 存在

**证据（亲自复核）：**
- `docs/AGENTS.md` 存在，header "superomni Agent Library"，"Last updated: v0.6.11"
- `README.md:234,374,390` 多处链接 `docs/AGENTS.md` 为 agent 库参考
- 根目录无 AGENTS.md（项目配置镜像断言确实错）

**修订：** Fact 8 改为"项目配置 = 仅 `CLAUDE.md`；`docs/AGENTS.md` 是 agent 库参考文档（非配置镜像）"。forbidden token 从 `AGENTS.md` 改为 `AGENTS.md 镜像`（允许命名 docs/AGENTS.md）。

---

## P1 RECOMMENDATIONS（执行前修，非阻断）

### P1-1 — M4 rollback 前提未验证
"原 doc 已在 spec 阶段 fetch 备份"——但 spec 文件不含原文 body。修订：M4 前先 fetch 原文存到 `docs/superomni/specs/feishu-original-DEDGwbF4EiFKMtk9Ikscg3HDnae-20260629.md` 作为回滚备份，或降级 rollback 声明为"仅能重发新内容，恢复原文须先持久化"。

### P1-2 — Fact 5：bin/build-skills 存在
`bin/build-skills` 是 legacy 渲染器（用 `{{PREAMBLE}}` token），`gen-skill-docs.{js,sh,ps1}` 是当前渲染器（wired into package.json `gen-skills*`）。M1 step 3 "NO build-skills" 会失败。修订：M1 step 3 改为"gen-skill-docs 是当前渲染器，build-skills 是 legacy（仍在磁盘但已 supersede）；文档描述 gen-skill-docs"。文档 body 的 forbidden token `build-skills` 保留（文档不该命名 legacy 脚本）。`byte-identical` 软化——若文档参考层描述渲染器一致性，"byte-identical" 是合法属性词，禁用 drifted 表述而非词本身。

### P1-3 — Fact 6：workflow 引用 9 口径不明
"9" = `skills/vibe/SKILL.md` 内 workflow 引用数（亲自复核 `grep -c workflow skills/vibe/SKILL.md` = 9）。修订：M1 pin 口径并在文档内说明"workflow skill 在 vibe SKILL.md 中被引用 9 处"；M5 grep `11 处` 而非裸 `11`。

### P1-4 — forbidden-token 收紧
裸 `11`/`AGENTS.md`/`harness-audits` 有合法用途，改为 drifted 表述：`11 处`/`AGENTS.md 镜像`/（harness-audits 视 P0-1 修订后可能合法）。

---

## ACCEPTANCE CRITERIA COVERAGE
完整无孤儿；但 9 facts 中 3 个（5/8/9）mis-grounded，须修订内容。

## THREE-ACT 结构完整性
忠实从 spec 承接到 plan，结构 sound。

---

## Decision Audit Trail

| # | Phase | Decision | Type | Principle | Rationale |
|---|-------|----------|------|-----------|-----------|
| 1 | Strategy | HOLD SCOPE（3 补丁打入 M1/M4/M6） | M | P6 | scope 正确，问题是执行质量 |
| 2 | Eng | Fact 9 反转，按代码声明用 harness-audits/ | M | P5 | 代码是真相，文档描述现状 |
| 3 | Eng | Fact 8 改为"配置仅 CLAUDE.md + docs/AGENTS.md 是参考" | M | P1 | 完整覆盖，不过校正 |
| 4 | Eng | M4 前先持久化原文 fetch 作为 rollback 备份 | T | P5 | 让 rollback 前提可验证 |
| 5 | Eng | build-skills legacy 但保留 body forbidden | M | P5 | 文档不命名 legacy 脚本 |

---

## TASTE DECISIONS — AUTO-RESOLVED

1. **rollback 备份方式**：选"M4 前先 fetch 原文存文件"而非"降级声明" — P5 — rationale: 让 rollback 前提可验证，比声明降级更安全，成本仅一次 fetch。
2. **byte-identical 处理**：选"禁用 drifted 表述而非词本身" — P1 — rationale: 词本身是合法属性，文档参考层可能正当使用。
3. **workflow 口径**：选"vibe SKILL.md 内引用数"并在文档说明 — P5 — rationale: 可复现，读者能验证。

---

```
PLAN REVIEW COMPLETE
════════════════════════════════════════
Phases completed:     1, 2 (skipped), 3
Issues found:         2 P0 + 4 P1
Decisions made:       5 mechanical, 3 taste — all auto-resolved
Plan status:          NEEDS_REVISION

P0 (阻断, 须修订后才能 M4):
  1. Fact 9 反转 — harness-audits/ 是代码生活路径, retros/ 已废弃
  2. Fact 8 过校正 — docs/AGENTS.md 存在且是 agent 库参考

Revisions required (spec + plan 同步):
  - Fact 9: 改为 harness-audits/ + retrospective 并入 releases/
  - Fact 8: 改为配置仅 CLAUDE.md + docs/AGENTS.md 是参考
  - M4 前持久化原文 fetch 作为 rollback 备份
  - Fact 5/6 + forbidden-token 收紧 (P1)

Status: NEEDS_REVISION — 修订 spec + plan 后重新过 review gate
════════════════════════════════════════
```
