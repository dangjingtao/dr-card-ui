# H011｜Storage Adapter

**Status:** Accepted  
**Phase:** Foundation  
**Depends on:** H006

## 目标

建立统一的 H5 持久化边界，避免页面和 store 随意直接操作 Web Storage。

## 范围

- 建立 storage adapter 与集中 key 定义。
- 明确 localStorage / sessionStorage 的使用边界。
- 提供 SSR/不可用/解析失败等基础保护。
- 明确敏感凭据、消费密码、长期 secret 不允许进入普通 H5 storage。

## 不做

- 不引入 IndexedDB/localForage，除非出现真实大数据/Blob/offline 需求。
- 不决定尚未确认的认证 token 存储方案。

## 验收

- 正式 H5 新代码通过 adapter 访问 Web Storage。
- adapter 对缺失、损坏值有确定行为。
- 敏感数据规则写入代码规范或模块注释并可被后续 review 检查。

## 实施结果

- 新增 `src/storage/`，与现有 H5 hygiene 的 Storage 架构边界保持一致。
- `src/storage/index.ts` 对业务只暴露 `STORAGE_KEYS` 与 `storage`；key/adapter 构造能力保留在内部模块。
- `StorageKey` 固定 key 名、`local`/`session` area 与 Zod runtime schema；统一使用 `dr-card:` 前缀。
- `storage.read/write/remove` 对 SSR、Storage 不可用、getter/getItem/setItem/removeItem 抛错、损坏 JSON、schema 不匹配和序列化失败均有确定的降级行为。
- 损坏或不符合 schema 的已有值读取为 `null`，并尽力清除坏值；写入失败返回 `false`，不把浏览器 Storage 异常冒到业务层。
- 当前 `STORAGE_KEYS` 保持为空：正式 H5 尚无已确认的真实持久化业务，不为完成基建虚构业务 key，也不在 H011 决定认证 token 存储。
- `docs/engineering/storage.md` 已记录 local/session 生命周期边界，以及登录密码、消费/支付口令、长期 secret、私钥、第三方密钥和未经确认的 auth token 不得进入普通 H5 Web Storage 的规则。
- 现有 `scripts/check-h5-hygiene.mjs` 继续以 TypeScript AST 禁止 `src/storage/` 外直接访问 `localStorage` / `sessionStorage`；H011 不重复或放宽该规则。

## 证据

- `npm run verify:h011` 覆盖 local/session 隔离、正常读写删除、缺失值、损坏 JSON、schema 无效值、不可序列化值、SSR、Storage resolver/get/set/remove 异常，以及集中 key 定义约束。
- H011 verifier 使用 AST 检查 `defineStorageKey` 不得在 `src/storage/keys.ts` 外调用，避免文本扫描误伤注释/字符串。
- 人工 review 已检查完整 PR diff、公开 API、异常路径、敏感数据边界、与现有 hygiene 的职责重叠以及任务范围；施工中发现并修复了错误的 `src/app/storage` 放置、无效 `@` alias 文档示例、`remove` 泛型、公用 API 过宽和 verifier 注释误报问题。当前无剩余 blocking finding。
- PR #18 Build run `35077368293` 在验收前 final head `0e8da321c51f6ad791ed5dedb6df0bee3b353cb5` 上完整通过静态 hygiene、typecheck、H007/H009/H010 回归、H011 验证、dev/Cloudflare preview/test/prod 构建与 identity 检查、production-like Mock 拒绝、SPA fallback 和 production preview smoke。
- Cloudflare Pages 已成功部署验收前 final head `0e8da321c51f6ad791ed5dedb6df0bee3b353cb5` 的 feature preview。
- PR #18 已记录人工 self-review。
- 2026-09-16：用户明确回复“接受”，H011 正式验收为 `Accepted`；后续按 squash merge 合入 `dev`。
