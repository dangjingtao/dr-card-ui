# H005｜Fixture 巨石按域拆分证据

## 结论

H005 已将历史 `src/app/fixtures/index.ts` 从约 86KB / 2140 行的多业务巨石收口为 555B 稳定 barrel。现有页面继续从 `app/fixtures` 导入，因此本卡没有制造页面级 import churn。

业务 fixture 已按真实职责拆入：

```text
src/app/fixtures/
├── index.ts           # 555B，只做稳定 re-export
├── dearseed.ts        # 专栏、新人、完善信息与首页展示
├── membership.ts      # 会员、泡泡值、打卡、澡运
├── cards.ts           # 卡包、转赠、核销、兑换码
├── cardUse.ts         # 卡券使用指引文案
├── notifications.ts   # 通知列表、分类与分组 helper
├── support.ts         # 福利官、智能客服、人工客服演示规则
├── exchange.ts        # 洗护兑换、排序、搜索、可兑换性 resolver
├── addressOrders.ts   # 地址、表单校验、订单与金额 helper
├── buddy.ts           # 搭子、邀请、分享与搜索演示规则
├── device.ts          # H005 前已存在，保留
├── service.ts         # H005 前已存在，保留
└── useFixture.ts      # H004 运行时 fixture/debug 控制，保留
```

## 兼容策略

`src/app/fixtures/index.ts` 只保留：

```ts
export * from './dearseed'
export * from './membership'
export * from './cards'
export * from './cardUse'
export * from './notifications'
export * from './support'
export * from './exchange'
export * from './addressOrders'
export * from './buddy'
```

因此现有正式 H5 页面仍可继续使用 `import { ... } from '../app/fixtures'`；后续新增 fixture 则应进入所属域，而不是继续向 barrel 堆业务内容。

## 显式域间依赖

旧巨石中兑换可用性判断直接读取同文件的 `BUBBLE_BALANCE`，依赖被隐藏在单文件作用域中。拆分后 `exchange.ts` 显式：

```ts
import { BUBBLE_BALANCE } from './membership'
```

这里只暴露既有依赖，没有修改余额或兑换判定规则。后续真实 service / API 接入时可直接识别并替换这条依赖。

`COUPON_USE_GUIDE` 虽历史上追加在专栏段之后，但职责实际属于卡包使用，因此 H005 将其单独放入 `cardUse.ts`；文案值不变。

## 范围纪律

- 未修改 MallHome；历史 fixture 中已有 `/mall` 跳转字段原样保留。
- 未引入 MSW、Zod、Axios、service 或真实 API。
- 未修正任何看起来可疑但属于既有业务口径的 fixture 值。
- blocker / rule status / deterministic resolver 保留。
- `device.ts`、`service.ts` 是 H005 之前已经存在的独立 fixture 文件，本卡没有冒充为新拆成果。

## 自动化证据

PR：#11 `refactor: split H005 fixtures by domain`

首个完成巨石替换的工程 head：`bbccdfe24d6b82f8c2810db7c2701f03b721f37d`

GitHub Actions Build run：`35046955770`

结果：

- Static hygiene: PASS
- Typecheck: PASS
- Development server smoke: PASS
- Development build: PASS
- Production build: PASS
- Cloudflare SPA fallback asset: PASS
- Production preview smoke: PASS

Typecheck 在 barrel 替换后通过，证明当前工程使用到的 fixture export 均可通过稳定入口解析；两套 build/smoke 通过，未发现拆文件导致的运行时模块解析回归。

## 当前结论

H005 已满足进入 Agent Review 的工程条件。最终 Ready 后仍需 AI reviewer 针对最新 head 检查是否存在语义漏搬、错误归域或隐藏循环依赖。
