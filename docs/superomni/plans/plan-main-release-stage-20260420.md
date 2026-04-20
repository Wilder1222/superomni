# Implementation Plan: RELEASE Stage & Risk Fixes

## Overview

将 vibe 流水线末尾的 SHIP + REFLECT 两阶段合并为单一 RELEASE 阶段，并行产出发布证据和回顾内容。同时修复4个已知运行时风险：Windows stat 兼容性、RELEASE artifact 软跳过、spec 无审批标记、preamble token 浪费。

## Prerequisites

- [ ] `docs/superomni/specs/spec-main-release-stage-20260420.md` 已存在且已审批 ✓
- [ ] `skills/ship/SKILL.md.tmpl` 和 `skills/self-improvement/SKILL.md.tmpl` 已读取 ✓
- [ ] `skills/vibe/SKILL.md.tmpl` 已读取 ✓
- [ ] `lib/preamble.md` (221行) 已读取 ✓
- [ ] `hooks/session-start` 已读取 ✓

---

## Steps

### Step 1: 新建 RELEASE skill
**What:** 创建 `skills/release/SKILL.md.tmpl`，并行执行发布和回顾逻辑，产出合并 artifact  
**Files:** `skills/release/SKILL.md.tmpl` (新建)  
**How:**
  1. 创建目录 `skills/release/`
  2. 写入 `SKILL.md.tmpl`，包含：
     - frontmatter（name: release, description, allowed-tools）
     - `{{PREAMBLE}}` 占位符
     - **Section A: Release** — 复用 `ship` skill 的版本检查、changelog、tag、publish 逻辑
     - **Section B: Retrospective** — 复用 `self-improvement` 的 tacit gap mining + phase 1-4 逻辑
     - **合并 artifact 输出**：`docs/superomni/releases/release-[branch]-[session]-[date].md`
       - `## Release` section（版本、tag、changelog 摘要、发布链接）
       - `## Retrospective` section（改进项、工作模式分析、下次建议）
**Verification:** 文件存在，包含 `{{PREAMBLE}}`、`## Release`、`## Retrospective`  
**Estimated effort:** M

---

### Step 2: 更新 `lib/preamble.md` — 流水线定义 + token 优化
**What:** (a) 将流水线从7阶段改为6阶段，(b) 压缩 preamble 至 ≤150 行  
**Files:** `lib/preamble.md`  
**How:**
  1. 找到所有 `SHIP -> REFLECT` 引用，替换为 `RELEASE`
  2. 更新 Auto-Advance Rule 表格：移除 SHIP 和 REFLECT 行，新增 RELEASE 行
  3. 压缩 bash 代码块 — 将纯模板噪声替换为伪代码注释：
     - `2>/dev/null || echo "default"` 类型的 fallback 改为注释说明
     - `mkdir -p ... && date +%s` 启动代码块改为单行伪代码
     - 保留所有逻辑规则表格（不压缩）
  4. 目标：≤150 行（当前221行，压缩目标 ~70 行）
**Verification:** `wc -l lib/preamble.md` 输出 ≤150；grep `RELEASE` 有结果；grep `SHIP` 无旧引用  
**Estimated effort:** M

---

### Step 3: 修复风险1 — `_session_files()` Windows 兼容性
**What:** 替换 `skills/vibe/SKILL.md.tmpl` 中使用 `stat` 的 `_session_files()` 函数  
**Files:** `skills/vibe/SKILL.md.tmpl`  
**How:**
  1. 定位函数（约第48-57行）
  2. 替换为基于 `find -newer` 的实现：
     ```bash
     _session_files() {
       local pattern="$1"
       # Create a reference file with session-start mtime
       local _ref
       _ref=$(mktemp 2>/dev/null || echo "/tmp/_omni_ref_$$")
       # touch with session timestamp (cross-platform: Git Bash / Linux / macOS)
       if command -v touch >/dev/null 2>&1; then
         touch -d "@${_SESSION_TS}" "$_ref" 2>/dev/null || \
         touch -t "$(date -d "@${_SESSION_TS}" +%Y%m%d%H%M.%S 2>/dev/null || \
                     date -r "${_SESSION_TS}" +%Y%m%d%H%M.%S 2>/dev/null)" "$_ref" 2>/dev/null || \
         touch "$_ref"  # fallback: use current time (conservative)
       fi
       # Find files newer than reference
       local dir
       for dir in docs/superomni; do
         [ -d "$dir" ] || continue
         find "$dir" -name "$(basename $pattern)" -newer "$_ref" 2>/dev/null
       done
       rm -f "$_ref" 2>/dev/null
     }
     ```
  3. 注意：pattern 参数需要适配 `find` 的 `-name` glob（`spec-*.md` → `-name "spec-*.md"`）
     因此调用处也需同步调整：用目录+文件名分开传参，或改为扫描特定子目录
  4. 更简洁方案：直接用 `find docs/superomni/specs -name "spec-*.md" -newer "$_ref"` 替代 `_session_files "docs/superomni/specs/spec-*.md"`
     — 将6处 `_session_files` 调用展开为6个 `find` 语句，消除函数依赖
**Verification:** 在 Git Bash on Windows 执行该代码段不报 `stat: illegal option` 错误  
**Estimated effort:** S

---

### Step 4: 修复风险3 — spec 审批标记
**What:** (a) `skills/brainstorm/SKILL.md.tmpl` 审批后写标记文件；(b) `skills/vibe/SKILL.md.tmpl` 检测标记  
**Files:** `skills/brainstorm/SKILL.md.tmpl`, `skills/vibe/SKILL.md.tmpl`  
**How:**
  1. **brainstorm**: 在 Phase 6 Human Gate 审批通过后，添加：
     ```bash
     # Write approval marker
     _SPEC_BASE=$(basename "$_SPEC_FILE" .md)
     touch "docs/superomni/specs/.approved-${_SPEC_BASE}"
     ```
  2. **vibe**: 在阶段检测的变量声明区（`_HAS_*` 块）中添加：
     ```bash
     _HAS_SPEC_APPROVAL=$(ls docs/superomni/specs/.approved-spec-* 2>/dev/null | head -1)
     ```
  3. **vibe**: 在 Stage Detection Matrix 中，Priority 2 条件改为：
     - 旧：`spec-*.md` exists, no `plan-*.md`
     - 新：`spec-*.md` exists AND `.approved-spec-*` exists, no `plan-*.md`
     - 若 `_HAS_SPEC` 有值但 `_HAS_SPEC_APPROVAL` 为空 → 仍判定 THINK（等待审批）
**Verification:** 新建 spec 不创建 `.approved-*` 时，`/vibe` 检测结果为 THINK；创建标记后检测为 PLAN  
**Estimated effort:** S

---

### Step 5: 更新 `skills/vibe/SKILL.md.tmpl` — RELEASE 阶段整合
**What:** 更新 Stage Detection Matrix、artifact 检测变量、`_verify_stage_artifact()`、Artifact Contract  
**Files:** `skills/vibe/SKILL.md.tmpl`  
**How:**
  1. **变量声明区**：
     - 移除 `_HAS_PROD_READINESS` 和 `_HAS_IMPROVEMENTS`
     - 新增 `_HAS_RELEASE=$(find docs/superomni/releases -name "release-*.md" ... | head -1)`
  2. **Cross-session fallback 区**：同步更新 `ls` 扫描列表，将 improvements/production-readiness 替换为 releases
  3. **Stage Detection Matrix**：
     - 删除 Priority 6 (SHIP) 和 Priority 7 (REFLECT)
     - 新增 Priority 6: `Verified` → RELEASE → `release` skill
  4. **`_verify_stage_artifact()`**：
     - 删除 `SHIP` 和 `REFLECT` case
     - 新增 `RELEASE) [ -n "$_HAS_RELEASE" ] ;;`  （移除 `|| true`）
  5. **Stage Artifact Contract 表格**：
     - 删除 SHIP 和 REFLECT 行
     - 新增 RELEASE 行：`docs/superomni/releases/release-[branch]-[session]-[date].md`
  6. **Auto-Advance Rule 描述**：更新流水线字符串从 `SHIP -> REFLECT` 为 `RELEASE`
**Verification:** SKILL.md.tmpl 中无 `SHIP` 或 `REFLECT` 旧引用；`_verify_stage_artifact` 无 `|| true`  
**Estimated effort:** S

---

### Step 6: 更新 `CLAUDE.md` — 流水线引用
**What:** 更新 CLAUDE.md 中所有 SHIP/REFLECT 阶段引用  
**Files:** `CLAUDE.md`  
**How:**
  1. 找到 Auto-Advance Rule 引用的流水线字符串（`THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> SHIP -> REFLECT`）
  2. 替换为 `THINK -> PLAN -> REVIEW -> BUILD -> VERIFY -> RELEASE`
  3. 检查 Skills 表格中的 `ship` 和 `self-improvement`/`retro` 条目是否需要更新描述
  4. 在 Document Output Convention 表格中：新增 `releases/` 目录行，标记 `release-[branch]-[session]-[date].md`
**Verification:** `grep -n "SHIP\|REFLECT" CLAUDE.md` 无旧流水线引用  
**Estimated effort:** S

---

### Step 7: 注册 release command
**What:** 在 `commands/` 和 `claude-skill.json` 中注册 `/release` 命令  
**Files:** `commands/release.md` (新建), `claude-skill.json`  
**How:**
  1. 创建 `commands/release.md`，参考 `commands/ship.md` 结构
  2. 在 `claude-skill.json` 的 commands 数组中添加 `{"name": "release", "file": "commands/release.md"}`
  3. 在 `claude-skill.json` 的 skills 数组中添加 release skill 条目
**Verification:** `cat claude-skill.json | grep release` 有结果  
**Estimated effort:** S

---

### Step 8: 重编译所有 SKILL.md
**What:** 运行 `bin/build-skills` 将 preamble 变更注入所有 skill 编译产物  
**Files:** 所有 `skills/*/SKILL.md`（编译产物）  
**How:**
  1. `bash bin/build-skills`
  2. 验证几个关键 skill 的 SKILL.md 已更新（检查 `RELEASE` 出现在 vibe/SKILL.md）
  3. 验证 preamble 行数：找一个 SKILL.md，计算 preamble 区块行数
**Verification:** `bash bin/build-skills` 无错误；`grep -c "RELEASE" skills/vibe/SKILL.md` ≥ 1  
**Estimated effort:** S

---

### Step 9: 更新版本号
**What:** 将 `package.json` 中版本从 0.5.6 → 0.5.7（minor feature）  
**Files:** `package.json`  
**How:**
  1. `grep version package.json` 确认当前版本
  2. 手动更新版本字符串
  3. 同步更新 `hooks/session-start` 第77行的版本字符串 `superomni v0.5.6` → `superomni v0.5.7`
**Verification:** `grep version package.json` 显示 0.5.7  
**Estimated effort:** S

---

## Testing Strategy

- **Manual verification:** 在新 session 中运行 `/vibe`，确认到达 VERIFY 后路由到 RELEASE 而非 SHIP
- **Windows 兼容验证:** 在 Git Bash 执行 `_session_files` 替换后的代码，无 `stat` 错误
- **标记文件验证:** 删除 `.approved-spec-*` 后运行 `/vibe`，确认停在 THINK
- **Artifact 强制验证:** 删除 release artifact，确认 `_verify_stage_artifact("RELEASE")` 返回非0

## Rollback Plan

所有修改在 git 中可追踪。如有问题：
```bash
git diff HEAD  # 查看变更
git checkout -- lib/preamble.md  # 回滚单个文件
```

## Dependencies

- `bin/build-skills` 必须在所有 `.md.tmpl` 修改完成后最后执行（Step 8）
- Step 3、4、5 均修改 `skills/vibe/SKILL.md.tmpl`，按顺序执行避免冲突

## Success Criteria

- [ ] `/vibe` 在 VERIFY 之后只路由到 RELEASE，不出现 SHIP 或 REFLECT
- [ ] RELEASE artifact 包含 `## Release` 和 `## Retrospective` 两个 section
- [ ] Git Bash on Windows 执行 `_session_files` 等价逻辑不报 `stat` 错误
- [ ] `_verify_stage_artifact("RELEASE")` 在缺少 release 文件时阻止自动推进
- [ ] spec 未审批时 `/vibe` 停在 THINK，不跳 PLAN
- [ ] `lib/preamble.md` 行数 ≤150
- [ ] `bin/build-skills` 无错误，所有 SKILL.md 更新
- [ ] `package.json` 版本 = 0.5.7
