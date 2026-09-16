# H005｜Fixture 巨石按域拆分

**Status:** Agent Review  
**Phase:** Hygiene  
**Depends on:** H004

## 目标

拆解当前约 86KB 的 `app/fixtures/index.ts`，让展示夹具、业务演示规则、类型和 resolver 按业务域与职责维护。

## 范围

- 按会员/打卡、卡券、地址、通知、客服、搭子等真实域拆文件。
- 区分静态 fixture、类型、resolver/演示规则与未决 rule status。
- 维持稳定 barrel export，避免无价值的大面积页面 import 改写。
- 为后续 MSW、Zod 和真实 service 迁移留下清晰接口。

## 不做

- 不在拆文件过程中重写未确认业务规则。
- 不删除历史 blocker / 未决记录。
- 不处理商城域。

## 实现结果

- 历史约 86KB / 2140 行 `src/app/fixtures/index.ts` 已缩为 555B 稳定 barrel。
- 巨石内容拆入 `dearseed.ts`、`membership.ts`、`cards.ts`、`cardUse.ts`、`notifications.ts`、`support.ts`、`exchange.ts`、`addressOrders.ts`、`buddy.ts`。
- H005 前已经存在的 `device.ts`、`service.ts` 与 H004 `useFixture.ts` 原样保留，不冒充本卡拆分成果。
- 页面侧继续通过 `app/fixtures` 导入，未制造无业务价值的 import 路径迁移。
- 原先隐藏在同文件作用域中的 `exchange → BUBBLE_BALANCE` 依赖改为 `exchange.ts → membership.ts` 显式 import；判断规则和数值未改。
- 历史上追加在专栏段后的 `COUPON_USE_GUIDE` 按职责独立到 `cardUse.ts`，文案值不变。

## 验收

- 不再由单个巨型 fixture 文件承载多数业务域。
- 现有正式 H5 页面行为和确定性演示状态保持一致。
- typecheck/build 通过。

## 证据

详见 [`../evidence/h005-fixture-domain-split.md`](../evidence/h005-fixture-domain-split.md)。

最终 review head `15a8c6de99` 的 Build run `35047133441` 全绿：Static hygiene、Typecheck、dev/prod build、dev/prod smoke、SPA fallback 均 PASS；Cloudflare 分支预览部署成功。

Codex 已对同一最终 head 完成 review，结论为 `Didn't find any major issues.`，没有遗留 review thread。PR #11 已合入 `dev`，merge commit `45138a3e8f61ccb558151cfe2a4d43d6fa5bb4a1`。

当前状态保持 `Agent Review`，等待用户决定是否标记 `Accepted`。
