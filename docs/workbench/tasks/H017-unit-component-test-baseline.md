# H017｜Vitest + React Testing Library 基线

**Status:** User Review  
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

- PR：#23 `H017: add Vitest and React Testing Library baseline`。
- 实现校验 commit：`47923e832ee964253f4d35dc4fae0df44ccca873`。
- `npm test`：4 个测试文件、13 个测试全部通过；覆盖 contract、HTTP/AppError、Storage Adapter、Zustand/React 订阅行为。
- GitHub Actions Build #375：success；lint、typecheck、H007-H015 retained verify、dev/preview/test/prod 构建与 smoke 链路均通过。
- OpenCode Review #132：No blocking findings；此前指出的 `tests/storage` 未被 Vitest discovery 纳入的问题已由 `47923e8` 修复。
- `package-lock.json` 由 Node 20.20.2 / npm 10.8.2 的 GitHub Actions runner 实际生成。
- Bridge adapter 测试仍按本卡约束等待 H015 真实 Native 协议解阻，不在 H017 中伪造宿主能力。

待用户验收后方可标记为 `Accepted`。
