# H008｜Service 层与首条真实 API 垂直链路

**Status:** Blocked  
**Phase:** Foundation  
**Depends on:** H007, H009  
**Blocker:** backend base URL、认证方式与可用核心接口契约尚未确认

## 目标

用一条真实正式 H5 业务链证明生产架构可用，而不是只创建空 `services/` 目录。

## 范围

- 选择一个非商城、非 legacy 的正式 H5 业务作为首条真实链路。
- 落地 `Page → business hook → service → Axios → backend`。
- 响应经过 Zod/契约边界后进入页面状态。
- 同一个 service 在 dev Mock 与 Real API 下保持调用方式一致。

## 不做

- 不在后台契约缺失时发明 endpoint、DTO 或认证头。
- 不一次性迁移所有页面。

## 验收

- 至少一条真实业务链在 Real API 模式成功工作。
- 页面不知道响应来自 MSW 还是真实后台。
- 错误沿统一 `AppError` 边界处理。

## 解阻条件

提供可用测试环境、核心 endpoint/DTO 与认证约定后转 `Ready`。
