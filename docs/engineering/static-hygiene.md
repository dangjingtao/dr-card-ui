# H5 静态卫生门禁

H001 为正式 H5 增加一条**零新增依赖**的静态卫生门禁：`npm run lint`。

它直接复用仓库已经安装的 TypeScript Compiler API，不引入 ESLint 及额外 lockfile 噪声。这里的目标不是替代未来可能需要的完整 ESLint 规则集，而是先建立一条稳定、可执行、能阻止结构债继续扩散的底线。

## 检查范围

门禁检查 `src/` 下正式 H5 的施工面，并暂时排除：

- `src/pages/legacy/**`；
- 已确认属于 Native reference 的历史首页、服务中心、设备、售货机等页面；
- 当前不在本轮施工范围内的商城页。

这是 H001 的临时范围声明。H002 会把路由 ownership 正式建模后，后续门禁应改为消费统一的归属事实，而不是长期维护文件名名单。

## 当前硬规则

正式 H5 新代码不得：

1. 在 `src/storage/` 之外直接访问 `localStorage` / `sessionStorage`；
2. 在 `src/services/` / `src/mocks/` 之外直接调用 `fetch`、`XMLHttpRequest` 或 `axios`；
3. 在 `src/bridge/` 之外直接调用常见 Native 宿主全局对象。

这些规则只限制依赖边界，不推定后台 API、认证方式或 Native Bridge 协议已经存在。

## 未使用代码基线

门禁同时开启 TypeScript 的 `noUnusedLocals` / `noUnusedParameters` 诊断，但不要求为了 H001 去重写整个原型期代码库。

历史遗留诊断如确有必要保留，必须显式记录在：

```text
scripts/h5-hygiene-baseline.json
```

基线记录的是每个文件允许存在的**最大历史诊断数**：

- 新文件默认允许 0 个；
- 某文件新增未使用代码导致数量上升时，CI 失败；
- 清理后数量下降会提示收紧基线；
- 不允许为了让 CI 变绿而无理由扩大基线。

这样可以冻结历史债，同时允许后续逐步减少，而不需要在 H001 一次性美化全仓。

## 明确不在 H001 自动拦截的内容

原型期页面中仍存在用固定 `setTimeout` 表达提交中、搜索中、发送中等演示状态的实现。`setTimeout` 同时也承担 Toast、动画和延时跳转等正常 UI 职责，H001 不用粗暴规则一刀切。

页面级假网络与 fixture/API Mock 的迁移由 H004、H013、H014 处理；新增正式业务代码仍必须遵守 `docs/engineering/coding-standards.md` 的 Service / Mock 分层要求。

## 执行

```bash
npm run lint
npm run typecheck
npm run build
```

CI 的 Build job 会在 TypeScript typecheck 之前先执行 `npm run lint`。静态卫生通过只代表代码边界门禁通过，不等于业务验收或 App WebView 验收。
