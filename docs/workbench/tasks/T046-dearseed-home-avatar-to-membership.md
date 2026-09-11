# T046｜诗得丽专栏首页右上角头像：跳转专栏「我的」

## 状态与类型

- 状态：`Done`（用户 2026-09-11 验收通过，由 `User Review` 推进至 `Done`）
- 类型：Bug Fix（路由跳转错误）
- 优先级：P0（影响品牌专栏核心入口语义）
- 所属阶段：诗得丽品牌专栏施工（2026-09-09 批次）
- PRD 检查：2026-09-11，报告见 [`../t046-prd-check.md`](../t046-prd-check.md)。功能项通过；本次按检查结论修订 / 更正了 7 处条款（R1–R7，详见文末「条款修订记录」）。
- ✅ 验收门槛：`## 必交证据` 的「对应提交号」已于 2026-09-11 回填为 `d5566d1`（推送至 `preview`），本卡已具备进入 `User Review` 的条件。

## 当前事实与差距

- 现状诗得丽专栏首页（`/dearseed`）右上角头像点击后跳转到商城（`/mall` 或等价），与期望不符。
  - **2026-09-11 更正（见 R6）**：本条前提有误。两个页面旧目标不同——`/`（页面标题「诗得丽品牌专栏」）原跳 `/mall`；`/dearseed`（页面标题「诗得丽专栏」）原跳 `/profile`，**不是 `/mall`**。历史依据：提交 `1e9fc2b`（2026-09-10）的 message 记载 `/profile → /dearseed/membership`。详见「实施记录」。
- 期望行为：点击专栏首页右上角头像 → 跳转诗得丽专栏内的「会员中心」页（注意：与「我的」改名 T051 联动）。

## 目标

1. 将诗得丽专栏首页右上角头像的 `onClick` / `to` 改为专栏「我的」路由。
2. 跳转目标在 T051 改名落地后统一为 `/dearseed/membership`（会员中心）。
3. 不修改卡博士 APP 主壳入口的头像行为（卡博士主壳头像行为仍指向 `/membership` 会员中心页，见文末修订记录 R1）。

## 原型范围

- 需求来源：2026-09-09 用户现场反馈。
- 节点：诗得丽专栏首页顶部右上角头像按钮。
- **无 Mockplus 节点可引用**（2026-09-11 补注）：本卡需求来源为现场反馈，非原型稿评审，建立时即未关联 Mockplus 节点号。因此 `task-ledger.md` 4.1「明确引用对应 Mockplus 节点」一项按「现场反馈类卡片豁免」处理，以 375×812 实现截图作为唯一视觉依据。
- **入口节点实为两个页面**（2026-09-11 补注）：反馈中的「诗得丽专栏首页」在代码中对应两个路由——`/`（页面标题「诗得丽品牌专栏」，`src/pages/Home.tsx`）与 `/dearseed`（页面标题「诗得丽专栏」，`src/pages/DearseedColumn.tsx`）。本卡施工覆盖两者，详见「实施记录」。

## 不在范围

- 不修改卡博士 APP 主壳头像行为。
- 不调整会员中心页面布局（由 T051 改名卡负责，见 R7）。
- 不修改头像本身视觉。

## 依赖与阻塞决策

| 编号    | 阻塞项                       | 风险 | 说明                                              |
| ----- | ------------------------- | -- | ----------------------------------------------- |
| B-048 | 诗得丽「会员中心」最终路由 slug | 低  | 与 T051 联动；建议 `/dearseed/membership`         |

## 实施要求

- 在专栏首页组件中定位顶部头像按钮的跳转 handler。
- 替换跳转目标为专栏「我的」路由（建议 `/dearseed/membership`）。
- 跳转前后视觉无变化，标题栏保持原样。
- 如果存在「已登录跳会员中心 / 未登录跳登录页」分支，保持不变，仅替换会员中心目标。
- 在专栏头像按钮区域增加可见测试锚点（开发期），便于验收时定位。

## 状态与交互矩阵

| 状态 | 入口 | 跳转目标 | 结果 |
| --- | --- | --- | --- |
| 已登录 | 专栏首页头像（`/`） | `/dearseed/membership` | 会员中心（原专栏「我的」） |
| 未登录 | 专栏首页头像（`/`） | 不适用（见 R2）——`/` 由 T037 守卫整页重定向 `navigate('/legacy-profile/login', { replace: true })`，**无 `from` 参数**，头像在未登录态**不可达** | 登录页（由根路由守卫触发，非头像自身行为） |
| 会员中心内 | 任何返回按钮 | 返回上一页（`navigate(-1)`，见 R3） | 从 `/` 进入时回 `/`；从 `/dearseed` 进入时回 `/dearseed` |

## 验收标准

- 点击专栏首页右上角头像可直接进入会员中心。
- 不再出现跳转到商城的错误行为。
- 卡博士 APP 主壳头像行为不受影响。
- `npm run typecheck` / `npm run build` 通过。
- 375×812 实现截图与说明对照。

## 必交证据

- 专栏首页头像区域 375×812 截图。
- 跳转前后两屏对照（专栏首页 → 会员中心）。
- 对应提交号。

## 产出

> 以下为建卡时的原始条款，**保留不改**（见 R4）。

- `src/pages/dearseed/DearseedHome.tsx` 或等价文件：头像跳转 handler 修正。
- 若路由 slug 与 T049 同步调整，需要联动更新 `src/app/router.tsx`。

### 实现偏差说明（2026-09-11）

| 项 | 原始条款 | 实际 | 差异原因 |
| --- | --- | --- | --- |
| 改名文件 | `src/pages/dearseed/DearseedHome.tsx` | `src/pages/Home.tsx` | **原条款路径不存在**：`src/pages/dearseed/` 目录与 `DearseedHome.tsx` 文件在仓库中均不存在（已核实）。实际漏改的是根路由 `/`，由 `src/pages/Home.tsx` 渲染 |
| 路由联动 | 「若路由 slug 与 T049 同步调整，需联动更新 `src/app/router.tsx`」 | 无需改动 | ① **编号笔误**：slug 联动对象应为 **T051**（「我的」改名「会员中心」），T049 是「洗头搭子双方泡泡值」决策卡，与本卡无关。② slug `/dearseed/membership` 已由历史提交 `1e9fc2b`（2026-09-10）注册在 `src/app/router/routes.ts` + `src/app/router/index.tsx`，本卡无需再改路由 |

> 本次施工首版曾直接替换本节原文，属「验收依据事后对齐」。2026-09-11 PRD 检查后已恢复原文并改为本节的偏差说明形式（见 R4）。

## 实施记录（2026-09-11）

### 定位结论：真正要改的不是 `DearseedColumn.tsx`

| 页面 | 路由 | 页面标题 | 右上角头像原行为 | 处理 |
| --- | --- | --- | --- | --- |
| 诗得丽品牌专栏首页 | `/`（`src/pages/Home.tsx`） | 诗得丽品牌专栏 | `navigate('/mall')`，aria-label「进入卡博士商城」 | **本次修正目标** |
| 诗得丽专栏（独立旧入口） | `/dearseed`（`src/pages/DearseedColumn.tsx`） | 诗得丽专栏 | 已指向 `/dearseed/membership` | 无需改动 |

用户反馈的「诗得丽品牌专栏」= 页面标题完全一致的路由 `/`，由 `Home.tsx` 渲染；T021 把根路由改成品牌专栏首页后，该头像仍停留在 T023 的「统一进商城」结论上，故为漏改。

### 改动内容

`src/pages/Home.tsx` 首屏右上角头像按钮：

```diff
-          aria-label="进入卡博士商城"
-          onClick={() => navigate('/mall')}
+          data-dearseed-avatar
+          aria-label="进入会员中心"
+          onClick={() => navigate('/dearseed/membership')}
```

- 同步补上开发期测试锚点 `data-dearseed-avatar`（与 `DearseedColumn.tsx` 保持一致）。
- 未改动 `/legacy-home`（卡博士 APP 主壳）头像：仍 `navigate('/membership')`。

### 与 T023 的结论冲突（已按用户 2026-09-11 指示反转）

T023 的取证脚本原先把「首页头像 / 专栏会员空间 / 我的-专属权益」三条入口统一断言为进入 `/mall`。本卡反转其中「首页头像」一条：

- `scripts/capture-t023.mjs`：该条入口从断言列表移除，并在注释中登记「已被 T046 反转到 `/dearseed/membership`」，该入口的期望由 `scripts/capture-t046.mjs` 接管。其余两条入口维持 T023 结论。
- `scripts/capture-t021.mjs` / `scripts/verify-t024.mjs`：首页头像的定位选择器由 `button[aria-label="进入卡博士商城"]` 改为 `[data-dearseed-avatar]`（仅换锚点，不断言跳转目标，故 T021 / T024 结论不变）。

## 验证结果（2026-09-11）

- ✅ `npm run build`（含 `tsc --noEmit` + `verify:images` + `vite build`）通过。
- ✅ `node scripts/capture-t046.mjs` 全部检查通过，0 条控制台/断言问题。
- ✅ 点击首页右上角头像 → `/dearseed/membership`，标题栏「会员中心」。
- ✅ 不再跳转 `/mall`；全页已无 `aria-label="进入卡博士商城"` 入口（0 处）。
- ✅ 会员中心返回 → 回到 `/`，返回路径闭合。
- ✅ 卡博士主壳 `/legacy-home` 头像 → 仍为 `/membership`，未受影响。

## 提交与推送

- 提交：`d5566d1` — `feat(dearseed): T046 诗得丽品牌专栏首页头像改跳会员中心`（12 个文件：`src/pages/Home.tsx` + 5 个脚本 + 3 个文档 + 3 张证据 PNG）。
- 已推送至 `preview`。
- ⚠️ 操作提示：本仓库为 `blob:none` 部分克隆 + 稀疏检出，`docs/` 不在 sparse 规则内，`git add` 会被拒（"paths that exist outside of your sparse-checkout definition"），**必须加 `--sparse`**；另外 `github.com` 的 git 端点在本机网络下间歇性不可达（实测 5 次通 1 次，代理隧道反而 502），push 需**剥掉代理环境变量直连 + 重试循环**。

## 必交证据

| 证据 | 位置 |
| --- | --- |
| 跳转前：首页头像区域 375×812 | `docs/workbench/evidence/screenshots/t046-01-home-avatar-before.png` |
| 跳转后：会员中心 375×812 | `docs/workbench/evidence/screenshots/t046-02-membership-after.png` |
| 返回后：回到专栏首页 | `docs/workbench/evidence/screenshots/t046-03-home-back.png` |
| 取证脚本（施工自检） | `scripts/capture-t046.mjs` |
| PRD 检查报告 | `docs/workbench/t046-prd-check.md` |
| PRD 独立复现脚本 | `scripts/verify-t046-prd.mjs` |
| **对应提交号** | ✅ `d5566d1`（2026-09-11 推送至 `preview`） |

截图规格已核验：三张 PNG 的 IHDR 尺寸均为 375×812。

## 改动文件清单

| 文件 | 改动类型 | 说明 |
| --- | --- | --- |
| `src/pages/Home.tsx` | 修改 | 头像 aria-label 改「进入会员中心」、跳转目标改 `/dearseed/membership`、新增 `data-dearseed-avatar` 锚点 |
| `scripts/capture-t046.mjs` | 新增 | T046 验收取证脚本（含登录动线、真实入口进入、跳转 / 返回 / 主壳回归） |
| `scripts/verify-t046-prd.mjs` | 新增 | T046 PRD 独立复现脚本（不复用 `capture-t046.mjs` 的断言，按 PRD 条款取事实） |
| `docs/workbench/t046-prd-check.md` | 新增 | T046 PRD 检查报告（逐条判定 / 偏差分级 / 条款修订建议） |
| `scripts/capture-t021.mjs` | 修改 | 首页头像定位选择器换锚点 |
| `scripts/verify-t024.mjs` | 修改 | 首页头像计数选择器换锚点 |
| `scripts/capture-t023.mjs` | 修改 | 移除「首页头像 → /mall」断言并登记 T046 反转 |
| `docs/workbench/tasks/README.md` | 修改 | 索引状态同步 + 批次说明追加 |
| 本卡自身 | 修改 | 状态、实施记录、验证结果、必交证据、已知偏差、条款修订记录 |

## 已知偏差与未决项

1. **未登录分支与卡片矩阵不一致**：本卡「状态与交互矩阵」原写「未登录 → 专栏首页头像 → `/login?from=/dearseed/membership`」。实际实现是 T037 的根路由守卫——未登录访问 `/` 时整页被 `navigate('/legacy-profile/login', { replace: true })` 重定向，**头像在未登录态不可达，也不存在 `from` 参数**。用户最终仍落在登录页，符合意图但不符合字面。若要严格落地 `from` 回跳，属 T037 守卫契约变更，建议另开卡。**（2026-09-11 已按此结论修订矩阵，见 R2）**
2. **头像可见性依赖登录态**：`userInfoStore` 是内存态（无持久化），整页刷新即丢登录态并再次被守卫拦截。取证脚本因此必须走真实登录动线 + SPA 导航，不能用 `page.goto('/')`。这属 T037 既有行为，本卡不改。
3. **进入首页/专栏会自动弹出 T043 身份选择弹窗并遮挡头像**，取证脚本按真实用户行为先关闭（`button[aria-label="关闭身份选择"]`）再取证。**2026-09-11 实测确认两个页面都会弹**：`/` 与 `/dearseed` 均触发。这本身不是缺陷（T043 既定行为），但人工验收时容易误判为「头像点不到」——第一次点击必然被弹窗吃掉。
4. **既有取证脚本自 T037 起已整体失效（非本卡引入）**：`capture-t021.mjs` / `capture-t023.mjs` / `verify-t024.mjs` 均用 `page.goto(base + '/?newcomer=off')` 整页刷新直达首页，而 T037（2026-09-07）给根路由加了登录守卫、`userInfoStore` 又是内存态，整页刷新即丢登录态 → 一律被重定向到 `/legacy-profile/login`，首页断言必然失败。本卡只做了必要的选择器同步（否则修好登录后仍会选错元素），**没有**替这三张已 `Accepted` / `User Review` 的卡补登录动线；建议单开一张技术债卡统一修复（可直接复用 `capture-t046.mjs` 里的登录 + SPA 导航写法）。
   ⚠️ 排查过程中发现一个**副作用风险**：这些脚本的 `shot()` 会**直接覆写已入库的证据 PNG**。在首页断言已经失败（停在登录页）的情况下跑 `verify-t024.mjs`，会把 `t024-01-home-baseline.png` / `t024-02-home-bottom-cause-story.png` 覆盖成登录页截图。本次已 `git checkout --` 还原；后续任何人跑这些脚本前，务必先确认工作区证据文件干净。
5. **本机 Playwright 浏览器版本不匹配**：`@playwright/test@1.49.1` 找 `chromium_headless_shell-1148`，而本机缓存只有 `-1187` / `-1234`，裸 `chromium.launch()` 会直接抛错。`capture-t046.mjs` 因此走系统 Chrome 通道（`channel: 'chrome'`，可用 `PW_CHANNEL` 覆盖）。这是环境问题，不是代码问题。
6. **鉴权范围不一致（本卡不修，建议单开卡）**：`MobileLayout` 的登录守卫只判 `location.pathname === '/'` 一条路径。2026-09-11 实测未登录直达各路由的落点：

   | 路由 | 未登录直达结果 |
   | --- | --- |
   | `/` | 重定向到 `/legacy-profile/login` |
   | `/dearseed` | **直接渲染**，且右上角头像可点 → `/dearseed/membership` |
   | `/dearseed/membership` | **直接渲染会员中心**，昵称 / 等级 / 卡号 / 泡泡值全部可见 |
   | `/legacy-home` | **直接渲染** |

   即**未登录用户可绕过首页守卫、经 `/dearseed` 直达会员中心**。这是 T037 守卫的覆盖范围问题，不由 T046 引入、也不属 T046 范围；但它直接决定本卡矩阵「未登录」一行的语义，故登记在此，建议单开卡统一准入策略。

## 条款修订记录（2026-09-11，PRD 检查后）

本卡自 2026-09-09 建立后，经 2026-09-11 一轮 PRD 检查（报告 [`../t046-prd-check.md`](../t046-prd-check.md)）。以下条款因与代码 / 运行时事实不符而修订，原文保留在表中以备追溯。

| 编号 | 位置 | 原文 | 修订后 | 依据 |
| --- | --- | --- | --- | --- |
| R1 | `## 目标` 第 3 条 | 「卡博士主壳头像行为仍指向 `Profile` 页」 | 「仍指向 `/membership` 会员中心页」 | `src/pages/LegacyHome.tsx:72` 为 `navigate('/membership')`；PRD 表述与基线不符 |
| R2 | `## 状态与交互矩阵` 第 2 行 | 「未登录 → 头像 → `/login?from=/dearseed/membership`」 | 「不适用：`/` 由 T037 守卫整页重定向，**无 `from` 参数**，头像在未登录态不可达」 | `src/layouts/MobileLayout.tsx:38-42`；实测未登录访问 `/` 落 `/legacy-profile/login` 且 `from` 为空 |
| R3 | `## 状态与交互矩阵` 第 3 行 | 「任何返回按钮 → 回 `/dearseed`」 | 「返回上一页（`navigate(-1)`）；从 `/` 进入回 `/`，从 `/dearseed` 进入回 `/dearseed`」 | `src/components/mobile/TitleBar.tsx:61`；两条路径均已实测 |
| R4 | `## 产出` | 文件名 `src/pages/dearseed/DearseedHome.tsx`；slug 联动对象写 `T049` | 原文**恢复保留**，实际改动改由「实现偏差说明」记录；`T049` 更正为 `T051` | `src/pages/dearseed/` 目录与 `DearseedHome.tsx` 均不存在；`T049` 是「洗头搭子双方泡泡值」决策卡，与本卡无关 |
| R5 | `## 原型范围` | 未说明原型来源 | 补注「现场反馈类卡片，无 Mockplus 节点可引用」 | `task-ledger.md` 4.1 事实门槛；本卡需求来源为 2026-09-09 用户现场反馈 |
| R6 | `## 当前事实与差距` 第 1 条 | 「诗得丽专栏首页（`/dearseed`）…跳转到商城（`/mall` 或等价）」 | 保留原文并加更正注：`/` 原跳 `/mall`、`/dearseed` 原跳 `/profile`，两页旧目标不同 | 提交 `1e9fc2b` message；`src/pages/Home.tsx` 改动前 diff |
| R7 | `## 不在范围` 第 2 条 | 「不调整会员中心页面布局（由 **T049** 改名卡负责）」 | 「由 **T051** 改名卡负责」 | `tasks/README.md`：T049 是「洗头搭子双方泡泡值」决策卡，T051 才是「我的」改名「会员中心」。**同一编号笔误在本卡 `## 产出` 中重复出现（见 R4）** |

未修订的条款：`## 验收标准`（5 条全部实测通过）、`## 实施要求`（5 条全部满足或 N/A）、`## 不在范围`、`## 依赖与阻塞决策`、`## 必交证据`（除回填提交号外）。

**流程说明**：本次施工首版曾直接替换 `## 产出` 原文，属「验收依据事后对齐」，会导致事后无法分辨「原本要求什么」与「实际做了什么」。2026-09-11 已恢复原文，改为「原文 + 偏差说明」双轨记录。此后本仓库卡片修订一律沿用本节的「原文 → 修订后 → 依据」三列表格式。