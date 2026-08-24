# T002｜Token 对照表与原型取样依据

> 状态：Agent Review（T002）
> 本文档是 `src/styles/tokens.css` 与 `src/styles/card-brand.css` 的取值事实源说明。
> 结论优先级遵循 `AGENTS.md`：用户确认 > 已确认摹客原型 > 原型语言 > Com Design Token > 已验收实现 > 历史稿 > 推断。

## 1. 取样方法

对 `mockplus/卡博士诗得丽/data/pages/*.js` 中关键页面做程序化取样：

- **颜色**：抽取 `"fill":{"color":{r,g,b},"type":"solid"}` 的实色填充，剔除纯白后按出现次数排序。
- **图片素材**：抽取 `"value":"./data/xxx"` 图片引用，并用 `sips` 核对分辨率。
- **文本色**：抽取 `textFormat / textStyle / textFormat.color` 的 rgb。
- **页面映射**：由 `data/project.js` 页面树解析页面名 → nodeID → 数据文件。

取样脚本与结果在本次施工过程中执行，原始输出保留在本次任务证据中。

## 2. 关键页面取样结果

### 2.1 会员中心 / 会员等级

| 页面 | nodeID | 取样 |
| --- | --- | --- |
| 会员中心 | K65Aq7Fpa | 实色：#ededed、#f3e2cb、#d9b990、#999999；素材 71be5c20(133×246)、6c65a6d0(155×290)、50d7b390(640×368)、46659180(200×170)、f6620470(200×200)、6a88f8e0(200×200) |
| 会员等级 | kKyrzTSw0 | 素材 7baade50(257×378)、80aff6b0(433×181)；实色以 #ededed 中性为主，等级视觉基本由图片承载 |

结论：原型会员卡/会员等级主要靠**图片素材**表达，图层内实色极少；暖金 `#f3e2cb`/`#d9b990` 与 Com Design premium 暖金接近，映射到 `--premium-*` 是**已确认方向内**的落地，不构成新造色。

### 2.2 泡泡值 / 兑换 CTA 的「红」—— 冲突记录

| 页面 | 取样 |
| --- | --- |
| 洗护兑换专区（MNQgHzX2I） | 商品价「200🫧」文本色 `rgb(255,0,0)`；商品卡白底、圆角 8 |
| 商品兑换弹窗（2OEnW_WOlm） | 「立即兑换」按钮实色 `rgb(255,0,0)`；商品图 6c65a6d0(155×290) |
| 泡泡值明细（oxJ4vdNWn） | 实色以 #ededed/#797979/#999999 中性为主，无明确品牌主色 |

**冲突**：原型把「泡泡值数字」和「兑换/领取 CTA」画成红色，而 design-baseline 已确认方向是 Gold=会员权益、Orange=行动转化（且不出现大面积黄金堆叠、游戏充值感）。

**处理（待确认）**：

- 本任务按 **design-baseline 已确认方向**，把泡泡值/兑换语义落为 Gold 系列 Token（`--color-bubble-*`、`--color-exchange-*`）。
- 原型红色表达记录为**阻塞决策**：是否恢复「泡泡值/兑换 CTA 为红」需产品确认后，在 T002 冲突记录中定值，不在此前静默选择。
- 同时预留 `--color-redpacket`、`--color-exchange-price`（当前指向 danger 红）作为「若确认恢复红」的直接落点。

### 2.3 卡包 / 卡券的「豆沙色」—— 冲突记录

| 页面 | nodeID | 取样 |
| --- | --- | --- |
| 卡包 | AdeVbUKKi | 实色 #e9e9e9×4、**#9f8189×2**；素材 0cbc5600(132×247) |
| 卡包-可用 | cyiNGErb3 | 同左 #9f8189 |
| 卡包-已使用 | qQmmrxmqG | 中性为主 |
| 卡包-已过期 | jHEk_Kx4N | #fafafa、#e2e2e2 |

**冲突**：原型卡包券卡出现豆沙色块 `#9f8189`，不属于 Gold/Orange 体系，也没有进入 Com Design primitive。

**处理（待确认）**：卡券主卡按已确认 Gold 语义落地（`--color-coupon-*`），`#9f8189` 记录为阻塞决策，待 T009（卡包）确认是否采用。

### 2.4 今日澡运 / 抽取成功

| 页面 | nodeID | 取样 |
| --- | --- | --- |
| 今日澡运 | SaiTa9aeM | 素材 d4a69be0(668×926)；实色 #fdf3e9（暖白） |
| 抽取成功 | TlwcghZtC | 素材 22eb13d0(800×1244)；实色以中性为主 |

**处理（待确认）**：`大吉金 / 中吉橙 / 小吉灰` 三态来自历史稿 T03，摹客未完整确认。T002 仅把既有实现（DrawSuccess）映射到 `--gradient-luck-*` / `--color-luck-*` 语义命名，**不构成对状态规则与颜色规则的定稿**；是否保留、三态色值如何定，待 T006 决策。

### 2.5 搭子 / 客服

| 页面 | nodeID | 取样 |
| --- | --- | --- |
| 搭子（无） | 4phMHZHwa | 素材 8e4b6bd0(179×123)；实色 #8f8f8f/#f3f3f3 中性 |
| 搭子（有） | EYVj0ngBs | 素材 12.jpg(1398×817) |
| 智能客服 | CftJZpuEN | 实色以中性 #797979 为主，无品牌主色 |

**处理**：搭子/客服页均 ⚠️ 待确认（T007/T013），本任务只落**语义命名 Token**（`--color-buddy-*`、`--color-support-*`），默认值取已确认 Gold/Orange 体系，页面施工时按确认结果覆写。

### 2.6 中性灰阶 —— 由原型直接取样

原型大量使用 `#f3f3f3 / #ededed / #8f8f8f / #999999 / #797979` 作为占位中性。T002 据此补全 `--neutral-*` primitive 灰阶，作为「澡运小吉」与通用中性底色的事实源。

## 3. Token 对照总表

### 3.1 Primitive 层（tokens.css）

| Token | 值 | 来源 |
| --- | --- | --- |
| `--brand-50…800` | 暖橙系 | Com Design theme-premium-gold-v2（已确认） |
| `--premium-50…900` | 暖金系 | Com Design theme-premium-gold-v2（已确认） |
| `--warm-50…300` / `--ink-500…950` | 暖面/墨色 | Com Design（已确认） |
| `--neutral-50…900` | 灰阶 | **原型取样** §2.6 + 插值 |
| `--success/warning/danger-*` | 状态色 | Com Design（已确认） |

### 3.2 品牌语义层（card-brand.css）

| 语义组 | Token | 值 | 依据 / 备注 |
| --- | --- | --- | --- |
| 会员 | `--color-member-surface/text/accent/muted` | ink-900 / premium-50 / premium-300 / premium-100 | design-baseline Gold 方向；§2.1 |
| 会员等级 | `--color-member-level-0…3` | premium-200/300/400/500 | ⚠️ 展示稿占位，待 T006 |
| 泡泡值 | `--color-bubble-surface/accent/text/muted` | premium-50/300/900/600 | Gold 语义；§2.2 冲突记录 |
| 泡泡值·金面文字 | `--color-bubble-on-gold(-muted)` | premium-900 / premium-700 | 对比度修正（见校验文档） |
| 卡券 | `--color-coupon-surface/accent/text/muted` | warm-50/premium-300/ink-800/ink-500 | Gold 语义；§2.3 冲突记录 |
| 卡券状态 | `--color-coupon-available/used/expired(+bg)` | success/ink/danger | 状态可区分（见校验文档） |
| 澡运 | `--color-luck-great/good/minor` | premium-300/brand-400/neutral-300 | ⚠️ 历史 T03 映射占位，待 T006 |
| 搭子 | `--color-buddy-*` / `--color-buddy-mutual` | brand/premium | T007 已落地（D-057）；surface/accent/text/muted 在用，默契值仅预留命名、D-059 禁页面引用 |
| 客服 | `--color-support-*` | brand/success/warning | ⚠️ 待 T013 |
| 领取/打卡/红包 | `--color-claim-*` / `--color-checkin-success` / `--color-redpacket` | premium / success / danger | §2.2 冲突记录 |
| 兑换 | `--color-exchange-*` | brand / danger(红价占位) | §2.2 冲突记录 |
| IP surface | `--color-card-ip-surface` | warm-100 | 白熊 IP 见素材清单 |

### 3.3 组件层（card-brand.css）

| Token | 值 | 说明 |
| --- | --- | --- |
| `--gradient-member` | ink-900→ink-800→#3A3228 | 会员卡渐变（与纯色语义并存，供暗面质感） |
| `--gradient-bubble` | premium-300→premium-500 | 泡泡值横幅（Home 消费） |
| `--gradient-luck-great/good/minor` | 金/橙/灰 | 澡运签（DrawSuccess 消费） |
| `--gradient-claim` | premium-100→premium-300 | 领取横幅（展示页消费） |
| `--shadow-bubble-card` | 0 8px 24px rgba(0,0,0,.08) | 由 Home 原页面临时阴影 token 化，值不变 |
| `--shadow-coupon-card` | 0 4px 16px rgba(41,39,34,.1) | 卡券浮层 |
| `--shadow-luck-card` | 同 member-card | 澡运签投影 |
| `--radius-coupon` / `--radius-luck` | 12px / 9999px | 组件几何 |

## 4. 冲突与阻塞决策清单（不得静默统一）

| # | 冲突点 | 页面 | 当前处理 | 责任任务 |
| --- | --- | --- | --- | --- |
| C1 | 泡泡值/兑换 CTA 原型为红 vs Gold/Orange 体系 | #18、#39、#15/#23/#25 | 暂按 Gold 落地，预留红 Token | T002 冲突记录 / T006、T008 |
| C2 | 卡包券卡 `#9f8189` 豆沙色 | #54、#62–#64 | 暂按 Gold 落地 | T009 |
| C3 | 澡运大吉/中吉/小吉三态与色值 | #41 | 仅映射命名，不定稿 | T006 |
| C4 | 搭子/客服气泡与页面主色 | #27–#30、#32–#36、#58、#70、#71 | 仅落语义命名 | T007、T013 |

以上均为**记录即停**：T002 不替产品定值，页面施工任务（T006/T007/T008/T009/T013）命中时必须先形成决策记录。

## 5. 硬编码色审计（rg）

`rg '#[0-9a-fA-F]{3,8}' src` 结果：

- `src/styles/tokens.css`、`src/styles/card-brand.css`：Token 定义层，允许，且均有来源注释。
- `src/pages/*.tsx`：**0 处品牌 hex**（Home/DrawSuccess 已改为 Token 消费）。
- 页面中的 `rgba(...)` 阴影已收敛到组件 Token；艺术素材内部颜色按 AGENTS.md 豁免。

修复明细：

| 文件 | 修复 |
| --- | --- |
| `src/pages/Home.tsx` | 金面白字→`--color-bubble-on-gold`；临时阴影→`--shadow-bubble-card`；`bg-white/text-white`→`bg-surface`/语义 Token |
| `src/pages/DrawSuccess.tsx` | 原 `--com-*` 失效变量（从未定义，渲染为透明）已随 T004 夹具化重构消除；结果页渐变走 `--gradient-luck-*`（fixtures），成功 Toast `success-500`→`success-700`（白字 2.63→5.36:1） |

`rg --com- src` 复查：0 处。
