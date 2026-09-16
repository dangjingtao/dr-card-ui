# Penpot 施工底包

本文件是 `dr-card-ui` Penpot 迁移任务的持久上下文。调度者维护它，低成本任务只读取它，不再为每个页面重新盘点全仓库或猜测 Penpot 能力。

## 1. 使用方式

每张页面卡只包含三部分：

1. 本底包的固定引用；
2. 当前路由的页面差量；
3. 当前卡独有的停卡条件和验收项。

底包中已经确认的内容不得重复调查。底包没有记录的 Penpot Token、组件、字体或素材视为“不可用”，不得自行命名或补造。

## 2. 固定项目事实

- 目标：卡博士移动 APP 高保真 UI，不是后台系统。
- Penpot 迁移事实源：用户当前确认 → 当前代码 UI 的实际渲染、状态与交互 → 当前代码中的 fixtures/router/Token/组件 → Mockplus 与 `docs/prototype/` → 历史参考。
- Mockplus 和原型文档用于解释来源、发现遗漏与标记冲突；不得覆盖当前代码 UI。若代码与文档冲突，先按代码还原，并把差异单独登记。
- 移动基准宽度：375。
- 可滚动页面交付完整长图；812 只代表常用视口高度，不是长图默认高度。
- 有意义的页面状态独立成图，同一路由相邻排列。
- 业务画板统一从 `(120, 120)` 起排，同一行水平间距固定为 80px；下一张 `x = 上一张 x + 上一张 width + 80`，同一行 `y` 必须一致。
- Debug 面板、Fixture 控件和施工批注不进入产品画板。
- `不靠谱的设计历史/` 不能单独授权施工。

## 3. 当前 Penpot 快照

快照日期：2026-08-29。目标文件：`dr-card-v2`（当前文件 ID：`40e06342-8830-80d6-8008-8cf8c7cf158a`）。

当前页面：`Sample - Points`、`20 / Membership`、`01 / Components`。

已知本地组件：`Checkin`、`Luck`、`Voucher`、`Pill`、`Component Source / CheckinPage / CheckinPage / Default Content`。

已知 Token 集：`dr-card.sample`，共 36 个。

颜色：

- `color.bg`
- `color.surface.default`
- `color.surface.subtle`
- `color.text.primary`
- `color.text.secondary`
- `color.text.tertiary`
- `color.brand.primary`
- `color.brand.premium`
- `color.brand.premiumStrong`
- `color.brand.premiumSoft`
- `color.border.default`
- `color.border.gold`
- `color.status.success`
- `color.status.successBg`
- `color.status.danger`
- `color.nav.inactive`

间距：`space.4`、`space.8`、`space.12`、`space.16`、`space.20`。

圆角：`radius.control`、`radius.card`、`radius.hero`、`radius.pill`。

字号：`font.caption`、`font.bodySmall`、`font.body`、`font.section`、`font.title`、`font.balance`。

字重：`font.weight.regular`、`font.weight.medium`、`font.weight.semibold`、`font.weight.bold`。

字体族：`font.family.sans`，当前值为 Noto Sans SC。

### 当前限制

- `Sample - Points` 是工作样品，尚不是批量黄金模板。
- 已失败的 `Batch 1 - Membership` 已删除，不得作为参考或复制源。
- 当前 Penpot 库中没有证据证明存在 `Button / Primary`、`PageContainer`、`Dialog / Compact` 等组件；不得写入 Manifest。
- 当前快照没有列出的 Token 名均不得写入 Manifest。
- `font.family.sans` 当前存在，但 Penpot 在应用时把其数组值判为无效；页面可使用真实 Noto Sans SC 字体，字体族绑定需在独立基础设施卡修复，不能由页面卡修改全局 Token。

## 4. 已完成、必须复用的仓库成果

- 品牌 Token 与素材治理：[`../workbench/tasks/T002-brand-tokens-assets.md`](../workbench/tasks/T002-brand-tokens-assets.md)，状态 `Accepted`。
- Com Design 移动组件验真：[`../workbench/tasks/T003-ui-components.md`](../workbench/tasks/T003-ui-components.md)，状态 `Accepted`，但文档中标记的业务消费缺口仍然有效。
- Token 实现：`src/styles/tokens.css`、`src/styles/card-brand.css`。
- 组件入口：`src/components/ui/`、`src/components/mobile/`、`src/components/card/`。
- 素材总表：[`../design/assets-inventory.md`](../design/assets-inventory.md)。
- Token 取样与冲突：[`../design/token-sampling.md`](../design/token-sampling.md)。
- Token 验证：[`../design/token-validation.md`](../design/token-validation.md)。
- 页面原型索引：[`../prototype/07-page-index.md`](../prototype/07-page-index.md)。

页面卡只查当前路由涉及的源文件、原型章节和素材路径，不再重读上述全部成果。

## 5. 页面差量格式

```text
BASE: docs/workflow/penpot-construction-base.md
ROUTE: /example
SOURCE: 当前页面源文件 + 对应 prototype 章节
KNOWN STATES: 只列当前路由状态
KNOWN ASSETS: 只列当前路由真实素材
ALLOWED PENPOT: 只允许底包中列出的 Token/组件
DELTA TASK: 只生成页面区块、文案、状态、交互和长图测量结果
STOP: 列出本页冲突；不要重复盘点底包
```

如果页面需要底包之外的 Penpot 基础能力，输出 `MISSING_PRIMITIVE`，由调度者统一加入基础设施批次；不能让每个页面自行创造一套名字。

## 6. 维护规则

- 只有受控调度者在读取真实 Penpot 状态后更新第 3 节。
- 新组件或 Token 必须先在基础设施批次创建、验收，再进入本底包。
- 页面完成后只回写画板名、状态、复用组件、已验证 Token 和已知限制。
- 后续卡片直接继承这些结果，不再重新发现。
- 每批结束清理失败画板、未使用组件源、上传缓存、临时截图和被拒绝的中间任务；被正式画板引用的组件、Token 和真实素材不属于中间产物。
- 清批时必须列出 Penpot 所有页面、顶层画板、组件源和插件缓存：空页面、失败稿、孤儿顶层图层、无实例引用的临时组件源以及上传缓存必须清零。

## 7. 已确认页面状态

### `/luck`

- 当前事实源：T022 `Accepted`、`src/pages/Luck.tsx`。
- 正式交付状态只有 `Default Placeholder`：展示「玩法待定」「敬请期待」及筹备说明。
- 页面不可操作，没有抽取 CTA，也没有 `/luck/result` 入口。
- `?state=drawn` 仅增加工程夹具隔离说明，不作为正式产品画板。
- `/luck/result` 是独立历史节点，不从 `/luck` 进入。
- Penpot 状态：`ACCEPTED SAMPLE`（用户于 2026-08-29 确认“可以，效果还行”）；字体族绑定存在已记录的基础设施缺口。
- 页面：`20 / Membership`。
- 画板：`20 / Membership / Luck / Default Placeholder / 375xLong`，375 × 812。
- 复用：真实素材 `src/assets/brand/luck/luck-draw-hero.webp`；颜色、字号、字重 Token 保持绑定。
- 结构验收：15 个顶层元素，无越界，无交互，无 Debug/夹具说明；完整导出已检查。
- 后续页面继承本样品的命名、完整画板、真实素材、Token 绑定和一次自检方式；不复制本页具体业务布局。

### `/checkin`

- 当前事实源：T006/T022 `Accepted`、`src/pages/Checkin.tsx`、`src/components/mobile/CheckinBoard.tsx`。
- Penpot 状态：`WRITTEN`（2026-08-29）。
- 页面：`20 / Membership`。
- 画板高度：375 × 1436；来源为 88px 页面外壳 + 实测 1348px 滚动内容。
- 独立画板：`Default`、`Success`、`Reminder`、`Make-Up Success`，从左到右相邻排列。
- 复用组件：`Default Content`；四张画板均为组件实例，成功态仅在尾部覆盖已绑定背景并增加独立 CTA。
- 真实素材：`checkin-ritual-hero-v2.webp`、`exchange-pick-shampoo-a.webp`、`exchange-pick-shampoo-b.webp`。
- 验收：四张画板正文文字字号均保持 Token 绑定；无 Debug 说明；默认态与 Reminder 完整导出已检查。
- 用户复核修正：`为你精选` 双列商品卡使用 165.5px + 12px gap + 165.5px，四个状态通过共享组件同步更新；不得恢复为相接或重叠布局。
- B-018～B-021 仅限制新增产品规则；当前 Accepted 视觉和隔离状态可以施工。

### `/points`

- 当前事实源：T022 `Accepted`、`src/pages/Points.tsx`、`src/app/fixtures/index.ts`。
- Penpot 状态：`WRITTEN`（2026-08-29，MCP 直连施工）。此前 REJECTED 卡读取旧实现的记录作废；其残留的 `20 / Points` 页面与画板仍待清理（见第 4 节清批规则，需明确授权）。
- 页面：`20 / Membership`。
- 画板：`20 / Membership / Points / Default / 375xLong`，375 × 1062；来源为 88px 页面外壳 + 实测 913px 滚动内容 + 61px TabBar（Playwright 实测）。
- 结构：104 个顶层元素，无越界；外壳（状态栏/标题栏/返回）与 Checkin 画板同源；底部 TabBar 含 5 个一级 Tab（泡泡高亮）+ 扫码 FAB 抬升圆底。
- 复用组件：`Pill`（吸底「泡泡值兑换」主按钮，343 × 48 实例）；其实例 Label 字体族直接设为 Noto Sans SC（`font.family.sans` 绑定缺口仍待独立基础设施卡修复）。
- 复用素材：`points-hero`（900×724）、`points-checkin`（384×384）、`points-voucher`（384×384），沿用文件内已上传 media ID。
- Token 绑定：47 个文本全绑定 font 字号/字重/颜色；Hero 边框 `color.border.gold`、圆角 `radius.hero/card/pill`、状态色 `color.status.success/successBg/danger`、`color.brand.premium/premiumStrong`、`color.nav.inactive`、主按钮 `color.brand.primary`。
- 已知差异登记：余额大字使用 `color.text.primary`（#292722，代码为 #21190F）；`已完成` 标签文字/图标用字面量 #21B66F（`checkin-success`，Token 集无此值）；金色 Hero 渐变、资产行、福利卡渐变及 #845A2E/#765634/#8C7357 等品牌金棕色为字面量（Token 集无对应项）；Penpot 不支持负 letterSpacing，余额 -1.89px 字距未还原。
- 用户复核修正：`20 / Membership` 页 Points 画板视觉导出后确认（B-002 流水/金色改造仍未决，本页只做 T022 Accepted 默认态）。
