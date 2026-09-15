# H012｜React Hook Form + Zod 表单基线

**Status:** Ready  
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

## 证据

记录迁移页面、schema、关键交互验证与 commit SHA。
