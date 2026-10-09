# H033｜激励广告 Native 能力接线

**Status:** In Review  
**Phase:** Host Integration / Checkin  
**Depends on:** H029

## 目标

把补签流程从 5 秒 Demo 倒计时切换到 Native 激励广告真实状态。

## Native 目标协议

双端同名：

```text
Android: window.androidBridge.showRewardAd(json)
iOS:     window.iosBridge.showRewardAd(json)
```

输入（`callbackId` 由 H5 transport 自动生成）：

```json
{"callbackId":"showRewardAd-...","scene":"h5CheckinResign"}
```

双端均异步回调：

```text
Target:  window.nativeBridgeCallback(callbackId, payload)
Android compatibility: window.androidBridgeCallback(callbackId, payload)
```

业务状态从 callback payload 的 `data.status` 解析。

`status: completed | closed | failed | no_fill`

Native 当前回填状态：两端均“否”；最低版本目标 2.13。

## 范围

- 注册 `showRewardAd` capability；
- 定义 status union；
- `completed` 才进入补签资格完成路径；
- `closed / failed / no_fill` 分别保持未完成，不再由 H5 计时器自行判定 rewarded；
- Bridge Lab 可直接传 scene 调试。

## 不做

- 不选择广告供应商；
- 不处理广告 SDK 内部逻辑；
- 不自行生成 placement id；
- 不扩展其它广告场景。

## 验收标准

- [x] DemoAdPlayer 不再作为生产完成信号；
- [x] 只有 `completed` 能触发补签后续；
- [x] 其它状态不误发奖励；
- [x] method 缺失 / 非法 status 明确失败；
- [ ] 真机广告联调后才最终 Accepted。


## 当前验证状态

- H5 capability、Checkin 补签判定与 Bridge Lab 接线已完成；
- DemoAdPlayer 已退出 production 完成信号；
- Native 当前仍标记 Android / iOS `showRewardAd` 尚未实现；
- 自动验证覆盖四种 status、非法 payload、unsupported 与重复触发；
- 双端真实 App WebView / 广告 SDK smoke 仍是最终 Accepted 门槛。

## H037 Android 实证覆盖

2026-09-29，Android 当前 `showRewardAd(json)` 已有真实实现，其结果 envelope 与 H033 早期 `data.status` target contract 不同。

当前 Android 实证基线：`sanchuang-dev/dr-card-android upstream/gitee/master@a8ac8469`。

真实回调使用：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "scene": "h5CheckinResign",
    "adLoadState": 1,
    "finishPlayState": 1
  }
}
```

已确认业务边界：

- Native 负责判断是否完整观看 / 满足时长；
- `code=0` 表示 Native 已判定满足补签前置条件；
- H5 不根据关闭动作、观看时长或广告 SDK 事件重新判定；
- H5 Bridge adapter 将当前 Native code 归一成既有 `completed / closed / failed / no_fill` 业务语义；
- 迁移期旧 `status` 结果继续兼容，但不要求 Native 恢复旧字段。

当前适配由 H037 负责。iOS 当前结果形态仍待真机/源码实证。
