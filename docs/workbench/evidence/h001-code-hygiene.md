# H001｜代码质量与卫生基线证据

## 结论

H001 已完成实现与自动化自检，等待用户验收。

本卡只建立正式 H5 的静态卫生底线并清理 3 个明确无效 import；未修改页面 JSX、业务状态、视觉、legacy / Native reference 或商城实现。

## 实现

- 新增 `npm run lint` → `node scripts/check-h5-hygiene.mjs`。
- 复用现有 TypeScript Compiler API，不新增 ESLint 或其他依赖。
- CI Build job 在 `typecheck` 前执行静态卫生门禁。
- 未使用代码基线文件：`scripts/h5-hygiene-baseline.json`，当前保持空基线（0 个历史例外）。
- 静态边界禁止正式 H5 新增：
  - `src/storage/` 外直接 Web Storage 访问；
  - `src/services/` / `src/mocks/` 外直接 `fetch` / `XMLHttpRequest` / `axios`；
  - `src/bridge/` 外直接常见 Native Bridge 全局调用。
- H001 临时排除 legacy / Native reference 与商城；正式 ownership 留给 H002 建模。

## 明确清理

首次门禁运行只发现 3 个正式 H5 未使用项，全部直接清理，没有写入 baseline：

1. `src/pages/Card.tsx`：移除未使用 `ChevronRight` icon import。
2. `src/pages/Home.tsx`：移除未使用 `PickerIdentity` type import。
3. `src/pages/Settings.tsx`：移除未使用 `useEffect` hook import。

## 自动化结果

PR：#5 `chore: establish H001 H5 hygiene baseline`

GitHub Actions：Build run `35005628414`，结果 `success`。

关键结果：

```text
H5 hygiene PASS: 113 formal source files checked;
0 unused diagnostic(s) within baseline;
0 architecture violation(s).
```

同一 run 中以下检查全部通过：

- Static hygiene
- Typecheck
- Smoke test development server
- Build development bundle
- Build production bundle
- Cloudflare SPA fallback asset
- Smoke test production preview

`test-gate` 按既有规则仅针对 `test` 分支，因此本 `dev` PR 正常跳过，不作为 H001 缺项。

## 提交

- `891e2d4605f17692fcc90abb6af8624b7d110ca0` — 建立静态卫生门禁。
- `30712a8a276320e4d1c46e1c58dde8219dcbb9dc` — 清理 Home 无效 type import。
- `867c9a8bfc2e41ffc803ddcd7e9eef1138c571e1` — 清理 Card 无效 icon import。
- `31552b3353ca66bbe2280be5ee09df36d050745e` — 清理 Settings 无效 hook import。

## 非本卡范围

- 页面级 fixture / fake network 迁移：H004 / H013 / H014。
- 正式 H5 / Native reference 路由 ownership：H002。
- `Settings.tsx` 仍依赖 legacy runtime store：H003。
- 真实 API、认证与 Native JSBridge 协议：后续对应任务处理，不在 H001 中臆造。
