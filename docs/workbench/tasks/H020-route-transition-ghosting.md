# H020｜路由过渡残影与快照边界修复

## 状态与类型

- **Status:** Accepted
- **Phase:** UX / Regression Fix
- **Depends on:** H016、H017、H018

## 当前事实与差距

H016 已验收的 UX 契约是：一级 Tab 只做约 130ms 的轻微淡入；一级→二级/详情与可靠返回使用约 150ms 的克制方向感。

H016 原实现把共享一级 Tab 也接入 React Router native View Transition，并为 `h5-route-content` 同时保留 old/new snapshot。用户在真实页面切换中先发现上下漂移，后又发现明显残影。已确认的实现问题包括：

- 浏览器默认 `::view-transition-group()` 会做 geometry interpolation；PR #24 已关闭这一层默认几何动画。
- 一级 Tab 的 native VT 仍会生成 old/new snapshot，而原有 Tab 动画把旧快照从 `opacity: 1` 仅退到 `0.96`、新快照从 `0.94` 进入，导致切换期间形成明显双重曝光。
- 浏览器默认 root snapshot 仍可能捕获壳层，造成 StatusBar / TitleBar / BottomNav 不必要的额外交叉淡化。

这不是页面业务 DOM 未卸载，也不是 `/points` 自身弹层问题，而是 H016 的 snapshot ownership 过宽。

## 目标

在不改变 H016 UX 契约的前提下，把路由动效的实现边界收紧：

- 一级 Tab 只走普通 Router + 130ms CSS fade，不创建 native View Transition snapshot。
- native View Transition 仅保留给需要方向语义的 forward/back 链路。
- 关闭默认 root snapshot，只允许显式命名的 `h5-route-content` 参与 native VT。
- native forward/back 不再依赖默认 old/new blending；可见运动由项目自己的横向 keyframes 定义。
- 清理 H016 中仅服务于 native Tab snapshot 的死代码。

## 原型范围

正式 H5 路由过渡边界，重点覆盖：

- `/` ↔ `/points` ↔ `/card/verify` ↔ `/profile` 一级 Tab 切换。
- 一级页 → 二级/详情页。
- browser POP / Forward 返回链路。

## 不在范围

- 不修改 legacy / Native reference 路由。
- 不修改 deferred `/mall` 的既有边界。
- 不调整 TitleBar、BottomNav、页面布局或品牌 UI。
- 不重写 H016 的滚动恢复规则。
- 不引入新的动画框架。

## 依赖与阻塞决策

无外部阻塞。该任务只修已确认的前端实现回归。

## 实施要求

1. `BottomNav` 的正式一级 Tab 使用普通 `navigate()`；重复点击当前 Tab 仍不导航。
2. 保留 `H5RouteOutlet` 的 `navigationKind='tab'` 与现有 130ms CSS fallback，使一级 Tab 仍符合 H016 动效契约。
3. 删除 `h5-vt-tab-old/new` 及对应 native Tab selectors，不保留不可达实现。
4. `:root` 设为 `view-transition-name: none`，避免默认 root snapshot 捕获整套壳层。
5. `h5-route-content` native VT group 禁用 geometry interpolation；old/new 使用 `mix-blend-mode: normal`，forward/back 仅保留横向 keyframes。
6. reduced-motion、不支持 View Transition 的环境继续按 H016 降级。

## 状态与交互矩阵

| 场景 | 实现 | 期望 |
|---|---|---|
| 一级 Tab → 一级 Tab | 普通 Router + CSS | 130ms 轻淡入；无 old/new snapshot；无残影 |
| 一级 → 二级/详情 | native VT（支持时） | 150ms 横向轻位移；无 root cross-fade；无 Y/尺寸 morph |
| browser POP / Forward | Router native VT lifecycle（支持时） | 150ms 返回方向；不叠加 CSS fallback |
| 不支持 VT | CSS fallback | 路由正常；130–150ms 既有 CSS 动画 |
| reduced-motion | 无动画 | 路由与滚动正常 |

## 验收标准

- 一级 Tab 连续切换时不再出现页面残影、双曝光、上下漂移。
- 一级 Tab 仍保持约 130ms 的轻微淡入，不改 H016 产品体验。
- forward/back 保持约 150ms 的克制横向位移。
- native VT 不再捕获默认 root snapshot。
- `h5-vt-tab-*` 不再存在；无与 native Tab snapshot 相关的不可达 CSS。
- typecheck、build、相关 Playwright 正式 H5 回归通过。
- 用户视觉验收后才能标记 Accepted。

## 必交证据

- 代码 diff 与 PR。
- `npm run typecheck` / build CI 结果。
- Playwright 正式 H5 Tab 回归结果。
- Cloudflare branch preview。
- 用户对实际 Tab 切换的视觉验收。

## 验收证据

- PR：#27 `fix/h020-route-transition-ghosting → dev`。
- Cloudflare branch preview：`https://fix-h020-route-transition-gh.dr-card-ui.pages.dev`，用户已实际切换一级 Tab 验收。
- 预览实现 Build #395 曾完整通过 Static hygiene、Typecheck、Unit/Component、Formal H5 browser regression 与各环境构建；后续新增的一条 native-VT 观察型测试因生命周期采样假设不成立被撤销，不作为产品行为契约。
- 用户验收：2026-09-17 明确确认“合并吧，可以了。”，H020 标记 `Accepted`。
- 最终 rebased CI 与合并 SHA 以 PR #27 / `dev` 历史为准。

## 产出

- `src/components/mobile/BottomNav.tsx`
- `src/styles/globals.css`
- `tests/e2e/formal-h5.spec.ts`
- H016 post-acceptance correction 记录
