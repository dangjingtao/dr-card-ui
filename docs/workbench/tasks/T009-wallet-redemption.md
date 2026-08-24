# T009｜卡包、核销、转赠与兑换码

## 状态与类型

- 状态：`Accepted`（owner 于 2026-08-24 确认通过；B-015、B-016、B-017 已关闭，核销二级页 Tabbar 作为非阻塞后续修正项）
- 类型：UI / Flow / Business Component
- 优先级：P0

## 当前事实与差距

- `/card` 已按 reference 卡包标准页实现（D-008）：可用/已使用/已过期三态 Tab + 券卡（使用/转赠）+ 使用 BottomSheet（扫码核销/消费密码核销）。
- 核销闭环已实现：`/card/verify` 扫码页、`/card/verify/confirm` 确认核销（核销设备/券明细/核销信息 + 确认）、`/card/verify/password` 6 位消费密码核销（样式参考完善信息 pin）。
- `/redeem`（兑换卡券）已实现，**12 位规则由 reference 标准页确认**（覆盖原型 8/11 位未决，B-009 关闭）。
- `/card/share` 分享（#65/#66）已按用户当轮提供的原型（`reference/分享.html`、`reference/分享成功.html`）还原：搜索 + 原型「搭子列表」单选、返回保留 `?coupon=`、`?state=success` 分享成功页（原型副文案 + 「分享的商品」卡）（D-016/D-019）；路由标题统一为「分享」，卡包入口按钮仍是原型的「转赠」。**B-015 / B-017 已由用户定案关闭**：不做对方接受、次数限制、时效限制和持久化，分享后原卡包状态不变；「洗发试用装 / 已发货 / 单次使用」仅为原型展示夹具，不实现物流规则。
- 卡包三态改为 URL 直达（`?state=available/used/expired`），`#63 已使用` 与标准页一致为计数 0 的空态，不造 `used` 夹具（D-014/D-015）。
- 「使用记录」入口 reference 标准页无、`prototype/04` §8 有，本轮不实现；**B-016 已由用户定案关闭**：卡包以 `reference/卡包.html` 为准，只保留可用 / 已使用 / 已过期三个 Tab，不加「全部」和「使用记录」。
- `/redeem` 已覆盖格式错误/无效/已使用/网络异常/提交中/成功入包，规则集中在夹具 `REDEEM_CODE_RULE`（D-017）。
- `/card/verify/confirm` 补 `?state=repeat` 重复核销态，确认后 Toast 回 `/card?state=used`（D-018）。
- T009 全部有状态页面挂载 `DebugPanel`（D-020）：右下角「调试」胶囊读 `routes.ts` 已登记的 `states`/`overlays`，点选即改写 `?state=`/`?overlay=`，供验收逐态复现，不属业务 UI。

## 目标

完成卡券资产的查看、状态筛选、核销、转赠、兑换码获取与成功入包闭环。

## 原型范围

- #54 卡包
- #62 卡包 - 可用
- #63 卡包 - 已使用
- #64 卡包 - 已过期
- #65 分享
- #66 分享成功
- #67 核销
- #68 兑换卡券
- #69 兑换成功

## 不在范围

- 商品兑换进入 T008。
- 真实二维码、扫码枪、短信和服务端核销不在本轮；使用明确模拟适配层。

## 依赖与阻塞决策

- 依赖 T002–T004、T008 入包结果。
- 必须确认兑换码长度、字符集、错误规则和是否区分活动来源。
- 决策前 UI 可展示 fixture，但不得硬编码 8/11/12 位为最终规则。

## 实施要求

- 卡券组件表达品牌、权益、有效期、状态和可用动作。
- Tab/筛选切换真实改变卡券集合。
- 核销页包含凭证、防误触确认、已核销反馈和重复核销状态。
- 转赠选择、确认、成功和取消路径完整。
- 兑换码表单覆盖格式错误、无效、已使用、网络错误和成功入包。

## 状态与交互矩阵

- 卡包空态 / 可用 / 已使用 / 已过期。
- 卡券详情或展开、核销确认/成功/重复。
- 转赠对象选择/取消/成功。
- 兑换码默认/输入/校验错误/提交中/无效/已使用/成功。

## 验收标准

- 9 个节点逐一可定位。
- 卡包三态、核销、转赠、兑换成功均可复现。
- 不把 placeholder 或静态 Tab 当作完成。
- 兑换码未决规则有显式配置和决策记录，不散落在组件中。

## 必交证据

- 卡券状态矩阵与 9 节点截图：矩阵见 [decisions/T009-wallet-redemption.md](../decisions/T009-wallet-redemption.md) §5；截图 28 张落 `docs/workbench/evidence/screenshots/t009-*.png`（375×812）——`t009-54-wallet-default` / `t009-62-wallet-available` / `t009-63-wallet-used` / `t009-64-wallet-expired` / `t009-62-overlay-use`（#54 #62 #63 #64）、`t009-65-share-select` / `t009-65-share-search` / `t009-65-share-picked`（#65）、`t009-66-share-success`（#66）、`t009-67-verify-scan` / `-password` / `-confirm` / `-done` / `-repeat` / `-toast`（#67）、`t009-68-redeem-default` / `-typing` / `-submitting` / `-error-format` / `-error-invalid` / `-error-used` / `-error-network`（#68）、`t009-69-redeem-success`（#69）。
- 采集脚本：`scripts/capture-t009.mjs`（Playwright，375×812，含点击交互、URL 断言与控制台采集）。用法 `BASE_URL=http://127.0.0.1:5173 node scripts/capture-t009.mjs`，退出码 0。
- 核销、分享、兑换码成功/失败操作记录（脚本内断言，输出见决策记录 §6）：#67 确认核销后跳 `/card?state=used`；#65 默认选中「小美」→ 搜索「室友」命中 1 位 → 改选「室友小婷」→ #66 成功页副文案与「分享的商品」四字段命中，「返回」回到 `/card/share?coupon=c1`；#68 空输入时提交按钮 `disabled=true`、输入自动转大写 `DRCARD000888`、四类失败文案逐条命中；#69 成功态可达。
- 调试面板门控记录：`/card`、`/redeem` 不带 `debug=1` 时 `[data-debug-panel]` count=0（正常页面不出现、不遮挡底部操作区）；`?debug=1` 下切换 `state`/`overlay` 时 `debug=1` 原样保留。对应截图 `t009-debug-panel-wallet` / `-wallet-expired` / `-wallet-overlay` / `-redeem` / `-redeem-invalid`（D-021）。
- 兑换码规则决策记录：[decisions/T009-wallet-redemption.md](../decisions/T009-wallet-redemption.md) §3.3 与 `REDEEM_CODE_RULE`（`pending: true`，规则集中在夹具，不散落组件）。
- 类型检查、构建和控制台结果：`npm run typecheck`（`tsc --noEmit`）退出码 0；`npm run build` 通过（CSS 48.37 kB / gzip 9.96 kB，JS 361.85 kB / gzip 108.19 kB）；采集过程中控制台**无 error；存在既有 Router warning**（40 条 React Router v7 future flag，项目全局既有、非本轮引入，脚本用 `isKnownNoise` 单列计数）。

## 产出

- 卡券业务组件、页面、规则配置、状态夹具和验收证据。
