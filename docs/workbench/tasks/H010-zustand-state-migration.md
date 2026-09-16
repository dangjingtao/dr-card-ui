# H010｜Zustand 状态基建与旧共享状态迁移

**Status:** Ready  
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

## 证据

记录迁移前后状态模块、关键行为验证与 commit SHA。
