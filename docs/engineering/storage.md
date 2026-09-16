# H5 Storage 基线

本文定义卡博士正式 H5 的 Web Storage 使用边界。目标不是鼓励持久化，而是在确有跨刷新/跨页面持久化需求时提供唯一、可审查的入口。

## 1. 唯一入口

正式 H5 代码不得在 page、store、service 或普通业务模块中直接访问：

```ts
localStorage
sessionStorage
```

统一通过 `src/storage` 的公开入口导入 `STORAGE_KEYS` 与 `storage`，调用方式为：

```ts
const value = storage.read(STORAGE_KEYS.someConfirmedKey)
storage.write(STORAGE_KEYS.someConfirmedKey, value)
storage.remove(STORAGE_KEYS.someConfirmedKey)
```

当前正式 H5 尚无已确认的真实持久化业务，因此 H011 不虚构业务 key。后续新增 key 必须先确认数据 ownership 和持久化必要性，再集中定义在 `src/storage/keys.ts` 的 `STORAGE_KEYS` 中。

## 2. localStorage / sessionStorage 边界

- `session`：只在当前浏览器/容器会话内需要，关闭会话后应消失的非敏感客户端状态。
- `local`：明确需要跨刷新、跨会话保留，并且产品/业务已经确认允许长期驻留的非敏感客户端状态。
- “方便”不是选择 `local` 的理由。能保持会话级就不要扩大生命周期。
- 服务端事实、API cache、Native Bridge 返回值不会因为可序列化就自动进入 Web Storage。

每个 key 在集中定义时必须固定 `area` 与 Zod schema，调用方不能临时改变存储介质。

## 3. 运行时行为

`storage` 对调用方提供确定行为：

- SSR / `window` 不存在：`read` 返回 `null`；`write` / `remove` 返回 `false`。
- 浏览器禁止访问 Storage、getter 抛错或 backend 不可用：同上，不向业务层抛异常。
- key 不存在：`read` 返回 `null`。
- JSON 损坏：`read` 返回 `null`，并尽力删除该损坏值。
- JSON 可解析但不符合 key schema：`read` 返回 `null`，并尽力删除该无效值。
- 写入值不符合 schema、无法序列化、Quota/安全策略导致 `setItem` 失败：`write` 返回 `false`。
- 删除失败：`remove` 返回 `false`。

调用方如果业务上必须区分“没有值”和“Storage 不可用”，应先提出真实需求，再扩展契约；不要绕过 adapter 自行探测。

## 4. 敏感数据禁止项

普通 H5 Web Storage 不得保存：

- 登录密码；
- 消费密码、支付 PIN 或其它交易口令；
- 长期 secret、私钥、第三方服务密钥；
- 未经明确安全/认证契约确认的 token 或其它敏感凭据。

H011 **不决定认证 token 的存储方案**。在 Native 容器认证链路、token 生命周期与安全契约确认前，不得为了接接口临时把 token 放进 `localStorage` 或 `sessionStorage`。

## 5. Key 规则

所有正式 key：

- 由 `src/storage/keys.ts` 集中定义；
- 通过 `defineStorageKey` 自动增加 `dr-card:` 前缀；
- 明确选择 `local` 或 `session`；
- 必须附带 Zod runtime schema；
- 不允许页面或 store 自造字符串 key。

`STORAGE_KEYS` 当前为空是有意为之：基础设施已经建立，但没有业务证据支持新增持久化状态。
