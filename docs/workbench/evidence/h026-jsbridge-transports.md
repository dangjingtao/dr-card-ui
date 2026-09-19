# H026｜Android / iOS Transport 与回调适配机制证据

## 1. 依赖与施工基线

H026 最初施工基于 H025 / PR #47 的稳定 Capability Runtime；H025 随后已合入 `dev`。

H026 分支已同步到 `dev@deaf5a3d4782dcb1beea8cbcdc428a5abe2ac807`，当前不再依赖 stacked merge 顺序，并保留 H025 最终合入的 input-capable runtime boundary。

本卡不复制 H025 的 mode gate、capability registry、Promise normalization、timeout/error normalization；只在其下方新增宿主协议 transport/driver 机制。

## 2. Android transport

新增通用 Android injected-object transport：

- 每次 capability resolution 都重新从当前 `window` 读取 injected object，保留 late injection / instance replacement；
- 动态 method lookup；
- 使用 `method.call(bridge, ...args)` 保留 receiver；
- 同步 return 可直接返回，上层 Capability Runtime 继续负责 Promise normalization；
- Native throw 不在 transport 私自吞掉，由 H025 runtime 统一归一为 Bridge error；
- 每个 capability 可独立提供参数 serializer 与结果 parser。

已确认的正式 Android `window.androidBridge.getLoginToken()` 已改为通过该 transport 进入 H025 Capability Runtime；协议事实仍保持“无参数、同步返回、raw result unknown”。

## 3. iOS-style transport

新增 message-handler + callback transport 机制，但没有注册任何新的 production iOS capability。

机制支持：

- `window.webkit.messageHandlers.<handler>.postMessage(payload)`；
- request-id correlation，可并发并允许乱序完成；request id 由 transport runtime 内部生成，不开放 capability 自定义 factory，避免 timeout 后 id 复用让旧 callback 误命中新请求；
- single-flight 模式，用于无法携带 request id 的祖传 callback 协议；第二个并发请求会明确失败，不允许靠覆盖单个 global callback 蒙混；
- single-flight 若发生无关联 timeout，通道会 fail-closed 标记为 unsafe：后续请求继续拒绝，迟到 callback 不会被绑定给新请求；只有宿主恢复/重建或调用方能够确认旧 callback 不再可能到达后，才允许显式 reset；
- 每个 pending callback 有统一 resolver / rejector / timeout 生命周期；
- timeout 后清理 pending；
- duplicate / late callback 返回未处理，不会二次完成 Promise；request-id timeout 后下一次调用使用新的 runtime-owned id，旧 callback 不会命中新请求；
- Native failure callback 统一进入 transport error；
- postMessage throw 会清理 pending；
- serializer / parser 可吸收 string / JSON string / object 差异。

callback ingress 由 transport 的单一 `handleCallback` 入口治理。当前没有把古老 `window.onToken`、任何扫码/相册 callback 名、或 `getAuthorizationInfo` handler 固化为正式协议；真实 Native callback 名称与参数形态仍需宿主团队确认后再做薄 adapter。

## 4. serializer / parser 边界

提供：

- `serializeJsonValue`：object → JSON string；
- `parseJsonPayload`：JSON string → parsed result，同时允许宿主直接回 object；
- malformed JSON → `NativeTransportError(code=payload-invalid)`。

raw string 协议不强制 JSON 化；capability 可使用 identity parser 或自定义 parser。

## 5. 自动测试范围

`src/services/nativeBridgeTransport.test.ts` 覆盖：

### Android

- late injection；
- receiver binding；
- method missing；
- sync return；
- Native throw；
- object → JSON string；
- JSON string → parsed result。

### iOS style

- messageHandler.postMessage；
- async callback success；
- callback failure；
- request-id correlation；
- runtime-owned request id 在 timeout 后不复用；
- concurrent requests / out-of-order completion；
- single-flight 并发限制；
- timeout cleanup；
- duplicate callback；
- late callback；
- single-flight timeout 后通道 poison / explicit recovery，避免旧 callback 污染下一请求；
- postMessage throw；
- handler receiver binding。

### contract

- object → JSON string；
- JSON string / object → parsed result；
- malformed JSON → transport error。

## 6. 真实 Native 证据边界

真实证据仍只有 H015/H025 已记录的 Android：

`window.androidBridge.getLoginToken()`

以及针对 receiver binding / late injection 的真人联调修正提交。

古老调试页出现过 iOS `webkit.messageHandlers.*.postMessage(...)` + H5 callback，只能证明“需要支持这一类 transport 形态”，不能证明任何具体 iOS production handler、callback 名、业务 capability 或 payload schema 已确认。

因此本卡只能声明：

- Android transport 对既有真实协议完成机制接线；
- iOS-style transport / callback registry 通过 stub host 验证机制。

**不能声明 iOS 真机已接通。**
