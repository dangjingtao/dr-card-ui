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

## H037 Android 实证覆盖

2026-09-29，Android 当前实现已经提供了比 H031 原始 target contract 更完整的业务语义。H031 上方内容保留为当时的 H5 接线历史，不再作为 Android 当前完成条件的最终描述。

当前 Android 实证基线：`sanchuang-dev/dr-card-android upstream/gitee/master@a8ac8469`。

已确认：

- `scanCode(json)` 使用 H5 生成的 `callbackId`；
- 第一次 `code=0 + data.text` 只表示扫码识别成功，Native 继续进入设备查询 / 调货或启动流程；
- Native 设备流程结束后使用**同一个 callbackId**再次回调成功或失败；
- 因此 Android 的 H5 Promise 不能在第一次扫码成功回调时 settle；
- 完整 Native 事务成功后，H5 直接接管结果与后续交互，不再重复执行旧“即将核销 → 确认核销”前置流程。

H5 的当前适配由 H037 负责，详见：

- `docs/workbench/tasks/H037-native-bridge-transaction-alignment.md`
- `docs/workbench/evidence/h037-native-bridge-transaction-alignment.md`

iOS 是否具有相同两阶段事务语义尚无真机/源码实证，H031 不据此推断。
