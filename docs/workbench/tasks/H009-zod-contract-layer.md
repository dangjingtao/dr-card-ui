# H009｜Zod 运行时数据契约

**Status:** Ready  
**Phase:** Foundation  
**Depends on:** H007

## 目标

对不可信外部数据建立运行时校验边界，使 API、Mock 与 Bridge 的类型不只停留在 TypeScript 编译期。

## 范围

- 引入 Zod 并建立 schema / inferred type 的放置规范。
- 先覆盖后续首条 API 链及一类 Bridge/Mock 示例，不追求全项目一夜 schema 化。
- 校验失败进入统一错误模型。
- 为未来 OpenAPI 生成/复用 TS 类型保留兼容空间。

## 不做

- 不重复手写尚未存在的后台全部 DTO。
- 不用 schema 重新定义未确认产品规则。

## 验收

- 至少一类外部响应能被 schema 安全解析，非法结构可预测失败。
- schema 与消费类型不重复维护两套真值。
- typecheck/build 通过。

## 证据

记录 schema 示例、失败验证和 commit SHA。
