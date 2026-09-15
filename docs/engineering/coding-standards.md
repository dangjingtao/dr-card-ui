# 卡博士 H5 代码规范

本文约束 `dr-card-ui` 从 UI 工程进入正式 App 内嵌 H5 开发后的代码组织与工程边界。

目标不是为了目录整齐而重构，而是保证：UI 真相不漂移、后台未就绪时仍可开发、真实 API 与 Mock 可平滑切换、JSBridge 不污染页面、App WebView 问题可定位和验收。

## 1. 适用范围

当前技术基线：

- Vite
- React 18
- TypeScript
- React Router
- Tailwind CSS
- Lucide React
- Com Design 金色 / 橙色语义 Token

本规范适用于 `dev` 及之后的正式 H5 工程施工。`preview` 的纯 UI 施工也应遵守组件、Token、类型和基础代码卫生规则。

## 2. 总体分层

页面不应同时承担 UI、接口、Mock、宿主协议和数据转换。

目标边界：

```text
Page / Component
      ↓
Service / Repository
      ↓
API implementation | Mock implementation

Page / Component
      ↓
Bridge adapter
      ↓
Native implementation | Browser Mock
```

两条依赖链彼此独立：后台 API 是否可用，不应决定 JSBridge 是否可测；浏览器是否有 Native Bridge，也不应阻塞普通页面开发。

## 3. 目录约定

仓库已经存在的结构优先复用：

```text
src/
  app/
  components/
    ui/
    mobile/
    card/
  layouts/
  pages/
```

随着正式 H5 能力接入，目标上逐步形成：

```text
src/
  services/        # 页面使用的业务服务 / repository 边界
  mocks/           # 业务 Mock、场景和 fixture
  bridge/          # H5 ↔ Native 统一协议与实现
  hooks/           # 可复用 React hooks
  lib/             # 与业务无关的通用工具
  types/           # 跨模块共享类型
```

这些是**目标边界，不是为了目录而目录**。只有出现真实职责时才新增；不要为了“符合规范”进行大规模无关搬家。

现有 `src/app/fixtures/` 等 UI 阶段数据可以继续作为视觉 fixture 使用。进入真实业务后，应逐步明确哪些属于 UI fixture、哪些属于 API Mock，避免两者混用。

## 4. 页面与组件

### 页面负责

- 路由页面组合；
- 页面级交互；
- loading / empty / error / success 等展示状态；
- 调用统一 service / hook / bridge；
- 将业务数据映射为组件 props。

### 页面不负责

- 直接拼接后端 URL；
- 散落 `fetch` / `XMLHttpRequest`；
- 直接访问未经封装的 `window.xxx` 原生对象；
- 在组件内维护一套只为 Mock 服务的独立业务逻辑；
- 把真实 token、密钥或敏感配置写进源码。

### 组件原则

- 先查已有组件，再新增；
- 基础组件保持无业务或低业务耦合；
- 可复用业务模式才抽组件，不为抽象而抽象；
- 一次性品牌艺术画面可以局部实现，不强行泛化；
- props 和状态命名表达业务含义，不使用 `data1`、`flag2` 等无语义命名。

## 5. TypeScript

- 新增正式业务代码默认使用明确类型，避免无边界 `any`。
- 外部输入都是不可信边界：API 响应、URL 参数、Bridge 返回值、LocalStorage 数据不能因为 TypeScript 声明就视为运行时一定正确。
- API DTO、Bridge payload 与页面展示模型可以不同；必要时在边界处转换，不让后端字段结构直接渗透整个 UI。
- 可空、可失败、未支持等状态应体现在类型或统一结果模型中，不用大量隐式 `undefined` 猜测。
- 若 Native Bridge 需要扩展 `window`，集中声明类型，不在多个页面重复 `declare global`。

## 6. API / Service 规范

### 统一入口

页面只依赖业务语义，例如：

```ts
getUserProfile()
getDeviceList()
submitRecharge()
```

而不是依赖 URL、HTTP 方法或某个 Mock 文件路径。

### API 实现

统一处理：

- base URL；
- 请求头与鉴权；
- timeout；
- HTTP / 业务错误归一化；
- 登录失效；
- 必要的数据转换；
- 可诊断但不泄露敏感信息的日志。

不要在每个页面重复这些逻辑。

### 错误处理

页面应拿到可判断的错误类别，而不是只能展示 `Request failed`。

至少区分需要业务关注的：

- 网络不可用；
- 超时；
- 未登录 / 登录过期；
- 无权限；
- 服务端失败；
- 返回结构异常。

具体业务错误码以后端正式契约为准，不在前端规范中臆造。

## 7. Mock 规范

Mock 是正式开发模式，不是散落在页面里的临时假数据。

### 核心规则

- Mock 与真实 API 通过同一 service / repository 接口提供给页面；
- 切换数据源不要求页面改代码；
- Mock 数据稳定、可复现；
- 需要时提供明确场景：normal / empty / loading / error / timeout / unauthorized 等；
- 不用随机数让截图和测试结果每次不同，除非该随机性本身就是测试目标；
- Mock 数据应明确属于开发 / 预览，不冒充真实生产数据；
- `prod` 禁止在真实 API 失败后静默退回 Mock。

### UI fixture 与 API Mock

二者不同：

- **UI fixture**：为了稳定还原设计、视觉截图和组件演示；
- **API Mock**：模拟正式业务服务契约和异常场景。

已有 fixture 不需要立即删除，但正式接口接入时应明确边界。

## 8. JSBridge 规范

所有 H5 ↔ 原生 App 调用集中在 `bridge` 边界，不允许页面各自发明协议。

### Bridge adapter 至少负责

- 能力检测；
- 调用参数类型；
- 返回值类型；
- 成功；
- 失败；
- 用户取消（若协议存在）；
- 超时；
- Bridge 未注入；
- 当前 App 版本不支持；
- 浏览器 Mock；
- 必要且合理的 Web fallback。

### 禁止

```ts
// 页面中禁止形成此类散落依赖
window.someNative.scan(...)
window.webkit.messageHandlers.xxx.postMessage(...)
```

具体宿主协议确认后，由 Bridge implementation 封装；页面只调用稳定的业务能力接口。

### 能力事实

- 没有宿主文档 / 实机验证的能力一律视为“未确认”；
- Browser Mock 成功不代表 Native 已支持；
- 不因历史 Demo 存在某方法，就自动把它升级为正式 Bridge 契约。

## 9. 环境配置

建议工程最终形成类似：

```text
VITE_DATA_MODE=mock|api
VITE_BRIDGE_MODE=mock|native
VITE_API_BASE_URL=...
```

这只是当前约定的**配置语义**；变量尚未实际落地前，不应在文档或代码评论里声称已经可用。

规则：

- `.env*` 不提交真实密钥；
- `VITE_*` 会进入前端产物，不能存放 secret；
- 提交 `.env.example` 时只提供安全示例和说明；
- 环境判断集中管理，不在页面里重复读取环境变量。

## 10. 路由与状态

- React Router 路由统一登记，避免页面内部偷偷形成第二套路由表；
- 页面刷新、直接访问和 App WebView 冷启动进入目标 URL 都应有明确行为；
- 能由 URL 表达、需要返回或分享的状态优先进入路由语义；
- 全局状态只放真正跨页面共享的业务状态；
- LocalStorage / SessionStorage key 应带项目语义前缀，避免宿主或其他 H5 冲突；
- 持久化数据需要考虑版本升级和旧值异常。

## 11. 样式与设计系统

- 优先使用 Com Design Token 与现有 Tailwind 语义类；
- 有 Token 时不重复硬编码近似色；
- 新增阴影、圆角、颜色前先确认现有设计体系是否已有对应语义；
- 375 × 812 是主要视觉基准，但代码不能依赖固定屏幕高度才能正常工作；
- 固定底部操作需要考虑 `safe-area-inset-bottom`；
- 输入表单需要考虑 WebView 键盘遮挡；
- 不以工程方便为理由改坏 `preview` 已确认的层级、间距和品牌视觉。

## 12. WebView 兼容

开发涉及以下行为时，不能只在桌面浏览器验证：

- 返回键 / 关闭页；
- 底部固定区域和安全区；
- 输入框与软键盘；
- 滚动容器；
- 页面隐藏 / 恢复；
- 上传、摄像头、扫码等宿主能力；
- 缓存导致的新旧 H5 版本；
- Bridge 注入时机。

真实 App 行为应在 `test` 阶段留下验收记录。

## 13. 日志与敏感信息

- 不打印 access token、完整手机号、身份证、密码、消费密码、签名串等敏感信息；
- 开发诊断日志应可关闭；
- 用户可见错误文案与开发日志分离；
- 不吞掉错误后伪装成成功状态；
- Mock / test 环境标记不应污染正式 UI。

## 14. 测试要求

按改动范围执行：

```bash
npm run typecheck
npm run build
npm run test:e2e
```

不是每次文档改动都必须运行业务 E2E；但功能改动需要与风险匹配的验证。

正式工程逐步补齐：

- service / 数据转换测试；
- Mock 场景测试；
- 路由与关键流程 E2E；
- Bridge contract / adapter 测试；
- App WebView 真机联调记录。

CI 绿灯不是生产验收的替代品。

## 15. Git 与修改卫生

- 只改当前任务需要的文件；
- 不顺手重构无关模块；
- 不提交 `node_modules`、`dist`、测试报告等生成产物；
- 不删除设计源、历史原型、验收截图和证据来追求“仓库更小”；
- 新需求不要静默改写已验收历史任务；
- 提交信息要能说明做了什么，不使用 `update`、`fix stuff`。

长期分支晋级规则以 `docs/workflow/branch-strategy.md` 为准。

## 16. 完成定义（DoD）

### 纯 UI 任务

- UI 事实依据明确；
- 375 × 812 基准符合预期；
- 关键状态覆盖；
- typecheck / build 与任务风险匹配地通过；
- 进入 `preview` 验收。

### H5 功能任务

除 UI 要求外：

- 数据来源通过统一 service；
- Mock / API 边界清晰；
- loading / empty / error 等真实状态有处理；
- 不直接散落依赖 Native Bridge；
- 关键路由可直接访问 / 刷新；
- 必要自动化检查通过。

### Native / JSBridge 任务

除 H5 功能要求外：

- 协议来源已确认；
- adapter 统一封装；
- 未注入 / 不支持 / 失败 / 超时有明确行为；
- Browser Mock 与 Native 实现可区分；
- 在目标 App WebView 中留下真实验证结果后，才可视为集成完成。
