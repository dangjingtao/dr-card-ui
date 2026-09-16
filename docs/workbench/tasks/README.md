# App 内嵌 H5 工程任务

本目录只承载 UI 高保真阶段之后的正式 H5 工程任务。历史 UI 台账已冻结在 [`../archive/ui-phase/`](../archive/ui-phase/)。

## 当前范围

- 运行载体：卡博士 Native App 内 WebView 的 H5 前端。
- 主施工分支：`dev`；后续按 `preview → dev → test → prod` 晋级。
- `legacy-home*`、`legacy-service*`、`legacy-profile*` 以及按归属属于 Native reference 的 `/device/*`、`/vending/*`、`/signin*` 默认不施工、不重构、不纳入 H5 业务验收。
- 商城当前暂不纳入本轮编码任务。
- 历史 UI 卡、旧节点编号、旧 `PASS` 只作为证据，不作为当前产品事实源。

## 卡片纪律

- 每张卡只验本卡建立的能力，不重复验整个产品。
- 不为了目录整齐、覆盖率、像素检查或历史脚本而改业务代码。
- 不虚构后台 API、认证协议或 Native Bridge 能力。
- 历史证据不删除；真正影响后续施工的结构债必须治理。
- 只有用户可以把任务明确标记为 `Accepted`；若用户明确授权某张卡由 Agent 自验，则仅该张卡可按授权自验收口。

## 当前任务

### A. 卫生与边界

| ID | 任务 | 状态 |
|---|---|---|
| H001 | 代码质量与卫生基线 | Accepted |
| H002 | 正式 H5 / Native reference 路由边界 | Accepted |
| H003 | 切断正式 H5 对 legacy runtime 的依赖 | Accepted |
| H004 | Fixture / Debug 运行环境隔离 | Accepted |
| H005 | Fixture 巨石按域拆分 | Accepted |

### B. 生产 H5 基础能力

| ID | 任务 | 状态 |
|---|---|---|
| H006 | 环境配置与构建身份 | Agent Review |
| H007 | Axios HTTP Client 与统一错误模型 | Ready |
| H008 | Service 层与首条真实 API 垂直链路 | Blocked |
| H009 | Zod 运行时数据契约 | Ready |
| H010 | Zustand 状态基建与旧共享状态迁移 | Ready |
| H011 | Storage Adapter | Ready |
| H012 | React Hook Form + Zod 表单基线 | Ready |
| H013 | MSW 网络 Mock 基建 | Ready |
| H014 | Mock 场景迁移与页面假网络清理 | Ready |

### C. 宿主与体验

| ID | 任务 | 状态 |
|---|---|---|
| H015 | JSBridge Adapter 与 Native 导航边界 | Blocked |
| H016 | 路由过渡、返回与滚动体验 | Ready |

### D. 测试与交付

| ID | 任务 | 状态 |
|---|---|---|
| H017 | Vitest + React Testing Library 基线 | Ready |
| H018 | Playwright / CI 正式 H5 基线 | Ready |
| H019 | 测试报告与 Cloudflare Pages 证据站 | Ready |

## 主要阻塞

- H008：真实 backend base URL、认证方式、核心接口契约尚未确认；禁止为完成任务自行发明协议。
- H015：Native JSBridge 的真实能力与协议尚未提供；在协议确认前不伪造扫码、相册、导航等宿主方法。
