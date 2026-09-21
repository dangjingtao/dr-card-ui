# H029｜Native Bridge v2 协议基线与双端登录能力对齐证据

## 1. 基线

施工基线：

```text
dev@f266aeaedbb94d81d17bbf78d097aa5af71eefb9
```

Native 团队回填后的正式登录协议：

```text
Android: window.androidBridge.getLoginToken()
iOS:     window.iosBridge.getLoginToken()
args:    none
return:  synchronous JSON string
         {"token":"..."}
```

旧 iOS `webkit.messageHandlers.getAuthorizationInfo.postMessage({}) → window.onToken(token)` 只保留为历史联调 / Raw Probe。

## 2. Transport 收敛

`src/services/nativeBridgeTransport.ts`：

- 新增平台无关的 `createInjectedObjectTransport`；
- Android / iOS injected object 使用同一套：
  - live object lookup；
  - receiver binding；
  - argument serializer；
  - result parser；
  - Native throw 可观察；
- 保留 `createAndroidInjectedObjectTransport` 兼容 alias，避免 H026 历史调用被无关破坏；
- 新增 `parseJsonStringPayload`，用于“必须是 JSON string”的 Native v2 返回；
- `NativeTransportWindow` 增加 `iosBridge`。

H026 iOS messageHandler/callback transport未删除，继续服务历史协议与 Raw Probe。

## 3. 登录 capability

`src/services/nativeBridge.ts`：

- `getLoginToken` 现在登记平台：`android + ios`；
- Android transport：
  - object: `androidBridge`
  - method: `getLoginToken`
- iOS transport：
  - object: `iosBridge`
  - method: `getLoginToken`
- 两端均不传参数；
- 返回强制按 JSON string 解析；
- DTO 固定为：

```ts
interface NativeLoginToken {
  token: string
}
```

以下均 fail-closed：

- 返回不是 string；
- JSON malformed；
- JSON 中缺 `token`；
- `token` 不是 string；
- bridge 不存在；
- method 不存在；
- Native 同步 throw。

`getLoginToken()` 对业务层统一返回 `Promise<NativeLoginToken>`。

## 4. iOS 历史协议降级

production registry 已移除 `getAuthorizationInfo` capability。

保留：

- H026 messageHandler transport；
- Bridge Lab iOS Raw Probe；
- `getAuthorizationInfo + onToken` 历史 preset。

因此旧 App build 仍能诊断，但新业务代码不会再把旧 callback 协议当正式登录入口。

## 5. Bridge Lab

- `?osType=android`：Registered capabilities 展示正式 `getLoginToken`；
- `?osType=ios`：Registered capabilities 同样展示正式 `getLoginToken`；
- iOS Raw Probe 仍可选择历史 `getAuthorizationInfo/onToken`；
- Registered token result 继续默认整体脱敏；
- preview 的 debug invocation 仍可直接验证真实 injected object，不改变正式业务 `bridgeMode`。

## 6. 自动验证覆盖

本卡新增 / 更新测试覆盖：

- Android late injection；
- Android receiver binding；
- injected object instance replacement；
- iOS `iosBridge.getLoginToken()`；
- 双端 JSON string DTO parse；
- malformed JSON；
- 非 string result；
- 非 string token；
- missing bridge / missing method；
- Native throw；
- Bridge Lab preview debug invocation；
- Android / iOS diagnostics；
- 旧 iOS messageHandler 只保留 host diagnostics，不被提升为 production auth；
- cross-platform injected-object transport；
- Bridge Lab Android / iOS platform filtering；
- iOS Registered `getLoginToken` 与旧 Raw Probe 同时存在。

## 7. 待真人验证

H029 仍需当前 App build 的双端 WebView smoke：

### Android

1. 打开 Bridge Lab `?osType=android`；
2. Registered `getLoginToken` 显示 supported；
3. 调用后返回结构可解析为 `{"token":"..."}`；
4. 默认日志不泄露 token。

### iOS

1. 打开 Bridge Lab `?osType=ios`；
2. 检测到 `window.iosBridge`；
3. Registered `getLoginToken` 显示 supported；
4. 调用后返回结构可解析为 `{"token":"..."}`；
5. 默认日志不泄露 token。

未完成双端当前 App WebView smoke 前，不把 H029 标记 Accepted。
