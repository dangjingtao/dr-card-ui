# H006｜环境配置与构建身份

**Status:** Ready  
**Phase:** Foundation  
**Depends on:** H001

## 目标

把 dev/test/prod、API/Mock、Bridge 模式与 H5 构建身份变成显式、可校验的配置。

## 范围

- 增加 `.env.example`，只放非敏感示例项。
- 统一读取 `APP_ENV`、`DATA_MODE`、Bridge 模式、API base URL 等配置。
- test/prod 明确禁止 API Mock 回退。
- 构建中暴露可诊断的 commit SHA / build 标识，不泄露秘密。
- 对非法环境组合尽早失败。

## 不做

- 不写真实 token / secret。
- 不把 Git branch 名直接当数据源开关。
- 不引入 PWA。

## 验收

- 本地 dev 可明确选择 Mock/API；CF dev 可固定 Mock；test/prod 只能 API。
- 构建产物可定位到 commit/build 身份。
- `.env.example` 足以让新环境知道需要哪些非敏感变量。

## 证据

记录配置矩阵、构建输出检查与 commit SHA。
