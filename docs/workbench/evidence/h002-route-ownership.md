# H002｜正式 H5 / Native reference 路由边界证据

## 实施结果

H002 将“正式 H5 / Native reference / 当前 deferred”的边界从文档约定升级为机器可读路由 scope。

核心实现：`src/app/router/routeScope.ts`。

### 归属规则

- `formal-h5`：正式 H5 产品路由。
- `native-reference`：Native 同事参考页面，保留可访问性，但不属于正式 H5 施工/验收面。
- `active`：当前 H5 工程施工面。
- `deferred`：保留产品路由，但当前工程轮次不施工。

Native reference 采用 canonical route 精确清单，不依赖 `/legacy` 字符串匹配；因此 `/device/*`、`/vending/*` 也被正确归入 Native reference。

当前登记 43 条 Native reference canonical route。

商城当前按用户要求暂缓施工，三条路由 `/mall`、`/mall/goods/:id`、`/mall/cart` 保持 `formal-h5` ownership，但 `engineeringScope=deferred`，不改变现有产品导航。

## 实际消费点

- `BottomNav.tsx`：主导航从 `FORMAL_H5_TAB_ROUTES` 生成；历史 reference 导航独立保留。
- `MobileLayout.tsx`：主 Tab 显示使用 `isFormalH5TabPath()`。
- `DebugPanel.tsx`：只对 `active formal-h5` 路由开放。
- 后续 route-wide CI / E2E / 工程治理统一可消费 `ACTIVE_FORMAL_H5_ROUTES`。

## 未扩大施工范围

本卡没有：

- 删除或重构 Native reference 页面；
- 修改商城内部实现；
- 改变现有 Tab 信息架构；
- 处理 H003 的 formal-H5 → legacy runtime 依赖；
- 重写历史 `verify-t015.mjs`。

## 自动化证据

PR：#6 `refactor: establish H002 route ownership boundary`

GitHub Actions Build run：`35033599628`

结果：

- Static hygiene: PASS
- Typecheck: PASS
- Development server smoke: PASS
- Development build: PASS
- Production build: PASS
- Cloudflare SPA fallback asset: PASS
- Production preview smoke: PASS

scope registry 会在运行时代码初始化时校验显式归类的 canonical path 是否真实存在于 `ROUTES`；本次 smoke/build 均通过，未发现未知归类路径或归属重叠。

## 当前结论

H002 已满足 Agent Review 条件。代码已能可靠判断 formal H5 / Native reference，并将“商城当前暂缓”作为独立 engineering scope 表达，而不是混进产品 ownership。

是否标记为 `Accepted` 仍由用户确认。
