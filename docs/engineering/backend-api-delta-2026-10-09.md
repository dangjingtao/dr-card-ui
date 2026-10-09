# 2026-10-09 后台新增接口｜H5 接入核对与合同差异

> **归档说明｜2026-10-09 22:00（Asia/Shanghai）**：本文是后台 **`API/master@7e1f710` 14:25 的源码审计快照**。下文“未实施”仅指**当时 H5 基线**，不代表晚间最新代码；源码存在也不代表 test/prod 已部署或真机验收完成。
>
> **H5 已合入 `dev`（仅代码交付）**：通知 [#128](https://github.com/dangjingtao/dr-card-ui/pull/128)、体验券分类 [#132](https://github.com/dangjingtao/dr-card-ui/pull/132)、搭子真实列表/手机号申请/通知确认 [#133](https://github.com/dangjingtao/dr-card-ui/pull/133) + [#134](https://github.com/dangjingtao/dr-card-ui/pull/134)、从登录用户 `profile.identify_code` 生成 QR [#139](https://github.com/dangjingtao/dr-card-ui/pull/139)、AI 客服 SSE/Socket [#141](https://github.com/dangjingtao/dr-card-ui/pull/141) + [#147](https://github.com/dangjingtao/dr-card-ui/pull/147)。上述合并**不等于后端真实部署、人工座席、二维码绑定、原生扫码及双账号 WebView 验收**。
>
> **后续权威跟踪**：API 总卡 [#92](https://github.com/dangjingtao/dr-card-ui/issues/92)、搭子交接 [#105](https://github.com/dangjingtao/dr-card-ui/issues/105) / [#107](https://github.com/dangjingtao/dr-card-ui/issues/107) / [#111](https://github.com/dangjingtao/dr-card-ui/issues/111)、通知 [#122](https://github.com/dangjingtao/dr-card-ui/issues/122)、分类 [#124](https://github.com/dangjingtao/dr-card-ui/issues/124)、客服 [#123](https://github.com/dangjingtao/dr-card-ui/issues/123)。二维码已采用前端识别码方案：**不再以独立 `qrUrl` 图片接口作为前置**；安全/鉴权/发券及真机验收仍需后端与 Native 证据。


> **状态：后台源码静态核对 / H5 接入依据（待部署及双账号实测）**。这不是已部署、已联调、已通过产品验收的证明。
>
> 后台事实源：本地 `~/Desktop/workspace/API`（阿里云 Codeup `kbs/API`），`master@7e1f710`，2026-10-09 14:25（UTC+08）。所审本地工作区无未提交修改；未核查线上/测试环境实际部署版本。**未经授权不修改后台代码**。
>
> H5 对照：`dangjingtao/dr-card-ui` 的 `dev`；既定产品合同以 [#102](https://github.com/dangjingtao/dr-card-ui/issues/102)、[#105](https://github.com/dangjingtao/dr-card-ui/issues/105) 和 [搭子交接协议](../workbench/contracts/buddy-backend-handoff.md) 为准。新增后台实现不自动改变产品决策。

## 1. 后台提交与范围

| 后台 commit | 日期 | 变更 | 性质 |
| --- | --- | --- | --- |
| `63f366c` | 10-08 | 好友申请 / 同意 / 拒绝、双方关系列表、申请通知 | 新业务动作 |
| `f2c07a7` | 10-08 | 用户通知列表、详情已读、未读统计、一键已读 | 新业务动作（替代旧用户端 CRUD） |
| `759e9ce` | 10-09 | AI 客服 SSE、转人工、Socket.IO、人机消息历史 | 新业务动作 |
| `7c6c338` | 10-09 | 泡泡值兑换券、流水/库存/失败补偿 | **动作已写，但第三方发券仍是占位** |
| `7e1f710` | 10-09 | 优惠券分类查询及通用 CRUD | 新分类接口，存在公开写接口风险 |
| `4f91aa2`、`e0e94e7` | 10-08 | 补签、连续签到逻辑修正 | 既有接口行为修复，**非新增路由** |

可复核的后台源路径：`docs/api-buddy.md`、`docs/api-notifications.md`、`docs/api-service-chat.md`、`docs/api-card.md`、`docs/api-couponscategory.md`、`docs/api-points.md`；对应 `src/app/api/controller/*`、`service/*`、`validate/*`。后台文档与实际代码冲突时，先记录差异，由后台 Owner 回填最终 test 环境契约，不能自行把文档示例升级为线上事实。

## 2. 新增接口清单

标记含义：**源码有** = 已在 `master@7e1f710` 找到路由/实现，未宣称已部署；**禁接** = 安全或产品边界未过，H5 不得调用。

| 模块 / 行为 | Method / path | 登录 | H5 处理意见 |
| --- | --- | --- | --- |
| 搭子：我的已通过好友 | `GET /api/friends/index` | 是 | 可准备列表数据映射；待鉴权/双账号实测 |
| 搭子：发送申请 | `POST /api/friends/add` | 是 | 可供手机号邀请评估；**不能用于二维码直接绑定** |
| 搭子：同意申请 | `POST /api/friends/agree` | 是 | 可供手机号确认评估；须确认产品状态一致性 |
| 搭子：拒绝申请 | `POST /api/friends/reject` | 是 | **产品一期不用**（不是 H5 待实现功能） |
| 通知：我的通知列表 | `GET /api/notices/index` | 是 | 可接真实消息列表 |
| 通知：详情并置已读 | `GET /api/notices/detail` | 是 | 可接详情/已读 |
| 通知：未读数 | `GET /api/notices/unread-count` | 是 | 可接通知角标 |
| 通知：一键已读 | `POST /api/notices/read-all` | 是 | 可接清除未读；不是删除 |
| 客服：发消息并收 AI 增量 | `POST /api/chatmessages/add` | 是 | `fetch` + SSE，不能按普通 JSON 解析 |
| 客服：转人工 | `POST /api/chatmessages/transfer` | 是 | 待真实客服侧准备好后联调 |
| 客服：历史消息 | `GET /api/chatmessages/index` | 是 | 可接历史/断线补齐 |
| 客服：人工实时回复 | Socket.IO `chat:message` | 是 | 同 HTTP 服务 Origin，token 鉴权；仅接收 |
| 分类：分页查询 | `GET /api/couponscategory/index` | 否 | 可映射动态分类；过滤字段需核实 |
| 分类：下拉选项 | `GET /api/couponscategory/select` | 否 | 建议分类 Tab 使用该只读端点 |
| 分类：详情 | `GET /api/couponscategory/detail` | 否 | 按需使用，空值可能是 `null` |
| 分类：新增 / 修改 / 删除 | `POST /api/couponscategory/add` / `update` / `delete` | **当前无鉴权** | **禁接；后台应移至授权管理边界** |
| 兑换：泡泡值兑换券 | `POST /api/coupons/exchange` | 是 | **暂不得宣称真实兑换可用**：外部发券未接通 |

`POST /api/coupons/MyCoupons` 是此前已有的卡包查询，不算这批新增；后续可用于兑换成功后的刷新，但目前兑换尚不能成功。

## 3. 精简的前端数据合同与易错点

### 3.1 好友 / 搭子（`api-buddy.md`）

- `GET /api/friends/index?page=1&pageSize=15`：**只返回已通过**（`status=20`）的关系，数组位于成功信封的 `data.data`；每条的 `friend` 字段是“当前登录者的对方”，提供 `id`、`nick_name`、`avatar_img`、`gender`、`kbs_id` 等最小显示信息。`avatar_img` 可空、`gender` 是字符串，不能直接沿用 H5 的“假头像/小美”。
- `POST /api/friends/add`：`{ "friend_id": 9, "source": 10 }` **或** `{ "mobile": "完整手机号" }`；后台按登录态识别发起人，成功后关系 `status=10`，并给对方发 `type=60` 通知。`source=20` 表示二维码来源，**但仅是申请来源枚举，不是二维码接受协议**。
- `POST /api/friends/agree`：`{ "id": 12 }`，这个 `id` 是**关系记录 ID**，不是被邀请人的 `user_id`；通知 `extra_json`（JSON 字符串）的 `friends_id` 提供这个 ID。只有接收方可同意，成功 `status=20`。`POST /api/friends/reject` 另有实现，但一期不接。
- 后台当前处理同意/拒绝时**软删除对应申请通知**。这与 #105 的“保留历史、呈已完成状态”不同；不应由 H5 私自模拟补齐。
- `GET /api/friends/index` **无法查看 pending**；pending 通过 `GET /api/notices/index?type=60` 查询。
- 后台的 `friends/detail|update|delete|select` 通用 CRUD 仍保留且缺少所需的关系归属/状态流转约束；**H5 不调用**。后台需给出负向授权/并发证明。

### 3.2 系统通知（`api-notifications.md`）

- `GET /api/notices/index?type=60&page=1&pageSize=15`：`type` 不传为全部；合法类型 `10/20/30/40/50/60`，其中 `60` 是好友申请。**当前通知 Service `myIndex` 会从登录态取当前用户并允许 `user_id=0` 的全员通知；H5 不传 `user_id`。**
- `GET /api/notices/detail?id=31`：查看即标记当前用户已读；`GET /api/notices/unread-count` 获取按类型/总计未读；`POST /api/notices/read-all` 可传 `{ "type": 60 }` 或不传类型处理全部。
- `is_read` 表示当前用户阅读状态，**不能用来代表好友申请已接受**。`extra_json` 是字符串，客户端解析须做异常处理。`send_time`/`read_time` 为秒时间戳，`create_time` 为时间字符串。
- **文档差异**：后台 `api-buddy.md` `5` 仍写旧调用方式 `?user_id=<当前用户ID>` 并警告通知可越权；10-08 后新增的 `api-notifications.md` 与 `Notices.myIndex` 实现已改为登录主体过滤。采用**最新实现**，但上线前仍需真实账号隔离测试。不得照抄旧 `user_id` 查询。

### 3.3 AI / 人工客服（`api-service-chat.md`）

- `POST /api/chatmessages/add`：`{ "content": "内容" }`（最长 5000 字，可选 `msg_type`），登录头 + `Accept: text/event-stream`。可能先收到注释帧 `: ok`；`data:` 帧类型有 `text`（增量文本）、`human`（人工接管）、`done`（可带 `message_id`）、`error`（流内报错）。**必须 POST `fetch` + 流解码**，不能使用浏览器 `EventSource`；HTTP 200 不代表流内无错误。
- `POST /api/chatmessages/transfer` 可带可选 `content`，返回 `data.mode="human"`；人工回复走 `socket.io` 默认命名空间的 `chat:message`，使用 `auth.token` 认证，Socket 只收不发。重连后用 `GET /api/chatmessages/index` 补断线漏消息，并按 `id` 去重。
- `GET /api/chatmessages/index?page=1&pageSize=15` 读取当前用户全会话，列表仍在 `data.data`，按 `id` 倒序。`sender_id===0` 是客服（AI/人工共用），展示时注意数值/字符串；列表的 `create_time` 是字符串，而 socket 推送时可能是数字秒时间戳。
- **运行依赖**：后台 `bailian.appId` / API Key 未配会在 SSE 中返回错误；人工侧没有实时接收用户消息通道、靠轮询，模式存在 Redis 且重启会回到 AI。**不得把“路由存在”写成“AI 模型额度已就绪、真人客服可用”。**

### 3.4 券分类与兑换（`api-couponscategory.md`、`api-card.md`）

- `GET /api/couponscategory/select`：响应 `data.data=[{"value":2,"label":"餐饮券"}]`。`total` / `last_page` 存在硬编码，**不能据此分页**。`GET /api/couponscategory/index` 返回 `id,name,pid,sort` 等；排序需要明确 `orderBy[sort]=DESC`，`pid=0` 表示顶级；切 Tab 是否使用多级分类取决于既定产品方案。
- 券 `category_id` 是**字符串**，分类 `value` 是**数字**，展示筛选时规范化类型；但当前后台 `CouponsIndex` DTO 仅声明 `page/pageSize`，与后台分类文档示例 `GET /api/coupons/index?category_id=2` 存在**入参合同疑点**，后台要用 test 请求确认是否保留过滤参数，不能仅凭文档宣称服务端筛选可用。
- `POST /api/coupons/exchange`：请求 `{"id":3}`，用户和余额从登录态取；**按后端设计**单事务占库存、扣泡泡值、写流水；第三方发券失败再补偿退款、删流水、退库存。成功合同拟返回 `data={coupon_id,points}`，之后刷新 `/api/userpoints/stat` 和 `POST /api/coupons/MyCoupons`。
- **实锤阻塞**：`src/app/api/service/Coupons.ts` 的 `sendCard()` 目前直接抛出“卡博士发券接口未接通”，所以真实兑换无成功闭环；补偿自身失败还需人工对账。不能以自动回退代替发券验收。
- **权限阻塞**：`couponscategory/add|update|delete` 当前挂用户端 `/api` 且无登录授权，属于后台整改项，H5 只使用查询接口；删除为物理删除并可能留下孤儿券关联。

## 4. 与已经冻结的产品合同存在的差异（不得静默改需求）

| 产品既定合同 | 当前后台源码 | 合同结论 |
| --- | --- | --- |
| 一人一张稳定、不可枚举标识的官方 HTTPS 邀请 QR；扫码只读预览，扫码者确认即建立双向关系，不需要邀请人二次审批 | `/api/friends/add` 仅创建 pending，`source=20` 只是来源；未见稳定 QR URL、解析预览与扫码确认的独立业务端点 | **未满足 #105 的二维码闭环**；不得用可枚举 `friend_id` 冒充二维码协议 |
| 手机号精准搜索：返回真实昵称头像、已邀请 / 反向待处理 / 已是搭子等状态 | `friends/add` 允许按手机号发送申请，但未见对应的安全**搜索+状态预览**业务接口 | **部分满足**，搜索/隐私与状态返回待后台确认 |
| 手机号邀请不提供拒绝、通知待处理可保留；关闭/已读不等于处理 | 后台 `friends/reject` 已实现；`agree/reject` 后申请通知被清理 | **与产品冲突**；H5 不展示拒绝，后台需确认“历史保留及完成态”处理 |
| 任一入口建立一段双向持久关系、反向待处理和二维码/手机号状态一致 | 当前仅有好友记录状态流转；通用 CRUD 写入口还在 | **并发/授权/跨入口幂等未验收** |
| 体验券兑换完成后券真实进入用户卡包 | `exchange` 事务/补偿已有，第三方 `sendCard` 仍抛错 | **不可真实兑换** |

这些差异要交后台 Owner 回填，不允许“后端这样写了”就把 #102 的产品决策改掉。安全调查 #104 当前暂停，不得写成已完成。

## 5. 当时 H5 消费者缺口（14:25 历史快照，现已部分实施）

| H5 页面 / service | 当前实际代码 | 下一步 |
| --- | --- | --- |
| `/buddy`、`/buddy/invite/phone` / `src/services/buddyPhone.ts` | 列表仍有本地 fixture；手机号 search/invite 使用 `/__h014/*` 占位 | 与 #105 核对状态语义后接真正安全的 API，不直接把 `friends/add` 当扫码确认 |
| `/notifications`、`/notifications/:id` | `src/app/state/notifications.ts` 读取 `NOTIFICATION_FIXTURES`，已读状态只存在本会话 | 增加独立通知 service，分页/未读/已读基于登录主体，保留原型 UI |
| `/service/chat` | `src/pages/ServiceChat.tsx` 使用假回复和定时模拟人工接入 | 接 SSE + socket + 历史；真实环境失败不转假成功 |
| `/exchange` | `src/services/exchange.ts` 仍请求 `/__h014/exchange/redeem`；分类 Tab 配置在 fixture | 可先落真实 DTO/分类只读适配，但发券未通前不得开放真实兑换成功路径 |
| `src/services/coupons.ts` | 已读 `GET /api/coupons/index` 券模板 | 核实 `category_id` 过滤是否真正生效后再启用分类服务端筛选 |

原有 `docs/engineering/exchange-redeem-api-proposal.md` 是 9-29 的 **Deferred 历史草案**，保留历史判断；**本文件才记录 10-09 后台新出现的 `/api/coupons/exchange` 现状**，两者不可互相覆盖。

## 6. 责任分工与放行条件

**后台同事需回填**（在现有 [#105](https://github.com/dangjingtao/dr-card-ui/issues/105) 交接链路中，不在 H5 仓库代理修改后台）：

1. Dev/test 实际服务地址、部署 commit 与版本；是否已上线这些变更。
2. 好友/通知的跨账号授权负向测试、通用 CRUD 封闭方案、并发/反向关系去重；二维码正式 QR URL / 预览 / 接受 API，手机号精确搜索状态 API。
3. 好友通知历史保留和已完成态如何处理；确认与一期“无拒绝”的分界。
4. 分类写接口权限整改；券列表 `category_id` 实测筛选；卡博士第三方发券接通与异常补偿/对账方案。
5. 百炼配置、SSE 和 Socket.IO 的 test 端到端样例，人工客服真实可接通的验收窗口。

**H5 现阶段执行与后续验收**：已入 `dev` 的功能参见文首交付链接；尚缺的安全与真实联调按现有 Issue 追踪。新缺口从最新 `dev` 单独开实施分支，遵守 `mock|api` / 统一 `httpClient` 及 `parseApiEnvelope`；分别做通知、搭子、客服、分类的正常/空态/鉴权/断网/重复提交测试。**在 test App WebView + 两个真实账号 + 后台已部署环境验证之前，不宣称接入验收。**

关联：[#95 通知](https://github.com/dangjingtao/dr-card-ui/issues/95)、[#96 好友调查](https://github.com/dangjingtao/dr-card-ui/issues/96)、[#102 产品决策](https://github.com/dangjingtao/dr-card-ui/issues/102)、[#105 后台交接](https://github.com/dangjingtao/dr-card-ui/issues/105)、[#107 二维码](https://github.com/dangjingtao/dr-card-ui/issues/107)、[#111 手机号/通知实施](https://github.com/dangjingtao/dr-card-ui/issues/111)。

**本次交付仅是事实文档入库，不包含新接口实现、后台代码变更或真实环境验收。**
