# H030｜关闭 WebView Native 能力接线

**Status:** Ready  
**Phase:** Host Integration / Navigation  
**Depends on:** H029

## 目标

把现有 H5 `closeWebView` 语义 capability 接到 Native 团队已给出的双端目标协议。

## Native 目标协议

Android：

```text
window.androidBridge.closeWebView()
```

iOS：

```text
window.iosBridge.closeWebView()
```

- 无参数；
- 无返回；
- Native 当前回填状态：两端均“否”，尚未实现；
- 最低版本目标：2.13。

## 范围

- 在 Capability Runtime 登记双端正式 method contract；
- 保持 method 缺失时 unsupported / fail-closed；
- 接通 `TitleBar` / `HostCloseButton` 的正式调用链；
- Bridge Lab 在对应平台可展示并探测该 capability；
- 不使用 `history.back()` 或 `window.close()` 冒充宿主关闭。

## 不做

- 不修改 Native；
- 不改变 H5 二级页返回规则；
- 不引入关闭结果 payload。

## 验收标准

- [ ] 方法存在时可调用；
- [ ] 方法缺失时 UI 明确 unsupported；
- [ ] 一级 H5 / 沉浸页关闭入口共用同一 capability；
- [ ] Android / iOS 分别真机 smoke 后才可最终 Accepted。
