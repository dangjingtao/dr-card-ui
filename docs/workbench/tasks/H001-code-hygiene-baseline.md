# H001｜代码质量与卫生基线

**Status:** Accepted  
**Phase:** Hygiene  
**Depends on:** —

## 目标

给正式 H5 建立可持续的代码卫生底线，清理会阻碍后续施工的明显污染，而不是进行全仓美化重写。

## 已知依据

当前 TypeScript 已开启 `strict`，但项目仍保留大量原型期代码与脚本；需要把“必须清的结构债”和“无收益的历史重构”分开。

## 范围

- 补齐适合当前 React + TypeScript 工程的 ESLint / 静态检查基线。
- 清理正式 H5 施工面中的明显死代码、无效 import、废弃入口与无意义重复实现。
- 明确新增代码不得继续制造直接 Web Storage、散落宿主调用、页面级假网络等污染。
- 只处理会影响可维护性、可施工性、构建或交接的卫生问题。

## 不做

- 不批量重写 legacy / Native reference。
- 不为整齐拆 `ComDesign.tsx` 或重排所有组件文件。
- 不全仓格式化制造噪声 diff。
- 不处理商城。

## 验收

- 有稳定可执行的静态检查命令，现有正式 H5 代码能通过或有明确、有限的例外。
- 本卡引入的清理不改变正式业务行为与视觉。
- 没有借卫生名义扩大到 legacy、商城或大规模架构重写。

## 实现结果

- 新增 `npm run lint`，复用现有 TypeScript Compiler API，无新增依赖。
- 当前正式 H5 静态卫生基线为 **0 个未使用代码例外**。
- 清理 3 个明确无效 import：`Card.tsx` 的 `ChevronRight`、`Home.tsx` 的 `PickerIdentity`、`Settings.tsx` 的 `useEffect`。
- 门禁检查 113 个正式 H5 源文件，并禁止新增直接 Web Storage、散落网络调用与常见 Native Bridge 全局依赖。
- legacy / Native reference 与商城未进入本卡施工面；页面级假网络迁移仍由后续任务处理。

## 证据

详见 [`../evidence/h001-code-hygiene.md`](../evidence/h001-code-hygiene.md)。

关键自动化结果：GitHub Actions Build run `35005628414` 成功；Static hygiene、Typecheck、开发/生产构建与 smoke checks 全部通过。

2026-09-16：用户明确确认验收，状态更新为 `Accepted`。
