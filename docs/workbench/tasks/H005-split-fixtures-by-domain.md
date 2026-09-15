# H005｜Fixture 巨石按域拆分

**Status:** Ready  
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

## 验收

- 不再由单个巨型 fixture 文件承载多数业务域。
- 现有正式 H5 页面行为和确定性演示状态保持一致。
- typecheck/build 通过。

## 证据

记录拆分后的目录图、关键兼容出口和 commit SHA。
