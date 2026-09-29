# Native Bridge v2 契约基线

> 来源：2026-09-21 Native 团队对 H028 能力征集清单的回填。  
> H029 负责把该回填转为 H5 正式 Bridge 契约基线；2026-09-28 H5 × Native 联调协议补充了 callbackId 与统一 callback 目标。未实现的 Native 方法仍保持 unsupported。

## 1. 双端统一约定

| 平台 | 注入对象 |
|---|---|
| Android | `window.androidBridge` |
| iOS | `window.iosBridge` |

Native 团队确认：

- Android / iOS 使用相同方法名；
- JSON 字段保持一致；
- 有参方法的入参统一为 **JSON 字符串**；
- 2026-09-21 原始回填中的“有参方法同步 return”已被后续真机实现与 2026-09-29 对齐结论覆盖：**调用形态按能力语义划分，不按平台划分**；
- 同步能力不带 `callbackId`：`getLoginToken()` 同步 return JSON；`closeWebView()` 为无结果 fire-and-forget；
- 异步能力必须带由 H5 transport 生成的 `callbackId`：`scanCode / takePhoto / chooseImage / saveImageToAlbum / copyText / showRewardAd / openApp`；
- Android / iOS 的异步方法名、业务字段、返回 envelope 与 callbackId 语义保持一致；**统一目标 callback** 为 `window.nativeBridgeCallback(callbackId, payload)`；
- 当前 Android 真机源码已验证 `window.androidBridgeCallback(callbackId, payload)`，H5 将其作为兼容入口挂到与统一目标相同的 pending channel；iOS 不新增平台专用 callback 名，真实宿主是否已实现统一目标仍须真机确认；
- 回填中统一写明最低 App 版本目标为 **2.13**；
- “最低版本 2.13”不等于方法已经实现，能力是否可用仍以“是否已有”和真机注入结果为准。

## 1.1 Native 统一失败返回

2026-09-21 Native 团队补充确认：对于有 JSON 结果返回的 Bridge 调用，通用失败 envelope 为：

```json
{"error":"cancel"}
```

表示用户取消。

```json
{"error":"permission_denied"}
```

表示系统权限拒绝。

```json
{"error":"fail"}
```

表示 Native / SDK 普通失败。

H5 Runtime 统一映射为：

| Native error | `NativeBridgeError.code` |
|---|---|
| `cancel` | `native-cancelled` |
| `permission_denied` | `native-permission-denied` |
| `fail` | `native-failed` |

约束：

- 不新增其它 error code；
- 未知 `error` 值视为协议非法，按 `invocation-failed` 处理，并保留 `payload-invalid` cause；
- 该 envelope 在 capability 自身成功 DTO 解析之前识别；
- `showRewardAd` 的 `completed | closed | failed | no_fill` 仍是广告业务结果；若 Native 直接返回通用 `{"error":"..."}`，则按 invocation-level failure 处理；
- `closeWebView()` 当前合同定义为“无返回”，因此不假设它也会返回该 JSON envelope；若 Native 后续需要失败回传，应另行确认返回契约。

## 2. 当前已注入：登录凭证

两端均已注入 `getLoginToken()`，Native 仍需把内部实现改为读取真实登录态。

### Android

```js
window.androidBridge.getLoginToken()
```

### iOS

```js
window.iosBridge.getLoginToken()
```

无参数，同步返回 JSON 字符串。当前 Android 宿主额外返回 salt；H5 对旧版只返回 token 的宿主保持兼容：

```json
{"token":"8a59966dc70c13b2b87b0ab2ca383ebb","salt":"..."}
```

H5 正式契约：

```ts
type NativeLoginToken = {
  token: string
  salt?: string
}
```

H5 必须：

- 每次调用重新解析当前 injected object；
- 保留 Native object receiver；
- 只接受 JSON string；
- salt 存在时必须是 string；旧宿主缺少 salt 时保留 token-only 兼容结果；
- JSON 非法、返回非 JSON string、`token` 非 string 均按 payload invalid 失败；
- 同步 Native return 统一 Promise 化给业务层；
- token 结果按敏感信息处理。

## 3. 已约定但 Native 尚未实现

| 能力 | 双端方法 | Native 当前状态 | 后续卡 |
|---|---|---|---|
| 关闭 WebView | `closeWebView()` | Android / iOS：否 | H030 |
| 扫码 | `scanCode(json)` | Android / iOS：否 | H031 |
| 拍照 | `takePhoto(json)` | Android / iOS：否 | H032 |
| 相册选图 | `chooseImage(json)` | Android / iOS：否 | H032 |
| 保存图片到相册 | `saveImageToAlbum(json)` | Android / iOS：否 | H032 |
| 复制文本 | `copyText(json)` | Android / iOS：否 | H032 |
| 激励广告 | `showRewardAd(json)` | Android / iOS：否 | H033 |
| APP 唤起 / 商店 | `openApp(json)` | Android / iOS：否 | H034 |

这些方法名、参数字段与返回形态已经由 Native 回填，可以作为后续 H5 target contract；但在 Native 真正注入方法之前，production capability 必须保持 unsupported / fail-closed。

## 4. 历史 iOS 协议

旧联调曾使用：

```js
window.webkit.messageHandlers.getAuthorizationInfo.postMessage({})
window.onToken(token)
```

H029 起该协议降级为 **历史联调证据 / Bridge Lab Raw Probe preset**：

- 不再作为 production auth capability；
- 不删除 H026 messageHandler transport；
- Bridge Lab 仍可用于验证旧 App build；
- 新正式登录入口只认 `window.iosBridge.getLoginToken()`。

## 5. 运行时边界

- 业务页面不得直接访问 `window.androidBridge` / `window.iosBridge`；
- 正式调用统一经过 `src/services/nativeBridge.ts`；
- injected-object 底层按**调用形态**选择 transport：同步能力使用 `createInjectedObjectTransport`；所有异步能力在 Android / iOS 均使用 `createCallbackInjectedObjectTransport`；
- `callbackId` 由 H5 transport 生成、登记 pending、超时清理并按 id 关联 Promise；业务页面不得传入或感知 callbackId；
- 为兼容迁移期旧宿主，callback transport 若收到同步 return 会立即解析；**目标协议仍以异步 callback 为准**，不得据此把异步能力重新定义成同步；
- Bridge Lab 可枚举 registered capabilities，并保留 Raw Probe；
- 浏览器、旧 App 或方法未注入时必须明确 unsupported；
- 真机 WebView smoke 才能把“契约已实现”升级为“当前 App build 已可用”。

## 5.0 宿主身份查询（H036）

`src/services/nativeBridge.ts` 除 capability 调用外，还对外提供一个一等公民的**宿主身份查询**：

```ts
export type NativeHostKind = 'android' | 'ios' | 'browser'

export function getNativeHost(): NativeHostKind
```

语义约束：

- 判定依据只有注入对象是否存在（`window.androidBridge` → `android`；`window.iosBridge` / `window.webkit.messageHandlers` → `ios`；否则 `browser`），**不看 UA，不做版本推断**；
- 每次调用重新读取当前 `window`，**不缓存**注入对象，允许注入晚于 H5 初始化；
- 结果与 `runtimePolicy.bridgeMode` **无关**：`bridgeMode` 决定"是否允许调用能力"，`getNativeHost()` 只回答"当前是什么宿主"；
- 它是宿主探测结果，因此**不得**由环境变量表达或用构建期配置替代；
- 与 capability 调用相同，页面、入口与提示组件只能经该 façade 查询，不得自行检测宿主对象。

`getNativeBridgeDiagnostics()` 继续用于能力就绪诊断；宿主门禁（`test/prod` 仅限原生宿主）消费的是 `getNativeHost()`，因为门禁不应受 `bridgeMode` 影响。

实现位置：`src/services/nativeBridge/runtime.ts` 的 `getNativeHost()`，经 `src/services/nativeBridge.ts` 重新导出。


## 5.1 Bridge 代码分层

Native Bridge 的业务公开入口保持为：

```text
src/services/nativeBridge.ts
```

该文件只承担稳定 façade；页面、adapter 与 Bridge Lab 不直接依赖内部模块。

内部实现按职责拆分：

```text
src/services/nativeBridge/
├── types.ts
├── errors.ts
├── protocol.ts
├── core.ts
├── registry.ts
├── runtime.ts
└── capabilities/
    ├── auth.ts
    ├── host.ts
    ├── scan.ts
    ├── media.ts
    ├── rewardAd.ts
    └── openApp.ts
```

约束：

- 新 capability 优先进入对应 `capabilities/*` 模块，再登记到 `registry.ts`；
- timeout、mode gate、diagnostics、debug invocation 等统一运行时逻辑留在 `runtime.ts`；
- Native 通用失败 envelope 与 Bridge error 映射集中维护，不允许页面重复解析；
- `nativeBridgeTransport.ts` 继续作为更底层 transport 层，当前 H026 messageHandler/callback 能力不因本次拆分改写；
- 业务侧继续只从 `src/services/nativeBridge.ts` 导入，避免内部结构成为新的公共契约。

## 6. H030 H5 接线状态

H5 已把双端 `closeWebView()` target contract 注册进 Capability Runtime：

- Android：`window.androidBridge.closeWebView()`
- iOS：`window.iosBridge.closeWebView()`
- 无参数、无结果 payload；
- 宿主 method 缺失时保持 unsupported；
- `HostCloseButton`、一级 TitleBar 与沉浸页关闭入口统一使用该 capability；
- Bridge Lab Android / iOS 均可查看该 registered capability。

Native 回填仍标记 Android / iOS 当前均“否”，所以这里仅表示 **H5 contract 已就绪**，不表示当前 APK / IPA 已支持。


## 7. H031 H5 扫码接线状态

H5 已把双端 `scanCode(json)` target contract 注册进 Capability Runtime：

- Android：`window.androidBridge.scanCode(json)`；H5 加入运行时生成的 `callbackId`，Native 通过 `window.androidBridgeCallback(callbackId, payload)` 回传；
- iOS：`window.iosBridge.scanCode(json)`；同样加入 `callbackId`，Native 通过 `window.nativeBridgeCallback(callbackId, payload)` 回传；
- `scanType` 保留 Native 原字段和值：`qr | bar | all`；
- Android 当前兼容联调 envelope（例如 `{ code: 0, data: { text: "..." } }`）以及既有 `{ code: "..." }` 结果；iOS 继续接受既有 JSON-string 结果；
- H5 以稳定的 `window.nativeBridgeCallback` 维护 callbackId pending channel；Android 同时挂载 `window.androidBridgeCallback` 兼容入口，两者命中同一 pending map，允许同能力与跨能力乱序返回，并在完成或超时后清理；
- 扫码原始内容按敏感结果处理，Bridge Lab 默认脱敏；
- `/card/verify` 已去掉“点击即模拟成功”，成功结果通过 route state 进入确认核销页；
- method 缺失时保持 unsupported，不启用 Web camera fallback。

Native 回填的“是否已在当前 App build 可用”仍须以真机注入结果为准；这里描述的是 **当前 H5 contract 与联调适配实现**。


## 8. H032 H5 图片与剪贴板接线状态

H5 已注册 `takePhoto / chooseImage / saveImageToAlbum / copyText` 的 Android / iOS target contract：

- 四项均为异步能力，Android / iOS 的 JSON 入参都由 transport 自动补 `callbackId`；
- Native 通过对应平台 callback 入口回传统一 `code/message/data` envelope；H5 同时兼容迁移期旧同步结果；
- 图片结果从 callback data 解析 `mimeType + imageBase64`，并按敏感结果处理；
- 保存图片 / 复制文本在 `code === 0` 时统一归一为 `success:true`；
- Settings 头像入口已接 `takePhoto / chooseImage`；
- buddyShare adapter 已接 `saveImageToAlbum / copyText`，不再恒定成功；
- 当前邀请海报 bytes / 正式 invite URL 尚未有业务来源，因此页面不会伪造 poster/link payload。

Native 回填仍标记四项当前均“否”，所以这里只表示 H5 contract 与调用链已就绪。


## 9. H033 H5 激励广告接线状态

H5 已注册双端 `showRewardAd(json)` target contract：

- Android：`window.androidBridge.showRewardAd(json)`；H5 加入运行时生成的 `callbackId`，结果经共享 `window.androidBridgeCallback(callbackId, payload)` 分发；
- iOS：`window.iosBridge.showRewardAd(json)`；同样加入 `callbackId`，结果经 `window.nativeBridgeCallback(callbackId, payload)` 分发；
- 当前仅开放 scene `h5CheckinResign`；
- 返回 status 仅接受 `completed | closed | failed | no_fill`，Android 同时兼容当前联调 envelope 中的 `data.status`；
- Android 扫码与激励广告共用同一 callback dispatcher，但各 invocation 由 `callbackId` 独立关联，不互相覆盖；
- `/checkin` 只有 `completed` 能进入 `make-up-success`；
- H5 的 5 秒 `DemoAdPlayer` 已退出正式补签完成链路；
- `closed / failed / no_fill` 均保持补签未完成。

Native 方法是否已在某个具体 APK / IPA 注入仍以真机证据为准；这里描述的是 **当前 H5 contract 与联调适配实现**。


## 10. H034 H5 APP 唤起与商店承接状态

H5 已注册双端 `openApp(json)` target contract：

- Android：`window.androidBridge.openApp(json)` → `window.androidBridgeCallback(callbackId, payload)`
- iOS：`window.iosBridge.openApp(json)` → `window.nativeBridgeCallback(callbackId, payload)`
- 两端均为异步能力，H5 transport 自动在 JSON 中加入 `callbackId`；
- action 仅允许 `open | store | detect`；
- `inviteCode` / `fallbackUrl` 保留 Native 原字段；
- 返回严格解析 `success:boolean + installed:boolean`；
- `/buddy/invite/scan` 的 installed 状态不再来自 `?state=` fixture，只信 Native detect；
- 打开 APP 不再以内跳 `/buddy/accept` 冒充唤起；
- 现有 APP 引导弹窗的“下载链接”改为 Native store action；
- H5 不自造 scheme / Universal Link / 商店 URL。

Native 回填仍标记 Android / iOS 当前均“否”，所以这里只表示 H5 contract 与业务接线已就绪。
