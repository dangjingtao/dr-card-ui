# 卡博士 H5 设计文档索引

本目录用于区分“当前设计规范”和“历史设计证据”，避免项目从 UI 阶段进入正式 H5 开发后继续引用过期结论。

## 当前施工优先读取

1. [`design-baseline.md`](./design-baseline.md) — 当前项目级设计基线，包含 App 内嵌 H5、WebView、Mock / 真实数据接入后的设计约束。
2. [`design-principles.md`](./design-principles.md) — 已有通用设计原则。
3. [`../prototype/README.md`](../prototype/README.md) 与同目录模块文档 — 基于 Mockplus 整理的原型语言。
4. `preview` 分支当前已确认页面 — 可运行 UI 真相。

## 历史详细文档

根目录 [`设计文档.md`](../../设计文档.md) 保留早期“卡博士诗得丽”Mockplus v3 的 72 页面整理、视觉细节和历史修订记录。

它仍然是重要证据，但部分项目定位、色彩推断、页面关系和建议形成于正式 H5 工程阶段之前，因此：

- 不删除；
- 不整体重写历史内容；
- 当前施工若与 `design-baseline.md`、当前 `preview` 或用户最新确认冲突，以更新的事实源为准；
- 需要追溯“为什么当时这样设计”时，再回看历史详细文档。

## 历史设计资料

`不靠谱的设计历史/` 不是当前设计规范。它保存可能有参考价值、但存在冲突或尚未确认的历史方案。

未经当前事实源支持，不得直接把其中页面、功能或交互升级为正式需求。

## 设计变更进入工程的路径

```text
需求 / 决策
   ↓
Mockplus / preview 做准 UI
   ↓
preview 验收
   ↓
dev 接 API / Mock / JSBridge
   ↓
test 在 App WebView 中验证
```

如果工程接入迫使 UI 改变，这不是“开发顺手调整”，而是新的产品 / 设计决策，应回到 `preview` 留下明确变更。
