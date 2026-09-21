# H032｜图片与剪贴板 Native 能力接线

**Status:** Ready  
**Phase:** Host Integration / Media & Share  
**Depends on:** H029

## 目标

一次收敛 Settings 与搭子邀请页共用的 4 个轻量 Native 工具能力：

- 拍照；
- 相册选图；
- 保存海报到相册；
- 复制文本。

## Native 目标协议

双端 object 分别为 `androidBridge` / `iosBridge`，方法名和 JSON 字段一致。

### takePhoto(json)

输入：

```json
{"crop":true,"maxWidth":1080,"maxHeight":1080,"quality":0.8}
```

返回：

```json
{"mimeType":"image/jpeg","imageBase64":"纯base64不含data前缀"}
```

### chooseImage(json)

输入：

```json
{"crop":true,"maxWidth":1080,"maxHeight":1080,"quality":0.8,"count":1}
```

返回同 `takePhoto`。

### saveImageToAlbum(json)

输入：

```json
{"imageType":"base64","imageData":"纯base64或https地址","fileName":"kaboshi-invite.png"}
```

`imageType: base64 | url`

返回：

```json
{"success":true}
```

### copyText(json)

输入：

```json
{"text":"https://example.com/invite"}
```

返回：

```json
{"success":true}
```

四项 Native 当前回填均为“否”；最低版本目标 2.13。

## 范围

- 注册 4 个 capability；
- 统一 JSON-string serializer / parser；
- Settings 头像入口接 `takePhoto / chooseImage`；
- buddyShare adapter 接 `saveImageToAlbum / copyText`；
- 保留页面现有成功/失败 UI，不再恒定 fake success；
- Bridge Lab 可测试全部 4 项。

## 不做

- 不扩展多图业务；
- 不自造裁剪 UI；
- 不改上传后端协议；
- 不把浏览器 Clipboard / file input 作为生产兜底；
- 不假设 Native 当前已经实现。

## 验收标准

- [ ] 4 个 capability 都走统一 transport；
- [ ] 图片 Base64 / mimeType 能被 H5 正确解析；
- [ ] 分享 adapter 不再恒定成功；
- [ ] method 缺失时明确 unsupported；
- [ ] 真机 smoke 后补权限/取消语义。
