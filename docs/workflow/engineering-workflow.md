# 卡博士 APP UI 工程工作方式

## 项目定位

dr-card-ui 是卡博士移动 APP 高保真 UI 工程。

目标不是搭建完整业务系统，而是：

- 还原 Mockplus 原型
- 沉淀 Com Design 移动组件
- 快速输出高质量视觉稿
- 保证后续可持续开发

## 技术基线

- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Playwright（交互验收）

## 工作原则

### 1. 原型优先

Mockplus 是主要视觉依据。

遇到历史设计资料和当前原型冲突：

- 不直接采用历史设计
- 标记差异
- 提交讨论

### 2. 组件优先

页面开发不得重复制造 UI。

优先顺序：

Com Design 组件
→ mobile 通用组件
→ card 业务组件
→ 页面组合

### 3. Token 优先

禁止页面直接定义主题颜色。

所有视觉必须经过：

Primitive
→ Semantic
→ Component

最终由 Com Design 土豪金 Token 控制。

## 开发流程

1. 阅读原型和需求
2. 确认页面范围
3. 检查已有组件
4. 开发组件或页面
5. TypeScript 检查
6. Build 验证
7. Playwright 验收关键流程

## 测试策略

不追求大量单元测试。

重点覆盖：

- 页面进入
- 页面跳转
- 核心用户流程
- 截图视觉回归

## 提交规范

一个任务一个提交范围。

提交内容说明：

- 做了什么
- 影响范围
- 验证方式
- 是否需要评审

## 禁止事项

- 未确认直接替换历史设计
- 引入新的颜色体系
- 页面复制组件代码
- 为了测试阻碍原型开发
