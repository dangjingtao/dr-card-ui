# H031｜扫码核销 Native 能力接线证据

## 1. 基线

施工基线：

```text
dev@132f9c5096be212ab09b97fe724caeca83d22101
```

Native 团队回填的扫码目标协议：

```text
Android: window.androidBridge.scanCode(json)
iOS:     window.iosBridge.scanCode(json)
```

输入为 JSON 字符串：

```json
{"scanType":"all"}
```

`scanType` 只允许：

- `qr`
- `bar`
- `all`

同步返回 JSON 字符串：

```json
{"code":"扫码原始内容"}
```

Native 当前回填状态：Android / iOS 均“否”，最低版本目标 2.13。

## 2. Capability Runtime

`src/services/nativeBridge.ts` 已注册双端 `scanCode`：

- Android object：`androidBridge`
- iOS object：`iosBridge`
- method：`scanCode`
- input：`NativeScanCodeInput`
- result：`NativeScanCodeResult`
- capability platforms：`android + ios`
- result 按敏感信息处理，Bridge Lab 默认脱敏

H5 严格保留 Native 字段名：

```ts
type NativeScanType = 'qr' | 'bar' | 'all'

interface NativeScanCodeInput {
  scanType: NativeScanType
}

interface NativeScanCodeResult {
  code: string
}
```

调用时对象被序列化为 **一个 JSON string 参数**，没有改成 JS object，也没有新增字段。

以下情况 fail-closed：

- `scanType` 不是 `qr | bar | all`
- bridge 不存在
- method 未注入
- Native 同步 throw
- 返回不是 JSON string
- JSON malformed
- `code` 不是 string

## 3. ScanVerify 业务接线

旧主路径：

```text
点击 H5 扫描框
→ 直接 navigate('/card/verify/confirm')
→ 固定模拟成功
```

H031 后：

```text
点击开始扫码
→ scanCode({ scanType: 'all' })
→ Native 返回 { code }
→ navigate('/card/verify/confirm', {
     state: { nativeScanCode: code }
   })
```

因此 H5 不再用固定模拟结果冒充扫码成功。

`ConfirmVerify` 能识别来自 Native scan 的 route state，并用 `data-verify-source="native-scan"` 标记来源；原始 `code` 不写 URL、不渲染到 DOM。

当前确认页仍使用既有核销 fixture 展示门店 / 券明细，因为“扫码 code → 真实券/设备查询 API”不在 Native 回填里，也不属于 H031；本卡不自行发明 backend lookup 契约。

## 4. Unsupported / failure UX

当前 App build 未注入 `scanCode` 时：

- ScanVerify 明确显示“当前 App 版本暂不支持扫码”；
- 扫码触发按钮 disabled；
- 不跳确认页；
- 不使用 Web camera fallback。

Native 调用失败时：

- 留在扫码页；
- 显示“扫码失败，请重试”；
- 不把失败解释为“用户取消”“权限不足”等未确认语义。

## 5. Bridge Lab

Android / iOS Registered capabilities 均展示 `scanCode`。

工程师可：

1. 选择 `scanCode`
2. 在 input JSON 输入，例如 `{"scanType":"all"}`
3. 直接调用当前真实 host method
4. 返回的扫码原始内容默认整体脱敏，需要时显式 reveal

这不新增 Raw Probe 专用协议；Registered capability 就是 production contract。

## 6. 自动验证

覆盖：

- Android 精确收到 `{"scanType":"all"}` JSON string；
- iOS 支持 `qr / bar / all` 三个原字段值；
- JSON-string result parse；
- malformed result / 非 string code；
- missing method；
- 非法 scanType 不发送给 Native；
- ScanVerify unsupported 状态；
- ScanVerify 初始 unsupported 后 late bridge injection 可恢复为 supported；
- ScanVerify 成功调用 `scanCode({scanType:'all'})`；
- Native code 通过 route state 进入确认流程；
- Native failure 不跳转；
- Bridge Lab Android / iOS capability 可见；
- Bridge Lab registered scanCode 可编辑 JSON 调用且结果默认脱敏。

## 7. 待真人验证

Native 当前回填仍是“双端尚未实现”。因此最终 Accepted 需要方法进入当前 App build 后：

### Android

- `window.androidBridge.scanCode` 存在；
- `{"scanType":"all"}` 可拉起真实扫码；
- 返回 JSON string 中有 string `code`；
- H5 自动进入确认核销页。

### iOS

- `window.iosBridge.scanCode` 存在；
- 同一 JSON string 入参可拉起真实扫码；
- 返回结构一致；
- H5 自动进入确认核销页。

取消、权限拒绝、系统扫码失败等语义待 Native 真机联调后按实际协议补齐，不提前虚构。
