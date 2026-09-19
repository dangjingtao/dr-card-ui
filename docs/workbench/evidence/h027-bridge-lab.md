# H027｜Bridge Lab 真机联调页升级证据

## 1. 施工基线

H027 从已包含 H025/H026 的 `dev@748e1e919371f89a781e7c0866d44106530441cf` 独立开工。

本卡复用已经合入的 Capability Runtime 与 Transport：
- registered capability 通过 `src/services/nativeBridge.ts` 的 registry / shared runtime 调用；
- Android Raw Probe 只做调试期宿主探测，不建立第二套 production capability；
- iOS Raw Probe 复用 H026 的 single-flight callback lifecycle，而不是自己维护一套 callback Promise 表。

古老 `bridge` 分支只作为真人联调证据读取，没有整分支合并。关键已知证据仍是：
- `ddc3c64981b2a134a63924802d8a138fa698e70b`：Android 调用必须保留 injected-object receiver；
- `bb2eb4c6f85db86fba17d3ca07442923b20fa1b1`：Android bridge 需要每次调用从 `window` 重新解析，以容纳 late injection / instance replacement；
- 古老 iOS `webkit.messageHandlers.*.postMessage(...)` + H5 callback 仅作为 transport 形态证据，不是 production 方法名或 payload 契约。

## 2. Registered capability runner

Bridge Lab 不再为每个正式能力维护一排固定按钮。

`getNativeBridgeCapabilityCatalog()` 从当前 production registry 生成 Lab 可见能力清单，包含：
- capability name；
- description；
- 当前 runtime support 状态；
- result 是否敏感。

`invokeRegisteredNativeCapabilityForDebug()` 仍进入与业务 facade 相同的 Capability Runtime，因此当前已确认的 Android `getLoginToken` 调试不会复制一份直接 `window.androidBridge` 调用。

该 generic debug invocation 在 production runtime fail-closed。

## 3. Raw Probe

### Android

`src/bridge/bridgeLabProbe.ts` 提供隔离的 Android Raw Probe：
- 动态 object / method；
- 无参数、string、单个 JSON value、JSON array → 多参数；
- 每次 invocation 重新解析 injected object；
- `method.call(bridge, ...args)` 保留 receiver；
- 宿主不存在 / 方法不存在 / 参数非法 / Native throw 均明确失败，不 fake success。

Raw Probe 成功只表示“当前宿主上这个调用可探测”，不会自动注册 production capability。

### iOS

iOS Raw Probe 支持：
- 动态 message handler；
- empty object / string / JSON payload；
- 仅 `postMessage`，或等待临时 H5 global callback；
- timeout；
- callback name 冲突保护；
- 临时 callback 调用结束后清理。

对于没有 request-id 的 global callback 模式，H027 按 H026 single-flight 安全边界处理：
- 相同 handler/callback channel 复用同一个 transport，timeout 后的 poison 状态会跨 UI invocation 保留；
- timeout 后下一次 probe fail-closed，不会把上一请求的迟到 callback 归给新请求；
- 只有在宿主恢复，或操作者已确认旧 callback 不可能再到达后，才允许通过显式 **Reset callback channel** 恢复；
- single-flight 仍要求宿主保证每次 invocation 最多回调一次。

这里没有把任何古老 iOS handler/callback 名提升为 production capability。

## 4. 敏感结果

普通 Lab 日志默认递归遮蔽以下语义字段：
- token；
- authorization；
- cookie；
- password；
- secret；
- session；
- credential。

已登记为敏感的 capability（当前 `getLoginToken`）会强制整体遮蔽返回值。Raw method / handler / callback 名带敏感语义时，同样默认整体遮蔽结果。

只有操作者点击“显式显示原始结果”后，当前日志项才展示 raw value；默认日志、截图路径和初始 UI 不明文暴露该值。

## 5. 运行环境隔离

Bridge Lab 不进入正式业务导航。

- dev / preview / test：可注册 `/__debug/bridge-lab`，用于本地、Cloudflare preview 和 App test WebView 联调；
- prod：router 使用 Vite production mode 的编译期分支，不静态导入 Bridge Lab；production CI 额外扫描 `dist`，确认 Bridge Lab route / Raw Probe UI 文案不存在；
- Raw Probe 与 generic debug invocation 仍保留 runtime guard 作为 defense in depth。

## 6. 自动验证范围

H027 新增：
- `src/bridge/bridgeLabProbe.test.ts`
  - Android receiver / JSON args；
  - browser host missing；
  - iOS handler + temporary callback；
  - timeout cleanup；
  - timeout 后 channel fail-closed + explicit recovery；
  - callback overwrite protection；
  - recursive sensitive-value redaction。
- `src/pages/BridgeLab.test.tsx`
  - registry-driven capability list；
  - sensitive Raw Probe result 默认脱敏 + explicit reveal；
  - browser host absence error。
- `tests/e2e/bridge-lab.spec.ts`
  - Bridge Lab route/list；
  - Android injected-object receiver + sensitive result masking/reveal；
  - iOS dynamic handler/callback + nested sensitive field masking。
- CI 增加专门的 Bridge Lab browser smoke 和 production-bundle exclusion gate。

最终验收仍以当前 HEAD 的 CI / review 结果为准，本文件不预写未执行结果。

## 7. 真实 Native 证据边界

### 已有真实证据

来自 H015/H025/H026 的历史真人 Android 联调：
- `window.androidBridge.getLoginToken()`；
- 无参数；
- 同步 return；
- receiver binding；
- late injection / instance replacement。

这些证据支持 H027 设计不能破坏上述宿主现实，但**不能替代 H027 新 Bridge Lab 页面在当前 App build 里的真机 smoke**。

### H027 当前仍待真人验证

H027 任务卡要求 Android App WebView：
1. 通过 Bridge Lab 的 registered capability runner 调用正式 `getLoginToken`；
2. 至少执行一次 Android Raw Probe。

当前自动化只能证明浏览器/stub-host 机制和构建边界。上述 H027 当前页面的真机 WebView smoke 尚无本轮证据，必须作为验收 validation gap 保留，不能用旧 H015 证据冒充。

iOS 仍没有 production handler / callback / payload schema 或真实设备接通证据。
