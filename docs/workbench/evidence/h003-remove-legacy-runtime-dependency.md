# H003｜切断正式 H5 对 legacy runtime 的依赖证据

## 结论

H003 已将普通正式 H5 运行时代码对 `src/pages/legacy/*` 的直接依赖切断，并用静态门禁防止该依赖重新进入施工面。

## 发现的问题

实施前确认两条正式 H5 反向依赖：

1. `src/layouts/MobileLayout.tsx` 直接读取 `pages/legacy/userInfoStore`，用 `account + isRegistered` 推断登录态，并在访问 `/` 时重定向到 `/legacy-profile/login`。
2. `src/pages/Settings.tsx` 直接读写同一个 legacy mock store 的生日字段。

该 legacy store 明确属于卡博士个人中心 mock / Native reference 演示状态，不能作为真实 App WebView 的生产认证或正式 H5 用户资料事实源。

## 实施结果

### 正式 H5 壳层

- `MobileLayout` 不再 import `pages/legacy/userInfoStore`。
- 移除基于 legacy mock `account/isRegistered` 的根路由登录判断。
- `/` 不再自动跳往 `/legacy-profile/login`。
- 真实认证、宿主会话、token/cookie、过期处理责任均保留为待确认协议，详见 `docs/engineering/auth-boundary.md`。

### 正式设置页

- 新增 `src/app/state/memberProfile.ts`，只承载当前正式 H5 确实需要的生日 UI 状态：`birthday` 与 `birthdayLastModifiedAt`。
- 没有把完整 legacy `UserInfo` 搬进正式 H5，以免把历史 mock 换目录后误当成生产模型。
- `Settings` 使用 `useMemberProfile()` / `memberProfileActions`，生日三个月编辑限制与原有确定性演示行为保持。
- 该状态明确不是认证事实源，真实持久化等待 API contract；H010 可在 Zustand 基建时再统一迁移。

### 防回归门禁

`npm run lint` 新增规则 `no-formal-h5-legacy-import`：

- 普通 formal H5 模块 import / re-export / dynamic import 到 `src/pages/legacy/*` 会直接失败；
- `src/app/router/index.tsx` 是唯一显式例外，因为 router composition root 必须继续注册 Native reference 页面，让其保持可查看；
- Native reference 页面本身仍不纳入 formal H5 hygiene 施工面。

## 自动化证据

PR：#9 `refactor: remove H003 legacy runtime dependency`

首轮 Draft PR GitHub Actions Build run：`35040382153`

结果：

- Static hygiene: PASS
- Typecheck: PASS
- Development server smoke: PASS
- Development build: PASS
- Production build: PASS
- Cloudflare SPA fallback asset: PASS
- Production preview smoke: PASS

静态门禁日志：

```text
H5 hygiene PASS: 115 formal source files checked; 0 unused diagnostic(s) within baseline; 0 architecture violation(s).
```

这意味着新增 `no-formal-h5-legacy-import` 后，没有发现其他普通 formal H5 源文件仍直接依赖 `src/pages/legacy/*`。

Cloudflare Pages 也为 `h003-remove-legacy-runtime` 分支生成过成功预览；由于最终证据以源码、CI 与 PR commit 为准，不把外部预览域名可达性作为 H003 新门禁。

## 明确未做

- 未修改 legacy 登录、个人中心、充值等 reference 页面实现；
- 未删除 Native reference route；
- 未发明 backend 登录 API、Cookie/token 方案或 Native JSBridge 会话协议；
- 未提前引入 Zustand；
- 未处理商城；
- 未处理现有 bundle size / Node runner deprecation 等与 H003 无关问题。

## 当前结论

H003 满足进入 Agent Review 的工程条件。最终 `Accepted` 仍由用户确认。
