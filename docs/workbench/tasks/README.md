# App 内嵌 H5 工程任务

本目录只承载 UI 高保真阶段之后的正式 H5 工程任务。历史 UI 台账已冻结在 [`../archive/ui-phase/`](../archive/ui-phase/)。

## 当前范围

- 运行载体：卡博士 Native App 内 WebView 的 H5 前端。
- 主施工分支：`dev`；后续按 `preview → dev → test → prod` 晋级。
- `legacy-home*`、`legacy-service*`、`legacy-profile*` 以及按归属属于 Native reference 的 `/device/*`、`/vending/*`、`/signin*` 默认不施工、不重构、不纳入 H5 业务验收。
- 商城当前暂不纳入本轮编码任务。
- 历史 UI 卡、旧节点编号、旧 `PASS` 只作为证据，不作为当前产品事实源。
- H019/H020 之后进入“功能页评估前收口 → 按功能页面/业务闭环施工”阶段，不再继续无边界横向铺基础设施卡。

## 卡片纪律

- 每张卡只验本卡建立的能力，不重复验整个产品。
- 不为了目录整齐、覆盖率、像素检查或历史脚本而改业务代码。
- 不虚构后台 API、认证协议或 Native Bridge 能力。
- 历史证据不删除；真正影响后续施工的结构债必须治理。
- 只有用户可以把任务明确标记为 `Accepted`；若用户明确授权某张卡由 Agent 自验，则仅该张卡可按授权自验收口。
- 自 H021 起，新工程卡以 GitHub Issue 作为工作项契约真相源；本 README 只保留索引与历史投影，不复制 Issue 正文或另造状态真相。


## H019 后功能页评估原则

- **同一功能不复制页面来模拟状态**：原型阶段若为成功/失败/空态等复制了同一套交互，正式工程应收敛为单一实现，由业务状态、参数或明确 fixture 驱动；合法 deep-link / 多入口可以保留，但不得复制业务实现。
- **明显公共组件要抽，并且抽出来要精修**：只抽职责稳定、真实重复的模式；抽取后统一视觉、交互、状态和必要可访问性，不追求机械组件化。
- **H5 是 App WebView 内的纯页面**：不模拟手机系统状态栏，也不把宿主顶部栏目当成 H5 原生壳层；业务内容自己的标题不受此规则影响。
- **商城先封闭**：当前商城不纳入本阶段开放与精修范围，待后续单独评估后再处理。
- **后台忙不构成前端停工理由**：只有已确认数据模型时，可以先定义最小 Mock API 契约并经 `service/adapter → HTTP → MSW` 跑通页面；不得退回页面内假网络。
- **数据模型字段名原则上原样保留**：transport/API 边界不为了前端习惯擅自改名；UI 需要不同结构时在 adapter / view-model 层转换。
- **前端可以协助定义接口，但必须标明事实与暂拟**：endpoint、method、参数、响应、分页、错误等可由前端基于已确认模型提出最小契约；未确认的认证、权限、审核、幂等和复杂状态机不得臆造。
- **治理重复硬编码仍以 Tailwind 体系为主**：重复 arbitrary value（如 `max-w-[480px]`）要区分正式设计约束与原型设备壳遗产；前者语义化，后者删除，不为此另起一套 PostCSS 样式体系。

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
| H006 | 环境配置与构建身份 | User Review |
| H007 | Axios HTTP Client 与统一错误模型 | User Review |
| H008 | Service 层与首条真实 API 垂直链路 | Blocked |
| H009 | Zod 运行时数据契约 | Accepted |
| H010 | Zustand 状态基建与旧共享状态迁移 | Accepted |
| H011 | Storage Adapter | Accepted |
| H012 | React Hook Form + Zod 表单基线 | Accepted |
| H013 | MSW 网络 Mock 基建 | Accepted |
| H014 | Mock 场景迁移与页面假网络清理 | User Review |

### C. 宿主与体验

| ID | 任务 | 状态 |
|---|---|---|
| H015 | JSBridge Adapter 与 Native 导航边界 | Blocked |
| H016 | 路由过渡、返回与滚动体验 | Accepted |
| H020 | 路由过渡残影与快照边界修复 | Accepted |

### D. 测试与交付

| ID | 任务 | 状态 |
|---|---|---|
| H017 | Vitest + React Testing Library 基线 | Accepted |
| H018 | Playwright / CI 正式 H5 基线 | Accepted |
| H019 | 测试报告与 Cloudflare Pages 证据站 | Accepted |


### E. 功能页评估前收口

> H021 起 GitHub Issue 为工作项契约；以下仅作台账索引，不在 README 复制生命周期状态。

| ID | 任务 | Issue |
|---|---|---|
| H021 | H5 宿主壳层与原型设备壳遗产收敛 | [#35](https://github.com/dangjingtao/dr-card-ui/issues/35) |
| H022 | 重复路由与状态实现收敛 | [#36](https://github.com/dangjingtao/dr-card-ui/issues/36) |
| H023 | 正式 H5 公共组件抽取与精修 | [#37](https://github.com/dangjingtao/dr-card-ui/issues/37) |
| H024 | 数据模型驱动的 Mock API 契约基线 | [#38](https://github.com/dangjingtao/dr-card-ui/issues/38) |

H021–H024 完成后，后续工作原则上按功能页面或可独立验收的业务闭环建卡，不再把通用原则拆成无限基础设施卡。

### F. JSBridge 与宿主能力收口

> H027 按 2026-09-19 用户指令使用旧式仓库任务卡作为施工契约；H029–H034 按 2026-09-21 用户指令继续使用 H 体系旧台账，不创建 GitHub Issue。H025/H026/H028 的既有 Issue 记录不回写、不迁移。

| ID | 任务 | Issue / 状态 |
|---|---|---|
| H025 | JSBridge Capability Runtime 可扩展内核 | [#43](https://github.com/dangjingtao/dr-card-ui/issues/43) |
| H026 | Android / iOS Transport 与回调适配机制 | [#44](https://github.com/dangjingtao/dr-card-ui/issues/44) |
| H027 | [Bridge Lab 真机联调页升级](./H027-bridge-lab.md) | User Review（#45 仅兼容跟踪） |
| H028 | 正式 H5 Native 能力盘点与接口征集清单 | [#46](https://github.com/dangjingtao/dr-card-ui/issues/46) |
| H029 | [Native Bridge v2 协议基线与双端登录能力对齐](./H029-native-bridge-v2-auth-contract.md) | Ready |
| H030 | [关闭 WebView Native 能力接线](./H030-native-close-webview.md) | Ready |
| H031 | [扫码核销 Native 能力接线](./H031-native-scan-code.md) | Ready |
| H032 | [图片与剪贴板 Native 能力接线](./H032-native-media-share.md) | Ready |
| H033 | [激励广告 Native 能力接线](./H033-native-reward-ad.md) | Ready |
| H034 | [APP 唤起与应用商店承接 Native 能力接线](./H034-native-open-app.md) | Ready |

H029 是 H030–H034 的公共协议前置；H029 合入后，H030–H034 可独立并行。H029–H034 以对应仓库任务卡为施工契约真相源，不另开 GitHub Issue。

## 主要阻塞

- H008：真实 backend base URL、认证方式、核心接口契约尚未确认；禁止为完成任务自行发明协议。
- H015：Native 已回填双端 Bridge v2 目标协议；当前仅登录能力标记为已注入，其余 close / scan / media / clipboard / reward-ad / open-app 方法仍待 Native 实现与真机联调。
