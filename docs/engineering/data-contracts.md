# 外部数据运行时契约

本文定义卡博士 H5 对 API、Mock 与 Native Bridge 外部数据的运行时校验边界。它补充 TypeScript 编译期类型，不替代后台或 Native 的正式接口文档。

## 1. 基本原则

所有跨边界输入先视为 `unknown`，在进入业务代码前通过 Zod schema 解析。

```text
API / Mock / Bridge raw payload (unknown)
                    ↓
              Zod schema
                    ↓
           inferred TypeScript type
                    ↓
             service / adapter
                    ↓
               page / hook
```

schema 是运行时结构真值；消费类型使用 `z.infer<typeof schema>` 推导，不再手写一份同形 interface 作为第二套真值。

## 2. 放置规范

通用解析器位于：

```text
src/services/contracts/parseContract.ts
```

真实业务 schema 应跟随拥有该契约的边界放置，而不是建设一个无边界的 DTO 大仓库：

```text
src/services/<domain>/contracts.ts     # 后续真实 API 契约
src/bridge/<capability>/contracts.ts   # 已确认 Native 协议的 Bridge 契约
```

只有真实职责出现后才创建对应目录。H008 的后台 endpoint / DTO / 鉴权尚未确认，因此 H009 不提前手写后台 DTO。

同一个业务 service 的 API 与 Mock 应复用同一 schema；Mock 的意义是模拟正式契约，而不是拥有另一套页面专用类型。

## 3. 解析与错误模型

使用 `parseContract(schema, input, context)` 在传输边界解析数据。校验失败统一转换为：

```text
AppError
kind = contract
code = CONTRACT_VALIDATION_FAILED
```

`details` 只保留：

- `source`：`api | mock | bridge`
- `contract`：可定位的契约名
- `issues`：标准化后的 Zod issue

不要把完整原始 payload 塞进错误详情或日志。API / Bridge 数据可能包含 token、手机号、身份信息等敏感内容。

## 4. Schema 设计规则

- 只表达已经确认的外部结构，不用 schema 发明产品规则。
- 默认允许外部对象出现新增字段；只消费当前已确认字段，避免服务端向后兼容新增字段导致无意义失败。
- 只有正式外部契约明确要求“字段必须精确匹配”时才使用严格对象校验。
- 转换、默认值和兼容逻辑必须有明确契约依据，不能为了让异常数据通过而静默修补。
- 数据结构异常必须沿 `contract` 错误暴露，不能退回 Mock 或伪装成成功。

## 5. OpenAPI 兼容方向

未来若后台提供 OpenAPI，可让生成产物承担后台 DTO 的编译期来源，并让运行时 schema 与该来源保持可检查的兼容关系。当前阶段不建立 OpenAPI 生成链，也不额外维护一份手写后台 DTO。

目标仍然只有一个：不要让“生成 TS 类型”和“手写 schema/interface”分别演化成两套互相漂移的真值。

## 6. H009 验证样例

`src/services/contracts/h009MockExample.ts` 是 Foundation 阶段的 Mock 契约探针，用来证明：

- 合法外部数据可以安全解析；
- 消费类型由 schema 推导；
- 非法结构稳定进入 `AppError(kind='contract')`；
- 原始错误 payload 不进入错误详情。

它不是后台 DTO，也不是 Native Bridge 协议，不得把其中字段解释成产品正式语义。H008 解阻后，首条真实 API 链应在自己的 domain contract 中复用同一解析边界。
