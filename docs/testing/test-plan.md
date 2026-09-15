# 卡博士 App 内嵌 H5 Test Plan

## 1. 目的

本计划定义 `dr-card-ui` 从 `dev` 进入 `test`、再从 `test` 进入 `prod` 时需要验证什么、留下什么证据，以及哪些结果不能互相替代。

核心原则：

> 浏览器可用 ≠ App WebView 可用；Mock 可用 ≠ 真接口可用；Bridge Mock 可用 ≠ Native Bridge 已支持；CI 绿灯 ≠ 业务验收通过。

## 2. 测试对象

正式 H5 验收分为四层：

```text
A. 浏览器 H5
B. App WebView
C. 真实 API
D. Native JSBridge
```

不同任务可以只影响其中部分层级，但进入生产前必须明确哪些层已经验证、哪些不适用、哪些仍待确认。

## 3. 推荐运行组合

### 开发 / 视觉验证

```text
Browser + Mock API + Mock Bridge
```

用途：

- UI 开发；
- 可重复截图；
- 页面状态覆盖；
- 后台或 Native 尚未就绪时继续施工。

这套组合不能作为真实 App 集成验收证据。

### API 联调

```text
Browser / WebView + Real API + Mock or Native Bridge
```

用途：

- 接口字段与状态联调；
- 鉴权、错误、超时；
- 业务数据真实性验证。

### App 集成验收

```text
App WebView + Real API + Native Bridge
```

这是涉及宿主能力任务进入 `prod` 前的核心验证环境。

## 4. `dev → test` 进入条件

准备进入 `test` 的版本至少要满足：

- 当前功能范围明确；
- 对应 H5 commit SHA 可定位；
- `npm run typecheck` 通过；
- `npm run build` 通过；
- 与本次变更相关的自动化 / E2E 已运行，或明确记录为何不适用；
- 已知阻塞问题已记录；
- 使用的是 Mock 还是真 API、Mock Bridge 还是 Native Bridge，有明确说明；
- 若依赖尚未确认的 Native 能力，不得把它描述成“已完成集成”。

## 5. 浏览器 H5 测试

重点检查：

### 路由

- 首页与关键业务页可进入；
- 目标 URL 可直接访问；
- 刷新不白屏；
- 前进 / 后退符合页面语义；
- 非法或缺失参数有明确处理。

### 页面状态

根据业务实际覆盖：

- loading；
- normal；
- empty；
- error；
- timeout；
- unauthorized / 登录失效；
- disabled / unavailable；
- 长文案与边界数据。

### 基础交互

- 点击区域可用；
- 表单输入、校验和提交；
- 弹窗 / Drawer / Tab / 列表滚动；
- 防重复提交；
- 操作后的状态变化真实而非只改高亮。

### 资源与构建

- 静态资源路径正确；
- production build 下可运行；
- SPA fallback 正常；
- 控制台无阻塞性错误。

## 6. App WebView 测试

浏览器通过后，进入真实 App WebView 检查：

### 布局环境

- iOS / Android 目标环境下无明显裁切；
- 顶部状态栏 / 安全区正确；
- 底部 Home Indicator / 安全区不遮挡固定按钮；
- 横竖屏策略与 App 约定一致；
- 页面缩放行为符合预期。

### 键盘与输入

- 键盘弹起不遮挡当前输入项或主操作；
- 输入完成 / 收起键盘后布局能恢复；
- 长表单可滚动到目标输入项；
- 输入法切换不造成页面永久错位。

### 滚动与容器

- 页面滚动正常；
- 固定顶部 / 底部区域不抖动；
- 内外层滚动不存在明显冲突；
- 弹层打开时背景滚动行为符合预期。

### 返回与生命周期

- H5 内返回；
- App 系统返回；
- WebView 关闭；
- 切后台再回来；
- 从其他 Native 页面重新进入；
- 页面恢复后关键状态是否需要刷新或保留。

具体行为以后续宿主协议和产品约定为准，测试计划不预设 App 一定提供某种返回接口。

### 缓存与版本

- App 是否命中新旧 H5 缓存可判断；
- 发布后能定位当前加载的 H5 版本 / commit；
- 必要时验证升级、重新打开后的资源一致性。

## 7. API 测试

真实 API 接入后至少关注：

- 正常返回；
- 空数据；
- 参数错误；
- 未登录 / 登录过期；
- 无权限；
- 4xx / 5xx；
- 网络断开；
- 超时；
- 返回字段缺失 / 类型异常时前端是否失控；
- 业务提交过程中重复点击的处理。

涉及支付、充值、设备启动、核销等有副作用的能力时，应以实际后端契约为准补充幂等、结果确认和失败恢复测试；在接口未确认前不在本计划中臆造具体协议。

## 8. JSBridge 测试

任何 Bridge 能力只有在真实宿主环境验证后，才能标记为 Native 集成通过。

对每个已确认 Bridge 能力检查：

- Bridge 是否已注入；
- capability detection 是否准确；
- 参数是否按协议传递；
- 正常成功返回；
- 原生失败；
- 用户取消（如果协议定义）；
- 超时；
- 不支持能力；
- 旧 App 版本；
- 页面连续 / 重复调用；
- 页面退出后回调是否造成脏更新；
- 注入晚于页面加载时的行为。

Browser Mock 应使用同一上层接口，但测试记录必须明确标记为 `mock`，不能作为 Native 证据。

### Bridge 能力矩阵模板

宿主协议确认后逐项增加，不提前编造能力：

| Bridge 能力 | Browser Mock | Android Native | iOS Native | 最低 App 版本 | 失败 / fallback | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `<confirmed-capability>` | 待填 | 待验证 | 待验证 | 待确认 | 待确认 | Draft |

## 9. Mock 测试要求

Mock 需要帮助发现问题，而不是只让页面看起来“能跑”。

要求：

- 场景稳定可复现；
- 与真实 service 使用同一页面接口；
- 明确区分 UI fixture、API Mock、Bridge Mock；
- 关键错误 / 空态可以主动切换；
- 不用 Mock 成功覆盖真实 API / Bridge 失败；
- `prod` 验收不得依赖 Mock 才能通过。

## 10. 自动化与 CI

现有 CI 的 typecheck、build、smoke、SPA fallback 等属于基础工程门槛。

随着正式开发推进，逐步补齐：

- 关键路由 E2E；
- 关键业务流程 E2E；
- Service / 数据映射测试；
- Bridge adapter / contract 测试；
- Mock 场景回归。

自动化无法完全替代真实 App WebView / Native Bridge 联调，因此 CI 成功只能作为进入下一验收步骤的证据之一。

## 11. 缺陷等级

为避免 `test → prod` 判断含糊，建议使用：

- **P0 Blocker**：无法启动、关键流程完全不可用、数据 / 资金 / 安全高风险、无法继续验收。
- **P1 Major**：核心业务明显错误、重要 Bridge / API 能力不可用、主流程有高概率失败。
- **P2 Normal**：非核心功能或部分场景错误，有明确替代路径。
- **P3 Minor**：轻微视觉、文案或低影响体验问题。

具体业务严重性由当前任务和产品影响决定，等级不能只按技术修复难度判断。

## 12. `test → prod` 发布门槛

进入 `prod` 前至少确认：

- 本次发布范围明确；
- H5 commit SHA 明确；
- 自动化基础门槛通过；
- 关键业务路径在目标 App WebView 中通过；
- 本次涉及的真实 API 已联调；
- 本次涉及的 Native Bridge 已在对应目标平台验证；
- 无未接受的 P0 / P1；
- 已知 P2 / P3 有明确记录与是否接受的结论；
- 发布产物 / 部署版本可定位；
- Mock 没有作为真实业务兜底。

如果某层不适用，需要写“不适用”和原因，而不是留空后默认通过。

## 13. 验收记录模板

每次正式 App 联调 / 发布候选至少记录：

```text
H5 commit SHA:
H5 build / deployment:
App version / build:
Platform: Android | iOS
Device / OS:
API environment:
DATA_MODE: mock | api
BRIDGE_MODE: mock | native
Test scope:
Result: PASS | FAIL | BLOCKED
Known issues:
Tester:
Date:
```

如果 App 版本、Bridge 协议版本等当时尚无正式编号，按实际可追踪信息记录，不虚构版本号。

## 14. 与台账系统的关系

`docs/workbench/` 继续负责需求、任务、决策、证据和用户验收治理。

本 Test Plan 负责回答“一个 H5 实现从工程角度验到什么程度才能晋级”。两者不是替代关系：

- UI 历史任务已验收，不自动等于真实 API / WebView / Bridge 已验收；
- 工程 CI 通过，也不自动等于用户已经接受产品 / UI 结论；
- 后续正式开发任务应把对应测试证据链接回任务记录。

旧 UI 任务的归档或删除方式尚未最终决定，本计划不改写其历史状态。
