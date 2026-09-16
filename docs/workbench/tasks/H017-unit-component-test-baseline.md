# H017｜Vitest + React Testing Library 基线

**Status:** Ready  
**Phase:** Test  
**Depends on:** H007, H009, H010, H011

## 目标

为有逻辑价值的 H5 基础层建立快速测试，不追逐页面覆盖率数字。

## 范围

- 引入 Vitest + React Testing Library 的最小配置。
- 优先覆盖 schema、AppError/service、storage、Zustand store；Bridge adapter 在 H015 解阻后补入。
- 提供稳定 npm test 命令并接入合适 CI 阶段。
- 测试不依赖历史截图节点编号。

## 不做

- 不为每个 JSX 分支凑覆盖率。
- 不测试 legacy/商城业务。
- 不以 snapshot 数量代替行为验证。

## 验收

- 单元/组件测试命令可在本地和 CI 稳定运行。
- 至少覆盖上述已落地基础层中的关键成功/失败行为。
- 测试失败能明确定位能力问题，而非历史文案差异。

## 证据

记录 test summary、CI 结果和 commit SHA。
