# H029｜Native Bridge v2 协议基线与双端登录能力对齐

**Status:** Ready  
**Phase:** Host Integration / Contract Alignment  
**Depends on:** H025, H026, H028

## 目标

根据 Native 团队最新回填，把正式 H5 Bridge 协议基线从“Android injected object + iOS messageHandler 历史协议”收敛到当前双方约定：

- Android：`window.androidBridge`
- iOS：`window.iosBridge`
- 两端同名方法、同字段；
- 有参方法统一传 JSON 字符串；
- 返回统一按 JSON 字符串解析；
- 当前登录能力两端均使用 `getLoginToken()`。

## 当前事实

Native 回填明确：

- Android `window.androidBridge.getLoginToken()`
- iOS `window.iosBridge.getLoginToken()`
- 两端均同步返回 JSON 字符串：
  `{"token":"..."}`
- 最低 App 版本：2.13
- 两端方法已注入，但 Native 仍需改为读取真实登录态。

旧 iOS `webkit.messageHandlers.getAuthorizationInfo.postMessage({}) → window.onToken(token)` 降级为历史联调证据 / Raw Probe preset，不再作为目标 production contract。

## 范围

- 扩展现有 injected-object transport，使 Android / iOS 可共用同一类同步调用适配；
- iOS production objectName 改为 `iosBridge`；
- 注册 iOS `getLoginToken`；
- 双端登录结果解析为统一 token DTO；
- Bridge Lab Registered capabilities 按 `osType` 展示对应 `getLoginToken`；
- 保留旧 iOS `getAuthorizationInfo/onToken` 作为历史 Raw Probe preset；
- 更新 H027/H028 evidence 与 Native contract 文档。

## 不做

- 不接 H030～H034 的业务能力；
- 不删除历史 iOS transport；
- 不假设 Native 已实现未标记为“是”的其它方法；
- 不把最低版本 2.13 解读为其它能力已经上线。

## 验收标准

- [ ] Android / iOS `getLoginToken` 均通过统一 production capability 调用；
- [ ] iOS 正式路径不再依赖 `getAuthorizationInfo/onToken`；
- [ ] JSON string 返回可安全解析，非法 JSON 明确失败；
- [ ] Bridge Lab Android / iOS 各自显示对应 registered login capability；
- [ ] 旧 iOS 联调协议仍可在 Raw Probe 使用；
- [ ] browser / bridge 缺失时 fail-closed；
- [ ] 双端真实 App WebView smoke 作为最终验收证据。

## 自动验证

至少覆盖：

- Android `androidBridge.getLoginToken()`
- iOS `iosBridge.getLoginToken()`
- late injection / receiver binding
- JSON string result parse
- malformed result
- Bridge Lab platform filtering
