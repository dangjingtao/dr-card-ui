# Native Bridge v2 契约基线

> 来源：2026-09-21 Native 团队对 H028 能力征集清单的回填。  
> H029 负责把该回填转为 H5 正式 Bridge 契约基线；未实现的 Native 方法仍保持 unsupported。

## 1. 双端统一约定

| 平台 | 注入对象 |
|---|---|
| Android | `window.androidBridge` |
| iOS | `window.iosBridge` |

Native 团队确认：

- Android / iOS 使用相同方法名；
- JSON 字段保持一致；
- 有参方法的入参统一为 **JSON 字符串**；
- 当前回填的方法返回均定义为同步 JSON 字符串；
- 回填中统一写明最低 App 版本目标为 **2.13**；
- “最低版本 2.13”不等于方法已经实现，能力是否可用仍以“是否已有”和真机注入结果为准。

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

无参数，同步返回 JSON 字符串：

```json
{"token":"8a59966dc70c13b2b87b0ab2ca383ebb"}
```

H5 正式契约：

```ts
type NativeLoginToken = {
  token: string
}
```

H5 必须：

- 每次调用重新解析当前 injected object；
- 保留 Native object receiver；
- 只接受 JSON string；
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
- injected-object 底层统一使用 `createInjectedObjectTransport`；
- Bridge Lab 可枚举 registered capabilities，并保留 Raw Probe；
- 浏览器、旧 App 或方法未注入时必须明确 unsupported；
- 真机 WebView smoke 才能把“契约已实现”升级为“当前 App build 已可用”。


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

- Android：`window.androidBridge.scanCode(json)`
- iOS：`window.iosBridge.scanCode(json)`
- 入参统一 JSON string；
- `scanType` 保留 Native 原字段和值：`qr | bar | all`；
- 返回严格解析为 JSON string `{"code":"..."}`；
- 扫码原始内容按敏感结果处理，Bridge Lab 默认脱敏；
- `/card/verify` 已去掉“点击即模拟成功”，成功结果通过 route state 进入确认核销页；
- method 缺失时保持 unsupported，不启用 Web camera fallback。

Native 回填仍标记 Android / iOS 当前均“否”，因此这里仍只表示 **H5 contract 与业务接线已就绪**。


## 8. H032 H5 图片与剪贴板接线状态

H5 已注册 `takePhoto / chooseImage / saveImageToAlbum / copyText` 的 Android / iOS target contract：

- 有参方法统一传 JSON string；
- 图片返回严格解析 `mimeType + imageBase64`，并按敏感结果处理；
- 保存图片 / 复制文本严格解析 `success:boolean`；
- Settings 头像入口已接 `takePhoto / chooseImage`；
- buddyShare adapter 已接 `saveImageToAlbum / copyText`，不再恒定成功；
- 当前邀请海报 bytes / 正式 invite URL 尚未有业务来源，因此页面不会伪造 poster/link payload。

Native 回填仍标记四项当前均“否”，所以这里只表示 H5 contract 与调用链已就绪。


## 9. H033 H5 激励广告接线状态

H5 已注册双端 `showRewardAd(json)` target contract：

- Android：`window.androidBridge.showRewardAd(json)`
- iOS：`window.iosBridge.showRewardAd(json)`
- 当前仅开放 scene `h5CheckinResign`；
- 返回 status 仅接受 `completed | closed | failed | no_fill`；
- `/checkin` 只有 `completed` 能进入 `make-up-success`；
- H5 的 5 秒 `DemoAdPlayer` 已退出正式补签完成链路；
- `closed / failed / no_fill` 均保持补签未完成。

Native 回填仍标记 Android / iOS 当前均“否”，因此这里只表示 H5 contract 与业务判定已就绪。


## 10. H034 H5 APP 唤起与商店承接状态

H5 已注册双端 `openApp(json)` target contract：

- Android：`window.androidBridge.openApp(json)`
- iOS：`window.iosBridge.openApp(json)`
- action 仅允许 `open | store | detect`；
- `inviteCode` / `fallbackUrl` 保留 Native 原字段；
- 返回严格解析 `success:boolean + installed:boolean`；
- `/buddy/invite/scan` 的 installed 状态不再来自 `?state=` fixture，只信 Native detect；
- 打开 APP 不再以内跳 `/buddy/accept` 冒充唤起；
- 现有 APP 引导弹窗的“下载链接”改为 Native store action；
- H5 不自造 scheme / Universal Link / 商店 URL。

Native 回填仍标记 Android / iOS 当前均“否”，所以这里只表示 H5 contract 与业务接线已就绪。
