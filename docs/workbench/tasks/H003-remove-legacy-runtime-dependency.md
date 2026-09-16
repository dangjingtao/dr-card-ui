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

- 将正式 H5 所需的最小客户端状态与 legacy reference 状态解耦。
- 去除正式 H5 壳层、设置等模块对 `pages/legacy/*` 的 import。
- 对当前无法确定的真实登录协议保留清晰边界，不自行发明认证方案。
- 必要时为 legacy 保留最小兼容适配，但不反向让正式 H5 继续依赖 legacy。

## 不做

- 不重写 legacy 登录、个人中心、充值等页面。
- 不建立虚构的真实登录 API。
- 不把历史 fixture 用户资料换目录后继续当作生产数据。

## 实现结果

- `MobileLayout` 已移除 `pages/legacy/userInfoStore` 依赖以及基于其 mock 登录状态的 `/ → /legacy-profile/login` 自动跳转。
- 新增 `src/app/state/memberProfile.ts`，只保存当前 SPA 会话里用户自己产生的临时生日 UI 状态；初始值为空，不携带 fixture 用户生日，也不作为认证或持久化资料源。
- `Settings` 已改用 formal H5 member profile state；真实资料读取/保存继续等待 API contract。
- Codex Review 指出首版曾把历史生日 `2003-08-15` 带进 formal H5 production state；该 P1 已接受并修正，正式 H5 不再 seed 任何 fixture profile 值。
- `npm run lint` 新增 `no-formal-h5-legacy-import`，普通 formal H5 模块重新依赖 `src/pages/legacy/*` 会被 CI 拦截。
- `src/app/router/index.tsx` 作为 Native reference 路由 composition root 保留唯一显式例外。
- 新增 `docs/engineering/auth-boundary.md`，记录真实 App/H5 认证与会话协议尚未确认，禁止用 legacy mock 冒充生产方案。

## 验收

- 正式 H5 源码不再 import `pages/legacy` 运行时状态。
- `/`、`/settings` 等正式 H5 路由仍能在开发环境正常运行。
- 未确认认证协议被明确标为待接入，而非用 legacy mock 冒充生产方案。
- formal H5 production state 不预置 Native-reference fixture 用户资料。

## 证据

详见 [`../evidence/h003-remove-legacy-runtime-dependency.md`](../evidence/h003-remove-legacy-runtime-dependency.md)。

PR #9 首轮 Build run `35040382153` 全绿；Codex P1 修正后的最终 head `d7ca3b3fca` Build run `35041121691` 全绿，Codex re-review 结论为 `Didn't find any major issues.`；PR #9 已合入 `dev`，merge commit `b7d6a87170dceb8b021354d29684bb0ace487a39`。

当前状态为 `Agent Review`；只有用户可以把任务标记为 `Accepted`。
