# H012｜React Hook Form + Zod 表单基线

**Status:** Accepted  
**Phase:** Foundation  
**Depends on:** H009

## 目标

给正式 H5 的非简单表单建立一致的数据、校验和提交模式，减少每页自行维护 field/error/submitting 状态。

## 范围

- 引入 React Hook Form + Zod resolver。
- 选择一个正式 H5 的真实复杂表单做迁移样板，优先地址或 onboarding；最终选择以实际后端/业务成熟度为准。
- 统一 field error、submit、reset/回填的基本模式。
- 保留 Com Design 现有视觉组件，不为表单库重做 UI。

## 不做

- 不强行迁移所有简单输入框。
- 不处理 legacy 表单。
- 不凭空补齐未确认必填/校验规则。

## 验收

- 至少一个真实表单完成 RHF + Zod 迁移且原交互无明显回归。
- 校验规则只有一个主要事实源。
- typecheck/build 通过。

## 实施结果

- 引入 `react-hook-form@7.88.0` 与 `@hookform/resolvers@5.9.1`，`package-lock.json` 通过真实 npm 流程同步。
- 选择正式 H5 `src/pages/AddressNew.tsx` 作为首个真实复杂表单样板；新增与编辑继续共用同一页面与同一业务 action。
- 新增 `src/app/forms/address.ts`，以 Zod schema 作为地址表单运行时校验主要事实源，并通过 `z.infer` 生成 `AddressFormValue` / `AddressFormData`。
- 旧 `validateAddressForm`、`AddressFormErrors` 和 fixture 自有 `AddressFormValue` 已退役；地址 Zustand state 改为消费 schema 推导类型，避免双事实源。
- 四个文本/选择字段及默认地址开关纳入 RHF；当前 Com Design `Input` / `Select` 保持原样，通过 `Controller` 接入，不为单张卡修改设计系统组件。
- 编辑目标变化通过 `reset(initial)` 回填；`?state=invalid` 通过同一 schema 的 `trigger()` 产生确定性错误态。
- 保留旧交互：手机号输入继续过滤非数字；字段发生变化后清除该字段当前错误；保存仍为显式点击按钮；粘贴识别、保存 Toast 与 900ms 后返回地址列表语义不变。
- Zod 校验只用 `trim()` 判断有效性，不转换保存数据；原始字符串保存语义保持不变。
- `docs/engineering/forms.md` 已记录 RHF + Zod 的适用范围、schema 单一事实源、回填/reset、Controller 与后续服务端字段错误约定。

## 证据

- `npm run verify:h012` 覆盖合法/非法地址、准确错误文案、Zod resolver、默认地址布尔字段、raw 值不被 trim 转换、AddressNew RHF 集成、旧手写校验退役和 schema-derived domain type。
- 人工 review 已检查完整 PR diff、编辑/新增/reset、错误清除、schema 数据转换风险、组件接入、依赖 lockfile 与范围边界；施工中发现并修复了“真实 `<form>` 会新增 Enter/IME 提交能力”的交互漂移，最终保持旧页面显式点击保存行为。当前无剩余 blocking finding。
- PR #19 Build run `35083117803` 在实现 head `806e1a9ff97d75fb8070fc5e654bbd2bf0a370f5` 上完整通过 npm ci、static hygiene、typecheck、H007/H009/H010/H011/H012 验证、dev/Cloudflare preview/test/prod 构建与 identity 检查、production-like Mock 拒绝、SPA fallback 和 production preview smoke。
- User Review head `5dd53e47dcf5845bbac390376b0bb70c1288f0f7` 的 Build run `35083424678` 同样完整通过；Cloudflare Pages 已成功部署该 final review head。
- PR #19 已记录人工 self-review。
- 2026-09-16：用户明确回复“接受”，H012 正式验收通过。
