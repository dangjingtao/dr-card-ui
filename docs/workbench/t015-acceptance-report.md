# T015｜全链路视觉、交互与回归验收报告

> 验收日期：2026-08-24
> 运行环境：Node.js 22.23.2、Chromium、Vite production preview
> 基准视口：375 × 812；窄屏抽查：320 × 480
> 当前结论：`Accepted`（owner 于 2026-08-24 确认通过）

## 1. 总结

| 检查项 | 结果 |
| --- | --- |
| 60 个实施节点 | **60/60 PASS** |
| 9 条业务主链路 | **9/9 PASS** |
| 12 个范围关闭节点 | **12/12 未偷渡** |
| placeholder / 404 | **0** |
| 坏图 | **0** |
| 阻塞性控制台错误 | **0** |
| 横向溢出 | **0** |
| 重复状态栏 / 标题栏 / Tabbar | **0** |
| TypeScript / production build | **PASS** |

机器可读逐节点结果见 [`evidence/t015-results.json`](./evidence/t015-results.json)。该文件逐条记录节点号、直达 URL、标志文案、占位/404、坏图、壳层数量、横向溢出及控制台错误。

## 2. 60 节点覆盖矩阵

| 卡片 | 节点 | 结果 | 主要证据 |
| --- | --- | --- | --- |
| T005 | #2 #12 #13 #14 #15 #16 #23 #24 #25 | 9/9 PASS | `t005-*.png`、`capture-t005.mjs` |
| T006 | #4 #5 #6 #7 #8 #21 #22 #26 #41 | 9/9 PASS | `t006-*.png`、`capture-t006.mjs` |
| T007 | #27 #28 #29 #30 #32 #33 #34 #35 #36 | 9/9 PASS | `t007-*.png`、`capture-t007.mjs` |
| T008 | #17 #18 #37 #38 #39 #40 #48 #49 | 8/8 PASS | `t008-*.png`、`capture-t008.mjs` |
| T009 | #54 #62 #63 #64 #65 #66 #67 #68 #69 | 9/9 PASS | `t009-*.png`、`capture-t009.mjs` |
| T010 | #55 #56 #60 #72 | 4/4 PASS | `t010-*.png`、`capture-t010.mjs` |
| T011 | #19 #20 #59 #61 | 4/4 PASS | `t011-*.png`、`capture-t011.mjs` |
| T012 | #11 #42 #43 #44 | 4/4 PASS | `t012-*.png`、`capture-t012.mjs` |
| T013 | #57 #58 #70 #71 | 4/4 PASS | `t013-*.png`、`capture-t013.mjs` |

覆盖合计：`9 + 9 + 9 + 8 + 9 + 4 + 4 + 4 + 4 = 60`。关闭节点 `#1 #3 #9 #10 #31 #45 #46 #47 #50 #51 #52 #53` 在 `routes.ts` 中注册数为 0。

## 3. 九条主链路

| # | 链路 | 结果 | 关键验证 |
| ---: | --- | --- | --- |
| 1 | 新人领取 | PASS | 专栏 → 新人弹窗 → APP 引导/完善信息 → 提交成功 → 已领取态 |
| 2 | 会员打卡 / 澡运 | PASS | 会员中心 → 泡泡明细/会员等级 → 打卡月历/补签 → 澡运结果 → 返回会员 |
| 3 | 搭子邀请 | PASS | 空态 → 邀请 → 保存/复制 → 手机搜索/重复邀请 → APP 边界 → 接受绑定 |
| 4 | 商品兑换入包 | PASS | 排序/搜索 → 商品弹层 → 提交中 → 兑换成功 → 卡包 |
| 5 | 卡券核销 / 转赠 / 兑换码 | PASS | 卡包三态 → 转赠成功 → 扫码/密码/确认/重复核销 → 兑换码五态 |
| 6 | 地址订单 | PASS | 地址空态/默认置顶 → 新增/编辑/校验 → 订单四筛选 → 多商品详情/兜底 |
| 7 | 个人设置 | PASS | 我的入口 → APP 引导夹具 → 四类编辑 → 保存 → 脏数据继续编辑/放弃修改 |
| 8 | 消息 | PASS | 全部/未读/分类 → 详情自动已读 → 未读数变化 → 一键已读 → 空态 |
| 9 | 客服转人工 | PASS | 欢迎/对话/失败重试 → 企业微信引导 → 人工排队/接入 → 窄屏输入区 |

## 4. 视觉与壳层抽查

人工抽查以下 9 张 375 × 812 关键页面：

- `t001-seed-home.png`
- `t001-seed-points.png`
- `t006-21-checkin-calendar.png`
- `t007-29-buddy-invite.png`
- `t008-18-exchange-default.png`
- `t009-54-wallet-default.png`
- `t010-56-orders-all.png`
- `t011-19-profile.png`
- `t013-58-conversation-live.png`

抽查结论：移动端层级、主要操作、卡片间距、滚动区和底部操作区完整；未发现内容被 Header/Tabbar 遮挡、重复壳层或明显横向裁切。T013 另以 `t013-58-small-screen.png` 验证 320 × 480，发送按钮底边为 468px，仍在 480px 视口内。

## 5. 工程与回归命令

以下命令均通过：

```bash
npm run typecheck
npm run build
BASE_URL=http://127.0.0.1:4173 node scripts/verify-t001.mjs
BASE_URL=http://127.0.0.1:4173 node scripts/verify-t004.mjs
BASE_URL=http://127.0.0.1:4173 node scripts/verify-reference-pages.mjs
BASE_URL=http://127.0.0.1:4173 node scripts/verify-std-pages.mjs
BASE_URL=http://127.0.0.1:4173 npm run verify:t015
```

T005–T013 的 `capture-*.mjs` 同样全部复跑通过。旧脚本中仍指向占位页、旧 Tab、旧文案或过度严格 locator 的断言已同步到当前事实源；没有为了让测试变绿而修改业务页面。

## 6. 问题单

本轮未发现需要退回 T005–T013 的阻塞问题。

非阻塞项：React Router 6.28.1 会输出两类 v7 future flag 升级警告；所有脚本已确认无 `console error` / `pageerror`，该提示不影响本轮 UI 验收，可在后续依赖升级时统一处理。

## 7. 验收边界

本报告只证明当前确定性 UI、路由、状态夹具与交互闭环达到 T015 验收要求，不代表真实接口、应用商店、系统分享、支付、地图或客服后端已经接入。owner 于 2026-08-24 明确确认通过，T015 最终状态为 `Accepted`。
