# H003｜切断正式 H5 对 legacy runtime 的依赖

**Status:** Agent Review  
**Phase:** Hygiene  
**Depends on:** H002

## 目标

消除正式 H5 运行时代码对 `pages/legacy` 的反向依赖，落实“legacy 默认只看、不动、不验”的边界。

## 已知问题

- `MobileLayout` 直接读取 `pages/legacy/userInfoStore`，并把未登录根路由重定向到 `/legacy-profile/login`。
- 正式 `Settings` 也直接读写 legacy mock user store。

## 范围

- 将正式 H5 所需的用户/会话最小状态迁出 legacy 目录。
- 去除正式 H5 壳层、设置等模块对 `pages/legacy/*` 的 import。
- 对当前无法确定的真实登录协议保留清晰边界，不自行发明认证方案。
- 必要时为 legacy 保留最小兼容适配，但不反向让正式 H5 继续依赖 legacy。

## 不做

- 不重写 legacy 登录、个人中心、充值等页面。
- 不建立虚构的真实登录 API。

## 实现结果

- `MobileLayout` 已移除 `pages/legacy/userInfoStore` 依赖以及基于其 mock 登录状态的 `/ → /legacy-profile/login` 自动跳转。
- 新增 `src/app/state/memberProfile.ts`，仅承载正式 H5 当前确实需要的生日 UI 状态，不复制完整 legacy `UserInfo`。
- `Settings` 已改用 formal H5 member profile state，保持生日编辑限制与现有 UI 行为。
- `npm run lint` 新增 `no-formal-h5-legacy-import`，普通 formal H5 模块重新依赖 `src/pages/legacy/*` 会被 CI 拦截。
- `src/app/router/index.tsx` 作为 Native reference 路由 composition root 保留唯一显式例外。
- 新增 `docs/engineering/auth-boundary.md`，记录真实 App/H5 认证与会话协议尚未确认，禁止用 legacy mock 冒充生产方案。

## 验收

- 正式 H5 源码不再 import `pages/legacy` 运行时状态。
- `/`、`/settings` 等正式 H5 路由仍能在开发环境正常运行。
- 未确认认证协议被明确标为待接入，而非用 legacy mock 冒充生产方案。

## 证据

详见 [`../evidence/h003-remove-legacy-runtime-dependency.md`](../evidence/h003-remove-legacy-runtime-dependency.md)。

PR #9 首轮 Build run `35040382153` 全绿；静态门禁检查 115 个 formal source files，0 unused、0 architecture violation。

当前状态为 `Agent Review`；只有用户可以把任务标记为 `Accepted`。
