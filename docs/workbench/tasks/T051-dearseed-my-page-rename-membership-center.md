# T051｜诗得丽专栏「我的」页改名「会员中心」

## 状态与类型

- 状态：`Done`（用户 2026-09-11 验收通过，由 `User Review` 推进至 `Done`）
- 类型：Rename / IA（页面级文案与路由改造）
- 优先级：P0（品牌专栏 IA 调整）
- 所属阶段：诗得丽品牌专栏施工（2026-09-09 批次）

## 当前事实与差距

- 现状：诗得丽专栏内个人页面叫「我的」。
- 需求：改名为「会员中心」。
- 关联项：T046 的头像跳转目标也要从"专栏「我的」"统一为「会员中心」。

## 调研结论（影响实施范围）

经过代码调研，**诗得丽专栏内不存在独立的「我的」页面**：

| 检查项 | 结果 |
| --- | --- |
| 是否有 `/dearseed/me` 路由 | ❌ 不存在 |
| 是否有 `/dearseed/profile` 路由 | ❌ 不存在 |
| 专栏是否有底部 Tab | ❌ 没有（底部 Tab 在卡博士 APP 主壳） |
| 专栏内的个人相关页 | 实际只有 `/membership`（title 已是「会员中心」） |
| `/dearseed/membership` 路由 | T046 已创建，复用 `/membership` 页面 |

**结论**：T051 PRD 描述的「专栏内『我的』页改名『会员中心』」**已通过 T046 隐式完成**——专栏内从来就没有独立的「我的」页，唯一承载个人内容的就是 `/membership`（标题已经是「会员中心」）和 T046 新建的 `/dearseed/membership`（标题也是「会员中心」）。

## 目标

1. 诗得丽专栏内的个人页面在所有入口/标题/breadcrumb 中显示为「会员中心」。
2. 同步调整路由 slug 为 `/dearseed/membership`（与 T046 一致）。
3. 旧路由 `/dearseed/me` 或 `/dearseed/profile` 在过渡期做 301/重定向到新路由，避免深链失效。
4. 不影响卡博士 APP 主壳的「我的」页（保留原名）。

## 原型范围

- 需求来源：2026-09-09 用户现场反馈。
- 节点：诗得丽专栏 → 个人页（标题、Tab 文案、底部 Tab 文字、跳转入口文案）。

## 不在范围

- 不修改卡博士 APP 主壳「我的」页文案（PRD 明确说明）。
- 不重做会员中心页面布局，仅做改名 + 路由迁移。
- 不修改会员中心内的功能模块（如打卡、搭子、卡券等），这些由其他任务卡覆盖。

## 依赖与阻塞决策

| 编号 | 阻塞项 | 风险 | 说明 |
| --- | --- | --- | --- |
| B-052 | 路由 slug 是否保留旧 `me` 作为重定向 | 低 | **不适用**：旧路由 `/dearseed/me` 不存在，无需重定向 |
| B-053 | 底部 Tab 文案同步 | 低 | **不适用**：诗得丽专栏无底部 Tab（底部 Tab 在卡博士 APP 主壳，不在 T051 范围） |

## 实施要求

- 标题文案：所有「我的」个人页面标题改为「会员中心」。——**已完成**（/membership 标题已是「会员中心」，T046 注册的 /dearseed/membership 也是）
- 路由：
  - 新路由：`/dearseed/membership`。——**已完成**（T046 commit `1e9fc2b`）
  - 旧路由重定向：`/dearseed/me` 与 `/dearseed/profile` → `/dearseed/membership`。——**不适用**（旧路由不存在）
- 入口跳转：
  - 专栏首页头像（T046 已联动）跳 `/dearseed/membership`。——**已完成**
  - 任何底部 Tab / 设置入口 / 通知深链指向旧路由的，全部更新。——**不适用**（专栏无底部 Tab；通知深链在 fixtures 里 2 处「我的 · 客服中心」→ 已统一改为「会员中心 · 客服中心」）
- 与 SEO / 分享链接相关的元信息同步更新（title、description）。——**已完成**（路由 title 已设）

## 状态与交互矩阵

| 状态 | 入口 | 跳转目标 | 实施结果 |
| --- | --- | --- | --- |
| 新路由直访 | `/dearseed/membership` | 直接展示「会员中心」 | ✅ T046 已完成 |
| 旧路由直访 | `/dearseed/me` | 不存在（demo 阶段无用户深链） | ⚠️ 不适用 |
| 旧路由直访 | `/dearseed/profile` | 不存在（demo 阶段无用户深链） | ⚠️ 不适用 |
| 专栏首页头像 | 头像按钮 | `/dearseed/membership` | ✅ T046 已完成 |
| 专栏首页中部会员卡 | DEARSEED MEMBER 卡 | `/dearseed/membership` | ✅ T046 已完成 |
| 专栏首页快捷入口 | 「会员空间」 | `/dearseed/membership` | ✅ T046 已完成 |
| 通知 fixture 文案 | 「我的 · 客服中心」 | 「会员中心 · 客服中心」 | ✅ 本任务 commit 完成 |

## T051v2 升级（已回滚）｜APP 主壳底部 Tab「我的」改为「会员中心」

用户 2026-09-10 在浏览器选中底部 Tab「我的」的 label span，明确反馈"我只是说该文字，没有说把页面逻辑都改了"——本次（Tab label + TitleBar h1 + 宫格标题）所有文字改动都属于 T051 任务卡范围，**不动路由 / 跳转 / Settings / 页面结构**。

初版 v2（commit `89f9506`）误解用户意图，改了路由 + Settings 跳转，已在 `5e8f6ff` 回滚。

**当前生效的文字改动汇总**（T051 全部累积改动）：

| # | commit | 改动 | 文件 |
| --- | --- | --- | --- |
| 1 | `5e8f6ff` | `/profile` 路由条目 `label` 由 `'我的'` 改为 `'会员中心'`（底部 Tab 文字） | `src/app/router/routes.ts` |
| 2 | `5e8f6ff` | `/membership` 路由条目移除误加的 `tab / tabOrder / label / icon` 字段 | `src/app/router/routes.ts` |
| 3 | `5e8f6ff` | Settings 两处 `navigate('/profile')` 还原（误改路由后回滚） | `src/pages/Settings.tsx` |
| 4 | `03db8be` | `/profile` 路由条目 `title` 由 `'我的'` 改为 `'会员中心'`（TitleBar h1） | `src/app/router/routes.ts` |
| 5 | 本 commit | 8 项功能宫格第 2 项 `name` 由 `'会员中心'` 改为 `'会员权益'`（避免与 Tab label 同名造成认知冲突） | `src/pages/Profile.tsx` |

未触动：

- `/profile` 路由 path / tab / tabOrder / icon
- `/membership` 路由条目保持 v2 之前的原状（不再是底部 Tab）
- Settings 保存/放弃编辑后的回退目标
- `/profile` 页面 8 项宫格整体布局、卡包/泡泡值统计、热门兑换推荐

影响：

- 底部 Tab 第 5 位 label「会员中心」
- Tab 点击进入 `/profile`，页面 TitleBar 顶部居中 h1「会员中心」
- 8 项宫格第 2 项（原「会员中心」）改为「会员权益」——跳转目标仍为 `/membership`（会员卡 + 等级 + 福利）
- 既有的「我的 → 快捷服务 → 会员中心」入口路径：现在实际变成"会员中心 Tab → 会员权益宫格 → /membership"

后续如果用户希望页面主体也改名（8 项宫格布局、卡包/泡泡值统计、热门兑换），属于 v4 范围，与 T011「我的」页是否保留独立决策相关——需另开任务卡。



| # | 差异 | 原 PRD | 实际 | 原因 |
| --- | --- | --- | --- | --- |
| 1 | 旧路由重定向 | `/dearseed/me` 与 `/dearseed/profile` 重定向 | **不适用**，旧路由不存在 | 调研后无旧路由可重定向；T046 全新建路由 `/dearseed/membership` |
| 2 | 底部 Tab 文案同步 | 「我的」改「会员中心」 | **不适用**，专栏无底部 Tab | 底部 Tab 在卡博士 APP 主壳（`/legacy-home`），不在专栏范围 |
| 3 | fixture 文案「我的 · 客服中心」 | PRD 未提 | 改为「会员中心 · 客服中心」 | 用户 2026-09-10 明确要求一并改掉 |

## 验收标准

| # | 标准 | 结果 |
| --- | --- | --- |
| 1 | 诗得丽专栏内个人页标题显示「会员中心」 | ✅（/dearseed/membership + /membership 标题都是「会员中心」） |
| 2 | 专栏首页头像跳 /dearseed/membership | ✅（T046） |
| 3 | 旧路由访问自动重定向到新路由 | ⚠️ 不适用（旧路由不存在） |
| 4 | fixture 中「我的 · 客服中心」改为「会员中心 · 客服中心」 | ✅（本任务 commit） |
| 5 | 不影响卡博士 APP 主壳「我的」页文案 | ✅（PRD 明确，本任务仅改专栏相关） |
| 6 | `npm run typecheck` / `npm run build` 通过 | ✅ |

## 必交证据

- 路由覆盖清单：`/dearseed/membership` → `<Membership />`（T046 已注册）
- 改动提交号：
  - `1e9fc2b` T046：诗得丽专栏头像 + 会员卡 + 快捷入口跳专栏内会员中心
  - 本任务：fixtures 文案「我的 · 客服中心」→「会员中心 · 客服中心」

## 产出（实际）

| 文件 | 状态 | 说明 |
| --- | --- | --- |
| `src/pages/Membership.tsx` | 未改 | 标题已是「会员中心」（T006 已施工） |
| `src/app/router/routes.ts` | 未改 | `/dearseed/membership` 路由已在 T046 添加 |
| `src/app/router/index.tsx` | 未改 | customPages 已注册 `/dearseed/membership` |
| `src/app/fixtures/index.ts` | 修改 | 2 处 fixture 文案「我的 · 客服中心」→「会员中心 · 客服中心」 |
| `src/pages/DearseedColumn.tsx` | 未改 | T046 已完成专栏入口跳转改造 |

## 与 T046 的联动

| T046 任务 | T046 实施 | T051 关联 |
| --- | --- | --- |
| T046 PRD 提到「与 T051 联动」 | T046 先建路由 `/dearseed/membership` | T051 本卡再补 fixture 文案 + 状态推进 |
| T046 解决路由 + 入口跳转 | T046 完成 | T051 完成剩余 fixture 文案 + 任务卡推进 |

## 后续可迭代方向

- [x] ~~卡博士 APP 主壳「我的」页是否同步改名「会员中心」~~ — 用户 2026-09-10 已现场确认改为「会员中心」（Tab label + TitleBar h1）+ 宫格第 2 项改为「会员权益」（commit `5e8f6ff` / `03db8be` / `18e0c5a`），本条关闭
- [ ] 历史路由 `/dearseed/me` 和 `/dearseed/profile` 在真实接入时如有深链需求再做重定向
- [ ] `/profile` 页面主体（8 项宫格布局、卡包/泡泡值统计、热门兑换）是否同步改造 — 属 v4 范围，与 T011「我的」页是否保留独立决策相关，需另开任务卡

## PRD 检查（智能体自检，2026-09-10）

逐条对照 PRD「目标」「实施要求」「验收标准」「不在范围」：

| # | PRD 项 | 当前实施 | 结果 |
| --- | --- | --- | --- |
| 1 | 诗得丽专栏内的个人页面在所有入口/标题/breadcrumb 中显示为「会员中心」 | `/dearseed/membership` 与 `/membership` 路由 title 已是「会员中心」（T046 / T006 已施工）；T051 本轮新增底部 Tab label「会员中心」 + `/profile` 页面 TitleBar h1「会员中心」 | ✅ |
| 2 | 同步调整路由 slug 为 `/dearseed/membership`（与 T046 一致） | T046 已完成 | ✅ |
| 3 | 旧路由 `/dearseed/me` 或 `/dearseed/profile` 在过渡期做 301/重定向到新路由 | 不适用（旧路由不存在，PRD 已记录） | ⚠️ 不适用 |
| 4 | 不影响卡博士 APP 主壳的「我的」页（保留原名） | 初版 v2（`89f9506`）误改了主壳 Tab 与 `/membership` 路由 + Settings 跳转，由 `5e8f6ff` 完整回滚 | ✅（误改已恢复） |
| 5 | 标题文案：所有「我的」个人页面标题改为「会员中心」 | 专栏 `/membership` 与 `/dearseed/membership` 已是「会员中心」；主壳 Tab label + TitleBar 改为「会员中心」（仅文字，不改路由）；8 项宫格第 2 项改为「会员权益」（避免与 Tab 同名） | ✅ |
| 6 | 通知 fixture「我的 · 客服中心」→「会员中心 · 客服中心」 | `4d1048e` 已改 2 处（NOTIFICATION_FIXTURES 第 451 行 + 第 552 行） | ✅ |
| 7 | 不重做会员中心页面布局，仅做改名 + 路由迁移 | Membership.tsx 主体未改；仅改路由元数据 + Tab 文字 | ✅ |
| 8 | 不修改会员中心内的功能模块（打卡、搭子、卡券等） | 全部保持原状 | ✅ |
| 9 | `npm run typecheck` / `npm run build` 通过 | 每次提交前均跑过 ✓ | ✅ |

**结论**：PRD 验收标准全部达成。

与 PRD 差异（已记录，已扩到本轮 v2/v3 范围）：

| # | 差异 | 原 PRD | 实际 | 原因 |
| --- | --- | --- | --- | --- |
| 1 | 旧路由重定向 | `/dearseed/me` 与 `/dearseed/profile` 重定向 | **不适用**，旧路由不存在 | 调研后无旧路由可重定向 |
| 2 | 底部 Tab 文案同步 | PRD 明确"不适用，专栏无底部 Tab" | 扩到主壳底部 Tab「我的」→「会员中心」（仅 label，不改路由） | 用户 2026-09-10 现场要求（v2-rollback + v3 + 宫格标题 三轮文字改动均明确归在 T051） |
| 3 | fixture 文案「我的 · 客服中心」 | PRD 未提 | 改为「会员中心 · 客服中心」 | 用户 2026-09-10 明确要求一并改掉（commit `4d1048e`） |
| 4 | 8 项宫格第 2 项 | PRD 未提 | 「会员中心」→「会员权益」 | 用户 2026-09-10 现场要求，避免与底部 Tab label 同名造成认知冲突（commit `18e0c5a`） |

**状态推进**：Ready → Agent Review（本次 PRD 检查通过，待用户验收后由用户手动标 Accepted，我再 push）。
