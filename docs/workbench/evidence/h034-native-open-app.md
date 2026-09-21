# H034｜APP 唤起与应用商店承接 Native 能力接线证据

## 1. 基线

施工基线：

```text
dev@f893d5fb7ba573b4e2516e07171604cbc0b959d3
```

Native 回填协议：

```text
Android: window.androidBridge.openApp(json)
iOS:     window.iosBridge.openApp(json)
```

输入：

```json
{"action":"open","inviteCode":"","fallbackUrl":""}
```

`action` 仅允许：

- `open`
- `store`
- `detect`

返回：

```json
{"success":true,"installed":true}
```

Native 当前回填状态：Android / iOS 均“否”，最低版本目标 2.13。

## 2. Capability Runtime

`src/services/nativeBridge.ts` 已注册双端 `openApp`：

- Android：`window.androidBridge.openApp(json)`
- iOS：`window.iosBridge.openApp(json)`
- 入参固定为一个 JSON string；
- `action` 只接受 `open | store | detect`；
- `inviteCode` / `fallbackUrl` 必须保留 string 字段；
- 返回必须同时包含 boolean `success` 与 boolean `installed`；
- method 缺失、action 非法、返回字段非法、Native throw 均 fail-closed。

H5 不自造 scheme、Universal Link、应用商店 URL，也不通过 visibility/timer hack 猜安装状态。

## 3. action 分层

新增 `src/app/adapters/appOpen.ts`，把三个动作拆成独立入口：

- `detectInstalledApp()` → `action:"detect"`
- `openInstalledApp()` → `action:"open"`
- `openNativeAppStore()` → `action:"store"`

三种 action 不混在一次 payload 中，也不由页面自行改写。

当前真实 `inviteCode` / `fallbackUrl` 还没有业务 contract，因此 adapter 默认严格传空字符串，和 Native 回填示例一致；不会自行生成 invite code、scheme 或 fallback URL。

## 4. /buddy/invite/scan

旧实现：

```text
?state=has-app
→ H5 假装已安装
→ “打开 APP”
→ navigate('/buddy/accept')
```

H034 后：

```text
openApp({action:"detect"})
→ success=true + installed=true
   → 显示原“打开 APP / 取消”弹窗
   → 点击“打开 APP”
   → openApp({action:"open"})
→ success=true + installed=false
   → openApp({action:"store"})
```

关键边界：

- `?state=no-app|has-app` 不再是 production installed-state 事实源；
- `installed` 只信 Native detect 结果；
- detect `success:false` 时不使用 `installed` 字段做结论；
- “打开 APP”不再跳 H5 `/buddy/accept` 冒充真实 App 唤起；
- 未安装时由 Native store action 决定商店承接；
- H5 仍保留原 WebView 边界视觉，不伪造 App Store / 应用市场页面；
- capability late injection 时页面会重新探测，避免首屏过早判 unsupported；
- 未安装进入商店后，H5 在 focus/pageshow 时重新 detect；后续重检不会自动重复拉起商店。

## 5. 现有 APP 引导弹窗

`/dearseed?overlay=app-guide` 与 Profile 的强制 APP 引导弹窗，原“下载链接”仅显示“下载地址尚未开放”。

H034 后：

- 点击“下载链接”调用 `openNativeAppStore()`；
- loading 状态由 `AppPromptDialog.downloadPending` 承载；
- Native `success:true` → 提示“已交由系统打开应用商店”；
- `success:false` → 提示打开失败；
- capability 不支持 / 调用异常 → 明确提示当前 App 版本暂不支持；
- 不再要求 H5 预先知道 App Store / 应用市场 URL。

## 6. Bridge Lab

Android / iOS Registered capability catalog 均展示 `openApp`。

可直接编辑：

```json
{"action":"detect","inviteCode":"","fallbackUrl":""}
```

并验证：

- action 原值；
- installed / success 返回；
- 真实 inviteCode / fallbackUrl 后续联调；
- 双端行为一致性。

## 7. 自动验证

覆盖：

- Android detect/open/store 三种 action 精确 JSON-string 序列化；
- iOS inviteCode / fallbackUrl 原字段透传；
- success / installed boolean 解析；
- missing method / 非法 action / 非法返回 fail-closed；
- appOpen adapter 三 action 分离；
- BuddyScanLanding 不在 capability 缺失时伪造安装状态；
- Native detect installed=true 才显示打开 APP 弹窗；
- installed=false 进入 Native store action；
- detect success=false 不把 installed 当真实结论；
- 从商店返回后重新 detect，且不会循环重复触发 store；
- Bridge Lab 可见并可编辑调用 `openApp`。

## 8. 待真人验证

Native 当前仍标记双端 `openApp` 尚未实现。最终 Accepted 需要：

1. `detect` 在 Android / iOS 当前 build 返回真实 installed；
2. `open` 能真正唤起目标 App / 对应邀请链；
3. `store` 能进入正确平台商店；
4. 真正 inviteCode / fallbackUrl 来源与格式由业务/Native 联调确认；
5. open 失败后的 fallback 规则按 Native 实际协议补齐。

真机 smoke 前，本卡保持 In Review。
