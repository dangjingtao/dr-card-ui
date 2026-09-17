# H019｜测试报告与 Cloudflare Pages 证据站

**Status:** In Progress  
**Phase:** Delivery  
**Depends on:** H018

## 目标

让每次 test CI 的结果既有机器原始证据，又有人能快速阅读和追溯的独立报告页面。

## 范围

- GitHub Actions Summary 输出 concise 状态与报告入口。
- 生成机器 JSON、Playwright HTML，以及失败时必要 screenshot/trace/video。
- 独立 Cloudflare Pages 报告站，不部署进生产 H5 Pages 项目。
- 支持 `/latest/` 与 `/commits/<sha>/`，后者保持 commit 级可追溯。
- GitHub Artifact 继续作为原始证据备份。
- 报告记录 SHA、branch、env、API mode、Bridge 验证状态、测试汇总与失败用例。

## 不做

- 不引入 Allure 等重量平台，除非后续真实需要。
- 不在报告中暴露 token、API key、凭据或敏感真实用户数据。

## 验收

- 一次 test CI 可产出可读报告 + 原始 artifact，并能按 commit 定位。
- 报告站与生产 H5 完全隔离。
- CF 发布失败时原始 GitHub evidence 仍然存在。

## 证据

记录 Actions run、报告路径、artifact 与 commit SHA。
