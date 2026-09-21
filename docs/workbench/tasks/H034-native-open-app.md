# H034｜APP 唤起与应用商店承接 Native 能力接线

**Status:** Ready  
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

输入：

```json
{"action":"open","inviteCode":"","fallbackUrl":""}
```

`action: open | store | detect`

返回：

```json
{"success":true,"installed":true}
```

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

- [ ] installed 状态来自 Native 返回；
- [ ] open / store / detect 三种 action 不混用；
- [ ] Native 不支持时明确失败；
- [ ] APP 引导不再用假 H5 内跳转冒充唤起；
- [ ] 双端真机验证后补齐 fallback 细节。
