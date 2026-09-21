# H030｜关闭 WebView Native 能力接线证据

## 1. 基线

施工基线：

```text
dev@e3bb1577fed05df2fe97766e90d8fcb0ac54e76e
```

依赖 H029 已合入的 Bridge v2 基线：

- Android injected object：`window.androidBridge`
- iOS injected object：`window.iosBridge`
- 两端同名方法 / 同字段
- method 是否真实可用仍以当前 App build 注入结果为准

Native 团队对 HOST-01 的回填目标：

```text
Android: window.androidBridge.closeWebView()
iOS:     window.iosBridge.closeWebView()
args:    none
return:  none
最低版本目标: 2.13
当前是否已有: Android / iOS 均否
```

因此 H030 的职责是登记并接通 H5 contract，不把“协议已约定”写成“当前 Native 已实现”。

## 2. Capability Runtime

`src/services/nativeBridge.ts` 新增双端 close transport：

- Android：`androidBridge.closeWebView()`
- iOS：`iosBridge.closeWebView()`
- 无参数；
- 无结果 payload；
- 两端共用 H029 的 receiver-safe `createInjectedObjectTransport`；
- capability platforms：`android + ios`；
- facade：`closeWebView(): Promise<void>`。

宿主对象存在但 method 未注入时返回 `capability-unsupported`；宿主对象不存在时返回 `bridge-unsupported`。没有 browser fallback，也没有 `history.back()` / `window.close()` 替代。

## 3. UI 接线

`HostCloseButton` 继续是唯一宿主关闭按钮：

- `getNativeBridgeDiagnostics().capabilities.closeWebView === false` 时禁用；
- method 存在时按钮可用；
- 点击只调用共享 `closeWebView()` facade；
- unsupported 提示从“协议未确认”更新为“当前 App 版本暂不支持”。

现有页面复用关系没有被改写：

- `MobileLayout` 的 active formal H5 一级 Tab 使用 `TitleBar leadingAction="close"`，最终落到 `HostCloseButton`；
- `ScanVerify` 沉浸扫码页直接复用同一个 `HostCloseButton`；
- H5 二级页仍使用 React Router/history 返回，与关闭 WebView 保持分离。

## 4. Bridge Lab

`closeWebView` 已进入 Android / iOS registered capability catalog。

即使 Native 当前尚未实现：

- `?osType=android` 仍能看到 `closeWebView` contract；
- `?osType=ios` 仍能看到 `closeWebView` contract；
- 当前宿主未注入 method 时显示 unsupported；
- 后续 Native 注入后无需再改 H5 registry，即可通过同一 Registered capability 真机验证。

## 5. 自动验证

覆盖：

- Android `closeWebView()` invocation；
- Android receiver binding；
- iOS `closeWebView()` invocation；
- 双端均无参数；
- 无结果统一为 `Promise<void>`；
- method 缺失保持 fail-closed；
- HostCloseButton unsupported 状态；
- HostCloseButton supported 时调用共享 facade；
- Bridge Lab Android / iOS 均展示 `closeWebView`。

## 6. 待真人验证

Native 当前回填仍是“两端均未实现”，因此本卡不能用 browser stub 冒充真实 App 支持。

Native 方法进入实际 App build 后分别 smoke：

### Android

1. `window.androidBridge.closeWebView` 存在；
2. 一级 H5 TitleBar 关闭按钮从 disabled 变为 enabled；
3. 点击后真实关闭当前 WebView；
4. Bridge Lab Registered `closeWebView` 显示 supported。

### iOS

1. `window.iosBridge.closeWebView` 存在；
2. 一级 H5 / 沉浸页关闭按钮 enabled；
3. 点击后真实关闭当前 WebView；
4. Bridge Lab Registered `closeWebView` 显示 supported。

双端当前 App WebView smoke 未完成前，H030 保持 In Review。
