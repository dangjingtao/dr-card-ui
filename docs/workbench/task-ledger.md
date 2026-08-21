# 任务卡系统

## 卡博士专项评估

当前专项评估见：

- `docs/workbench/design-assessment.md`

核心约束：

- Mockplus 作为业务与视觉来源。
- Com Design 作为工程设计体系。
- 《不靠谱的设计历史》作为视觉质量下限，不作为反例库。
- 全项目拆分任务卡不超过 15 张。

## 任务卡模板

```md
# TXXX｜任务名称

## 类型
- Design / UI / Component / Infrastructure / Test

## 背景
为什么做这个任务。

## 目标
明确完成后的状态。

## 范围
包含什么，不包含什么。

## 设计依据
- Mockplus页面
- Com Design规范
- 设计决策记录

## 实施要求
具体施工要求。

## 验收标准
- 页面可访问
- 视觉符合原型
- 交互流程通过
- Build通过

## 产出
- Commit
- Preview
- Screenshot
```

## 状态流转

```text
Draft
 ↓
Ready
 ↓
Doing
 ↓
Review
 ↓
PASS
 ↓
Archive
```

## 任务分类

### 基建任务

工程能力、配置、CI、组件框架。

### 设计任务

页面视觉、交互、响应式。

### 组件任务

Com Design 或业务组件沉淀。

### 验收任务

Playwright、截图、人工评审。

## 拆解原则

避免：

- 一张卡包含整个 APP
- 没有验收标准
- 只有开发描述，没有设计依据

推荐：

页面级任务 + 组件级任务 + 验收任务分离。
