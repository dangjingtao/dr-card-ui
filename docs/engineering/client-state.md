# 客户端共享状态基线

本文定义卡博士正式 H5 中客户端共享状态的 Zustand 使用边界。目标不是把所有数据塞进全局 store，而是替换原型期为了跨路由联动而存在的手写 listener/version 状态模块。

## 1. 什么时候使用 Zustand

适合进入 Zustand 的是由 H5 客户端拥有、需要跨组件或跨路由共享的会话状态，例如：

- 地址管理中尚未提交到后端前的客户端集合与默认项；
- 消息列表与详情之间共享的本次会话已读状态；
- 其它已经确认属于客户端而非服务端缓存的跨页面状态。

以下内容默认不进入 Zustand：

- Axios/API 响应缓存；
- 可以由 URL/路由参数表达的页面状态；
- 单个组件内部即可完成的临时交互状态；
- Native Bridge 的能力或返回缓存；
- 仅因为“多个页面都要用”就复制进 store 的服务端事实。

## 2. Store 命名与职责

每个领域 store 只管理一个清晰职责，命名采用：

```text
use<Address|Notification|...>Store
```

领域文件继续向页面暴露稳定的 hook/action，例如：

```ts
useAddresses()
setDefaultAddress(id)
addAddress(value, isDefault)

useNotifications()
markNotificationRead(id)
```

页面优先使用这些领域入口，不直接散落调用 `store.getState()` / `store.setState()`。原始 Zustand store 主要用于状态模块内部以及基础验证。

## 3. 持久化边界

H010 不引入持久化。当前迁移的 store 仍是页面会话级状态，刷新后回到 fixture 初始态。

未来若某类客户端状态确认需要跨刷新保存，必须通过 H011 Storage Adapter；禁止在 Zustand store 中直接写：

```ts
localStorage
sessionStorage
```

敏感凭据、消费密码、长期 secret 不进入普通 H5 Web Storage。

## 4. Fixture 与真实业务

当前 `addresses` / `notifications` 的初始数据仍来自 UI fixture，这是既有原型行为，不代表未来真实 API 数据应整体搬入 Zustand。

当 H008 真实 service 链路解阻后，应重新判断数据 ownership：服务端事实由 service/API 契约负责，Zustand 只保留真正由客户端拥有的状态和必要的局部协调状态。

## 5. H010 首批迁移

H010 首批迁移：

- `src/app/state/addresses.ts`
- `src/app/state/notifications.ts`

两者保留现有页面使用的领域 API，内部从模块级变量 + listener/version 订阅改为 Zustand。`buddies.ts` 本卡暂不迁移，避免把其原型期随机默认态等额外语义混进首批基线；后续可按同一规则逐步迁移。
