# H033｜激励广告 Native 能力接线证据

## 1. 基线

施工基线：

```text
dev@f5806997bb119afb281e52828176890c2631febb
```

Native 回填目标协议：

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

允许状态：

- `completed`
- `closed`
- `failed`
- `no_fill`

Native 当前回填状态：Android / iOS 均“否”，最低版本目标 2.13。

## 2. Capability Runtime

`src/services/nativeBridge.ts` 已注册双端 `showRewardAd`：

- object：Android `androidBridge` / iOS `iosBridge`
- method：`showRewardAd`
- 入参固定为一个 JSON string；
- 当前只开放 Native 已确认的 scene：`h5CheckinResign`；
- 返回必须是 JSON string，且 `status` 必须属于确认的四个值；
- method 缺失、scene 非法、status 非法、Native throw 均 fail-closed。

H5 不新增 placement id、广告供应商字段或其它 scene。

## 3. 补签主链

H033 前：

```text
点击补签
→ H5 DemoAdPlayer
→ 固定 5 秒倒计时
→ 时间到自动 onComplete
→ make-up-success
```

H033 后：

```text
点击补签
→ showRewardAd({scene:"h5CheckinResign"})
→ Native 承载真实广告 UI
→ status === completed
   → make-up-success
→ closed / failed / no_fill
   → 保持未完成
```

只有 `completed` 能调用 `open('make-up-success')`。

状态映射：

- `closed`：广告未完整观看，补签未完成；
- `failed`：广告播放失败，可重试；
- `no_fill`：暂无可用广告，可稍后重试；
- bridge / method 不支持：当前 App 版本暂不支持激励广告补签。

## 4. DemoAdPlayer 降级

`DemoAdPlayer` 不再由 `Checkin.tsx` 引用，也不再是 production 补签完成信号。

同时：

- `/checkin` 路由移除 `demo-ad` overlay；
- H5 不再依赖 5 秒计时器发放补签完成信号；
- 历史组件文件保留，仅作为 T045 历史实现，不进入当前正式补签链路。

## 5. Bridge Lab

Android / iOS Registered capability catalog 均可看到 `showRewardAd`。

工程师可输入：

```json
{"scene":"h5CheckinResign"}
```

直接调用当前真实 host method，并观察四种 status。

## 6. 自动验证

覆盖：

- Android 精确收到 `{"scene":"h5CheckinResign"}`；
- iOS 保留 `completed / closed / failed / no_fill` 原值；
- 非法 scene 不发送给 Native；
- 未知 status 拒绝；
- missing method fail-closed；
- Checkin 只有 completed 打开 `make-up-success`；
- closed / failed / no_fill 均不误发补签成功；
- unsupported host 保持未完成；
- pending 期间防止重复触发；
- Bridge Lab Registered capability 可编辑 JSON 调用。

## 7. 待真人验证

Native 当前仍标记双端 `showRewardAd` 未实现，因此最终 Accepted 需要当前 App build 真机确认：

### Android / iOS

1. method 已注入；
2. scene `h5CheckinResign` 可拉起真实激励广告；
3. 完整观看返回 `completed`，且仅此状态进入补签成功；
4. 主动关闭返回 `closed`，不补签；
5. SDK 失败返回 `failed`，不补签；
6. 无广告库存返回 `no_fill`，不补签。

真机 smoke 前，本卡保持 In Review。
