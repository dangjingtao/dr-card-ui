# H009｜Zod 运行时数据契约

**Status:** Accepted  
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

- Schema 示例：`src/services/contracts/h009MockExample.ts`，消费类型通过 `z.infer<typeof h009MockPayloadSchema>` 推导。
- 运行时边界：`src/services/contracts/parseContract.ts`，校验失败统一转换为 `AppError(kind='contract', code='CONTRACT_VALIDATION_FAILED')`，错误详情不复制原始 payload。
- 错误边界：通用 `AppError` 原语位于 `src/lib/appError.ts`；HTTP 层从原入口 re-export，避免 Contract / Bridge 校验反向依赖 Axios，同时保持 H007 兼容。
- 失败验证：`npm run verify:h009` 覆盖合法数据解析、非法结构可预测失败、附加字段兼容和敏感原始值不泄漏。
- 自审：PR #15 人工 review 发现并修复 Contract → HTTP/Axios 耦合；修复后无剩余 blocking finding。
- CI：PR #15 Build run `35065410689` 在 head `febfab64d6e41e093a9f2fa26e7e6f7f7866a3af` 上完整通过 `npm ci`、静态检查、typecheck、H007/H009 验证、dev/Cloudflare preview/test/prod 构建与 production preview smoke。
- Cloudflare Pages：head `febfab64d6e41e093a9f2fa26e7e6f7f7866a3af` 的 feature preview 部署成功。
- 用户验收：2026-09-16 明确确认“接受”。
