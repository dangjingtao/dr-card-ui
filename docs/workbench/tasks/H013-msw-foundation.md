# H013｜MSW 网络 Mock 基建

**Status:** Doing  
**Phase:** Foundation  
**Depends on:** H006, H007

## 目标

让 Mock 发生在网络边界，使页面和 service 不感知数据来自 Mock 还是真实后台。

## 范围

- 引入 MSW browser worker。
- 建立 handlers / fixtures / browser bootstrap 的清晰结构。
- 本地 dev 可选 Mock/API；CF dev 固定 Mock。
- test/prod 禁止启用 MSW，构建门禁继续检查 `mockServiceWorker.js` 泄漏。
- API Mock 与 Bridge Mock 完全分开。

## 不做

- 不建独立 Mock Server。
- 不增加 CF Functions/Worker 只为 Mock。

## 验收

- 同一个 Axios/service 调用可在 Mock 与 Real API 模式工作，无页面分支。
- test/prod 不注册 Service Worker，也不存在 Mock fallback。
- 至少一个 handler 证明网络级拦截链路可用。

## 证据

施工中。H013 仅建立网络 Mock 边界和最小 handler 证明；页面内既有假网络/场景迁移留给 H014，不在本卡扩大范围。
