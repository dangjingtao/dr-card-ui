# H010｜Zustand 状态基建与旧共享状态迁移

**Status:** Accepted  
**Phase:** Foundation  
**Depends on:** H003

## 目标

统一正式 H5 的跨页面客户端状态，逐步替换 addresses / buddies / notifications 等原型期手搓订阅 store。

## 范围

- 引入 Zustand，建立 store 命名和职责边界。
- 迁移正式 H5 中至少两类现有手搓共享状态，优先选择会继续发展的业务状态。
- 服务端数据不因“能放 store”就无条件进入 Zustand。
- 需要持久化的状态必须通过 Storage Adapter。

## 不做

- 不迁移 legacy 内部 store 以追求统一。
- 不引入 Redux。
- 不把 API cache 伪装成全局客户端 store。

## 验收

- 被迁移业务不再维护自制 listener/version store。
- 跨页面状态行为保持正确。
- store 不直接散落访问 localStorage/sessionStorage。

## 实施结果

- 引入 Zustand `5.0.15`，npm lockfile 已同步。
- `src/app/state/addresses.ts` 已迁移为 `useAddressStore`。
- `src/app/state/notifications.ts` 已迁移为 `useNotificationStore`。
- 保留现有页面使用的领域 hook/action，页面不直接依赖 Zustand API。
- 两个 store 仍是会话级状态；未引入 Web Storage 持久化。
- `buddies.ts` 本卡暂不迁移，避免把原型期随机默认态等额外语义混入首批基线。
- 状态职责、命名与持久化边界已记录在 `docs/engineering/client-state.md`。

## 证据

- `npm run verify:h010` 覆盖地址新增、编辑、默认唯一、reset，以及通知单条已读、全部已读、reset。
- 验证脚本同时检查已迁移模块不再包含手写 listener/version 订阅，也不直接访问 Web Storage。
- PR #16 Build run `35070703238` 在实现 head `2becfa5287ab055ec13f14b50a32a4c4f8e955b3` 上完整通过 `npm ci`、静态检查、typecheck、H007/H009 回归、H010 验证、dev/Cloudflare preview/test/prod 构建与 production preview smoke。
- Final evidence head `c401052353a69b341c2542f6497248552c7c90b4` 的 Build run `35070962836` 再次完整通过，Cloudflare Pages 部署成功。
- PR #16 已记录人工自审，无剩余 blocking finding。
- 2026-09-16：用户明确回复“接受”，H010 正式验收通过。
