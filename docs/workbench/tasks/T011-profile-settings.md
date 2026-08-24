# T011｜我的、设置与 APP 引导

## 状态与类型

- 状态：`Accepted`（owner 于 2026-08-22 明确确认通过，授权按自检结论标注）
- 类型：UI / Flow
- 优先级：P0

### 验收结论（2026-08-22）

四节点 #19 #20 #59 #61 自检全部通过，owner 于 2026-08-22 明确确认验收通过。按 `task-ledger.md` §4 四道门槛逐项对照：

| 门槛 | 结论 | 依据 |
| --- | --- | --- |
| 4.1 事实 | 通过 | 四节点均引用摹客 05 模块说明；当前实现状态已在「当前事实与差距」写明，未用历史稿代替决策 |
| 4.2 UI | 通过 | 17 张 375×812 截图与原型对照，见「验收方式」；空态/编辑/校验/保存中/成功/禁用态均已实现 |
| 4.3 交互 | 通过 | 正向 17 条跳转与出口全量实测 PASS、0 FAIL，见「页面间跳转接线」；11 个目标页顶栏「返回」回到 `/profile` 实测 PASS、0 FAIL，返回路径成立；原「更多」假按钮已消除，无静态高亮代替交互 |
| 4.4 工程 | 通过 | `npm run typecheck`、`npm run build` 通过；四条路由直达与刷新不白屏；控制台仅 React Router v7 future flag warning（项目既有，非阻塞） |
| 4.5 证据 | 通过 | 路由与节点清单、原型定位、实现截图、交互结果、已知差异与未决项均已沉淀于本卡 |

未决项不阻塞本卡验收，已在「待产品确认的原型矛盾」记录；首页侧通知入口按 owner 决定归 T012。APP 弹窗「下载链接」目标地址待产品提供，随地址到位后按 #20 补接，不影响本卡已验收结论。

## 当前事实与差距

- `/profile`（我的，#19）已按 reference 我的标准页实现（D-007）：暖白 hero（头像/昵称/VIP 徽标/等级进度/卡包·泡泡值·权益三宫格）+ 6 宫格常用功能（卡券兑换/订单/地址/搭子/福利官/客服）+ 热门兑换，入口已接通项目路由。
- 个人设置（#59）、放弃修改（#61）、APP 弹窗（#20）已实现，见「实现记录」。

## 目标

完成个人中心作为订单、地址、客服、福利官、卡包和资料设置的业务分发页，并完成资料修改闭环。

## 原型范围

- #19 我的
- #20 APP 弹窗
- #59 个人设置
- #61 放弃修改

## 不在范围

- 各业务入口目标页面分别进入 T009、T010、T013。
- 不实现真实账号安全、上传和服务端保存。

## 依赖与阻塞决策

- 依赖 T002–T004。
- 依赖后续任务提供入口目标；未完成时必须明确 unavailable 状态，不能假跳转。

## 实施要求

- “我的”按原型展示用户信息、资产/订单/服务入口和层级，不用通用设置页代替。
- 设置页覆盖可编辑字段、保存、保存反馈和脏数据离开确认。
- APP 弹窗明确触发原因、继续方式与关闭路径。
- 入口统一由路由表管理，避免页面内散落目标。

## 状态与交互矩阵

- 用户已登录基础态；缺失头像/昵称的降级态。
- 设置默认/编辑/校验错误/保存中/保存成功。
- 有未保存修改时返回：继续编辑/放弃修改。
- APP 弹窗打开/关闭/确认。

## 验收标准

- 4 个节点逐一可定位。
- “我的”全部原型入口可达或明确说明尚未开放。
- 修改流程不会静默丢数据。
- 当前占位级 Profile 被替换，并提交前后差异证据。

## 必交证据

- 4 节点截图和入口清单。
- 设置修改/放弃/保存流程记录。
- APP 引导触发记录。
- 类型检查、构建和控制台结果。

## 产出

- 我的、设置、离开确认和 APP 引导页面。

## 实现记录

### 落点

| 节点 | 落点 |
| --- | --- |
| #19 我的 | `src/pages/Profile.tsx`（本次仅把「绑定搭子」由假跳转改为 `appOnly` 触发 APP 引导） |
| #20 APP 弹窗 | `src/components/mobile/AppPromptDialog.tsx`，由 `/profile` 触发，URL 同步 `?overlay=app-prompt` |
| #59 个人设置 | `src/pages/Settings.tsx` |
| #61 放弃修改 | `src/pages/Settings.tsx` 内的 `PromptOverlay`，fixture 直达 `?overlay=discard` |
| 共用弹窗外壳 | `src/components/mobile/PromptOverlay.tsx` |

### 脏数据离开确认的实现约束

设置页用 `useBlocker` 拦截脏数据离开。**弹窗可见性必须由 `blocker.state` 驱动，blocked 期间不得发起任何导航**：

```tsx
const discardOpen = blocker.state === 'blocked' || overlay === 'discard'
```

早期实现曾在 blocked 期间用 `setSearchParams(..., { replace: true })` 写 `?overlay=discard` 来显示弹窗，结果这次 REPLACE 污染了 blocker 的 pending 导航，`blocker.proceed()` 无法重放被拦截的 POP，表现为「确认放弃」点击无反应。识别症状是：`window.location` 中没有 `overlay=discard`，但弹窗已渲染。后续维护此页请勿恢复该写法。

`bypassGuard` 用 ref 而非 state，因为主动 `navigate` 需要同步放行，避免被自己的 blocker 拦住。

### 验证结果

- `npm run typecheck`：通过。
- `npm run build`：通过（js 339.91 kB / gzip 101.94 kB，css 50.59 kB / gzip 10.39 kB）。
- 运行时用例 9/9 通过（375×812，Chromium，控制台零错误）：

| 用例 | 结果 |
| --- | --- |
| 无改动返回 | 放行至 `/profile` |
| 选「大三」后返回 | 拦截，停留 `/settings`，弹窗可见 |
| 继续编辑 | 停留 `/settings`，弹窗关闭，年级选中态保留 |
| 二次返回 | 再次拦截 |
| 确认放弃 | 跳转 `/profile`，弹窗关闭 |
| 确认修改 | toast「保存成功」→ 跳转 `/profile` |
| 消费密码设置 | 未设置 → 完成 → 「已设置」+ toast；返回触发拦截 |
| APP 引导 | 弹出 + `?overlay=app-prompt`；下载链接给出占位提示；「我知道了」关闭并清理 URL |
| `?overlay=discard` | fixture 直达可用 |

### 页面间跳转接线（本次收口）

`/profile` 的全部对外出口已逐一核对代码接线与目标路由存在性，12 条跳转全部落地，无死链、无假跳转：

| 入口 | 目标 | 依据 |
| --- | --- | --- |
| 顶栏「通知」 | `/notifications` | 本次修复，见下 |
| 头像 / 右侧铅笔 | `/settings` | 摹客「头像/资料区 → 个人设置」 |
| 三宫格 卡包 / 泡泡值 / 专属权益 | `/card` / `/points` / `/membership` | 摹客三宫格 |
| 六宫格 卡券兑换 / 订单管理 / 地址管理 | `/redeem` / `/orders` / `/address` | 摹客六宫格 |
| 六宫格 品牌福利官 / 客服中心 | `/service/welfare-officer` / `/service/chat` | 摹客六宫格 |
| 六宫格 绑定搭子 | APP 弹窗（#20），不跳页 | 摹客「绑定搭子 → APP 引导」 |
| 热门兑换「查看更多」 | `/exchange` | 摹客 |

`/settings` 三个出口：「确认修改」→ toast → `/profile`；脏数据返回 → #61 弹窗拦截；「确认放弃」→ `blocker.proceed()` 真正离开。`/membership` 顶栏齿轮 → `/settings` 亦通。

**返回路径实测（2026-08-22）**：11 个目标页（`/notifications` `/settings` `/card` `/points` `/membership` `/redeem` `/orders` `/address` `/service/welfare-officer` `/service/chat` `/exchange`）均可通过顶栏「返回」回到 `/profile`，11/11 PASS。返回由 [TitleBar.tsx](../../../src/components/mobile/TitleBar.tsx) 的 `onClick={onBack ?? (() => navigate(-1))}` 统一承载。

**修复：顶栏右上角原为死按钮。** `MobileLayout` 的 `titleBarAction === 'more'` 分支渲染了一个「更多」图标但没有 `onClick`，点击无任何反应；且摹客 05 文档的主要交互清单中并无「更多」这一项，来源不明。经确认改为通知入口：`routes.ts` 的 `titleBarAction` 类型收窄为 `'settings' | 'notifications'`，`/profile` 声明同步，`MobileLayout` 分支改为 `Bell` 图标 + `navigate('/notifications')` + `aria-label="通知"`。因 `titleBarAction` 全项目仅 `/profile` 与 `/membership` 两处使用，移除 `'more'` 不留死分支。

**已知跨任务断点：** `routes.ts` 中 `/notifications` 的 `entry` 声明为「首页/我的-通知入口」，其中「我的」侧已由本次修复打通，**首页侧仍未接线**，按约定留给 T012 处理。同时提醒：`routes.ts` 的 `entry` 字段与 `route-table.md` 的「入口」列都只是设计意图，没有任何机制保证与代码同步，不能当作接线事实使用。

### 验收方式

截图脚本 `scripts/capture-t011.mjs`，产物落 `docs/workbench/evidence/screenshots/`，与 T001/T004/T012 同范式：

```bash
npm run dev
BASE_URL=http://127.0.0.1:5173 node scripts/capture-t011.mjs
```

脚本内含断言，逐点校验 URL、pathname、弹窗可见性、选中态，并逐个点击 `/profile` 的 12 个真实入口断言落地 `pathname`；执行结果为 17 张截图落盘、零 error、零断言失败（控制台仅 React Router v7 future flag warning，属项目既有情况，每次导航 2 条）。

| 节点 | 截图 |
| --- | --- |
| #19 | `t011-19-profile.png`、`t011-19-notifications-entry.png` |
| #20 | `t011-20-app-prompt.png`、`t011-20-app-prompt-download-hint.png` |
| #59 | `t011-59-settings-default.png`、`t011-59-sheet-avatar.png`、`t011-59-sheet-nickname.png`、`t011-59-sheet-birthday.png`、`t011-59-sheet-password.png`、`t011-59-password-step2.png`、`t011-59-toast-saved.png`、`t011-59-confirm-saved.png` |
| #61 | `t011-61-dirty-year-selected.png`、`t011-61-discard-dialog.png`、`t011-61-keep-editing.png`、`t011-61-discarded-to-profile.png`、`t011-61-fixture-overlay-discard.png` |

手动验收入口：`/profile` →（头像或右侧铅笔）→ `/settings`；`/profile` → 六宫格「绑定搭子」→ APP 弹窗。两个 overlay 也可用 `?overlay=app-prompt` / `?overlay=discard` 直达；`/settings` 的返回拦截需先在页面内产生改动（如选年级）再点返回。

### 待产品确认的原型矛盾

- `routes.ts` 中 `/buddy` 的 `entry` 声明「首页/我的-绑定搭子」，与摹客「我的-绑定搭子 → APP 弹窗」冲突；当前按摹客走 APP 弹窗。
- #20 APP 弹窗的「下载链接」在原型中无跳转目标，当前实现为显式占位提示，不做假跳转。详见下节「未决项：APP 弹窗下载链接」。
- #61 放弃修改节点底层字段坐标冲突，且「确认修改」按钮在原型中重复两份、弹窗按钮溢出卡片；当前按单一有效布局还原。
- 摹客页面树名「个人设置」与页面标题「资料设置」不一致；当前标题沿用「资料设置」。
- 原型部分素材品牌名为 DearSeed，与项目名不一致，未擅自统一。

### 未决项：APP 弹窗下载链接（#20）

本节记录唯一需要产品回填后才能补接的项。**不阻塞 T011 的 `Accepted` 状态**：地址到位后按下表补接即可，无需重开本卡。

| 项 | 内容 |
| --- | --- |
| 现状 | 摹客 #20 原型中「下载链接」无任何跳转目标，仅为视觉元素 |
| 当前实现 | 点击后显示占位提示「下载地址尚未开放，待产品提供后接入。」，不绑任何跳转；不做假按钮、不做假跳转（依 `task-ledger.md` §4.3「不得以假按钮或文字说明代替交互实现」） |
| 阻塞原因 | 产品未提供 APP 下载地址，亦未确认分发形态 |
| 需产品确认 | ①下载地址（应用商店 / 官网落地页 / 应用宝等中间页）；②是否需区分 iOS 与 Android 分流；③小程序内能否直接外跳，若受限则改为「复制链接」或「引导浏览器打开」 |
| 补接位置 | [Profile.tsx:179](../../../src/pages/Profile.tsx#L179) 的 `onDownload` 回调（当前只 `setDownloadHint`）；按钮本体在 [AppPromptDialog.tsx:50-54](../../../src/components/mobile/AppPromptDialog.tsx#L50-L54)，弹窗由 `/profile?overlay=app-prompt` 承载 |
| 补接后需同步 | 本节、[evidence-matrix.md](../evidence-matrix.md) #20 行证据列 |

注：地址到位前**不要**先填一个临时或猜测的 URL。那会让当前明确的占位提示退化成一个看似可用、实则走错地方的假跳转，比现在更难被发现。
