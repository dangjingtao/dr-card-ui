# H007｜Axios HTTP Client 与统一错误模型

**Status:** Ready  
**Phase:** Foundation  
**Depends on:** H006

## 目标

建立正式 H5 唯一 HTTP 出口和统一错误语义，结束页面未来各自调用 fetch/axios、各自解释错误的风险。

## 范围

- 引入 Axios 并建立集中 HTTP client。
- 配置 base URL、timeout、基础 headers 与必要 interceptor 边界。
- 定义 `AppError`，统一区分网络、HTTP、业务/契约等错误类别。
- 页面不直接创建 Axios 实例；service 层作为业务请求入口。
- 认证注入预留接口，但认证协议未确认前不虚构 token 规则。

## 不做

- 不在本卡接所有业务 API。
- 不用 Native 充当默认 HTTP proxy。
- 不把 toast/UI 反馈写进 HTTP client。

## 验收

- 有单一可复用 HTTP client 和错误模型。
- 示例/基础测试能证明成功、timeout、HTTP error 会落到确定错误类型。
- typecheck/build 通过。

## 证据

记录 API 入口、错误模型示例、验证结果与 commit SHA。
