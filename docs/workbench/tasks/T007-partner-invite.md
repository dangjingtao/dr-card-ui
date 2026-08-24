# T007｜搭子与邀请闭环

## 状态与类型

- 状态：`Accepted`（owner 于 2026-08-24 验收确认通过；9 节点邀请闭环成立，B-004 / B-005 / B-006 的残余端能力与真实业务规则继续由 `BUDDY_RULE_STATUS` 隔离，不阻塞本轮 UI 验收）
- 类型：UI / Flow
- 优先级：P1

## 当前事实与差距

- 6 条搭子路由已落地：`/buddy`（#27/#28）、`/buddy/invite`（#29）、`/buddy/invite/qrcode`（#34/#35）、`/buddy/invite/phone`（#32/#33）、`/buddy/invite/scan`（#30）、`/buddy/accept`（#36）。
- 历史 T06/T07 的二次设计**可继承部分为 0**（D-057）：200×200 二维码卡片、金色高亮话术、北极熊剪影、4 人默契值 mock 全部未采用；#28 多搭子档沿用摹客原型自身的 4 行「小美」占位，并有负向断言防历史数值偷渡。
- 空态与有态共用同一业务模型（`state/buddies.ts` 模块级共享状态 + 订阅，不持久化），仅视觉差异：空态走 `EmptyState`，有态走列表；三档夹具 `empty / list / multi`（D-058 / D-062）。
- 三件分享事（保存海报 / 复制链接 / 手机号邀请）统一走 `adapters/buddyShare.ts` 单一出口，`SHARE_LATENCY=600`、`SEARCH_LATENCY=500`，无随机（D-060）。
- 失败态**只由 `?state=` 复现**，页内真实操作恒成功（D-056，owner 定案）；未接 `navigator.clipboard`，避免成败随 https/权限环境漂移。
- #30 按 owner 定案实现为「WebView 边界页 + 唤起弹窗」两态（D-055）：未装 APP 渲染显式「应用商店H5」边界占位，已装 APP 弹出唤起对话框；不伪造任何商店视觉，有负向断言。
- 仍缺原型依据、已登记未实现：搭子数量上限与列表排序、解绑/移除搭子入口、相册保存权限与剪贴板真实写入、APP 唤起 scheme 与商店包信息、正式搭子头像素材（现用摹客自带图库占位照）——见 `BUDDY_RULE_STATUS` 4 条。
- **#31 搭子默契值零入口**：页面无默契值文案，`--color-buddy-mutual` 仅保留命名 Token 且禁止页面引用（D-059）。

## 目标

完成无搭子、已有搭子、二维码/链接/手机号邀请、接受邀请和无 APP 承接的完整闭环。

## 原型范围

- #27 搭子（无）
- #28 搭子（有）
- #29 邀请搭子
- #30 邀请搭子（没 APP）
- #32 手机号邀请
- #33 手机号邀请成功
- #34 二维码保存到本地
- #35 生成分享链接
- #36 接受邀请

## 不在范围

- #31 搭子默契值明确“先不做”，进入 T014。
- 不实现真实通讯录、短信、系统分享或下载能力；用明确适配层模拟结果。

## 依赖与阻塞决策

- 依赖 T002–T004（已完成）。
- #27/#28 页面结构与数据口径已由 D-057 / D-058 确认；**搭子数量上限、列表排序、解绑入口仍缺依据**（B-004 残余）。
- #29 邀请卡片/IP 视觉的可继承部分已由 D-057 判定为 0；历史 mock 数据未进入任何默认态（负向断言守护）。
- 端能力口径（相册权限、剪贴板、APP 唤起、商店包信息）与正式头像素材仍缺依据（B-005 残余）。

## 实施要求

- 空态与有态共用业务模型但保留视觉差异。
- 邀请二维码、复制链接、保存图片和手机号邀请都有成功/失败反馈。
- 被邀请人路径明确已登录/未安装 APP 的承接差异。
- 使用 deterministic fixture 控制无搭子、单搭子、多搭子和邀请结果。

## 状态与交互矩阵

- 无搭子 / 有搭子。
- 二维码生成 / 保存成功 / 保存失败。
- 链接复制成功 / 失败。
- 手机号默认 / 搜索中 / 未找到 / 可邀请 / 已邀请 / 成功。
- 接受邀请确认 / 取消 / 成功 / 无 APP。

## 验收标准

- 9 个节点逐一可定位并连成闭环：#27 `/buddy?state=empty`、#28 `/buddy` 与 `?state=multi`、#29 `/buddy/invite`、#30 `/buddy/invite/scan?state=no-app|has-app`、#32 `/buddy/invite/phone`（+ `searching|invitable|not-found|invited`）、#33 `?state=success&phone=13900000000`、#34 `/buddy/invite/qrcode?state=saved|poster-failed`、#35 `?state=link-copied|link-failed`、#36 `/buddy/accept`（+ `?state=dismissed`）。
- 不出现 #31 默契值功能入口或历史 4 人 mock 数据偷渡（脚本负向断言：默契值文案数 = 0、历史数值 `98|86|72|55` 数 = 0、非「小美」行数 = 0）。
- 分享类操作有实际反馈和可复现失败态（「处理中…」过程态 + 成功弹窗/轻提示；失败态由 `?state=` 复现）。
- 返回路径、取消路径和重复邀请处理明确（#33「我知道了」回 `/buddy`；#30 取消回边界页；#36 关闭落 `?state=dismissed`；同号二次搜索变「已邀请」且不再暴露「发送邀请」）。

## 必交证据

- 历史稿可继承/不可继承决策记录。
- 9 节点截图和邀请闭环操作记录。
- 分享/搜索失败态截图。
- 类型检查、构建和控制台结果。

### 交付情况（2026-08-24）

| 必交项 | 已交付 |
| --- | --- |
| 历史稿继承决策记录 | [decisions/T007-partner-invite.md](../decisions/T007-partner-invite.md)（D-055–D-066）。D-057 判定历史 T06/T07 可继承部分为 0；关闭 B-006（T007 侧）、部分关闭 B-004 / B-005，残余项回登 `decisions/README.md` §2 |
| 9 节点截图 | 20 张 `docs/workbench/evidence/screenshots/t007-*.png`：`27-buddy-empty`、`28-buddy-single`、`28-buddy-multi`、`29-buddy-invite`、`30-scan-no-app`、`30-scan-has-app`、`32-phone-invite-{idle,not-found,invited,invitable,repeat}`、`33-phone-invite-success`、`34-share-poster-{saved,failed}`、`35-share-link-{copied,failed}`、`36-buddy-accept{,-bound,-dismissed}`、`debug-buddy` |
| 邀请闭环操作记录 | `BASE_URL=http://127.0.0.1:5211 node scripts/capture-t007.mjs` exit 0，5 条闭环全通：① #29「保存到本地」→「处理中…」→ `/buddy/invite/qrcode?state=saved`；② #29「复制链接」→ `?state=link-copied` + 轻提示；③ 手机号 `13900000000` 搜索 →「正在搜索…」→ 可邀请 → 发送 → `#33 ?state=success` →「我知道了」回 `/buddy` → 同号二次搜索变「已邀请」且「发送邀请」按钮数 = 0；④ #30「打开 APP」→ `/buddy/accept`；⑤ #36「接受邀请」→ 回 `/buddy` 且搭子行 = 1（空态 → 有态） |
| 失败态截图 | 分享失败 `t007-34-share-poster-failed.png`（「海报保存失败，请检查相册权限后重试」）、`t007-35-share-link-failed.png`（`role=alert`「链接复制失败，请稍后重试」）；搜索失败 `t007-32-phone-invite-not-found.png`（「没有找到该用户，请核对手机号后重试」）、重复邀请 `t007-32-phone-invite-invited.png` |
| 交互与负向断言 | 同脚本 32 条断言全 PASS：#27 空态列表 0 行且保留 2 个邀请入口、#28 单档 1 行 / 多档 4 行 + 功能介绍 3 条、#30 伪造商店元素（`App Store\|安装\|下载卡博士`）计数 0 且有显式边界标注、#36 关闭图标 1 个且 `?state=dismissed` 弹窗残留 0；调试面板状态胶囊数 `/buddy`=4、`/buddy/invite/qrcode`=5、`/buddy/invite/phone`=6、`/buddy/invite/scan`=3、`/buddy/invite`=0 个面板（未登记 states，D-064）、`/buddy/accept`=1 个面板（唯一来自背景层 `DearseedColumn`，避免两个 `fixed bottom-0` 重叠） |
| 类型检查与构建 | `npm run typecheck`（`tsc --noEmit`）exit 0，无报错；`npm run build` exit 0，`✓ built in 2.05s`，产物含本任务新增资产 `buddy-ip-shower`、`buddy-avatar-xiaomei`、`buddy-avatar-self` |
| 控制台 | 脚本采集全程无 error / warning；仅 46 条项目既有的 React Router v7 future flag 噪音，与 T007 无关 |
| 证据矩阵回链 | [evidence-matrix.md](../evidence-matrix.md) T007 区段 9 行已由 `Missing / 阻塞` 升为 `Implemented / 未验收`，逐节点附可达 URL 与决策/风险引用 |

## 产出

- 搭子页面、邀请组件、分享适配层和验收证据。

### 实际产出文件

- 页面：`src/pages/Buddy.tsx`（#27/#28）、`src/pages/BuddyInvite.tsx`（#29）、`src/pages/BuddyShareResult.tsx`（#34/#35）、`src/pages/BuddyPhoneInvite.tsx`（#32/#33）、`src/pages/BuddyScanLanding.tsx`（#30）、`src/pages/BuddyAccept.tsx`（#36）
- 适配层：`src/app/adapters/buddyShare.ts`（`saveInvitePoster` / `copyInviteLink` / `getInviteLink` / `sendPhoneInvite`，分享类操作的唯一出口）
- 共享状态：`src/app/state/buddies.ts`（模块级 `buddies` / `invitedPhones` + 订阅，不持久化，刷新回夹具初值）
- 夹具：`src/app/fixtures/index.ts` T007 区段（`BUDDY_LIST_SINGLE/MULTI`、`BUDDY_EMPTY_COPY`、`BUDDY_INVITE_ENTRIES`、`BUDDY_FEATURE_INTRO`、`BUDDY_INVITE_COPY`、`BUDDY_SHARE_FEEDBACK`、`BUDDY_SEARCH_OUTCOMES`、`BUDDY_SEARCH_SAMPLE_PHONES`、`BUDDY_SEARCH_FEEDBACK`、`resolveBuddySearchOutcome`、`BUDDY_INVITE_LINK`、`BUDDY_RULE_STATUS`）
- 路由：`src/app/router/routes.ts` T007 区段（6 条路由 + `states` 登记 + `/buddy/accept` 的 `titleBar: 'plain'`）、`src/app/router/index.tsx` 注册
- Token：`src/styles/card-brand.css` §5 注释按 D-057 / D-059 更新（`--color-buddy-mutual` 仅预留命名，禁止页面引用）
- 资产：`docs/design/assets-inventory.md` §2.6 更正、§2.14 新增；`scripts/extract-mockplus-assets.mjs` 增补 3 条搭子头像条目（D-066）
- 脚本：`scripts/capture-t007.mjs`
