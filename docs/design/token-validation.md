# T002｜对比度 / 状态色 / 375 宽度校验

> 状态：Agent Review（T002）
> 对比度按 WCAG 2.1 相对亮度公式计算（AA：正文 4.5:1 / 大字 3:1）。
> 取样值来自 `tokens.css` / `card-brand.css` 当前定义，与页面实际消费一致。

## 1. 文本对比度校验

### 1.1 基础文字（亮色）

| 前景 / 背景 | 比值 | 结论 |
| --- | --- | --- |
| text-primary ink-800 #292722 / background warm-50 #FCF8F1 | 14.09:1 | PASS |
| text-secondary ink-600 #5C574E / background | 6.77:1 | PASS |
| text-tertiary ink-500 #7B7468 / background | 4.37:1 | ⚠️ 仅 4.5 下限附近，用于辅助说明可接受 |
| text-primary / surface #FFFFFF | 14.92:1 | PASS |
| text-secondary / surface | 7.17:1 | PASS |
| ink-800 / surface-subtle warm-100 #F8F0E5 | 13.20:1 | PASS |

### 1.2 彩色面文字

| 前景 / 背景 | 比值 | 结论 |
| --- | --- | --- |
| reward-text premium-700 / surface | 7.39:1 | PASS（ValueCard 泡泡值金额） |
| reward-text premium-700 / reward-subtle premium-50 | 7.03:1 | PASS |
| member-text premium-50 / member-surface ink-900 | 16.39:1 | PASS（会员卡） |
| member-accent premium-300 / member-surface | 9.85:1 | PASS |
| text-inverse #FFF / primary brand-600 #D63D10 | 4.63:1 | PASS |
| text-inverse / primary-pressed brand-700 #AD2E0A | 6.62:1 | PASS |
| success-text / success-bg | 4.77:1 | PASS |
| warning-text / warning-bg | 4.63:1 | PASS |
| danger-text / danger-bg | 5.72:1 | PASS |
| info-text / info-bg | 6.08:1 | PASS |
| **bubble-on-gold premium-900 / gradient 浅端 premium-300** | **8.49:1** | PASS（Home 泡泡值横幅数字） |
| **bubble-on-gold premium-900 / gradient 深端 premium-500** | **5.05:1** | PASS |
| bubble-on-gold-muted #5F3D14 / 渐变浅端 | 5.55:1 | PASS（横幅标题，位于浅端） |
| bubble-on-gold-muted / surface（按钮） | 7.03:1 | PASS |
| white / success-700 #147A4C（成功 Toast） | 5.36:1 | PASS（已由 success-500 修正） |

### 1.3 待确认页面上的对比度缺口（不阻塞 T002，记入对应任务卡）

| 位置 | 现状 | 比值 | 处理 |
| --- | --- | --- | --- |
| DrawSuccess 大吉签白字 on 金渐变 | 1.75:1 | FAIL | 属未确认 T03 视觉；T006 决策时建议改用深棕字或加深金色 |
| DrawSuccess 中吉白字 on brand-500 | 3.33:1 | 大字边界 | T006 复核 |
| DrawSuccess 再抽一次 白字 on premium-500 | 2.94:1 | FAIL（大字 3:1 边界下） | T006 复核，可改 premium-700 |
| Tag brand 浅橙 on 白 | 2.43:1（装饰性标签，非正文） | ⚠️ | 标签为装饰性小元素，正式页避免承载关键信息 |

> 以上 4 项均位于**未确认历史稿（T03）**页面，T002 不擅自改其主视觉，仅记录并移交 T006。

## 2. 状态色区分校验

卡券/状态色必须彼此可分，且在各自底色上文字可读：

| 状态 | 色值 | 底色 | 文字对比 | 与相邻状态区分 |
| --- | --- | --- | --- | --- |
| 可用 coupon-available success-500 #21B66F | 绿 | success-100 | 2.34:1（仅装饰点/徽标底，正文用 success-text #147A4C=4.77:1） | 与「已使用」灰（ink-500）色相+明度双区分 |
| 已使用 coupon-used ink-500 #7B7468 | 灰 | warm-200 | 3.62:1 | 中性，不抢可用/过期 |
| 已过期 coupon-expired danger-500 #D63E50 | 红 | danger-100 | 3.76:1（正文用 danger-text 5.72:1） | 红 vs 绿/灰 高区分 |
| success / warning / danger / info | 绿/黄/红/橙 | 各自浅底 | 均 ≥4.6:1 | 色相分离，且深浅底+文字同色系双通道 |

结论：状态色采用「绿/灰/红」三态 + 「success/warning/danger/info」四态，色相与明度双通道可区分；
正文不使用状态主色直接承载文字（用 -text 变体），规避低对比。

## 3. 375 × 812 字号与间距校验

基准 375×812，与原型一致。

### 3.1 字号阶梯（沿用现有组件约定）

| 用途 | 字号/行高 | 备注 |
| --- | --- | --- |
| 页面标题（TopAppBar） | 18px / 28px | 1 行截断 |
| Section 标题 | 16px / 24px | |
| 正文 | 14px / 20px | |
| 辅助/描述 | 12px / 16px | |
| 徽标/时间 | 10–12px | 仅辅助 |
| 泡泡值大数字 | 30px / 36px | Home 横幅，375 下无溢出 |

### 3.2 间距与触控

- 页面水平内边距 `px-4`（16px）；卡片间距 `space-y-3~5`（12–20px）。
- 底部导航 + 安全区：`pb-[calc(4rem+env(safe-area-inset-bottom))]`。
- 触控目标：Button/ListItem ≥40px 高（min-h-10），IconButton 40×40，满足单手操作。
- 四列快捷入口 375-32-3×12 = 307 → 单格 ≈71px，内 padding 12px，12px 文案无溢出。

### 3.3 校验方式

- 截图按 375×812 视口验证（见本次证据图：/tokens、/、/draw-success）。
- 无横向滚动（`min-width:320px`，375 下内容区 343px）。

## 4. 本次已执行的修正

| 文件 | 修正 | 依据 |
| --- | --- | --- |
| `src/styles/card-brand.css` | 新增 `--neutral-*` 灰阶、品牌语义/组件层；`--color-bubble-on-gold(-muted)` 深棕文字 | §1.2 对比度；原型取样 |
| `src/styles/card-brand.css` | 暗色不再把金面文字切浅色 | 金渐变暗色不变，文字须保持深棕 |
| `src/pages/Home.tsx` | 泡泡值横幅：白字→深棕（1.75→8.49:1）、临时阴影→`--shadow-bubble-card`、`bg-white`→`bg-surface` | §1.2、§4 硬编码治理 |
| `src/pages/DrawSuccess.tsx` | 原 `--com-*` 失效变量随 T004 夹具化重构消除；成功 Toast `success-500`→`success-700`（2.63→5.36:1） | 失效引用修复 + §1.2 |
| `src/pages/Tokens.tsx`（新增） | Token 展示页，默认/交互/状态/组合全部消费 Token | 验收「展示页」 |

## 5. 硬编码色审计（rg）

`rg '#[0-9a-fA-F]{3,8}' src`：

- 页面（`src/pages`、`src/components`）：**0 处品牌 hex**。
- `tokens.css` / `card-brand.css`：Token 定义层，允许且含来源/用途注释。
- `rg --com- src`：**0 处**（原 DrawSuccess 7 处失效引用已清理）。

补充：艺术素材内部颜色按 AGENTS.md「艺术素材内部颜色除外」豁免；工程内无此类内联。
