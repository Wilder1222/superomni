# Plan Review — retro-mechanize (回顾教训机械化锁死)

- **Plan**: `docs/superomni/plans/plan-main-retro-mechanize-20260630.md`
- **Spec**: `docs/superomni/specs/spec-main-retro-mechanize-20260630.md`
- **Date**: 2026-06-30
- **Phases completed**: 1 (Strategy), 2 (Design — skipped, 纯 dev-time CI 脚本无 UI), 3 (Engineering)

---

## STRATEGY REVIEW

| 维度 | 结论 |
|------|------|
| Premises | **EXPLICIT** — 3 条全部亲自复核：(a) check-workflow-contract.js 无自动化测试（仅 test-generators.js，package.json:34 有 test:generators 无 test:contract，无 mocha/jest）✓；(b) Section 3 单方向（:266-277 仅 dir→produces，无反向）✓；(c) check-plan-content.js 对 0-step plan 静默 no-op（:171-188 空 steps[] → for 跳过 → exit 0 "0 destructive steps"）✓。setup.js:325,328 确认 harness-audits/+production-readiness/ 是 target-project gitignore bootstrap，源仓库缺它们是合法 → 验证 advisory-not-error 决策 |
| Scope | **RIGHT-SIZED** — 4 milestone（3 独立 additive edit + 1 纯验证），每个 ≤80 LOC，3 文件 disjoint 可并行。第 4 项 forbidden-token Non-Goal 是正确战略调用（语义复杂、误报风险高、会拖累其他 advisory 可信度）|
| Alternatives | **CONSIDERED** — spec Key Design Decisions 表记录 advisory-vs-error 选择（Section 4 + 0-steps 均 advisory），Open Questions 记录用户拍板 4 项 |
| DRY | **REUSES** — test-contract.js 仿 test-generators.js 风格（execSync+stdio:pipe+console.error+exit 1）。无既有 test harness 可插（无 mocha/jest）。P1 提示：未来加 test:all 聚合脚本可参考 verify:skill-docs 组合模型 |
| Risks (top 3) | ① R1 allowlist marker 漂移 → Test C 假 PASS（P0，已修：加 `if (patched===original) throw` 守卫）② R4 ENOSPC（C: 640M free/100% used，P0，TEMP→D: 缓解）③ R3 负向测试 temp plan 残留（P1，try/finally + git status 审计）|
| Strategy mode | **HOLD SCOPE** — scope 正确，3 个 P0 补丁打入 plan，不扩不缩 |

---

## ENGINEERING REVIEW — 逐条复核（含主审亲自复核代码）

**决定性问题逐条验证：**

| 项 | 计划声称 | 代码真相（亲自复核） | 结论 |
|---|---|---|---|
| M1 DRY 模型 | 仿 test-generators.js | test-generators.js:11,25-29 execSync+stdio:pipe+err.stderr+exit 1，runContract() 镜像 | ✅ |
| M1 marker 串 | `"const DECLARATION_ALLOWLIST = [];"` 匹配 :265 | :265 `const DECLARATION_ALLOWLIST = []; // retros/...` → substring replace 匹配 | ✅ |
| M1 try/finally | assert 不 throw → finally 必跑 | assert() 不 throw（增 failed 返回），finally 安全 | ✅ |
| M2 变量 in-scope | allProducePatterns/subdirs/warnings 在插入点 | :118/:266/:170 均 main() scope，插入点 :278 后可用 | ✅ |
| M2 正好 2 warning | harness-audits + production-readiness | 亲数 13 skill produces vs 9 磁盘子目录，唯这 2 个缺磁盘 | ✅ |
| M2 style-profiles 边界 | `<scope>` 非标准形状 | 正则提取 style-profiles，磁盘存在 → 不假报 | ✅ |
| M3 parsePlan/rel/warn/exempt | :71/:49/:203/:165-168 | 全部确认；exempt 检查在 parsePlan 前 | ✅ |
| M4 4-hash vs 3-hash | parsePlan `/^### Step` 不匹配 4-hash | 实证：4-hash → 0 steps | ✅ |

---

## P0 STRUCTURAL ISSUES（阻断执行）— 3 个，已全部打入 plan 修订

### P0-1 — R1 marker-drift 守卫 MISSING from M1 code block
**证据：** plan M1 代码块（testAllowlistExempt body）原本无 `if (patched === original) throw` 守卫，只在 Effort 散文 + R1 风险段提到。代码与散文不一致——照代码块 verbatim 执行会 ship 假 PASS 的 test harness。
**修订：** 在 writeFileSync 前加 `if (!original.includes(marker) || original.replace(marker, patched) === original) throw new Error("...test harness stale")`。throw 在 finally 前，finally 写回 original（writeFileSync 未跑，安全 no-op）。✅ 已打入 plan M1 代码块。

### P0-2 — M4 负向测试 temp plan 文件名被 exempt → warning 永不触发
**证据：** 原文件名 `plan-main-retro-mechanize-20260630-NEG-TEST.md` 结尾非 `-<8digits>.md`，extractDate（:56 `/-(\d{8})\.md$/`）返回 null → :165-168 exempt 跳过 → 0-steps warning 不触发 → M4 step 5 报 "did NOT fire — FAIL" exit 1。plan Effort 段误判"20260630 ≥ CUTOFF 不 exempt"——作者误读自己的正则（日期埋在文件名中间，不在 .md 后缀）。
**修订：** 文件名改 `plan-NEG-TEST-20260630.md`（结尾 `-20260630.md`）→ extractDate 返回 20260630 ≥ CUTOFF → 不 exempt → warning 触发。同时加 try/finally 包 rmSync（P1-3 hardening）。✅ 已打入 plan M4。

### P0-3 — M3/M4 验证期望与实际 repo 矛盾
**证据：** plan 称"13 existing plans 全 parse ≥1 step / 无新 warning"是 **FALSE**。亲数 14 个 post-cutoff plan：`plan-main-feishu-doc-align-20260629.md` 和 `plan-main-retro-mechanize-20260630.md`（本 plan 自身）都用 `### Milestone N`（非 `### Step N:`）→ 0 steps → post-cutoff 不 exempt → M3 落地后 WILL 触发 `[advisory]`。M4 step 3 "NO [advisory] lines" 会 FAIL。
**这是 G3 正确工作**（这俩 plan 确实缺 `### Step N:` 头，Pre-Destructive Gate 对它们是 no-op，advisory 理应提示）。错的不是代码是期望。
**修订：** M3 Verification / M4 step 3 / G3 Success Criteria / P5 全改为"期望 2 条 advisory（feishu + retro-mechanize），exit 仍 0，这是正确行为"。✅ 已打入 plan。

**架构决策（auto-resolved）：** `### Milestone N:` 不是 linter 接受的 step 头（仅 `### Step N:` 是）。2 个 Milestone 风格 plan 正确触发 advisory——这是 intended signal。迁移它们到 `### Step N:` 是独立清理（out of scope）；接受 advisory 作为已知信号是 chosen path（P5 显式 + 偏向行动：warning 是信息性不阻断）。

---

## P1 RECOMMENDATIONS（已部分打入 plan）

- **R4 ENOSPC 缓解靠操作纪律**：P2 是手动前置。建议 M4 顶加 `test "$TEMP" = "/d/omni-temp" || exit 1` 自动门。P0 风险值得自动 gate。✅ 已在 plan M4 How 提示设 TEMP。
- **M2 Section 4 count 硬编码 "2"**：今天正确，未来加 produces 无磁盘目录会误报。M4 step 2 已含 harness-audits + production-readiness 名称断言（足够），count 是 snapshot。可接受。
- **Test C 变异源码技术**：env-var override（`process.env.CONTRACT_ALLOWLIST`）更 DRY、不碰源码。用户拍板"只测 Section 3"未决定"变异源码 vs env override"——flag 为未来重构项。
- **未提未来 test 聚合**：第 2 个 bespoke `lib/test-*.js`，建议未来加 `test:all` 聚合或参考 verify:skill-docs 组合。

---

## Decision Audit Trail

| # | Phase | Decision | Type | Principle | Rationale |
|---|-------|----------|------|-----------|-----------|
| 1 | Strategy | HOLD SCOPE（3 P0 补丁打入） | M | P6 | scope 正确，问题是代码-散文一致性 + plan-repo 经验矛盾 |
| 2 | Eng | P0-1 加 `patched===original` 守卫 | M | P5 | 防假 PASS，代码与散文对齐 |
| 3 | Eng | P0-2 文件名改 `-20260630.md` 结尾 | M | P5 | extractDate 正则要求 8 位数字结尾 |
| 4 | Eng | P0-3 期望改"2 条 advisory 正确" | M | P5 | Milestone 风格 plan 确实 0 steps，advisory 是正确信号 |
| 5 | Eng | `### Milestone N` 触发 advisory 接受 | T | P5+P6 | 迁移 out of scope，advisory 信息性不阻断 |
| 6 | Strategy | R4 ENOSPC 提示自动门 | M | P1 | P0 风险值得自动 gate |

---

## TASTE DECISIONS — AUTO-RESOLVED

1. **Milestone 风格 plan 是否迁移到 Step 风格**：选"不迁移，接受 advisory" — P5+P6 — rationale: 迁移是独立清理、out of scope；advisory 是信息性提示不阻断，且正确反映"这些 plan 的 Pre-Destructive Gate 是 no-op"。
2. **Test C 变异源码 vs env override**：选"变异源码（带守卫）" — P3 — rationale: 用户已拍板"只测 Section 3"，env override 是更大重构；带 `patched===original` 守卫后变异源码可接受，标记为未来重构项。
3. **forbidden-token 机械化**：选"保持 advisory Non-Goal" — P1+YAGNI — rationale: 语义复杂、误报风险高、会拖累其他 advisory 可信度。

---

```
PLAN REVIEW COMPLETE
════════════════════════════════════════
Phases completed:     1, 2 (skipped), 3
Issues found:         3 P0 + 4 P1
Decisions made:       6 mechanical, 3 taste — all auto-resolved
Plan status:          APPROVED_WITH_NOTES

Revisions applied (已打入 plan):
  - P0-1: M1 代码块加 `if (!original.includes(marker) || patched===original) throw` 守卫
  - P0-2: M4 负向测试 temp plan 文件名改 plan-NEG-TEST-20260630.md + try/finally rmSync
  - P0-3: M3/M4/G3/P5 期望改为"2 条 advisory（feishu+retro-mechanize）正确，exit 0"
  - R4: M4 How 提示设 TEMP 自动门

Taste decisions auto-resolved:
  - Milestone 风格 plan 不迁移、接受 advisory（P5+P6）
  - Test C 变异源码带守卫（未来重构 env override）（P3）
  - forbidden-token 保持 advisory Non-Goal（YAGNI）

Status: DONE
════════════════════════════════════════
```

关键执行提示（给 executing-plans）：
- **M1 代码块现在含 R1 守卫**——照代码块 verbatim 写即可，勿漏。
- **M4 负向测试 temp plan 文件名必须是 `plan-NEG-TEST-20260630.md`**（结尾 8 位日期），否则被 exempt 不触发。
- **M3 落地后 check-plan-content.js 会对 feishu-doc-align + 本 retro-mechanize plan 发 2 条 advisory**——这是正确行为，exit 0，勿误判为失败。
- **所有 node 命令直调 + TEMP 重定向 D:**（C: 640M free/100% used，npm run 会 ENOSPC）。
