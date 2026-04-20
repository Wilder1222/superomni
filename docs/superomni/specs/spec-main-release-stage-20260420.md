# RELEASE Stage & Risk Fixes — Spec

## Problem

当前流水线有两个独立的末尾阶段：SHIP（发布操作）和 REFLECT（回顾改进）。这导致：
1. 用户必须经历两个独立的 auto-advance 步骤才能结束一个 sprint
2. 两个阶段的 artifact 分散在不同目录，无法在单一文档中查看"发布了什么 + 学到了什么"
3. 调查发现5个运行时风险（Windows 兼容性、软跳过、无审批标记、竞态、token 浪费）影响流水线可靠性

## Goals

- [ ] 将 SHIP + REFLECT 合并为单一 **RELEASE** 阶段，并行产出发布证据和回顾内容
- [ ] RELEASE artifact 包含两个 section：`## Release` 和 `## Retrospective`，可直接归档或分享
- [ ] 修复 `stat` Windows 兼容性问题（风险1）
- [ ] 消除 SHIP artifact 软跳过 `|| true`（风险2）
- [ ] 添加 spec 审批文件标记防止绕过 THINK 关口（风险3）
- [ ] 优化 preamble 内联方式减少 token 浪费（风险5）
- [ ] 竞态问题（风险4）推迟，本次不修复

## Non-Goals (YAGNI)

- 不重新设计 artifact 存储结构
- 不修改 THINK/PLAN/REVIEW/BUILD/VERIFY 阶段
- 不修复 session 文件并发写入竞态（风险4，已确认推迟）
- 不改变现有 skills 的对外接口

## Proposed Solution

### 1. RELEASE 阶段合并

将流水线最后两个阶段合并：

```
旧：VERIFY → SHIP → REFLECT
新：VERIFY → RELEASE
```

**RELEASE 阶段行为：**
- 并行执行 `ship` skill 和 `self-improvement`（`retro` scope）
- 产出单一 artifact：`docs/superomni/releases/release-[branch]-[session]-[date].md`
- Artifact 结构：
  ```markdown
  # Release: [session]
  ## Release
  [发布操作、changelog、部署证据]
  ## Retrospective
  [改进项、工作模式反思、下次建议]
  ```
- CLAUDE.md 和 `lib/preamble.md` 中的流水线定义统一更新为 7 阶段 → 6 阶段

**Stage Detection Matrix 更新：**

| Priority | Condition | Stage | Skill |
|----------|-----------|-------|-------|
| 6 | Verified | RELEASE | `ship` + `self-improvement`（`retro` scope，并行） |

### 2. 风险修复

**风险1 — `stat` Windows 兼容性**

在 `_session_files()` 中替换 `stat` 调用，改用 `find -newer` 方式：

```bash
# 旧方式（不兼容 Windows native）
stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null

# 新方式（Git Bash / Linux / macOS 三平台兼容）
_tmp_ref=$(mktemp)
touch -t $(date -d @$_SESSION_TS +%Y%m%d%H%M.%S 2>/dev/null || \
           date -r $_SESSION_TS +%Y%m%d%H%M.%S 2>/dev/null) "$_tmp_ref"
find docs/superomni -name "*.md" -newer "$_tmp_ref"
rm -f "$_tmp_ref"
```

**风险2 — SHIP artifact 软跳过**

移除 `_verify_stage_artifact()` 中的 `|| true`，改为：
- RELEASE 阶段要求 `docs/superomni/releases/release-*.md` 存在
- 若缺失则报 `DONE_WITH_CONCERNS`，不自动推进

**风险3 — 无 spec 审批文件标记**

spec 审批后写入标记文件：
```bash
touch "docs/superomni/specs/.approved-$(basename $SPEC_FILE .md)"
```

阶段检测中 THINK → PLAN 跳转前，验证标记文件存在：
```bash
_HAS_SPEC_APPROVAL=$(ls docs/superomni/specs/.approved-spec-* 2>/dev/null | head -1)
```

若 `_HAS_SPEC` 存在但 `_HAS_SPEC_APPROVAL` 不存在 → 阶段仍判定为 THINK（等待审批）

**风险5 — Preamble token 优化**

将 preamble 中的 bash 代码块改为伪代码/注释风格，减少 ~40% token：
- 保留所有逻辑描述和协议规则
- 移除可执行 bash 的冗余语法（`$()`, `2>/dev/null`, `|| echo "default"` 等模板噪声）
- 目标：preamble 从 221 行压缩至 ≤150 行

## Key Design Decisions

| Decision | Choice | Rationale | Principle Applied |
|----------|--------|-----------|------------------|
| 合并策略 | 并行产出 (B) 而非顺序执行 | 发布和回顾没有依赖关系，用户期望单一 artifact | Prefer completeness |
| 阶段名 | RELEASE | 比 SHIP/REFLECT 更准确描述"结束一个交付" | Explicit over clever |
| artifact 目录 | `docs/superomni/releases/` | 新目录避免与旧 executions/improvements 混淆 | DRY |
| spec 审批标记 | 隐藏文件 `.approved-*` | 不污染文档目录，但可被脚本检测 | Mechanical gate |
| 竞态修复 | 推迟 | worktree 并发场景罕见，ROI 低 | YAGNI |

## Affected Files

```
lib/preamble.md                          # 流水线定义 + preamble 压缩
skills/vibe/SKILL.md.tmpl               # Stage Detection Matrix 更新
skills/vibe/SKILL.md                    # 编译产物（build-skills 重新生成）
skills/brainstorm/SKILL.md.tmpl         # 审批时写入标记文件
hooks/session-start                     # _session_files() Windows 兼容修复
CLAUDE.md                               # 流水线阶段引用更新
bin/build-skills                        # 触发重编译
所有其他 skills/*.md.tmpl               # preamble token 优化后重编译
```

## Acceptance Criteria

- [ ] `/vibe` 在 VERIFY 之后只显示 RELEASE 一个阶段，不再出现 SHIP 或 REFLECT
- [ ] RELEASE artifact 包含 `## Release` 和 `## Retrospective` 两个 section
- [ ] 在 Git Bash on Windows 执行 `_session_files()` 不报错，正确过滤文件
- [ ] `_verify_stage_artifact("RELEASE")` 在缺少 release 文件时返回非0，阻止自动推进
- [ ] spec 未审批时，`/vibe` 阶段检测结果为 THINK，不跳转到 PLAN
- [ ] spec 审批后，`.approved-spec-*` 标记文件存在于 `docs/superomni/specs/`
- [ ] `lib/preamble.md` 行数 ≤150 行（当前221行）
- [ ] `bin/build-skills` 执行后所有 `SKILL.md` 正确反映新 preamble

## Open Questions

- 无（所有 TACIT 维度已探明）
