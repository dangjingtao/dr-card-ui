# H025｜JSBridge Capability Runtime 证据

## 1. 范围

H025 只把正式 H5 的 `src/services/nativeBridge.ts` 从按能力手写 invocation 生命周期收敛为统一 Capability Runtime，不新增任何 Native 业务能力。

本卡明确保留：

- Android 已真人确认的 `window.androidBridge.getLoginToken()`；
- 无参数；
- 同步返回由 H5 adapter Promise 化；
- 每次 invocation 重新解析当前 `window.androidBridge`，兼容 late injection / instance replacement；
- `method.call(bridge)` receiver binding；
- `bridge-disabled` / `bridge-unsupported` / `capability-unsupported` / `invocation-failed` / `invocation-timeout` 错误语义；
- `closeWebView` 只作为 H5 capability intent，仍无 Native protocol；
- iOS `getAuthorizationInfo / window.onToken` 仍只属于历史调试证据，不进入正式 capability。

## 2. 实现

`nativeBridge.ts` 现在包含单一 capability registry。每个 capability 只描述：

1. capability 名称与用途；
2. 输入 / 返回值类型；
3. 如何在“本次 invocation”解析当前宿主对象；
4. 当前是否支持；
5. 真正调用宿主方法的最小 closure。

Runtime 的泛型边界显式包含 `TInput`：support resolution 仍只依赖当前 host window，真正执行时再把本次 invocation input 传给 `invoke(input)`。因此后续带参数 capability 可以复用同一 invocation lifecycle，而不需要再次修改核心调度器；当前无参数 `getLoginToken()` 以 `void / undefined` 接入，真实 Android 协议不变。

统一 runtime 负责：

- bridge mode gate；
- capability resolution；
- sync return → Promise；
- timeout；
- throw/reject normalization；
- diagnostics。

因此新增 capability（包括未来带 string / JSON string / object 输入的能力）不需要复制或改写 mode/error/timeout/invocation 核心逻辑；Native 协议差异继续留在 capability resolver / 后续 transport 层消化。

## 3. 自动验证

新增 `src/services/nativeBridge.test.ts`，覆盖：

- late injection；
- bridge instance replacement；
- receiver binding；
- sync return → Promise；
- capability missing；
- invocation throw/reject；
- timeout；
- disabled/browser 差异；
- diagnostics；
- `closeWebView` 保持 unsupported；
- iOS debug 草稿不被提升为正式支持。

H015 verifier 继续作为兼容性 gate，确保正式 H5 页面不直接访问宿主 globals，并检查 Android receiver binding / late injection 等既有事实不回退。

## 4. Native 回归状态

当前施工环境没有 Android 真机 / 当前 App WebView build 可供直接调用正式 adapter，因此 **没有把浏览器/jsdom stub 记作真机证据**。

剩余 validation gap：

- 在当前 Android App WebView 中以正式 H5 adapter 再调用一次 `getLoginToken()`；
- 确认当前宿主 build 仍满足 late injection、receiver binding 和同步返回行为。

该 gap 不改变已确认协议事实，但在进入真实 App 宿主验收前仍应保留。
