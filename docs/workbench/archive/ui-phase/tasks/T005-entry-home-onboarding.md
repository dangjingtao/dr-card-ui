# T005｜专栏首页与新人流程

## 状态与类型

- 状态：`Accepted`（owner 于 2026-08-24 确认整卡通过；9 个节点 9/9 收口，当前实现为正确事实源）
- 类型：UI / Flow
- 优先级：P0

## 当前事实与差距

- 根首页（`/`）已按「不靠谱的设计历史/首页.html」实现（用户 2026-08-21 确认，决策 D-006）：状态栏/标题/搜索+头像/黑金签到 Banner/4 宫格/3 白卡/福袋 FAB，素材同源（`src/assets/brand/home/`）。
- 首页入口已接通项目路由（Banner/宫格→`/checkin`、福袋→`/redeem`、头像→`/membership`、品牌卡→`/brand-culture`）；底部 4 Tab 按 D1 决策由壳层承载。
- 完善信息（#14/#24）已按 reference 消费密码.html 标准页实现（D-008，路由 `/onboarding`）：头像上传 + 昵称/生日/身份（学生/教职工）/性别/消费密码（6 位）+ 确认信息。
- 新人弹窗（#12）、引导弹窗（#13）已于 2026-08-22 补尾交付并通过 owner 验收：由首页（`/`）承载 `?overlay=newcomer` / `?overlay=app-guide` 真实弹窗，不再是夹具占位壳（详见下方补尾记录）；#23 领取完首页状态、#15/#25 领取成功弹窗已于 2026-08-22 落地并通过 owner 验收；**#2 诗得丽专栏与 #16 品牌文化已于 2026-08-24 按 owner 定案补齐/施工，等级由 `Partial`/`Missing` 升为 `Implemented`**（#2 补顶部 Banner 轮播与「为你精选」；#16 只铺原型长图、无浮动 CTA，B-001 关闭）。
- `T01-A-info-architecture.md` 已记录完善信息分步流程，但尚未变成 UI；旧文档中的 `PASS` 仅代表该决策记录，不代表整卡验收。

## 目标

完成从诗得丽专栏进入、新人权益引导、资料补全到领取成功，并回到已领取首页状态的闭环。

## 原型范围

- #2 诗得丽专栏
- #12 新人弹窗
- #13 引导弹窗
- #14 完善信息
- #15 领取成功
- #16 品牌文化
- #23 领取完首页状态
- #24 完善信息（学生）
- #25 填写完成后领取成功

## 不在范围

- 会员打卡与澡运进入 T006。
- 商城、卡包、订单进入 T008–T010。

## 依赖与阻塞决策

- 依赖 T002–T004。
- #14/#24 按已确认分步 onboarding 决策实现。
- #16 品牌文化历史深色长页与浮动 CTA 未确认，先形成决策记录。

## 实施要求

- 首页必须还原原型入口优先级、品牌素材和领取前后差异，不用通用卡片拼贴代替。
- 完善信息覆盖基本信息、学生/教职工分支、消费密码、校验和放弃/返回。
- 领取成功状态必须明确权益去向，并能进入会员、卡包或兑换后续入口。
- 所有 CTA 有实际目标；未接后续模块时用明确 fixture，不做假按钮。

## 状态与交互矩阵

- 新用户 / 已完善资料 / 已领取。
- 学生 / 教职工身份分支。
- 表单默认 / 填写 / 校验错误 / 提交中 / 提交成功。
- 新人弹窗打开、关闭、去完善；APP 引导确认/取消。
- 品牌文化进入与返回。

## 验收标准

- 9 个节点逐一可定位并与原型对照。
- 新人主链路可从 #2 连续走到 #25/#23，无手工改代码。
- 表单错误不会清空已填内容，返回/放弃行为符合决策。
- 首页不是当前粗骨架水平，主视觉、入口、状态和品牌资产均有证据。

## 必交证据

- 9 节点路由/状态清单。
- 新人完整流程录屏或逐步截图。
- 领取前后首页对照、表单分支/错误截图。
- 品牌文化决策记录、原型差异、构建结果。

## 产出

- 页面、表单状态、决策记录、验收证据。

## 施工进度（2026-08-22）

本轮按用户指令只做「领取成功、领取后首页状态、表单提交闭环」，#16 品牌文化页不碰。

已完成：

- #2 首页新增「本期活动」区块（`Section` + 缩略图 + 进度条 + 主按钮），数据来自 `CAMPAIGN_FIXTURE`。
- #23 `/?state=claimed`：主按钮 前往领取 → 已领取（disabled outline）。
- #15 `/claim/success`、#25 `/onboarding/success`：同一个 `ClaimSuccess` 按 `from` 分支文案。**形态为「诗得丽专栏首页 + 遮罩 + 居中成功弹窗」**（详见下方返工记录），关闭统一回 `/?state=claimed`。
- #14/#24 `/onboarding`：身份改为原型口径「学生 / 教职工」，选「学生」展开年级 2 列网格（大一–大五、研一–研三），切换教职工清空年级；昵称与消费密码校验错误提示（`aria-invalid` + `aria-describedby`）；提交中态用 `Button loading`，600ms 确定性延时后进入 #25。
- `routes.ts` 的 T005 区段原本已登记 `/?state=claimed`、`/onboarding?state=student`、`/claim/success`、`/onboarding/success`；返工时仅在本区段给两条 success 路由补 `titleBar: 'plain'` + `titleBarTitle: '首页'`，未触碰公共区段。

修正记录：

- 原「身份：学生 / 职场」为历史稿口径，本轮按 `docs/prototype/01-entry-and-home.md` 更正为「学生 / 教职工」。

未做与待确认：

- #12 新人弹窗、#13 引导弹窗不在本轮指令范围。
- #16 品牌文化页维持阻塞（深色长页与浮动 CTA 未确认）。
- 消费密码强度与重复提交规则未确认，未定稿。

## 返工记录（2026-08-22，owner 第一次验收后）

owner 指出两处必须修，均已完成并复测：

1. **#15/#25 容器形态不对**（原实现是带返回标题栏的独立空白页面）。原型是「首页背景上的成功弹窗」，已改为 `ClaimSuccess` 内先渲染 `<Home />` 作背景，再叠既有 `PromptOverlay`（遮罩 + `role="dialog"` 居中卡片，样式对齐 T011 #61 的 `border border-[#797979] bg-surface shadow-modal`，不自造第二套弹窗视觉）。路由按 owner 意见保留，仅在 T005 区段补 `titleBar: 'plain'` + `titleBarTitle: '首页'`，使标题栏与首页一致、不出返回箭头。此形态与 `docs/prototype/01-entry-and-home.md` §5「成功弹窗提醒」、§6「点击关闭 → 回到专栏首页 / 主按钮从前往领取变为已领取」一致。
2. **`/onboarding/success` 暴露 `fixture：?from=...` 调试文字**，已从用户界面删除（连同 `fromParam`/`other` 中间变量）。调试信息仍只由 `DebugPanel` 承载。

已确认的产品口径（owner 结论，不再自行补写规则）：

- #14 **不复用** T011 的 #61 放弃修改弹窗；Onboarding 返回直接回诗得丽专栏。原「需用户决策」条目就此关闭。
- 年级、生日、性别**保持非必填**，不新增校验。

为防回归，`scripts/capture-t005.mjs` 新增 `assertOverlayShape()`，对 #15、#25 各断言 4 项：`role=dialog` 可见、首页背景（「本期活动」标题）可见、`[data-title-bar="back"]` 计数为 0、`fixture：?from=` 文案计数为 0；两处关闭点击收窄为 `getByRole('dialog').getByRole('button', { name: '关闭' })`，避免与背景首页按钮产生 strict-mode 冲突。

已知偏差（未自行修改，交由 owner 决策）：

- `/claim/success`、`/onboarding/success` 渲染首页背景时**不显示底部 Tabbar**，因 `isTabPath()` 仅匹配 `/` 与各 Tab 路径前缀。修它需改 `routes.ts` 公共区段，与「只改本任务区段 + 不改 Tabbar」约束冲突，故保持现状。

证据：

- 截图：`docs/workbench/evidence/screenshots/t005-*.png`（14 张，375×812，返工后已全部重新生成）。
- 交互脚本：`scripts/capture-t005.mjs`，运行 `BASE_URL=http://127.0.0.1:5174 node scripts/capture-t005.mjs`，退出码 0，12 条断言全部通过：

  ```
  #15 容器形态: 弹窗=true 首页背景=true 返回标题栏=0 调试文字=0
  #15 关闭后回到首页主按钮: 已领取
  #14 空表单提交校验: 昵称错误=true 密码错误=true URL=/onboarding
  #24 年级选项数: 8
  ?state=student 直达学生态: 年级可见=true
  提交中态可见: true
  #25 容器形态: 弹窗=true 首页背景=true 返回标题栏=0 调试文字=0
  #25 关闭后回到首页主按钮: 已领取
  ```

- 脚本末尾「控制台问题 18 条」经逐条核对**全部为 React Router v7 future flag 警告**（`v7_startTransition`、`v7_relativeSplatPath`），属项目全局既有提示，无 `[assert]` 失败、无 error/pageerror，非本轮回归。
- 构建：`npm run build`（含 `tsc --noEmit`）通过。

## 验收结论（2026-08-22）

owner 确认：**本轮范围完成**（#14 #15 #23 #24 #25 判通过，矩阵等级升为 `Verified`）。

整张 T005 **不结束**：#12 新人弹窗、#13 引导弹窗、#16 品牌文化页尚未完成，其中 #16 仍处决策阻塞。

## 补尾交付：#12 新人弹窗 / #13 引导弹窗（2026-08-22）

本轮按用户指令只施工 #12、#13，**#16 品牌文化继续阻塞、未动一行**。

### 依据

`docs/prototype/01-entry-and-home.md`：

- §2 新人弹窗：「见面礼已送达」；完善个人信息并打卡可得洗护小样等新人福利；主操作「去完善信息」→ 完善信息页；remark 注明**点击弹窗本身可继续查看 APP 下载引导**。
- §3 引导弹窗：TIPS 弹窗，文案强调 APP 内有双倍泡泡积分/更多养护福利，并提供下载链接（→ 应用商店）。

### 改动清单

- `src/app/fixtures/index.ts`（**仅 T005 区段末尾追加**）：新增 `NEWCOMER_FIXTURE`、`APP_GUIDE_FIXTURE`，逐条带原型出处注释与未定稿标注。
- `src/components/mobile/NewcomerDialog.tsx`（新建）：#12 内容层，复用既有 `PromptOverlay`（遮罩 + `role="dialog"` 居中卡片），样式串对齐 `ClaimSuccess`／T011 #61，不自造第二套弹窗视觉。
- `src/pages/Home.tsx`：接 `useOverlay()`，挂载 `NewcomerDialog` 与 `AppPromptDialog`；用 `ownedOverlay` 布尔量让 `FixtureOverlay` 在这两个 key 上让位，其余未施工 overlay 仍走 T004 夹具壳。
- `scripts/capture-t005.mjs`：新增 6 段截图与 10 条断言（累计 20 张截图 / 22 条断言）。
- `routes.ts` **零改动**：`/` 路由早已登记 `{ key: 'newcomer', node: 12 }`、`{ key: 'app-guide', node: 13 }`。
- `AppPromptDialog.tsx`、`PromptOverlay.tsx`、`FixtureOverlay.tsx`、Header/Tabbar/PageContainer/ComDesign/全局 Token **均零改动**。

### 复用而非重造

#13 直接复用 T011 #20 已有的 `AppPromptDialog`：其 TIPS 标题 + 气泡图 + `downloadHint`（`role="status"`）+「下载链接」/「我知道了」双按钮与原型 §3 一一对应，仅由 props 注入 T005 自己的文案，未新建任何 TIPS 视觉。

### 未确认规则的处理（不自行补写）

- **应用商店下载地址未确认**：沿用 T011 既有口径，点「下载链接」只提示「下载地址尚未开放，待产品提供后接入。」，不编造 URL、不接假链接。
- **新人福利清单细则、弹窗逐字长文案原型未定稿**：只落原型已明确的话术要点，夹具内以 `⚠️` 标注不定稿。

### 实现中的一处自查修复

`NewcomerDialog` 首版用 `role="button" tabIndex={0}` 包裹整个弹窗主体来承接「点击弹窗」交互，会触发 ARIA **presentational children** 规则，导致内部 `<h2>`/`<p>` 语义被吞、无法按 role 定位。已改为普通 `<div onClick>` 承接点击，提示文字改为独立 `<button>` 并 `stopPropagation()`；「去完善信息」按钮同样 `stopPropagation()`，避免误触发链式跳转。

### 证据

- 截图：`docs/workbench/evidence/screenshots/t005-*.png`（20 张，375×812），本轮新增 `t005-12-newcomer.png`、`t005-12-13-chain-app-guide.png`、`t005-12-to-onboarding.png`、`t005-13-app-guide.png`、`t005-13-download-hint.png`、`t005-13-close-back-home.png`。
- 交互脚本：`scripts/capture-t005.mjs`，运行 `BASE_URL=http://127.0.0.1:5177 node scripts/capture-t005.mjs`，退出码 0，22 条断言全部通过，本轮新增部分日志：

  ```
  #12 新人弹窗: 见面礼已送达=true 首页背景=true 去完善信息=true 夹具占位壳=0
  #12 点击弹窗链到 #13: TIPS=true URL=?overlay=app-guide
  #12 去完善信息跳转: /onboarding
  #13 引导弹窗: TIPS=true 双倍泡泡积分文案=true 夹具占位壳=0
  #13 下载链接提示可见: true
  #13 关闭后弹窗数: 0
  ```

- 脚本末尾「控制台/断言问题 24 条」经分解核对**全部为 React Router v7 future flag 警告**（12 条 `v7_startTransition` + 12 条 `v7_relativeSplatPath`），属项目全局既有提示，无 `[assert]` 失败、无 error/pageerror，非本轮回归。
- 构建：`npm run build`（含 `tsc --noEmit`）通过。

### 顺带印证的既有偏差归因

#12/#13 截图中首页背景**自带底部 Tabbar**（`/` 属 Tab 路径），这反向印证 `/claim/success`、`/onboarding/success` 缺 Tabbar 确实源于 `isTabPath()` 未收录这两条独立路由，而非页面实现问题。该修复需改 `routes.ts` 公共区段，仍保持现状交由 owner 决策。

### 残留

- **#16 品牌文化页维持阻塞**：T13 深绿深色长页与浮动 CTA 方向未确认，本轮未施工、未推断。整卡在 #16 决策落地前不结束。
- #2 诗得丽专栏仍为 `Partial`（Banner 轮播、为你精选未做）。
- 消费密码强度与重复提交规则仍未确认。

## 第二次验收结论（2026-08-22，owner 复核补尾交付）

owner 逐节点结论：

| 节点 | 结论 | 说明 |
| --- | --- | --- |
| #12 新人弹窗 | **通过** | 实测 #12 → #13 链式跳转、#12 → 完善信息、关闭弹窗均正常 |
| #13 APP 引导弹窗 | **通过** | 实测下载提示、关闭均正常 |
| #14 #15 #23 #24 #25 | 维持已通过 | 沿用第一次验收结论，本轮无回归 |
| #2 诗得丽专栏 | 仍为 `Partial` | 缺**顶部 Banner 轮播**、**「为你精选」**（原型 §1 页面内容第 2、6 条） |
| #16 品牌文化 | 未施工 | 仍是占位页，且**设计方向待确认**（B-001） |

工程校验：`npm run typecheck` 与 `npm run build` 均通过，无运行错误。

**当前进度：9 节点中 7 个可通过。整卡维持 `Doing / Blocked`**，结束条件只剩两项：

1. **补齐 #2 首页剩余内容**（Banner 轮播、为你精选）——存在需 owner 拍板的口径问题，见下方「#2 剩余内容缺口」。
2. **owner 确认 #16 采用哪种品牌文化设计后再施工**——B-001 未决，见下方「#16 待决策项（B-001）」。

### 文档修正（owner 指出，非阻塞）

- 本卡「当前事实与差距」原写「身份（学生/职场）」为旧文案，实际实现早已按摹客口径为「学生 / 教职工」，已更正。上方「修正记录」章节中对旧口径的引用属历史记录，保留不改。

### #2 剩余内容缺口（施工前需确认的口径）

原型依据：`docs/prototype/01-entry-and-home.md` §1「页面内容」第 2 条「顶部 Banner 轮播展示产品信息或最新活动」、第 6 条「『为你精选』展示诗得丽商品售卖或泡泡值兑换内容」。

已核查的现状与缺口：

- **与 D-006 已确认首页的关系待明确**：根首页当前按 D-006（用户 2026-08-21 确认的历史稿黑金版）实现，顶部已有**一张静态**「黑金签到 Banner」。摹客要求的是**轮播**。是把该 Banner 升级为轮播首帧，还是在其之上另置一条轮播，属改动已确认视觉的决策，不自行选定。
- **轮播素材不足**：`docs/design/assets-inventory.md` 中标注可用于 #2 的 Banner 素材仅 `6.jpg`（2685×1790，高清）与 `88ba4d30-653c-11f1-bd33-7bdcb357e944.png`（375×210，**⚠️ 1x 偏低清，Banner 施工需 ≥2x**）。轮播至少需 2 帧且清晰度一致，当前素材不满足。
- **「为你精选」商品清单未定**：原型只给模块名与用途，未给 SKU、价格或泡泡值。同类问题在打卡页已登记为 B-018（`CHECKIN_PICKS` 以隔离夹具处理）。首页是否沿用同一隔离口径、还是复用 T008 兑换商品夹具，需确认。

### #16 待决策项（B-001）

已核查事实：

- 摹客原型对 #16 的全部确认内容只有一句：`docs/prototype/01-entry-and-home.md` §7「长页面展示品牌文化内容。」入口为首页金刚区「品牌文化」，返回首页（`docs/workbench/route-table.md`）。
- 路由 `/brand-culture` 已注册，当前为占位页。
- 素材已就位：`docs/design/assets-inventory.md` §2.7 `ef4c2310-6605-11f1-bc47-a5b4fa35a797.png`，1683×5950 高清长图，策略「分段裁切」，备注「⚠️ T13 待确认后施工」。
- 历史稿 T13 的**深绿 KV、深色长页、暖金高亮、右下 56×56「立即体验」浮动 CTA 均为历史稿自行设计**，摹客未确认（`docs/prototype/README.md`、`01-entry-and-home.md` 风险行）。

因此唯一缺口是**视觉方向拍板**，按 AGENTS.md 第 5 节不自行补齐主视觉方向，等 owner 决策后施工。

## 收尾交付：#2 剩余内容 + #16 品牌文化（2026-08-24）

owner 就上方两处缺口逐项拍板，本轮据此施工，未再自行推断任何未确认规则。

### owner 定案（本轮唯一施工依据）

| 缺口 | owner 定案 | 登记 |
| --- | --- | --- |
| #16 品牌文化视觉方向 | **只铺原型长图，无浮动 CTA**（T13 深绿深色稿与右下 56×56「立即体验」浮动按钮均不继承） | **B-001 关闭** → D-051 |
| #2 Banner 与已确认黑金 Banner 的关系 | **黑金 Banner 之上另加一条轮播**（D-006 黑金签到 Banner 保留、顺次下移，不改其视觉） | D-052 |
| #2「为你精选」数据 | **按原型**（清单/名称/描述/价格照抄摹客，不自行统一、不复用 T008 夹具） | D-053 |

### 事实源核对

直接读取摹客页面数据而非凭历史稿推断：

- #2：`mRzKbV3B_.js` —— 顶部 `carouselChart` @(0,88)，2 帧，`interval 3000` / `speed 700`，整体 click → 新人弹窗 `A2UYnlovN`；「为你精选」双卡，价格 `200🫧`，「去兑换」→ 商品兑换弹窗 `2OEnW_WOlm`。
- #16：`D1gOOzGEq.js` —— 全页**只有一张长图**（源 1683×5950），@(0,88) 以 375×1326 `lockedRatio` 铺满 1414 高 artboard，**全页 button 计数为 0**（这条即 owner 定案「无浮动 CTA」在原型侧的客观印证）。
- 底色：摹客 artboard `rgb(252,250,246)` 与项目 `bg-background`（`--warm-50` = `#FCF8F1`）同属暖白，直接消费既有 Token，未引入私有底色。

### 改动清单

- `scripts/extract-mockplus-assets.mjs`（新建）：从摹客镜像按 hash 迁入 4 个 PNG 到 `src/assets/`，脚本留痕以便后续换 ≥2x 素材时复跑。
- `src/components/mobile/BannerCarousel.tsx`（新建，120 行）：自动轮播 + 指示点 + 整体点击回调，`data-carousel-slide` / `data-carousel-dot` 供取证定位。
- `src/app/fixtures/index.ts`（**仅 T005 区段**）：新增 `HOME_BANNER_CAROUSEL`、`HomePick` / `HOME_PICKS`，逐条带摹客出处注释。
- `src/pages/Home.tsx`：轮播插入到黑金签到 Banner **之上**（按 D-052），底部新增「为你精选」section（`data-home-pick`）。
  - 后续修正（D-054）：APP 首页 `/` 与诗得丽专栏 `/dearseed` 拆为并列独立业务页后，「本期活动」「为你精选」及 #12/#13 弹窗已迁至 `src/pages/DearseedColumn.tsx`，取证钩子相应改为 `data-dearseed-pick`、轮播 label 改为「诗得丽专栏活动轮播」（单帧、无指示点）。本行保留当时口径以存留痕。
- `src/pages/BrandCulture.tsx`（新建）：`PageContainer inset={false}` + 单张长图 `className="block w-full"`，页内 0 button，返回栏沿用 MobileLayout 统一提供。
- `src/app/router/index.tsx`：`customPages` 增 `'/brand-culture'`（32 → 33 项）。
- `src/app/router/routes.ts`（**仅 T005 区段**）：`/brand-culture` 的 owner 备注改为已定案口径，路由结构零改动。
- Header / Tabbar / PageContainer / TitleBar / MobileLayout / ComDesign / 全局 Token **均零改动**。

### 未确认项仍未静默统一

- **#16 文案三口径冲突**：页面树「品牌文化」/ 导航栏「核心文化」/ 素材名「核心品牌vi8.16」。未自行选定，已在 `BrandCulture.tsx` 注释与矩阵 #16 行留痕。
- **#2 轮播第二帧原型素材为空**：按「不补图、不删帧」保留占位帧，不编造第二张 Banner。
- **⚠️ 清晰度**：轮播第一帧源图仅 375×210（1x），已在 `docs/design/assets-inventory.md` §3 登记待 ≥2x 替换。
- **⚠️ 长图为整张位图**：图内文字不可选中/搜索，但拆图重排属重新设计版式，未自行拆。
- B-018（商品清单/价格口径）沿用照抄原型，未跨卡统一。
- 消费密码强度与重复提交规则仍未确认。

### 取证方式的一处修正

首轮 #16 返回断言报 `实际 /onboarding/success`。读源码定位到 `TitleBar` 第 50 行 `onClick={onBack ?? (() => navigate(-1))}` —— 返回是 **history back**，属全局既有行为、不在本卡修改边界。故**改脚本而非改禁改层代码**：改走真实入口链路（首页「诗得丽品牌专栏」入口 → `/brand-culture` → 点返回），与摹客 remark「点击左上角的返回按钮回到主页面」对齐。直接 `page.goto('/brand-culture')` 只会退回脚本上一步地址，不代表真实链路；页面本身无缺陷（#16 另 5 项断言首轮即通过）。

### 证据

- 截图：`docs/workbench/evidence/screenshots/t005-*.png`（**27 张**，375×812），本轮新增 `t005-02-home-banner-carousel.png`、`t005-02-carousel-to-newcomer.png`、`t005-02-home-picks.png`、`t005-02-picks-to-redeem.png`、`t005-16-brand-culture-top.png`、`t005-16-brand-culture-bottom.png`、`t005-16-brand-culture-back-home.png`。
- 交互脚本：`scripts/capture-t005.mjs`，运行 `BASE_URL=http://127.0.0.1:5177 node scripts/capture-t005.mjs`，退出码 0，本轮新增断言日志：

  ```
  #2 Banner 轮播: 可见=true 帧数=2 指示点=2 位于黑金 Banner 之上=true
  #2 轮播点击跳转: URL=?overlay=newcomer
  #2 为你精选: 卡片数=2 去兑换按钮=2 价格 200🫧=true
  #2 去兑换跳转: /exchange?overlay=redeem
  #16 品牌文化: 长图=true 全宽铺满=true(w=375) 页内按钮=0 返回栏=1 占位文案=0
  #16 入口→返回: / → /brand-culture → /
  ```

- 脚本末尾「控制台/断言问题 30 条」经过滤核对**全部为 React Router v7 future flag 警告**（15 条 `v7_startTransition` + 15 条 `v7_relativeSplatPath`），属项目全局既有提示，无 `[assert]` 失败、无 error/pageerror。
- 构建：`npm run typecheck` 与 `npm run build` 均退出码 0。4 个新素材确认进入产物：`home-banner-carousel` 129.11 kB、`exchange-pick-shampoo-a` 64.09 kB、`exchange-pick-shampoo-b` 47.79 kB、`brand-culture-longpage` 653.84 kB；`index.js` 412.35 kB / gzip 121.74 kB。
- 排除过一次**并发编辑污染**导致的假失败：某次运行出现 `[hmr] Failed to reload /src/pages/MembershipLevels.tsx` + 500 连带打挂 #12 三条断言。该文件不属 T005 范围，`npm run typecheck` 退出码 0 后重跑，6 条问题全部消失，未改动该文件。

### 状态

- #2、#16 等级由 `Partial` / `Missing` 升为 `Implemented`，`Partial` 全局归零（矩阵快照已同步：11 + 28 + 0 + 0 + 21 = 60）。
- #2、#16 在本轮施工完成时等待 owner 复核；该等待已由下方最终验收结论关闭。

## 最终验收结论（2026-08-24）

owner 明确确认 T005 整卡通过。#2、#16 与此前已通过的 7 个节点统一按当前实现验收，T005 以 **9/9** 收口；当前仓库实现为正确事实源，历史过程记录不再作为本卡阻塞条件。

## 后续影响留痕：T021 金刚区删除（2026-08-27，D-080）

T021 按需求 §2.2 删除了根首页 `/` 的金刚区（D-072），连带影响本卡取证脚本：

- `scripts/capture-t005.mjs` 原先通过点击首页金刚区的「诗得丽品牌专栏」卡片进入 `/dearseed`，该卡片随金刚区一并移除后该步骤失效（已用 `git show HEAD:src/pages/Home.tsx` 核实旧版确有此卡片，属金刚区一部分；非弹窗遮挡问题，加 `?newcomer=off` 等参数无效）。
- 修正方式：改为 `await go('/dearseed?overlay=reminder')` 直连专栏页，仅验证专栏侧提示层与关闭出口，脚本重跑退出码 0。
- **本卡历史验收结论不回改**：T005 仍为 `Accepted` / 9-9 收口。此处仅记录入口路径变更的事实，避免后续误以为脚本改动意味着 T005 验收失效。

