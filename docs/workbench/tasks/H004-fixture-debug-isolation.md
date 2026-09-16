# H004｜Fixture / Debug 运行环境隔离

**Status:** In Progress  
**Phase:** Hygiene  
**Depends on:** H001, H006

## 目标

保留 preview/dev 的确定性演示能力，同时阻止 `?state=`、`?overlay=`、`?debug=1` 在 test/prod 冒充真实业务状态。

## 范围

- 定义 fixture/debug 能力的环境开关和运行策略。
- preview / 本地 Mock 环境可继续使用状态 URL 与调试面板。
- test/prod API 模式不允许 query 参数构造假业务结果；DebugPanel 不应成为生产可开启能力。
- 对现有 fixture hook 做最小兼容迁移，避免一次性改写所有页面。

## 不做

- 不删除历史 fixture 与截图能力。
- 不把 Mock 与 JSBridge Mock 混成同一开关。

## 验收

- dev Mock 环境仍可稳定复现需要的演示状态。
- test/prod 构建无法通过 `?debug=1` 打开调试面板，也不会靠 `?state=` 获得假业务成功/失败。
- 环境差异由统一配置决定，不由页面自行判断 branch 名称。

## 证据

记录环境矩阵、关键构建/运行验证与 commit SHA。
