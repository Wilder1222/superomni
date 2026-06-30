# Plan — 飞书文档《superomni 围绕 Agent 的研发工作流实践》重组重写

- **Spec**: `docs/superomni/specs/spec-main-feishu-doc-align-20260629.md`
- **Task type**: DOCUMENT REWRITE (Feishu wiki), not code
- **Target doc_id**: `DEDGwbF4EiFKMtk9Ikscg3HDnae`
- **New title**: 《superomni：围绕 Agent 的研发工作流实践——What / Why / How》
- **Delivery**: Feishu MCP `update-doc` with `mode: overwrite`
- **Date**: 2026-06-29
- **Branch**: main

---

## P0 Risks (explicit up front)

| Risk | Mitigation |
|------|------------|
| `overwrite` is destructive — clears the original doc body | Content is fully deterministic from the spec + this plan. **Original re-fetched and persisted to `docs/superomni/specs/feishu-original-DEDGwbF4EiFKMtk9Ikscg3HDnae-20260629.md` BEFORE overwrite (M4)**. Rollback = re-issue `overwrite` with corrected markdown (idempotent) OR restore original from persisted file. |
| One of the 9 facts is mis-transcribed during authoring | 9-fact checklist is inlined into Milestone 2 as acceptance sub-items; authoring happens against the checklist, not from memory. |
| Feishu markdown rendering differs from local preview | Verification milestone re-fetches the doc and grep-checks each of the 9 facts on the *server-returned* content, not the local file. |
| Title not updated (overwrite may or may not change title) | M4 sets the title via update-doc; if unchanged, note DONE_WITH_CONCERNS with manual-edit hint (no confirmed rename API). |
| **plan-review P0-1: Fact 9 反转风险**（spec 初稿误把 retros/ 当真相） | 已修正：Fact 9 改为 harness-audits/ 是代码生活路径，retrospective 并入 release。M1 step 6 重新核实 produces 字段；M5 验证 retros/ 不作为生活目录出现。 |
| **plan-review P0-2: Fact 8 过校正风险**（docs/AGENTS.md 实际存在） | 已修正：Fact 8 改为"配置仅 CLAUDE.md + docs/AGENTS.md 是参考"；forbidden token 从 AGENTS.md 裸词改为"AGENTS.md 镜像"表述。 |
| **plan-review P1: 定量声明 stale** | M1 step 7 重新从代码派生 6255/223/9，不信任 spec 数字。 |

---

## Milestones

### Milestone 1 — Scaffold authoring workspace & re-confirm facts
**What**: Create a local working file `docs/superomni/plans/feishu-body-feishu-doc-align-20260629.md` to hold the authored markdown body. Re-confirm the 9 hard facts against code so authoring starts from verified ground truth.

**Files / targets**:
- Create: `docs/superomni/plans/feishu-body-feishu-doc-align-20260629.md` (empty header only)
- Read (verification): `agents/*.md` (count = 5), `skills/` (count = 28), `lib/preamble*.md`, `lib/gen-skill-docs.*`, `hooks/launcher.js`, `hooks/session-start.sh`, `.gitignore`, `CLAUDE.md`, `docs/AGENTS.md` (agent library ref), `skills/harness-engineering/SKILL.md` (produces path)

**How**:
1. Verify counts: `ls agents/ | wc -l` == 5; `ls skills/ | wc -l` == 28.
2. Verify preamble files exist: `preamble.md`, `preamble-core.md`, `preamble-ref.md` (NO `preamble-soft.md`). `wc -l` = 135/15/127.
3. Verify renderer: `lib/gen-skill-docs.{js,sh,ps1}` exist and wired into `package.json` `gen-skills*` scripts; `bin/build-skills` is LEGACY (still on disk, superseded) — doc describes gen-skill-docs, NOT build-skills.
4. Verify hooks: `hooks/launcher.js` + `hooks/session-start.sh`; NO `session-start.js`.
5. Verify `.gitignore` has no superomni rules; verify NO root `AGENTS.md` (but `docs/AGENTS.md` EXISTS as agent library ref — Fact 8 须区分).
6. Verify harness-engineering produces path = `harness-audits/` (`grep produces: skills/harness-engineering/SKILL.md`); retros/ is DEPRECATED (CHANGELOG v0.5.8) — doc 用 harness-audits/，retrospective 表述为并入 release 产物。
7. **Re-derive quantitative claims**（plan-review P1 风险）: `find skills -name SKILL.md | xargs wc -l | tail -1` must == 6255; avg == 223; `grep -c workflow skills/vibe/SKILL.md` must == 9. If any mismatch, HALT and update spec — do not author against stale numbers.
8. Write the 9-fact correction table to the top of the body file as an authoring reference header (will be stripped before delivery).

**Verification**: The 9 facts in the spec table each have a `ls`/`grep` confirmation, including re-derived quantitative claims (6255/223/9). Record the command outputs as inline comments in the body file header.

**Effort**: S

---

### Milestone 2 — Author the full markdown body (three acts + bookends)
**What**: Author the complete Feishu markdown document body in the local working file, structured per the spec's three-act design. This is the bulk of the work. The 9-fact correction checklist is inlined as authoring sub-items so facts are baked in at write time, not patched after.

**Files / targets**: `docs/superomni/plans/feishu-body-feishu-doc-align-20260629.md`

**How** — author each section in order:

1. **Title line**: `《superomni：围绕 Agent 的研发工作流实践——What / Why / How》`

2. **引子 — 工程化的转向** (精炼保留): 1–2 short paragraphs framing the shift from "argue the model isn't smart enough" → "engineer the R&D process so agents can execute it". Anchor: superomni turns software R&D (think→plan→review→build→verify→release) into an agent-executable pipeline.

3. **第一幕 WHAT —— superomni 是什么**
   - 1.1 一句话定义：围绕 agent 的研发工作流实践框架（not just "harness" — emphasize R&D workflow engineering）
   - 1.2 给谁用：应用工程师 / 框架设计者 / 技术管理者
   - 1.3 装上之后发生什么：`/vibe` 触发 → 检测阶段（扫描 `docs/superomni/` 产物）→ 6 阶段流水线（THINK→PLAN→REVIEW→BUILD→VERIFY→RELEASE）→ 产物入库
   - 1.4 核心优势对比表（裸 agent / 单 prompt vs superomni），≥6 维度：输出确定性 / 跨会话延续 / 判断盲区防护 / 作用域控制 / 失败反馈利用 / 工具选择。Use the table from spec lines 97–104 as the base, ensure ≥6 rows.

4. **第二幕 WHY —— 为什么需要 harness 工程**
   - 2.1 7 个本质痛点（保留精炼）：LLM 内生属性，换更强模型解决不了
   - 2.2 6 大原则（保留）：上下文即一切 / 工具精简 / 持续评估 / 信号驱动 / 简单优于巧妙 / 文档即合约
   - 2.3 核心论断：工程师设计系统，Agent 执行

5. **第三幕 HOW —— 怎么工作**
   - 3.1 端到端走读（一次 sprint）：`/vibe auto "feature"` → brainstorm 出 `spec-main-feature-xxx-20260629.md` → 用户审批（唯一 human gate，THINK 阶段）→ `writing-plans` 出 `plan-main-feature-xxx-20260629.md` → `plan-review`（planner-reviewer mode）→ `executing-plans` 派发 subagent → `code-review` → `qa` → `verification` → `release`（含 retrospective 段，产物 `release-main-feature-xxx-20260629.md`，retrospective 自 v0.5.8 起并入 release 产物）。串联真实文件名。
   - 3.2 9 个解法机制（每个 = 解决哪个痛点 + 怎么落地）：
     ① 6 阶段强制流水线（产物契约表）
     ② 铁律与硬/软规范分层 — **preamble 三文件**：`preamble.md`(135) + `preamble-core.md`(15, 内联) + `preamble-ref.md`(127, 按需)；无 `preamble-soft.md`
     ③ Skills 三段式分层加载
     ④ when_to_use + "不适用"边界声明
     ⑤ **5 个 Agent** 专长分工（planner-reviewer / explorer / frontend-designer / refactoring-agent / doc-writer），mode dispatch 机制；无 test-writer
     ⑥ `docs/superomni/` 永久产物 = 外部记忆 — **全入库 tracked**（`.gitignore` 无 superomni 规则）；harness-engineering 产物路径 = `harness-audits/`（与代码一致）；retrospective 内容 v0.5.8 起并入 `releases/release-*.md`（无独立 retros/ 目录）
     ⑦ self-improvement + harness-engineering 双重反思
     ⑧ Hooks 级 Guardrails — **`launcher.js`**（Node 跨平台入口，spawns bash）+ **`session-start.sh`**（单 bash）；无 "bash+node 双版本" / 无 `session-start.js`
     ⑨ **`CLAUDE.md`** 项目配置（唯一项目配置文件）；`docs/AGENTS.md` 是 agent 库参考文档（非配置镜像，参考层可如实提及）
   - 3.3 维护者参考层（附录）：
     - 目录结构速查（skills/ agents/ lib/ hooks/ docs/superomni/）
     - 渲染机制 — **`gen-skill-docs.{js,.sh,.ps1}`** 三版本，展开 `{{PREAMBLE_CORE}}`/`{{PREAMBLE_REF_LINK}}` 宏生成 SKILL.md；`bin/build-skills` 是 legacy 渲染器（仍存在但已 supersede），文档描述 gen-skill-docs
     - 跨平台 hook 机制（launcher.js → bash 调度）
     - 量化指标：**28 skill / 5 agent / SKILL.md 共 6255 行（平均 223）/ 6 阶段 + 观察期**；workflow skill 在 vibe SKILL.md 中引用 = **9 处**（注明计数口径）

6. **第四幕 局限与演进**（精简保留）：当前局限（含"软规范是 prompt 信仰"，事实校正后）+ 演进方向（短/中/长期）

7. **总结 — 7 个核心洞察**（保留）

**9-fact correction checklist (inline acceptance sub-items)** — each MUST be verifiable in the authored text:
- [ ] Fact 1: "5 agent" + roster of 5; "test-writer" does NOT appear anywhere in the body
- [ ] Fact 2: "preamble.md + preamble-core.md(15) + preamble-ref.md(127)" present; "preamble-soft.md" does NOT appear
- [ ] Fact 3: "6255 行 / 平均 223" present; "7231" and "258" do NOT appear
- [ ] Fact 4: "launcher.js + session-start.sh" present; "双版本等价对照" / "session-start.js" do NOT appear
- [ ] Fact 5: "gen-skill-docs 三版本" present; "build-skills" does NOT appear in body (build-skills is legacy, doc describes gen-skill-docs); "byte-identical" 作为 drifted 表述不出现，但若描述渲染器一致性可保留合法属性词
- [ ] Fact 6: "workflow 引用 9（vibe SKILL.md 内）" present with 口径说明; "11 处" as workflow count does NOT appear
- [ ] Fact 7: "全入库 tracked" + ".gitignore 无 superomni 规则" present; "gitignore 审计类平衡" claim does NOT appear
- [ ] Fact 8: "项目配置仅 CLAUDE.md" present; "AGENTS.md 镜像" / 镜像论表述 do NOT appear; `docs/AGENTS.md` 作为 agent 库参考可如实提及（不禁止 AGENTS.md 裸词）
- [ ] Fact 9: harness-engineering 产物路径 = `harness-audits/`（原文正确保留，不误改）; 补述"retrospective 内容 v0.5.8 起并入 releases/release-*.md，无独立 retros/ 目录"; **不得把 harness-audits/ 改成 retros/**

**How (authoring discipline)**: Write each section then immediately `grep -i` the body file for the *forbidden drifted phrasings* (test-writer, preamble-soft, 7231, 258, session-start.js, build-skills, "11 处", "AGENTS.md 镜像", "双版本等价", "gitignore 审计类平衡"). Any hit = fix before moving to the next section. 注意：`AGENTS.md` 裸词、`harness-audits/`、`byte-identical`、`11` 裸数字 NOT 在 forbidden 列表（有合法用途）。

**Verification**: After full body authored, run a single grep pass for all forbidden drifted phrasings → must return zero hits; run a grep pass for all required-correct tokens → must hit. Three-act headers present (第一幕/第二幕/第三幕). 关键负向检查：`retros/` 不得作为产物目录出现（仅可作为"已废弃"的历史说明）。

**Effort**: L

---

### Milestone 3 — Local structural & acceptance self-review
**What**: A focused self-review pass of the authored body against the spec's Acceptance Criteria (spec lines 122–142) BEFORE any destructive Feishu call. This is the last cheap-correction gate.

**Files / targets**: `docs/superomni/plans/feishu-body-feishu-doc-align-20260629.md` + spec Acceptance Criteria section

**How** — run through each acceptance checkbox:
1. **Structure**: three-act division present; WHAT has comparison table ≥6 dims; HOW has end-to-end sprint walk-through with real artifact filenames; reference layer has dir-quickref / renderer / cross-platform hook / metrics.
2. **Facts (9)**: re-run the forbidden-token + required-token grep pass from Milestone 2.
3. **Quality**: 7 痛点 / 6 原则 / 工程师设计-Agent执行 / 7 洞察 all present; title is the new title; prose frame positions superomni as engineering the R&D process (not just abstract agent constraints).
4. Fix any gap in-place in the body file.

**Verification**: All spec acceptance checkboxes can be checked off against the body file. No forbidden token remains.

**Effort**: S

---

### Milestone 4 — Pre-Destructive Gate (careful) + execute `update-doc overwrite`
**What**: The destructive step. Pause, enumerate blast radius, then issue the single `update-doc` call with `mode: overwrite` against doc_id `DEDGwbF4EiFKMtk9Ikscg3HDnae`. Set the new title.

**Files / MCP targets**: Feishu MCP `update-doc` — params: `{ doc_id: "DEDGwbF4EiFKMtk9Ikscg3HDnae", mode: "overwrite", title: "《superomni：围绕 Agent 的研发工作流实践——What / Why / How》", content: <body from Milestone 2> }`

**How**:
1. **Pre-Destructive Gate** (per writing-plans rule):
   - **Blast radius**: The original doc body of `DEDGwbF4EiFKMtk9Ikscg3HDnae` (current title 《superomni-ude的Harness 实践》) will be fully replaced. Comments / media handled per Resolved Decision #1 (not checked, user accepted).
   - **Rollback backup (plan-review P1-1)**: BEFORE overwrite, re-fetch the original doc via `fetch-doc` and persist to `docs/superomni/specs/feishu-original-DEDGwbF4EiFKMtk9Ikscg3HDnae-20260629.md`. This makes the rollback premise verifiable — original content is on disk, not just "in spec-phase context".
   - **Rollback path**: Intended new content is in `docs/superomni/plans/feishu-body-feishu-doc-align-20260629.md`; original content is in the persisted fetch file. If overwrite produces wrong NEW content → re-issue overwrite with corrected markdown (idempotent). If user wants ORIGINAL back → restore from the persisted fetch file.
   - **Gate decision**: GREEN — content deterministic, original persisted to file, rollback is re-issue or restore. Proceed.
2. Read the final body file, strip the authoring-reference header (the 9-fact table added in Milestone 1) so only the document body remains.
3. Issue `update-doc` with `mode: overwrite`, the new title (《superomni：围绕 Agent 的研发工作流实践——What / Why / How》), and the stripped body.
4. Capture the MCP response (success / error). **Title-failure remedy (plan-review Risk 2)**: if response shows title unchanged, note as DONE_WITH_CONCERNS with manual title-edit hint (Feishu MCP may not support title change via update-doc; no separate rename API confirmed).
5. Strip the rollback-backup fetch file's gitkeep if it would clutter specs/ — actually KEEP it (it's a legitimate rollback artifact, gitignored or not per repo policy).

**Verification**: `update-doc` returns success; doc_id unchanged; new title reflected in response (or title-failure noted); original persisted to file before overwrite.

**Effort**: S

---

### Milestone 5 — Re-fetch & verify the 9 facts on server-returned content
**What**: Testing strategy. Re-fetch the doc from Feishu and verify each of the 9 corrected facts appears in the *server-returned* content (not just the local file), plus structural check that three acts are present.

**Files / MCP targets**: Feishu MCP `get-doc` (or equivalent fetch) on `DEDGwbF4EiFKMtk9Ikscg3HDnae`

**How**:
1. Fetch the doc content from Feishu.
2. **9-fact verification** (grep on returned content):
   - [ ] "5 agent" + 5-name roster present; "test-writer" absent
   - [ ] "preamble-core.md" + "preamble-ref.md" present; "preamble-soft.md" absent
   - [ ] "6255" present; "7231" absent
   - [ ] "223" present; "258" absent
   - [ ] "launcher.js" + "session-start.sh" present; "session-start.js" absent
   - [ ] "gen-skill-docs" present; "build-skills" absent from body (legacy, not named)
   - [ ] workflow count "9" present WITH 口径说明; "11 处" absent
   - [ ] "全入库" / ".gitignore 无 superomni 规则" present; "gitignore 审计类平衡" absent
   - [ ] "项目配置仅 CLAUDE.md" present; "AGENTS.md 镜像"/镜像论 absent; docs/AGENTS.md 可作为 agent 库参考出现（AGENTS.md 裸词不禁）
   - [ ] "harness-audits/" present as harness-engineering 产物路径; "retrospective 并入 release" 补述 present; **"retros/" NOT present as a live artifact dir**（仅可作为废弃历史说明）
3. **Structural check**: 第一幕 / 第二幕 / 第三幕 headers all present; title is the new title.
4. If any check fails → go to Milestone 6 (rollback).

**Verification**: All 9 facts verifiable on server-returned content; three acts present; title correct. Status = DONE. If any fail → DONE_WITH_CONCERNS or BLOCKED per rollback.

**Effort**: S

---

### Milestone 6 — Rollback plan (conditional, only if Milestone 5 fails)
**What**: Recovery path if the overwrite produced wrong content. Executed only if Milestone 5 finds a drift or rendering issue.

**Files / MCP targets**: Feishu MCP `update-doc` overwrite (re-issue) on `DEDGwbF4EiFKMtk9Ikscg3HDnae`

**How**:
1. Identify the specific failing fact / structural gap from Milestone 5 output.
2. Patch the local body file (`feishu-body-feishu-doc-align-20260629.md`) to correct it.
3. Re-run Milestone 3 self-review on the patched body (cheap gate).
4. Re-issue `update-doc overwrite` with the corrected body.
5. Re-run Milestone 5 verification.

**Verification**: Milestone 5 passes after re-issue. Content is deterministic so rollback is bounded to ≤1 iteration in practice.

**Effort**: S (conditional)

---

## Rollback Plan (summary)
Content is fully deterministic from the spec + plan. If `overwrite` produces wrong content, re-issue `overwrite` with corrected markdown from the local body file. The original doc was already fetched during the spec phase; no unrecoverable data loss path exists. Rollback is bounded to re-authoring the local body + one re-issue call.

---

## Testing Strategy (consolidated)
- **Unit-of-correctness**: the 9-fact checklist (forbidden tokens absent + required tokens present), run on both the local body file (M3) and the server-returned content (M5).
- **Structural**: three-act headers present; comparison table ≥6 dims; sprint walk-through with real artifact filenames; reference layer complete.
- **Quality**: 7 痛点 / 6 原则 / 7 洞察 / "工程师设计-Agent执行" philosophy all preserved.
- **Server truth**: verification runs against Feishu-returned content, not local file, so rendering/escaping issues surface.

---

## Out of Scope (per spec Non-Goals + Resolved Decision #2)
- Code-internal drift in `harness-engineering` skill frontmatter (`harness-audits/` vs `retros/`) — user handles separately. **Document uses `harness-audits/` throughout (code's live path); retrospective content described as merged into release artifacts.**
- test-writer / AGENTS.md / preamble-soft.md are NOT added "as planned" — they simply do not appear.
- No code changes; no new framework design; this is a document rewrite only.

---

## Status
- [ ] M1 Scaffold workspace & re-confirm facts
- [ ] M2 Author full markdown body (three acts + bookends)
- [ ] M3 Local structural & acceptance self-review
- [ ] M4 Pre-Destructive Gate + execute update-doc overwrite
- [ ] M5 Re-fetch & verify 9 facts on server content
- [ ] M6 Rollback (conditional)
