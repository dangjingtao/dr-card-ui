# DR Card UI → Figma

把 React 项目抽取出来的 IR JSON，在 Figma 中重建为**真实可编辑图层**的插件。

产物面向 iOS / Android / 小程序原生开发：文本是真 `TEXT` 节点（可复制文案、可量行高）、图标是真矢量、颜色尽量绑定到 Figma Variables（可直接读 Token 名）。

---

## 1. 目录内容

```
scripts/figma-export/figma-plugin/
├── manifest.json   插件清单
├── code.js         插件主线程（纯 JS，无构建步骤）
├── ui.html         插件面板（选文件 / 导入 / 日志）
└── README.md       本文档
```

无任何 npm 依赖，不需要 `npm install`，不需要编译。

---

## 2. 安装（Figma 桌面端）

浏览器版 Figma 无法加载本地插件，必须用**桌面客户端**。

1. 打开 Figma 桌面端，进入任意 Design 文件。
2. 顶部菜单 `Plugins` → `Development` → `Import plugin from manifest…`
   - 新版界面在：菜单栏 `Figma` / 主菜单 → `Plugins` → `Development` → `Import plugin from manifest…`
   - 也可以在画布右键 → `Plugins` → `Development` → `Import plugin from manifest…`
3. 在文件选择框中选中本目录下的 `manifest.json`。
4. 导入成功后，插件会出现在 `Plugins` → `Development` → `DR Card UI → Figma`。

只需导入一次。之后修改 `code.js` / `ui.html`，重新运行插件即可生效（不需要重新 import；若没生效，在 Development 菜单里勾选 `Hot reload plugin`）。

---

## 3. 使用

1. 打开要放置参照稿的 Figma 文件，切换到目标页面（画板会创建在**当前页面**）。
2. 运行 `Plugins` → `Development` → `DR Card UI → Figma`。
3. 在面板里点文件选择框，选一个或多个抽取器产出的 `.json`（支持多选）。
4. 点「导入」。
5. 面板下方实时滚动日志与进度；完成后自动缩放视口到新建画板，并弹出中文完成提示（含节点总数与警告条数）。

### 多文件行为

一次选多个 JSON 时，按选择顺序**横向依次排开**，画板间距 80px，不会重叠。

### 命名

每个 JSON 生成一个顶层 Frame，名字取 `meta.name`；`meta.name` 缺失时退回文件名。

---

## 4. 输入格式（IR JSON）

插件只消费下述结构，字段名严格对应，不做猜测：

```jsonc
{
  "meta": { "name": "home", "url": "/?newcomer=off", "width": 375, "height": 812 },
  "variables": [ { "name": "brand/500", "hex": "#F25B26" } ],
  "root": { /* Node */ }
}
```

Node：

```jsonc
{
  "id": "n12",
  "name": "div.checkin-card",
  "type": "FRAME" | "TEXT" | "SVG" | "IMAGE",
  "x": 16, "y": 220, "w": 343, "h": 180,   // x/y 相对父节点左上角，1x 逻辑像素
  "opacity": 1,
  "clip": true,
  "cornerRadius": [16, 16, 16, 16],        // [左上, 右上, 右下, 左下]
  "fills": [ /* Paint，从底到顶 */ ],
  "stroke": { "hex": "#E5E7EB", "opacity": 1, "weight": 1 },
  "effects": [ { "type": "DROP_SHADOW", "hex": "#000000", "opacity": 0.08, "x": 0, "y": 2, "blur": 8, "spread": 0 } ],
  "text": { "characters": "今日已签到", "family": "Inter", "size": 20, "weight": 600,
            "lineHeight": 28, "letterSpacing": 0, "hex": "#2A1A10", "opacity": 1,
            "align": "LEFT", "cjk": true },
  "svg": "<svg ...></svg>",
  "image": { "dataUrl": "data:image/webp;base64,...", "fit": "COVER" },
  "children": []
}
```

Paint 三种：

```jsonc
{ "type": "SOLID", "hex": "#RRGGBB", "opacity": 1 }
{ "type": "GRADIENT_LINEAR", "angle": 135, "stops": [ { "pos": 0, "hex": "#FFF0C7", "opacity": 1 } ] }
{ "type": "GRADIENT_RADIAL", "cx": 0.7, "cy": 0.12, "rx": 0.5, "ry": 0.5, "stops": [ ] }
```

### 关键约定

- **绝对定位重建**，不做 auto layout 推断。保真优先。
- `fills` 数组顺序与 Figma 一致：先给的在下。
- `stroke` 固定 `strokeAlign = "INSIDE"`（与 CSS `border-box` 语义一致）。
- `clip: true` → `clipsContent = true`。
- 任意字段缺失都会被跳过，不会中断导入。

---

## 5. 渲染细节

### 渐变

`angle` 按 CSS `linear-gradient` 语义解释：`0deg` 从下往上，`90deg` 从左往右，顺时针增大。

插件在**像素空间**计算渐变线后再归一化，因此非正方形节点上的视觉角度与浏览器一致（直接在归一化方形里取角度会被宽高比拉歪）。

`GRADIENT_RADIAL` 的 `cx/cy/rx/ry` 是节点包围盒内的归一化值，同样换算为 `gradientTransform`。

### 文本

- 字族：`text.cjk === true` → `Noto Sans SC`，否则 `Inter`。
- 字重映射：300 Light / 400 Regular / 500 Medium / 600 Semi Bold / 700 Bold / 800 Extra Bold / 900 Black，非标准值就近取。
- **字体 fallback 链路**：`目标 family + style` → `目标 family Regular` → `Inter Regular` → 系统里第一个可加载字体。
- 全部字体在导入前**去重后一次性预加载**，递归过程中不再 `await`。
- 降级信息按字体去重、只记一次，最终在日志末尾一次性汇总，不会逐节点弹窗。

> 若日志出现大量「已降级为 Inter Regular」，通常说明本机没装 `Noto Sans SC`。可在 Figma 里安装该字体或用 Google Fonts 本地安装后重新导入。

### 图标（SVG）

用 `figma.createNodeFromSvg` 生成真矢量组。解析失败时降级为同尺寸透明矩形并记警告，保住布局占位。

SVG 节点不会再递归 IR 的 `children`，其内部结构由 Figma 自身解析生成。

### 图片

`createRectangle` + `figma.createImage`，`scaleMode` 由 `image.fit` 映射：`COVER → FILL`、`CONTAIN → FIT`，`FILL/FIT/CROP/TILE` 直通，未知值回落 `FILL`。

base64 解码优先用沙箱的 `atob`，缺失时走内置手写解码。

### Variables（设计 Token）

1. 创建或复用名为 `dr-card-ui` 的 Variable Collection，模式名 `default`。
2. 为 `variables[]` 每项创建 `COLOR` 变量，变量名直接用 `name`（`brand/500` 会被 Figma 自动按 `/` 分组）。同名变量复用，不重复创建；复用时会用本次 IR 的 hex 刷新取值。
3. 建立 hex → variable 映射；SOLID fill / 描边 / 文本颜色命中即通过 `setBoundVariableForPaint` 绑定，命不中保持普通色值。
4. 渐变 stop 不绑定变量。

> 同一 hex 对应多个 Token 名时，保留 `variables` 数组中先出现的那个，避免绑定结果随机。

---

## 6. 容错

- 单个节点创建失败只记警告并继续，不会让整棵树挂掉。
- 单个文件解析失败只跳过该文件，其余文件照常导入。
- 所有警告在导入结束后一次性列在日志区，同时 `figma.notify` 报总数。

---

## 7. 常见问题

**Q：菜单里找不到 `Import plugin from manifest…`**
A：确认用的是桌面客户端而非浏览器；且当前打开的是 Design 文件（本插件 `editorType` 只声明了 `figma`，FigJam / Slides 里不会出现）。

**Q：导入后图层全堆在左上角**
A：本插件已按「先 `appendChild` 再设 `x/y`」的顺序处理。若仍出现，多半是 IR 里 `x/y` 缺失，检查抽取器输出。

**Q：导入很慢**
A：主要成本在图片 base64 解码和超大 DOM 树。建议抽取器侧限制单页节点数与内联图片体积。

**Q：颜色没绑上变量**
A：只有 hex 与 `variables[].hex` **完全一致**（忽略大小写与 `#` 前缀）才会命中。抽取器侧应把 Token 色输出为精确 hex，不要经过 alpha 混合。

**Q：插件不联网吗？**
A：不联网。`networkAccess.allowedDomains` 为 `["none"]`，JSON 完全由用户本地选文件传入。
