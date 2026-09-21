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
