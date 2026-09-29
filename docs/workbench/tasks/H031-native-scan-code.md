# H031｜扫码核销 Native 能力接线

**Status:** In Review  
**Phase:** Host Integration / Card Verify  
**Depends on:** H029

## 目标

把 `/card/verify` 当前模拟扫码改为真实 Native 扫码 capability。

## Native 目标协议

双端同名：

```text
Android: window.androidBridge.scanCode(json)
iOS:     window.iosBridge.scanCode(json)
```

输入 JSON 字符串（`callbackId` 由 H5 transport 自动生成，业务层不传）：

```json
{"callbackId":"scanCode-...","scanType":"all"}
```

`scanType: qr | bar | all`

双端均为异步回调：

```text
Target:  window.nativeBridgeCallback(callbackId, payload)
Android compatibility: window.androidBridgeCallback(callbackId, payload)
```

成功 payload 使用统一 envelope，扫码正文位于 `data.text`。

Native 当前回填状态：两端均“否”；最低版本目标 2.13。

## 范围

- 注册 `scanCode` capability；
- 定义输入 / 输出解析；
- `ScanVerify` 去掉“点击即模拟成功”主路径；
- 成功后把真实扫码结果进入现有确认流程；
- 缺方法 / 非法返回 / Native throw 明确失败；
- Bridge Lab 可按平台直接测试。

## 不做

- 不决定 Native 扫码 UI；
- 不自行实现 Web camera scanner；
- 不扩展码制字段；
- 不虚构取消/权限错误码，Native 未提供前保持通用失败。

## 验收标准

- [x] H5 不再用固定模拟结果冒充扫码；
- [x] qr / bar / all 入参保持原字段；
- [x] 真实 code 能进入核销确认链；
- [x] method 缺失时 fail-closed；
- [ ] 真机联调后补齐取消/权限语义。


## 当前验证状态

- H5 capability、扫码页与确认链路接线已完成；
- Native 回填仍标记 Android / iOS `scanCode` 尚未实现；
- 自动测试覆盖 JSON string 入参/返回、scanType、unsupported、late injection 恢复、页面跳转与 Bridge Lab；
- 取消 / 权限 /系统失败语义等待真机联调，不提前定义；
- 双端真实 App WebView smoke 仍是最终 Accepted 门槛。
