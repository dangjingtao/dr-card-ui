# 卡博士 APP UI 工作台

这里管理项目施工过程中的任务、决策和验收记录。

## 目标

工作台不是简单 TODO 列表，而是连接：

需求 → 设计决策 → 任务卡 → 实现 → 验收 → 复盘

## 文件结构

```text
workbench/
├── README.md
├── task-ledger.md
├── design-assessment.md
├── tasks/
├── decisions/
├── reviews/
└── archive/
```

## 工作原则

- 一个明确目标对应一张任务卡
- 大任务拆成可验收的小任务
- 设计问题先决策，再编码
- 任务完成必须有验证方式
- 保留关键设计讨论，避免重复争论

## 当前 15 张任务卡

- [实际评估与覆盖矩阵](./design-assessment.md)
- [任务卡索引与全局验收契约](./tasks/README.md)
- [任务状态规则](./task-ledger.md)

智能体自审通过不等于项目通过。任务只能由智能体推进到 `User Review`，最终 `Accepted` 必须来自用户明确验收。
