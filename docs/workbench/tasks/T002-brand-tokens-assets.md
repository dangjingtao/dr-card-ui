# T002｜品牌 Token 与素材治理

## 状态与类型

- 状态：`Accepted`（用户于 2026-08-21 明确确认通过）
- 类型：Design / Component
- 优先级：P0

## 当前事实与差距

- 已有 Com Design warm/gold Token 和少量 `card-brand.css` 语义变量。
- 当前品牌层只有会员金、会员绿、奖励红、IP surface 等少数映射，尚未覆盖会员等级、泡泡值、卡券、澡运、搭子、客服等语义。
- 当前色值没有提交原型素材取样、对比截图和暗色/对比度验证。

## 目标

建立“Com Design 基础层 → 卡博士品牌语义层 → 页面组件层”的可追溯 Token 与素材体系，既不抹平原型品牌，也不在页面私造颜色。

## 原型范围

- 全局 60 个实施节点的颜色、字体、间距、圆角、阴影、图标与品牌/IP 素材。
- 重点校准会员卡、白熊 IP、泡泡值、红包/签卡、卡券和兑换专区。

## 不在范围

- 不改业务信息架构。
- 不凭历史稿新增原型未出现的主视觉。

## 依赖与阻塞决策

- 依赖 T001 的事实源和素材定位。
- Mockplus 与现有 orange/gold 体系冲突时，必须记录具体页面和用途后再定值。

## 实施要求

- 输出 primitive、semantic、component 三层 Token。
- 建立素材清单：文件、原型节点、用途、裁切规则、替代策略、版权/来源。
- 禁止在页面新增无注释的品牌 hex；艺术素材内部颜色除外。
- 校验文本对比度、状态色区分和 375 宽度下的字号/间距。

## 验收标准

- 核心品牌语义都有命名 Token，并至少被两个真实页面/组件消费或说明为何单用。
- 原型关键素材可定位且没有低清替代。
- Token 展示页包含默认、交互、状态与组合示例。
- 关键页面截图证明颜色不是只写在 CSS、未被页面使用。

## 必交证据

- Token 对照表与原型取样依据。
- 素材清单。
- Token 展示截图及代表页面截图。
- `rg` 硬编码色审计结果、类型检查和构建结果。

## 产出

- `tokens.css` / `card-brand.css` 修订、素材目录规范、说明文档。

## 本次施工记录（2026-08-21 → Accepted）

已交付：

- 三层 Token：primitive（补 `--neutral-*` 灰阶，取样自原型中性灰）、品牌语义层（会员/泡泡值/卡券/澡运/搭子/客服/领取/兑换 + 等级占位）、组件层（渐变/阴影/圆角）。见 `src/styles/card-brand.css`、`src/styles/tokens.css`。
- Token 展示页 `/tokens`（默认/交互/状态/组合示例，全部消费 Token），已接入当前路由注册表。
- 页面治理：Home 泡泡值横幅金面白字→深棕（对比度 1.75→8.49:1）、临时阴影/白色 token 化；DrawSuccess 成功 Toast `success-500`→`success-700`（2.63→5.36:1）；全仓 `--com-*` 失效引用清零。
- 文档：`docs/design/token-sampling.md`（对照表+原型取样+4 条冲突阻塞决策）、`docs/design/assets-inventory.md`（素材清单+目录规范+低清清单）、`docs/design/token-validation.md`（对比度/状态色/375 校验）。
- 证据：`docs/design/evidence/` 截图（/tokens 全页+375、/、/draw-success、/card、/exchange，均 scrollWidth=375 无横向溢出）；`rg` 审计：页面/组件 0 品牌 hex、0 `--com-`；`npm run typecheck`、`npm run build` 通过。

协调说明：施工期间检测到 T004（路由/夹具）并行改动并完成兼容（/tokens 以独立子路由接入，不进入业务 ROUTES；未改动业务信息架构）。

阻塞决策（不静默统一，见 token-sampling.md §4）：C1 泡泡值/兑换红 vs Gold、C2 卡包 #9F8189 豆沙色、C3 澡运三态色值、C4 搭子/客服主色——分别在 T006/T007/T008/T009/T013 命中时先形成决策记录。

验收记录：Token 展示截图与代表页面截图已提交（evidence/）；核心品牌语义 Token 均被 ≥1 真实页面 + 展示页消费，未施工页面语义在 token-sampling.md §3.2 标注「待 T0x 消费」。用户于 2026-08-21 明确确认本卡通过。
