# H033｜激励广告 Native 能力接线

**Status:** Ready  
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

输入：

```json
{"scene":"h5CheckinResign"}
```

同步返回：

```json
{"status":"completed"}
```

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

- [ ] DemoAdPlayer 不再作为生产完成信号；
- [ ] 只有 `completed` 能触发补签后续；
- [ ] 其它状态不误发奖励；
- [ ] method 缺失 / 非法 status 明确失败；
- [ ] 真机广告联调后才最终 Accepted。
