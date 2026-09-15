# H003｜切断正式 H5 对 legacy runtime 的依赖

**Status:** Ready  
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

## 验收

- 正式 H5 源码不再 import `pages/legacy` 运行时状态。
- `/`、`/settings` 等正式 H5 路由仍能在开发环境正常运行。
- 未确认认证协议被明确标为待接入，而非用 legacy mock 冒充生产方案。

## 证据

记录依赖搜索结果、关键迁移文件、typecheck/build 与 commit SHA。
