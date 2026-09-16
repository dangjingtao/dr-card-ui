# H016｜路由过渡、返回与滚动体验

**Status:** User Review  
**Phase:** UX  
**Depends on:** H002

## 目标

为正式 H5 建立轻量、可降级的导航体验，不引入重动画框架。

## 范围

- 使用浏览器 View Transition 能力与 CSS；实施前按当前 React Router 版本确认实际 API。
- 一级 Tab 不做横向推页，最多轻微淡入。
- 一级→二级/详情提供克制前进感；返回方向在可可靠判断时对应处理。
- 尊重 `prefers-reduced-motion`，不支持时无动画正常工作。
- 处理返回、scroll restoration 与 WebView 中明显冲突。

## 不做

- 不给 legacy/Native reference 加动画。
- 不引入 Framer Motion / React Transition Group 只为路由动画。
- 不处理商城。

## 验收

- 正式 H5 典型前进/返回/Tab 链路无导航错乱、滚动异常或明显闪烁。
- reduced-motion 与不支持 View Transition 的浏览器正常降级。
- 动画保持短促克制，目标约 120–180ms。

## 实现

- `H5ScrollRestoration` 以内部 `[data-page-scroll]` 为唯一滚动容器，按 `location.key` 保存历史位置。
- 只有 **pathname 变化的 PUSH** 会主动置顶；同页 `REPLACE`、search/hash 变化保持当前位置；POP 优先恢复目标 history entry 已记录的位置。
- `MobileLayout` 的 active formal-H5 内容形成统一 route-motion boundary：一级 Tab 仅淡入，前进/返回使用约 8px 的轻位移，不给 legacy、Native reference 或 deferred 商城应用动画。
- 共享一级 Tab、标题栏前进/显式返回在浏览器支持且未开启 reduced-motion 时使用 React Router `navigate(..., { viewTransition: true })`；其余正式 H5 pathname 切换由同一壳层 CSS fallback 覆盖。
- `prefers-reduced-motion: reduce` 时不启用原生 View Transition，并关闭 H016 CSS route animation。
- `/service/chat#wecom` 改为 Router `replace` 的页内 hash 状态；打开/关闭均保留当前 router state，不再新增 history entry，也不再直接调用裸 `window.history.replaceState`。

## 支持矩阵

| 环境 | View Transition | H016 行为 |
|---|---|---|
| 支持 `document.startViewTransition` 的浏览器 / WebView，且未启用 reduced-motion | 启用共享 Tab / 壳层导航的 React Router View Transition | 130ms Tab 淡入；150ms 前进/返回；滚动按 H016 规则处理 |
| 不支持 View Transition 的浏览器 / WebView | 不启用原生能力 | pathname 切换走 130–150ms CSS fallback；路由与滚动功能不依赖该 API |
| `prefers-reduced-motion: reduce` | 主动禁用 | 无 H016 页面动画；路由与滚动保持正常 |
| legacy / Native reference / deferred 商城 | 不启用 | 保持原行为，不纳入 H016 动画施工 |
| 真实 App WebView 返回键 / 宿主返回 | 不假定 Native 能力 | 需在 `test` 阶段使用真实 WebView / 宿主返回继续验收 |

## 代表性链路验证

实现与代码路径已覆盖以下 H016 回归点；本卡保持 `User Review`，浏览器实际交互与真实 WebView 返回由后续验收确认，不把静态检查冒充人工/设备验收：

1. 正式 H5 一级 Tab → 一级 Tab：不横向推页，只做轻微淡入；重复点击当前 Tab 不产生新导航。
2. 一级页 → 二级/详情：pathname PUSH 进入时滚动置顶，并提供克制前进感。
3. 二级/详情 → 返回：浏览器 POP 恢复对应 `location.key` 的已记录滚动位置；显式 `backTo` 使用返回方向。
4. 通知页、Card、Exchange 等同页 overlay/search `REPLACE`：保持当前滚动，不再跳顶。
5. `/service/chat` 滚动后打开/关闭 `#wecom`：同页 Router replace，不新增历史项、不触发 pathname 级动画、不主动滚到顶部。
6. reduced-motion：关闭 H016 动画，路由与 scroll restoration 逻辑仍工作。
7. legacy / Native reference / deferred 商城：不进入 H016 route-motion boundary。

## 证据

- PR：#22 `h016-route-scroll → dev`
- H016 主体实现 SHA：`9677bd124e696e5e3c96f09ac46fb08acfdfd9e1`
- 关键文件：
  - `src/components/mobile/H5ScrollRestoration.tsx`
  - `src/app/router/h5Transition.ts`
  - `src/layouts/MobileLayout.tsx`
  - `src/components/mobile/BottomNav.tsx`
  - `src/pages/ServiceChat.tsx`
  - `src/styles/globals.css`
- PR CI 负责 `typecheck`、静态卫生、各环境构建与 smoke；真实 App WebView / 宿主返回不在 dev 阶段伪造通过，保留到 `test` 验收。
