# 代码漂移修复 + Process Improvements 落地 — Spec

## Problem

feishu-doc-align (20260629) vibe 流程的 release 产物 `docs/superomni/releases/release-main-feishu-doc-align-20260629.md` 在 Next Sprint 区遗留了两项未完成的代码侧修复，retrospective 区提出了 3 条 Process Improvements。本 spec 完成这些遗留项。

**残留漂移（亲自复核）：**
1. `docs/superomni/retros/.gitkeep` 是废弃空目录的残留。`retros/` 自 v0.5.8 起废弃（内容并入 `releases/release-*.md`），代码声明的生活路径是 `docs/superomni/harness-audits/`（`harness-engineering/SKILL.md:12` `produces:`、`lib/setup.js:328`、`CLAUDE.md:102`、`lib/frontmatter-map.json:73` 一致指向）。磁盘上 `retros/` 仅剩一个 `.gitkeep`，是历史遗留垃圾，但它的存在让"声明优先于磁盘"约定在新贡献者眼里不成立。
2. `docs/AGENTS.md` 是 v0.6.11 agent 库参考文档，但缺少一行注释说明它"是 agent 库参考、非 CLAUDE.md 配置镜像"。feishu-doc-align 流程中 spec 阶段正是因此误判为"配置镜像漂移"（plan-review P0-2 救场）。缺这一行注释 = 漂移会复发。

**3 条 Process Improvements（retrospective 提出，未落地）：**
- **声明优先于磁盘**：涉及"代码里有什么"的断言，必须同时查 (a) 磁盘存在性 (b) frontmatter `produces:`/`consumes:` 声明 (c) CHANGELOG 废弃记录；三者不一致时以代码声明为准。
- **定量声明当场 pin 口径**：任何"N 处/X 个"断言，必须当场写明 grep 命令与口径。
- **forbidden-token 用 drifted 表述**：文档对齐任务的 forbidden 列表，禁"错误表述"（如"AGENTS.md 镜像"）而非"裸词"（如"AGENTS.md"），避免误伤合法引用。

这三条目前只写在 release retrospective 里，没有进入任何 skill 行为规范或可执行检查，因此下次同类任务会复发。

## Goals

- **G1 — 删除废弃遗留**：移除 `docs/superomni/retros/.gitkeep` 及空目录，让磁盘与"retrospective 并入 release 产物"的代码声明自洽。
- **G2 — 消除 AGENTS.md 镜像歧义**：在 `docs/AGENTS.md` 头部加一行注释，明确"本文件是 agent 库参考文档，非 CLAUDE.md 配置镜像"，防止未来再次被误判为镜像漂移。
- **G3 — 集中权威源**：把 3 条 Process Improvements 作为"产物路径与文档对齐约定"集中写入 `docs/SKILL-DATA-FLOW.md`（已记录 v0.5.8 retros 废弃，是产物路径权威文档），并在 `brainstorm` + `plan-review` SKILL.md 各加一行指针指向它。单一权威源 + 指针，DRY。
- **G4 — 可执行防护**：在 `lib/check-workflow-contract.js` 新增一条结构性断言——`docs/superomni/` 下每个磁盘子目录必须能被至少一个 skill 的 `produces:` 声明覆盖，否则报 drift；对已废弃遗留目录（如 `retros/`）维护显式 allowlist 豁免。把"声明优先"从文档约定升级为 CI 可执行检查。

## Non-Goals (YAGNI)

- **不**改动 `bin/audit-repo-invariants`——它是 grep 模式发现工具（find files referencing a pattern），不是结构不变量执行器；新增 dir-vs-frontmatter 断言与它的职责不匹配。它已正确 `--exclude-dir=retros`（line 56）。
- **不**重写 `release`/`self-improvement`/`verification`/`vibe` SKILL.md 里的 `retrospective` 措辞——它们用的是"retrospective"（正确词）而非 `retros/` 目录，无漂移。
- **不**清理 `lib/check-workflow-contract.js:48-49` 的 `'retro'` 向后兼容解析——它是有意保留的（解析历史 release/retro 文件），且有注释说明。
- **不**改动 feishu 文档本身——那是上一轮 vibe 的交付物，本任务只动代码侧 + 约定文档。
- **不**引入新 skill / 新 agent。
- **不**追求把 3 条 Process Improvements 分散写进每个 skill 的完整正文——集中权威源 + 指针即可（用户已拍板）。

## Proposed Solution

**最小自洽 + 权威源 + 可执行防护** 三件套，逐项落地：

### Step 1 — 删除废弃遗留目录
- `git rm docs/superomni/retros/.gitkeep`，删除空目录 `docs/superomni/retros/`。
- 复核 `git grep -n "retros/"` 确认无 living code 引用 `retros/` 作为产物路径（只有 audit-trail 历史文档和 `audit-repo-invariants` 的 exclude 列表提及，均合法）。

### Step 2 — docs/AGENTS.md 加镜像歧义注释
- 在 `docs/AGENTS.md` 标题下方、"Last updated" 上方加一行 blockquote：
  > **Note:** This file is the agent library reference, **not** a mirror of `CLAUDE.md`. `CLAUDE.md` is the sole project configuration; this document describes the available sub-agents.

### Step 3 — docs/SKILL-DATA-FLOW.md 集中权威源
- 在 `docs/SKILL-DATA-FLOW.md` 现有 "retros/ was removed in v0.5.8" note（line 33 附近）下方，新增一节 **"Convention: Declaration Precedence & Doc-Alignment Discipline"**，集中写入 3 条约定：
  1. **Declaration precedence**：产物路径以 skill frontmatter `produces:` 声明为准；磁盘目录可能是废弃遗留或未 bootstrap。涉及"代码里有什么"的断言须查三源（磁盘 / `produces:` / CHANGELOG），不一致以代码声明为准。
  2. **Quantitative claims pin scope**：任何"N 处/X 个"断言须当场写明 grep 命令与口径（如"workflow skill 在 vibe SKILL.md 中被引用 9 处 = `grep -c workflow skills/vibe/SKILL.md`"）。
  3. **Forbidden-token = drifted expression**：文档对齐任务的 forbidden 列表禁"错误表述"而非"裸词"（禁"AGENTS.md 镜像"而非"AGENTS.md"；禁"build-skills byte-identical 漂移表述"而非"build-skills"），避免误伤合法引用。

### Step 4 — brainstorm + plan-review SKILL.md 加指针
- `skills/brainstorm/SKILL.md`：在 Iron Law / 事实核实相关位置加一行指针 → "For doc-alignment & declaration-precedence discipline, see `docs/SKILL-DATA-FLOW.md` Convention section."
- `skills/plan-review/SKILL.md`：在 forbidden-token / 事实复核相关位置加一行指针 → 同上。
- 指针不复制正文，只引用权威源（DRY）。

### Step 5 — lib/check-workflow-contract.js 新增 Section 3 结构性断言
- 在 Section 2 之后新增 **Section 3: directory-vs-produces coverage**：
  - 遍历 `docs/superomni/` 下所有子目录（仅顶层子目录，如 `specs/`、`plans/`、`retros/`…）。
  - 对每个子目录，检查是否存在至少一个 skill 的 `produces:` 声明路径以该子目录名开头。
  - 未被任何 `produces:` 覆盖的子目录 → 报 drift error，**除非**在显式 allowlist 中。
  - allowlist 初始为空（因为 Step 1 已删 `retros/`）。若未来出现合法遗留目录，须显式加入 allowlist 并附注释说明废弃版本。
- 输出格式与现有 Section 一致（`errors[]` / `warnings[]`，计入 `totalErrors`，非零退出）。
- 同步在 `package.json` 确认 `check:workflow-contract` script 已覆盖（无需新增 npm script，复用现有）。

### Step 6 — 验证
- `node lib/check-workflow-contract.js` 通过（含新断言）。
- `git grep -n "retros/"` 仅剩 audit-trail 历史文档 + `audit-repo-invariants` exclude 列表（合法）。
- `docs/AGENTS.md` 含镜像歧义注释。
- `docs/SKILL-DATA-FLOW.md` 含 Convention 三条。
- `brainstorm` + `plan-review` SKILL.md 含指针。

## Key Design Decisions

| Decision | Choice | Rationale | Principle Applied |
|----------|--------|-----------|-------------------|
| 漂移目录处理 | `git rm` 删除 `retros/.gitkeep` | v0.5.8 已废弃，代码声明生活路径是 harness-audits/；空目录是纯垃圾 | 声明优先于磁盘 |
| AGENTS.md 镜像歧义 | 加 blockquote 注释 | 一行注释消除复发性误判，成本最低 | 显式优于巧妙 |
| 3 条约定落地位置 | 集中 docs/SKILL-DATA-FLOW.md + 两处指针 | 单一权威源，新贡献者一处看全；DRY | DRY |
| 可执行检查位置 | lib/check-workflow-contract.js Section 3 | 它已解析所有 skill produces: + 遍历 docs/superomni/，是结构性断言的天然归属；audit-repo-invariants 是 grep 工具不匹配 | 完整性（复用既有解析） |
| 废弃遗留豁免 | 显式 allowlist（初始空） | 严格但不误伤；新未声明目录被拦，旧遗留被显式记录 | 显式优于巧妙 |
| 不动 audit-repo-invariants | 保持现状 | 它职责是模式发现，已正确 exclude retros/；改它 = 职责越界 | YAGNI |

## Acceptance Criteria

**漂移修复**
- [ ] `docs/superomni/retros/` 目录及其 `.gitkeep` 已从仓库删除（`git ls-files docs/superomni/retros/` 为空）
- [ ] `git grep -n "retros/"` 输出中无 living code 把 `retros/` 当作产物路径（仅 audit-trail 历史文档 + `audit-repo-invariants` exclude 列表，合法）
- [ ] `docs/AGENTS.md` 标题区含一行注释明确"agent 库参考、非 CLAUDE.md 配置镜像"

**权威源 + 指针**
- [ ] `docs/SKILL-DATA-FLOW.md` 含 "Convention" 节，集中写入 3 条（声明优先 / 定量 pin / forbidden drifted）
- [ ] `skills/brainstorm/SKILL.md` 含指向 SKILL-DATA-FLOW Convention 节的指针
- [ ] `skills/plan-review/SKILL.md` 含同样指针
- [ ] 指针是引用而非复制（正文只在 SKILL-DATA-FLOW.md）

**可执行防护**
- [ ] `lib/check-workflow-contract.js` 新增 Section 3：遍历 docs/superomni/ 顶层子目录，断言每个被某 skill `produces:` 覆盖，否则 error（allowlist 豁免）
- [ ] allowlist 显式可见且初始为空（retros/ 已删，无需豁免）
- [ ] `node lib/check-workflow-contract.js` 退出码 0，输出含 "passed"
- [ ] 临时构造一个未声明子目录能触发 error（验证断言有效，验证后删除）

**回归**
- [ ] `git diff HEAD --name-only` 仅含本任务预期文件（AGENTS.md / SKILL-DATA-FLOW.md / brainstorm SKILL.md / plan-review SKILL.md / check-workflow-contract.js / 删除 retros/.gitkeep），无意外改动
- [ ] 现有 `npm run check:workflow-contract`（若存在）保持通过

## Open Questions

无。所有 TASTE 决策已由用户拍板：
- 修复范围 = 全面落地 3 条
- 约定落地位置 = SKILL-DATA-FLOW 为权威源 + 指针
- 防护脚本严格度 = allowlist 豁免
