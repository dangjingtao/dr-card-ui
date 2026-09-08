# T041｜领款机反扫码充值

## 状态与类型

- 状态：`Doing`（2026-09-08 用户拍板新增 P0 功能；进入 Doing 不阻塞其他在跑的卡）
- 类型：Feature / UI / Flow
- 优先级：P0

## 当前事实与差距

- 来源：`卡博士APP缺失及新增功能.xlsx` Sheet1 第 16–17 行：
  - 16｜反扫码｜即将账户余额充值到实体卡
  - 17｜领款机｜APP 有余额，通过领款机充值到实体卡上
- 当前 APP 没有「领款机充值」入口；用户在校园领款机上无法把 APP 余额充到绑定的实体卡。
- 「我的」宫格已有 8 项（8 项布局口径来自 T031），其中「报修」入口跳 `/legacy-service/repair/projects`；而「服务」页（`/legacy-service`）里本身已带报修入口，形成重复。

## 目标

1. 「我的」宫格把「报修」替换为「领款机充值」，避免与「服务」页重复。
2. 新增「领款机充值」页面，展示一个可被领款机摄像头识别的二维码 + 反扫码操作步骤说明。
3. 二维码内容为占位 mock，指向「账户 → 实体卡」的转账语义；接口阶段再替换为真实签名串。
4. 不做真实领款机协议对接；仅前端演示态。

## 原型范围

- 需求文档：`卡博士APP缺失及新增功能.xlsx` Sheet1 第 16–17 行。
- 复用现有顶部栏（淡金渐变 + 返回 + 居中标题 + 右侧可选 pill）、`PageContainer`、`BottomNav` 与 `Button` 风格。
- 二维码占位：SVG inline mock（30×30 模块矩阵 + 三角定位符 + 中央 logo 占位）。

## 不在范围

- 不实现真实领款机扫码协议、二维码签名接口、转账确认接口。
- 不修改「服务」页（T034）已有内容。
- 不实现多卡批量反扫码，单次只展示一张当前默认卡的反扫码码。
- 不写领取记录的额外页；转账结果以领款机出票为准，APP 端不写流水。

## 依赖与阻塞决策

| 编号    | 阻塞项                | 风险 | 说明 |
| ----- | ------------------ | -- | --- |
| B-050 | 二维码内容字段定义 | 中  | 二维码内容是「卡号 + 用户 ID + 一次性 nonce」还是「服务器签名串」需业务侧确认；先 mock 一个稳定字符串 `pickup://card-{cardId}/user-{account}/ts-{ts}`，等接口阶段替换 |
| B-051 | 「我的」宫格「报修」移除    | 低  | 「服务」页已自带报修入口，「我的」移除后唯一入口迁移到「服务」，用户已确认；本卡内一并完成 |

## 实施要求

- `ProfileHome.tsx`：`QUICK_ENTRIES` 第 8 项（当前 `key: 'repair'`、`label: '报修'`、`to: '/legacy-service/repair/projects'`）替换为：
  - `key: 'pickup'`
  - `label: '领款机充值'`
  - `to: '/legacy-profile/pickup-machine'`
  - `icon: QrCode`，配色与原"报修"项保持暖橙渐变 `from-[#FB923C] to-[#FDBA74]`（避免视觉跳变）
- 新建 `src/pages/legacy/PickupMachineRechargePage.tsx`（`/legacy-profile/pickup-machine`）：
  - 顶部淡金渐变栏：左侧返回 + 居中"领款机充值"标题
  - 中央白卡：二维码 SVG（mock 30×30）+ 下方"扫一扫领款机"提示
  - 二维码下方：当前卡信息（卡名 + 卡号 + 余额）+ "金额由领款机选择"提示
  - 步骤说明（卡片样式，编号 1–3）：
    1. 在领款机上选择「APP 充值 / 反扫码」
    2. 用领款机摄像头扫描本二维码
    3. 在领款机屏幕上确认充值金额与目标卡，完成扣款
  - 右下角保留原型状态切换器（开发用，不计入业务页面）
- 路由：`src/app/router/routes.ts` + `src/app/router/index.tsx` 同步新增 `pickup-machine` 路径，归类 `task: 'T041'`，参考 T036 设备相关页的写法
- 数据来源：当前卡从 `useCards()` 读取第一张 `normal` 卡；mock 二维码字符串用 `pickup://card-{id}/user-{account}` 占位
- 空态：无卡时（demo state = unbound 或卡列表为空）显示空态"暂无可充值的实体卡"

## 状态与交互矩阵

- 默认态（有卡）：展示二维码 + 卡信息 + 步骤说明
- 顶部返回：跳 `/legacy-profile`
- 空态（无卡）：提示"暂无可充值的实体卡，请先绑定卡" + 「去绑定卡」按钮跳 `/legacy-profile/my-cards`
- 步骤 1–3 静态展示，不可点击
- 右下角 demo 切换器：保持与 MyCardsPage 一致的「已绑卡 / 未绑卡」切换

## 验收标准

- 「我的」宫格最后一项为「领款机充值」，不再有「报修」入口。
- 点击「领款机充值」进入 `/legacy-profile/pickup-machine`，页面在 375 × 812 下顶部栏、卡片、步骤说明不被裁切。
- 二维码占位可被肉眼识别为二维码样式（三角定位符 + 模块矩阵）。
- 有卡时显示当前卡名 + 卡号 + 余额；无卡时显示空态和去绑定按钮。
- 三步说明文字正确，编号 1–3 顺序与图标对齐。
- `npm run typecheck` 与 `npm run build` 通过。

## 必交证据

- 375 × 812 截图：有卡态 + 无卡空态
- 「我的」宫格最新布局截图
- 路由 `/legacy-profile/pickup-machine` 注册登记
- typecheck / build 输出

## 落地（2026-09-08）

- `src/pages/legacy/ProfileHome.tsx`：`QUICK_ENTRIES` 第 8 项从 `repair / Wrench / /legacy-service/repair/projects` 替换为 `pickup / QrCode / /legacy-profile/pickup-machine`，去掉 `Wrench` 引入、补 `QrCode` 引入。
- 新建 `src/pages/legacy/PickupMachineRechargePage.tsx`：
  - 顶部淡金渐变栏：返回 + 居中"领款机充值"
  - 中央白卡：mock 二维码 SVG（30×30 模块矩阵 + 三角定位符 + 中央金色 logo "卡"字）
  - 二维码 payload mock：`pickup://card-{cardId}/user-{account}`（B-050 待业务侧定稿）
  - 当前卡信息卡：紫色 Wallet 图标 + 卡名 + 卡号 + 余额（`¥{card.balance.toFixed(2)}`）
  - 三步操作说明卡片：编号 1–3 渐变圆形 + 标题 + 说明
  - 底部淡黄提示条：说明前端不发起扣款
  - 无卡态：橙色 CreditCard 图标 + "暂无可充值的实体卡" + 「去绑定卡」CTA → `/legacy-profile/my-cards`
  - 右下角"已绑卡 / 未绑卡"演示态切换器，与 MyCardsPage 共用 `KBS_CARD_DEMO_STATE` key
- `src/app/router/routes.ts`：新增 T041 section，登记 `pickup-machine` 路径（`title: '领款机充值'`、`titleBar: 'hidden'`、`nodes: []`、`task: 'T041'`、`entry: '「我的」-领款机充值'`、`returnTo: '我的'`）
- `src/app/router/index.tsx`：新增 `PickupMachineRechargePage` import + `customPages` 注册 `'/legacy-profile/pickup-machine'`
- 工程门：`npm run typecheck` 0、`npm run build` 通过（typecheck → verify:images 36 WebP / 1.98 MiB → Vite build 1.50s）