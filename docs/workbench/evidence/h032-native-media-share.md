# H032｜图片与剪贴板 Native 能力接线证据

## 1. 基线

施工基线：

```text
dev@b3f751863173107f4bdfe0cfb1f62e1ed0b84442
```

Native 回填的 4 个目标协议：

- `takePhoto(json)`
- `chooseImage(json)`
- `saveImageToAlbum(json)`
- `copyText(json)`

Android 使用 `window.androidBridge`，iOS 使用 `window.iosBridge`；有参方法统一传一个 JSON string，返回同步 JSON string。

Native 当前回填状态：四项 Android / iOS 均“否”，最低版本目标 2.13。

## 2. Capability Runtime

H032 注册四个双端 capability，并继续复用 H029 的 receiver-safe injected-object transport。

### takePhoto

默认输入：

```json
{"crop":true,"maxWidth":1080,"maxHeight":1080,"quality":0.8}
```

### chooseImage

默认输入：

```json
{"crop":true,"maxWidth":1080,"maxHeight":1080,"quality":0.8,"count":1}
```

两者返回严格解析：

```json
{"mimeType":"image/jpeg","imageBase64":"..."}
```

图片结果标记为 sensitive，Bridge Lab 默认脱敏。

### saveImageToAlbum

输入：

```json
{"imageType":"base64","imageData":"...","fileName":"kaboshi-invite.png"}
```

`imageType` 仅允许 `base64 | url`。

### copyText

输入：

```json
{"text":"..."}
```

保存图片与复制文本均严格解析：

```json
{"success":true}
```

method 缺失、JSON malformed、字段类型不符、Native throw 均 fail-closed。

## 3. Settings 头像

`Settings` 的头像 sheet 已从假保存改为：

- “拍照” → `takePhoto()`
- “从相册选择” → `chooseImage()`
- Native 返回后用 `data:{mimeType};base64,{imageBase64}` 做当前页面头像预览；
- capability 不支持时明确提示“当前 App 版本暂不支持该图片能力”；
- `native-cancelled` 显示“已取消图片选择”；
- `native-permission-denied` 按拍照 / 相册来源给出对应权限提示；
- `native-failed` 与其它未知调用失败显示“头像更新失败，请重试”。

H032 不新增头像上传后端契约；当前只接宿主图片来源和本地预览。

## 4. buddyShare adapter

旧 adapter 对保存海报 / 复制链接恒定返回成功。

H032 后：

- `saveInvitePoster(poster)` → `saveImageToAlbum(poster)`
- `copyInviteLink(inviteLink)` → `copyText({text: inviteLink})`
- Native `success:false` 或调用失败会映射到既有 `poster-failed / link-failed`；
- `BuddyInvite` 修正了历史映射，不再把真实失败错误跳到成功态。

### 当前业务数据边界

当前仓库的邀请二维码仍是明确的 `WecomQrPlaceholder`，没有真实 poster bytes / image URL；邀请链接仍是 `drcard.example` fixture，不是线上业务 URL。

因此：

- 页面没有真实 poster payload 时，保存海报明确进入 `poster-failed`，不伪造图片；
- 页面没有真实 invite URL 时，复制链接明确进入 `link-failed`，不把 fixture 地址写入系统剪贴板；
- `?state=saved|poster-failed|link-copied|link-failed` 仍可用于 UI 状态验收；
- 一旦上游提供真实 poster/link，adapter 无需改协议即可调用 Native。

## 5. Bridge Lab

Android / iOS 平台视图均展示：

- `takePhoto`
- `chooseImage`
- `saveImageToAlbum`
- `copyText`

Registered capability 可直接编辑 input JSON 调用；图片返回默认脱敏。

## 6. 自动验证

覆盖：

- takePhoto / chooseImage 精确 JSON-string 入参；
- mimeType / imageBase64 解析；
- saveImageToAlbum / copyText 原字段序列化；
- success boolean 解析；
- missing method / malformed result fail-closed；
- Bridge Lab capability catalog 与敏感结果标记；
- buddyShare Native 成功 / false / throw 映射；
- 无真实 poster/link 时不伪造成功；
- BuddyInvite 真实失败进入既有失败 state；
- Settings 拍照 / 相册入口调用对应 facade 并消费 Base64 结果。

## 7. 待真人验证

Native 当前仍标记四项未实现。最终 Accepted 需在当前 Android / iOS App WebView 中分别确认：

- 相机可拉起并返回正确 MIME + Base64；
- 相册可选择图片并返回一致结构；
- 真实 poster payload 可写入系统相册；
- 真实 invite URL 可写入系统剪贴板；
- 已确认的取消 / 权限拒绝 / 普通失败 envelope 在真机上实际返回一致。

未完成上述 smoke 前，本卡保持 In Review。
