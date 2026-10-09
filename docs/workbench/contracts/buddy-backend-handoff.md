# 洗头搭子一期｜后台 × H5 联调协议（待后台确认）

> 状态：**协议提案 / 待后台 Owner 签署**，不是已存在的 API 文档。
> 产品依据 [#102](https://github.com/dangjingtao/dr-card-ui/issues/102)，后台交接台账 [#105](https://github.com/dangjingtao/dr-card-ui/issues/105)，H5 二维码 [#107](https://github.com/dangjingtao/dr-card-ui/issues/107)，H5 手机号/通知 [#111](https://github.com/dangjingtao/dr-card-ui/issues/111)。
> 后台源代码由后台同事负责，H5 不修改 `kbs/API`。#104 Friends 权限调查整改曾被暂停，**未视为通过**。

## 人话：我们需要后台做什么

1. 给当前登录用户提供**唯一、长期不变**的二维码数据；产品只有**一张邀请二维码**，不是两种码。二维码必须最终编码一个可以从微信打开的**官方 HTTPS URL**（微信只显示引导页）。
2. App 内扫码后查询发起人真实头像、昵称、是否已是搭子；**查询、取消不建立关系**。
3. 被邀请人点确认后，由后台核实其**真实登录身份**，建立双方都能看到、刷新和重登仍存在的**一段**搭子关系；不能自邀、不能重复、不能伪造别人同意。
4. 完整手机号搜索已注册用户，展示本人可见的公开昵称头像与邀请状态；支持发送一次长期待处理的定向邀请，进入 App 通知中心供对方查看和确认。
5. 二维码和手机号共享最终关系。确认成功后，关联手机号未处理邀请自动完成，历史通知仍可查看，重复点击不能再绑定。

## API 合同表：后台请逐项回填（路径均**未确定**）

| H5 动作 | 推荐 method | H5 输入（草案） | 需要的后台输出（草案） | 约束 |
| --- | --- | --- | --- | --- |
| 获取我的二维码 | GET | 无用户 ID；从鉴权读当前用户 | `{qrUrl: string}` | 每个账号稳定唯一的官方 HTTPS 地址；需足够随机、不可枚举、可多人用、不自动过期 |
| 扫码邀请预览 | GET/POST | 从 `qrUrl` 提取不可猜测的内部识别值 | `{inviter:{id:string,nickname:string,avatarUrl:string|null},relation:'available'\|'self'\|'already_buddies'\|'unavailable'}` | 已登录后查询，最小公开字段；只读、不自动绑定 |
| 二维码确认绑定 | POST | 邀请识别值/服务端认可的预览 ID | `{relation:'accepted'\|'already_buddies'}` | 接受者身份只能从有效登录态取得；原子、双向唯一、重试幂等 |
| 搭子列表 | GET | 当前登录态、必要分页参数 | `{items:[{id,nickname,avatarUrl}]}` | 只返回当前用户的真实搭子，不使用 UI mock |
| 按手机号找人 | GET/POST | `{phone:string}`，**完整号码** | `{user:{id,nickname,avatarUrl},relationship:'invitable'\|'outgoing_pending'\|'incoming_pending'\|'already_buddies'\|'self'}` 或 not-found | 查已注册者；频控、反批量枚举、隐私合规另行验收 |
| 发送手机号邀请 | POST | 服务端允许的目标标识或已校验完整手机号 | `{invitationId,status:'pending'}` | 同方向仅一条待处理，重发不产生第二条通知；不向未注册者发短信 |
| 我的邀请通知 | GET | 当前登录态、必要分页参数 | `{items:[{invitationId,inviter:{id,nickname,avatarUrl},status:'pending'\|'completed',createdAt}]}` | 通知属于当前用户；已读/关闭不等于处理；pending 不自动过期 |
| 确认手机号邀请 | POST | `{invitationId}` | `{relation:'accepted'\|'already_buddies'}` | 仅被邀请者可确认；与二维码共用同一关系/原子去重 |
| 邀请状态同步 | 写入接受事务内 | 无额外 H5 写入 | 其它待处理邀请返回 `completed` | 保留历史、禁二次确认；H5 再请求通知列表与搭子列表 |

上述字段和枚举都是**供讨论的 DTO 草案**。最终 method、path、HTTP 状态、分页与字段名由后台 Owner 确认，H5 再写 Zod schema 和调用层，**绝不把草案路径当真接口**。

## 一张二维码的约定

- 产品对用户只展示**唯一二维码/海报**。后台可以内部生成稳定随机标识用于查询，不需要再给用户第二个“邀请码”。
- H5 只能编码正式批准的官方 HTTPS URL，不能把手机号、可枚举 user_id、测试域名 `drcard.example` 或登录令牌放进二维码。
- 微信/系统相机打开 URL 时只允许展示「请在卡博士 App 内使用诗得丽扫一扫」及**经确认的官方下载入口**；**网页不能接受邀请**、不自动打开 App 并恢复绑定。
- 本次 H5 已做**静态外部引导页** `/buddy/invite/scan`；部署方需要明确最终公网 HTTPS 域名、将二维码 URL 映射到该静态页面的规则、SPA 回退与下载入口。**未拿到官方真实下载地址前，不提供假的跳转按钮**。
- App 内从同一 URL 识别出内部值后才调**登录态**邀请预览 API，显式确认后才触发后台事务。外部页面绝不承载确认动作。

## 业务冲突与错误

后台请给出稳定的业务状态/错误码：`unauthorized`（无登录或过期）、`forbidden`、`not_found`、`invalid_qr`、`self_invite`、`already_buddies`、`outgoing_pending`、`incoming_pending`、`rate_limited`、`conflict`、`service_unavailable`。这些是语义示例，不强制后端按英文命名。

- 客户端**不得自报** `user_id`、`friend_id`、`status=accepted` 来伪造授权。
- A→B/B→A 不应因数据库只有单向唯一键而产生两段双向关系；后端负责原子操作、幂等和必要的并发锁/约束。
- 未登录不能查任意邀请人资料、不能绑定；任何一个人不能直接读取或更改不属于自己的邀请与通知。
- “永久二维码/邀请”只意味着**不以时间自动过期**，账号被停用或授权无效依旧不可接受。
- 本期不开放解绑、明确拒绝、二维码换码/撤销、短信邀请、相册扫码、网页接受；D9 无法解除与 D14 手机号全量精确搜索是发布前风险审查项。
- 后台已有 `/api/friends/*` 通用 CRUD 不能直接充当安全的“确认成为搭子”接口；后台可评估复用数据模型，但须提交可信的认证/权限负面测试证据。

## 两方交接签收记录（后台请填）

- 后台负责人 / 实际开发仓库与 Issue/PR：
- 已确认可复用的安全接口：
- 需要新增或扩展的业务接口（path + method）：
- 真实登录身份取得方式 / token 传递方式：
- GET 二维码时返回完整 qrUrl 还是稳定内部值：
- 官方 HTTPS 站点域名、路径规则与下载链接责任人：
- 用户邀请/关系列表/通知 DTO 与错误码文档：
- dev/test 环境 URL、部署版本与回归证据：
- 搜索限频/隐私评审与 #104 安全门禁处理结论：
- Backend Owner 确认日期：

## 联调通过的最低标准（**目前全部待测**）

- A 的二维码反复打开**完全一致**，B/C 分别扫码确认成功；A/B/C 各自的双向列表真实持久，一人一码不是一次性消费。
- B 扫 A 的码只预览、点取消不绑定、点确认才绑定；自扫/已是搭子/无效码都不写关系。
- 手机号 A→B 一次邀请，B 通知中心可见、关闭仍 pending；B 搜索 A 走直接确认；任一入口完成后旧通知标完成且不可重复操作。
- 重复并发提交、伪造身份、跨账户查询、无效/过期登录、枚举/限频都有真实后台负向测试。
- **所有结果用真实双账号后台 test 环境回证**，前端 Mock、截图和 CI 绿灯不是绑定已经可用的证明。

## 2026-10-09｜#107 H5 第二刀二维码接线说明

H5 已独立实现二维码绘制与可保存的 PNG 海报（`src/lib/buddyQrPoster.ts`），调用既有 `saveImageToAlbum({imageType:'base64',imageData,fileName})` Bridge。屏幕与海报使用**同一二维码 PNG**，不重新编码不同内容。

- `src/services/buddyQr.ts` 是与后台的唯一接线点：`loadOwnBuddyQr({ readMyQr, trustedOrigin })`。未来由后台 Owner 确认的 HTTP 客户端方法注入 `readMyQr`，约定响应包含 `qrUrl`；`trustedOrigin` 应是部署确认的官方 HTTPS Origin，绝不由 H5 自报身份。
- 该协议**目前尚未签署**。因此未注入后台查询时，正式 API/test/prod 环境会明确提示“二维码接口尚未接通”，不渲染可误认的真实 QR，也不能保存一张假海报。
- 仅 preview/dev Mock 环境可以生成含 `demo` 参数的**演示二维码**，明确标注不可建立真实关系；此码不依赖任何真实账号或固定的 `user_id`。
- H5 的初步 URL 校验要求 HTTPS、同一受信 Origin、`/buddy/invite/scan` 路径、不可空的识别信息，禁止凭证、fragment、重定向参数；如后台决定另一种合法路径或签名参数，请先双方更新此合同及校验测试，不能偷偷放开到任意 URL。
- 后台需回填：真实 path/method、`qrUrl` DTO、使用的 token 参数、官方域名及页面部署规则；前端随后接入真接口并做双账号真机验收。本段不是后台已有接口或 Native 相册能力已验收的证明。

## 2026-10-09｜#111 手机号 / 通知 H5 提前施工说明

H5 已在 #111 分支补齐搜索结果状态、真实资料字段展示、反向待处理确认、通知中心的独立待处理状态及显式确认操作。所有新 /__h014/buddy-phone/* 路径都只是 MSW Mock seam，不是后台已交付 API。src/services/buddyPhoneGateway.ts 在 API/test/prod 模式封锁这些 seam，直到 #105/#95 鉴权权限合同和正式端点确认；H5 无法自动代替后台建立关系。

后端请具体回填：
- 仅按完整手机号精确搜索已注册账号：昵称、头像、本人/已是搭子/已发邀请/对方已发邀请/可邀请/未找到；反向待处理时一并提供仅当前登录用户可以确认的 invitationId。
- 发送只产生一次持久 pending，重复发送返回稳定状态，不生成重复通知。
- 当前登录人的搭子邀请通知箱 GET：真实 invitationId、发起人公开资料、pending 或 completed、创建时间、分页与登录态；普通“已读”不改变邀请处理状态。
- 被邀请者 POST 确认：仅该用户可执行；幂等的 accepted 或 already-buddies；二维码/手机号关系唯一，另一入口产生的 pending 同步完成；返回双方真实关系数据的后续查询方式。
- 对完整手机号检索做真实限频/反枚举措施，验证越权查询与越权接受；不复用未审查安全的通用通知 CRUD。
- 方法/path/DTO/错误码、token 归属、dev/test 地址、真实双账号证据由 Backend Owner 签署。

以上是草案语义，不代表现有后台接口；H5 仍缺真实联调与 Android/iOS WebView 验收。


## 2026-10-09｜#107 H5 第三刀 · 扫码预览/关系列表接线

- `src/services/buddyRelations.ts` 新增 **H5-only** `BuddyRelationsBackend` 合同：`trustedOrigin`、`previewQr(qrUrl)`、`acceptQr(qrUrl)`、`list()`，以服务端已登录用户为可信主体；DTO（示例）为 `{ inviter: {id,nickname,avatarUrl}, relationship:'available'|'self'|'already-buddies'|'unavailable' }`、`{result:'accepted'|'already-buddies'}`、`{items:[{id,nickname,avatarUrl}]}`。这些**仅是前端草案**，不是后台现有路径或返回字段。Owner 确认后统一在服务层适配最终字段；不能把原始 Friends CRUD 当业务确认。
- `src/pages/BuddyAccept.tsx` 只消费未来 Native **专用的二维码纯识别**传参：App 内 React Router location state `{ buddyScan: { source: 'native-buddy-recognition', raw: '<official HTTPS QR>' } }`。此形状只是 H5 内部消费提案，**不是已落地 JSBridge 名称/回调**。禁止外部网页、公开 query 或 Android 设备事务回调直接注入。
- 预览必须先从服务端读真实邀请人昵称头像及关系状态。**查询和取消均不写关系**；只有点击「确认成为搭子」才调用后端接受事务；成功路由至 `/buddy`，页面重新请求自己的真实搭子列表；已绑定直接提供「查看我的搭子」，自邀/不可用不允许确认。
- `src/pages/Buddy.tsx`：正式模式从关系服务取得当前登录人的 `items`，支持 loading / 空态 / 请求失败重试 / 列表头像回退。**不得混用本地 fixture 写成真实列表**。
- 目前后台 `#105` 与 Native `#110` 均未签署：`signedBackend` 默认未配置，API/test/prod 显示不可用和重试，但**不执行写操作、不假建关系**；preview/dev 的演示二维码和搭子列表明确标注模拟数据，点击演示确认只回显「不建立真实关系」。
- 双方联调必须证明：App 底部共用扫码识别搭子码→H5 预览/确认→真实列表刷新，并且**设备/卡券二维码能继续原事务与最终结果回调**；微信/system 相机只进入静态提示页。未知码不得执行任何交易。至少两个真实账号验证无效/自己/重复/取消/幂等/刷新重进。

## 2026-10-09｜对接已实现的真实后台接口（H5 #105 适配）

已对照 `workspace/API` 的 `kbs/API master@b6d2821` 实际 controller、service、docs/api-buddy.md、Notices，前端仅在 `runtimePolicy.dataMode === 'api'` 时走下列真实接口（dev/preview Mock 保持独立）。

| H5 能力 | 已有后台端点 | 前端口径 |
| --- | --- | --- |
| 我的搭子列表 | GET /api/friends/index?page&pageSize | 按登录用户分页读取 status=20，在 `data.data[].friend` 取对方 id/nick_name/avatar_img，翻页取全，不接受 user_id |
| 手机号发送申请 | POST /api/friends/add {mobile, source:10} | 只有手动点击才写；响应 status=10 是 pending，**不是直接绑定**。后台尚无安全的只读手机号预览，正式模式改为“输入完整手机号直接发送申请”，绝不编造对方头像昵称 |
| 我的好友申请通知 | GET /api/notices/index?type=60&page&pageSize | 按已登录用户读取，解析 extra_json.friends_id **关系记录 ID**（不是 notice.id），显示后端 content 文本；既有通知普通已读与确认分开 |
| 明确接受申请 | POST /api/friends/agree {id: friends_id} | 必须点击确认；只接受 status=20 响应，后台同意后删除对应 type=60 通知，H5 重新拉取；不保留虚构的完成历史 |
| 唯一识别码查公开资料 | GET /api/user/code?identify_code=UUID | 仅只读、强制 UUID 输入并只映射昵称/头像/ID；**不能据此生成官方二维码 URL** |

以上使用现有统一 `parseApiEnvelope` 的 `code === 0` 判定、现有 HTTP session 授权，并在契约解析失败时如实报错。H5 对接的是已经存在的接口形状；**代码已接线≠后台测试/生产环境已部署，≠真人账号真机验收**。

仍待后台同事：手机号精确只读搜索、关系状态查询/反向待处理、官方 HTTPS 二维码 URL、扫码预览+直接确认原子事务、完成通知持久化、识别码补齐持久化、安全/归属与权限问题。特别注意，/api/friends/agree 的 `id` 必须是朋友申请的业务记录编号，不能传用户 ID 或通知 ID；旧 /api/friends/update/delete 不得用于绕过确认。#110 Native 按码分流继续保留原设备和卡券核销事务。
