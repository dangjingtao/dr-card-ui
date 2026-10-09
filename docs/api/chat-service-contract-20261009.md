# 客服接口最新合同：2026-10-09

> **权威性与版本**：本文件依据后台同事当前交付的源码核对，不是根据旧 Swagger 猜测。证据文件位于项目工作区的 `API/` 仓库，核对日期 2026-10-09。旧快照 `docs/api/dearseed-openapi.json` 抓取于 **2026-09-16**，其 `ChatMessagesSave` 属已下线的 CRUD 形式，**不能作为当前用户端客服的入参定义**。当前后台若继续调整，需要重新核对源码和联调。

## 后端源码证据

- `API/src/app/api/validate/ChatMessages.ts`：`ChatMessagesAdd` 只定义 **必填 `content`（1–5000 字）**、可选 `msg_type`（1–6、8；默认 1），不接受客户端 `user_id` 和 `sender_id`；`ChatMessagesTransfer` 的 `content` 可选。
- `API/src/app/api/controller/ChatMessages.ts`：`POST /api/chatmessages/add` 从 `service.userId()` 取得用户身份，存储用户消息，然后返回 SSE `text/human/done/error`；`POST /api/chatmessages/transfer` 存真实转人工状态，正常走 JSON envelope；`GET /api/chatmessages/index` 提供历史。
- `API/src/app/api/socket/ChatSocket.ts`：默认命名空间 `/`，`auth.token` 握手，服务端解析登录用户并加入自己的 room；鉴权不通过推 `error` 并断开。
- `API/src/app/common/service/Chat.ts`：人工坐席推送事件 `chat:message`。推送仅收不发，客户端发送仍走 HTTP。
- `API/docs/api-service-chat.md`：后端提供的综合客服 API/Socket.IO/SSE 联调文档。

## 用户端接口定义

| 接口 | 请求 | 认证 | 成功 |
|---|---|---|---|
| `GET /api/chatmessages/index?page=1&pageSize=30` | 查询参数 `page, pageSize` | Bearer token | `{code:0,data:{data:[],current_page,per_page,total,last_page}}` |
| `POST /api/chatmessages/add` | `{content:string,msg_type?:number}` | Bearer token | `text/event-stream`；`text` 增量、`human` 模式、`done.message_id`、`error.message` |
| `POST /api/chatmessages/transfer` | `{content?:string}` | Bearer token | `{code:0,data:{mode:"human"}}` |
| `Socket.IO /` | `auth:{token:accessToken}` | 握手令牌 | `chat:message` 推送完整存储记录 |

安全约束：**不允许由 H5 决定用户身份**；`user_id/sender_id` 服务端依据 token 写入。旧 OpenAPI 里 `ChatMessagesSave.required=["user_id","sender_id","msg_type"]` 是 9 月旧 CRUD 合同，不符合当前控制器 DTO，**优先当前后台源码定义**。不要为通过旧文档的验证而传入可伪造身份。

Socket `chat:message` 返回 `id, user_id, sender_id, content, msg_type, create_time`；时间戳为秒级数字，历史接口则可能返回 SQL 字符串。均以服务端 ID 排序去重。重连后 `GET index` 补消息，推送本身不补发。

## 验收边界

本文件证明**当前交付的后端源码存在这套合同**，不证明阿里云 / 测试环境已部署相同版本、Redis 服务与真实人工坐席正在运行。正式完成要用授权账号在目标测试环境完成 `/add`、`/transfer`、后台 `/admin/chatmessages/send` → H5 Socket `chat:message`，以及 Android/iOS WebView 断线重连验收。人工客服未在线不应伪造排队人数、等待时长或姓名。
