# H009｜Zod 运行时数据契约

**Status:** User Review  
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
- 失败验证：`npm run verify:h009` 覆盖合法数据解析、非法结构可预测失败、附加字段兼容和敏感原始值不泄漏。
- CI：PR #15 的 Build run `35063874657` 在交接前 head `5ce43d5be7f951c44d1904418459ebe55524bace` 上完整通过 `npm ci`、静态检查、typecheck、H007/H009 验证、dev/Cloudflare preview/test/prod 构建与 production preview smoke。
- Cloudflare Pages：交接前 head `5ce43d5be7f951c44d1904418459ebe55524bace` 的 feature preview 部署成功。
- 实现提交基线：`61b2941bca610c47b1770bd47e0fde6e734a0ef6`。
