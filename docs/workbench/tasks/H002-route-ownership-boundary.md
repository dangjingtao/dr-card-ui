# H002｜正式 H5 / Native reference 路由边界

**Status:** Ready  
**Phase:** Hygiene  
**Depends on:** H001

## 目标

让路由层在代码上表达页面归属，使正式 H5 与 Native reference 不再只靠路径命名和文档约定区分。

## 范围

- 为路由元数据建立明确的 ownership / scope 语义。
- 正式 H5 的导航、测试枚举、调试与后续工程能力只消费 formal-H5 范围。
- 将 `/legacy-home*`、`/legacy-service*`、`/legacy-profile*` 及按归属属于 Native reference 的 `/device/*`、`/vending/*` 从 H5 施工/验收枚举中排除。
- 保留历史 reference 路由可查看性，不删除旧页面。

## 不做

- 不重构 Native reference 页面内部实现。
- 不处理商城。
- 不改变产品信息架构。

## 验收

- 代码可可靠判断一个路由是否属于正式 H5，而不是只做 `/legacy` 字符串匹配。
- H5 的后续 CI / 测试 / 体验能力能复用该归属信息。
- reference 路由仍可访问，正式 H5 行为无回归。

## 证据

记录归属规则、受影响路由清单、typecheck/build 与 commit SHA。
