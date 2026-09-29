# H034｜APP 唤起与应用商店承接 Native 能力接线

**Status:** In Review  
**Phase:** Host Integration / App Boundary  
**Depends on:** H029

## 目标

把搭子邀请与 APP 引导场景从 H5 fixture / 假跳转切到 Native 提供的统一 `openApp` 契约。

## Native 目标协议

双端同名：

```text
Android: window.androidBridge.openApp(json)
iOS:     window.iosBridge.openApp(json)
```

输入（`callbackId` 由 H5 transport 自动生成）：

```json
{"callbackId":"openApp-...","action":"open","inviteCode":"","fallbackUrl":""}
```

`action: open | store | detect`

双端均异步回调：

```text
Target:  window.nativeBridgeCallback(callbackId, payload)
Android compatibility: window.androidBridgeCallback(callbackId, payload)
```

`detect` 从 callback `data.installed` 读取安装状态；`open/store` 以 `code === 0` 判成功。

Native 当前回填状态：两端均“否”；最低版本目标 2.13。

## 范围

- 注册 `openApp` capability；
- 定义 `open / store / detect` 输入边界；
- 接 `/buddy/invite/scan`；
- 接现有 APP 引导弹窗；
- 不再用 H5 fixture 假装 installed；
- Bridge Lab 可直接编辑 action / inviteCode / fallbackUrl 测试。

## 不做

- 不在 H5 自行探测安装状态；
- 不自造 scheme / Universal Link；
- 不改变邀请码后端规则；
- 不替 Native 决定商店 URL。

## 验收标准

- [x] installed 状态来自 Native 返回；
- [x] open / store / detect 三种 action 不混用；
- [x] Native 不支持时明确失败；
- [x] APP 引导不再用假 H5 内跳转冒充唤起；
- [ ] 双端真机验证后补齐 fallback 细节。


## 当前验证状态

- H5 runtime、appOpen adapter、搭子扫码承接、现有 APP 引导弹窗与 Bridge Lab 接线已完成；
- `?state=no-app|has-app` 已退出 production installed-state 判定；
- Native 当前仍标记 Android / iOS `openApp` 尚未实现；
- 真实 inviteCode / fallbackUrl 与 open→fallback 细节仍待业务/Native 真机联调；
- 双端真机 smoke 后再标记 Accepted。
