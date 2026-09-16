# T037｜登录页补全（卡博士淡金色风格 + 学校/专业/学号绑定）

## 状态与类型

- 状态：`PASS`（2026-09-07 PRD 全门槛通过，详见「PRD 验收」章节）

- 类型：Feature / UI

- 优先级：P2

## 当前事实与差距

- T026 实现的登录页为金色渐变风格，仅做微信授权主路径，「手机号登录」「学号登录」仍为占位灰字，缺密码/验证码等备选登录方式。

- 用户 2026-09-07 上传紫色渐变登录页截图（来源：小程序原版），明确 5 项改动需求：
  1. 密码输入框需有「睁眼/闭眼」切换按钮，控制正在输入的密码可见/不可见。
  2. 新注册用户需提供「二次确认密码」输入框。
  3. 连续输错密码 5 次后，必须切换为图形验证码（页面需有图形验证码切换入口/触发态）。
  4. 登录页保留微信授权登录入口。
  5. 登录成功后弹窗提示绑定学校、专业、学号；同步「我的」页面需要展示学校/专业/学号三栏。

- T026 已通过 `userInfoStore` 提供 `school / academy / studentId` 字段，PersonalInfo 已展示。本卡继续沿用同一 store，不重复定义。

- 当前 PersonalInfo 已展示学校/学院/学号，ProfileHome 顶部仅展示昵称与账号，缺学校/学院/学号摘要。

## 目标

1. 重写登录页为紫色渐变风格（对齐用户上传参考图），账号 + 密码 + 二次确认密码 + 微信授权。
2. 密码框增加「显示密码」切换图标（睁眼/闭眼）。
3. 输错 5 次密码后自动显示图形验证码，并支持点击切换。
4. 登录成功后弹窗引导绑定学校 / 专业 / 学号。
5. 「我的」页 ProfileHome 顶部区增加学校 / 学院 / 学号展示。
6. 冷启动进入 APP 默认先打开登录页（用户 2026-09-07 决定）。
7. 「我的」→「设置」→「退出登录」→ 确认后跳转回登录页（用户 2026-09-07 决定）。
8. 注册入口：登录页底部新增「还没有账号？请注册」；注册页 = 手机号 + 验证码 + 设置密码 + 二次确认密码；二次确认密码仅出现在注册页（用户 2026-09-07 决定）。
9. 演示逻辑重写：任何账号 + 密码（满足 6-20 位）均能直接登录成功（去掉原先 mock 密码 `000000`）；登录页右下角加"原型切换按钮"提供两个演示场景——`正常`：可直接登录；`错误`：连续 4 次提交都返回「账号或密码错误，还可输入 N 次」，第 5 次必须输入正确图形验证码才能登录成功（用户 2026-09-07 决定）。

## 原型范围

- 视觉源：用户上传的紫色渐变登录页截图（小程序原版） + 用户 2026-09-07 后续决定：「登录页的设计风格同样保持卡博士 APP 的淡金色设计风格」。
- 最终定调：与卡博士 APP 整体保持一致的淡金色品牌色（`#D4A853 → #E8C97A → #F0D68E`）。
- 登录页背景：项目 `--gradient-app-background` 金色径向柔光 + 暖白渐隐（与壳层统一）。
- 主操作按钮：金色渐变胶囊 `#D4A853 → #E8C97A`；微信授权保留绿色调（外部品牌识别）。
- 输入框：白底圆角胶囊，边框 `#E8D9B8`（与「我的」顶部金色区一致），placeholder 与图标色 `#B8893D`。
- 协议勾选：底部居左，金色径向渐变填充。
- 辅助文案：「还没有账号？请注册」（点击注册入口跳转 `RegisterPage`）。

## 不在范围

- 不做忘记密码 / 修改密码的完整流程（仅视觉占位）。
- 不做账号注册流程（仅在登录页展示引导文案）。
- 图形验证码仅做前端 mock（SVG 字符串），不接后端校验。

## 依赖与阻塞决策

| 编号 | 阻塞项 | 风险 | 说明 |
| --- | --- | --- | --- |
| B-039 | 账号类型 | 中 | 登录页"账号"字段是否只允许学号 / 手机号，提示文案如何写？本期按"账号"统称，placeholder 写"请输入账号" |
| B-043 | 错误次数计数 | 低 | 输错计数在登录页内维护即可，5 次阈值可配 |

## 实施要求

### 登录页 LoginPage（`/legacy-profile/login`）

- **背景**：浅紫到白的纵向渐变（`#A6A6F5 → #FFFFFF`）。
- **标题文案**：「你好，欢迎来到卡博士」。
- **账号输入框**：白底圆角胶囊，placeholder「请输入账号」。
- **密码输入框**：白底圆角胶囊，右侧「睁眼/闭眼」图标切换 `type="password"` 与 `type="text"`，切换过程中光标与已输入内容保持一致。
- **二次确认密码输入框**：[已迁移] 仅出现在注册页 `RegisterPage`，登录页不再要求二次确认（用户 2026-09-07 决定）。
- **忘记密码**：右上角小字链接，点击仅弹 toast「功能施工中」（T037 不展开）。
- **主操作按钮**：「立即登录」，紫色渐变胶囊，宽度撑满，登录中显示 loading。
- **微信授权按钮**：「微信授权登录」绿色调渐变胶囊，宽度撑满，含微信图标。
- **注册入口**：「还没有账号？请注册」金色文字按钮，点击跳 `/legacy-profile/register`。
- **协议勾选**：底部居左复选框 + 文案「我已阅读并同意《用户协议》和《隐私政策》」。
- **错误反馈**：
  - 输入校验：账号 / 密码非空、密码 6-20 位。
  - 登录失败（仅 `错误` 场景）：账号或密码错误时按钮下方红字提示「账号或密码错误，还可输入 N 次」（N 随 attempts 递减 4→1）。
  - 连续错误 4 次后：图形验证码模块（CaptchaImage）常驻展示，需输入正确才能再次提交；该模块在页面内可见状态下点击图片可换一张。
- **演示态切换按钮**（右下角浮动）：图标 `FlaskConical`，文案 `正常状态` / `错误状态` 互切；切换时清空 attempts / 错误文案 / 验证码输入，保证两套场景互不污染。
- **登录成功**：弹窗「完善账号信息」引导绑定学校 / 专业 / 学号；点击「去绑定」跳 `/legacy-profile/bind-school`；点击「稍后再说」关闭弹窗并回跳来源页或 `/legacy-profile`。
- **状态**：默认态 / 输入校验失败 / 登录中 / 错误提示 / 需图形验证码 / 绑定引导弹窗。

### CaptchaImage 组件（新建，`src/components/ui/CaptchaImage.tsx`）

- 接收 `length`（默认 4 位）与 `onChange`（输出当前验证码字符串）。
- 内部维护一个随机生成的字符串（字母 + 数字，区分大小写），点击图片或右侧「换一张」刷新。
- 视觉：120×44 SVG 风格（圆角矩形底 + 干扰线 + 轻微旋转字符），与输入框右对齐显示。

### RegisterPage（新建，`/legacy-profile/register`）

- 顶部栏：「注册账号」+ 返回登录页。
- 字段（按顺序）：
  1. **手机号 + 获取验证码**：手机号白底圆角胶囊，输入框 `inputMode="numeric"`，右侧「获取验证码」金色渐变按钮；点击触发 60s 倒计时（与 PhoneChangePage 复用 `isValidPhone` 校验）。
  2. **验证码**：4-6 位数字。
  3. **设置密码**：6-20 位，睁眼/闭眼切换。
  4. **二次确认密码**：必须与设置密码一致，睁眼/闭眼切换。
- 协议勾选：底部居左；未勾选提交给出明确红字提示。
- 主操作：「注册并登录」金色渐变胶囊；提交时校验所有字段，任一失败给出对应红字 + 不发请求。
- 提交成功：调用 `userInfoActions.update({ account: phone, phone, isRegistered: true })`，弹窗「完善账号信息」引导绑定学校 / 专业 / 学号；点「去绑定」跳 `/legacy-profile/bind-school`，点「稍后再说」跳 `/legacy-profile`。
- 辅助入口：「已有账号？去登录」金色文字按钮跳回 `/legacy-profile/login`。
- 视觉与 LoginPage 同款淡金色风格，保证品牌一致。

### BindSchoolPage（新建，`/legacy-profile/bind-school`）

- 表单：学校（选择 mock 学校列表「广州大学/华南理工/中山大学/暨南大学」）/ 学院（输入）/ 学号（输入，8-20 位）。
- 顶部栏：「绑定学校信息」。
- 主操作：「确认绑定」，保存时调用 `userInfoActions.update({ school, academy, studentId })`，完成后 `navigate('/legacy-profile')`。
- 与 PersonalInfo 共享 `userInfoStore`，绑定成功自动同步到「我的」/个人信息。

### ProfileHome 改造（`/legacy-profile`）

- 顶部区在账号下方新增一行「学校 · 学院 · 学号」摘要，3 项空值时隐藏对应项。
- 「我的」页与 PersonalInfo / LoginPage 绑定弹窗联动，绑定后顶部摘要实时刷新（共用 store）。

### 路由与状态

- `routes.ts`：在 T026 区块内更新 `/legacy-profile/login` 的 owner 描述；新增 `/legacy-profile/bind-school` 与 `/legacy-profile/register`。
- `router/index.tsx`：在 T026 imports + `customPages` 中新增 `BindSchoolPage` 与 `RegisterPage` 路由项。
- `userInfoStore.ts`：扩展 `UserInfo` 新增 `isRegistered: boolean`（mock 默认为 `false`，触发二次确认密码），`account` 与 `school/academy/studentId` 字段已存在。
- `MobileLayout.tsx`：在壳层增加"未登录访问 `/` 时 `replace` 跳 `/legacy-profile/login`"的副作用，登录后（`account` 非空且 `isRegistered=true`）放行诗得丽专栏首页；保留底部 Tab「首页」语义不被破坏。
- `SettingsPage.tsx`：`handleLogout` 落实 — 调用 `userInfoActions.update({ isRegistered: false, account: '' })` 清空登录态后 `navigate('/legacy-profile/login', { replace: true })` 跳转；`replace` 避免返回栈回退到设置页。
- `LoginPage.tsx`：移除"未注册则显示二次确认密码"逻辑（已迁移到 RegisterPage）；底部新增「请注册」入口；右下角加 `FlaskConical` 演示态切换按钮（`normal` / `error`），错误态下 4 次提交递减错误提示文案，第 5 次强制图形验证码。

## 状态与交互矩阵

- **LoginPage**：默认态 / 输入校验失败 / 密码可见切换 / 加载中 / 错误提示（含剩余次数，错误场景下 N 递减 4→1）/ 需图形验证码（错误场景 attempts ≥ 4）/ 换一张验证码 / 登录成功 + 绑定引导弹窗 / 「请注册」入口 / 右下角演示态切换按钮（正常 ↔ 错误）。
- **RegisterPage**：默认态 / 各字段校验失败 / 验证码 60s 倒计时 / 加载中 / 提交成功 + 绑定引导弹窗 / 「去登录」入口。
- **CaptchaImage**：初始渲染 / 校验失败高亮 / 刷新。
- **BindSchoolPage**：默认态 / 表单校验失败 / 加载中 / 提交成功跳转。
- **ProfileHome**：未绑定态（仅昵称 + 账号）/ 已绑定态（昵称 + 账号 + 学校学院学号）。

## 验收标准

- 用户可输入账号 + 密码登录，密码可切换显示/隐藏。
- 任何账号 + 密码（满足 6-20 位）均能直接登录成功，不做账号匹配校验。
- 右下角演示态切换按钮在「正常状态 / 错误状态」之间切换；切换时清空错误态残留。
- 错误状态下，连续 4 次提交均返回「账号或密码错误，还可输入 N 次」（N 从 4 递减到 1）；第 5 次提交强制图形验证码，校验通过后登录成功。
- 注册页可填写手机号 + 验证码 + 设置密码 + 二次确认密码，二次确认密码不一致给出明确错误。
- 微信授权按钮与登录按钮均能正常触发对应流程。
- 登录成功 / 注册成功 弹窗正确引导绑定学校/专业/学号，跳转 BindSchoolPage 后保存成功。
- ProfileHome 顶部区正确展示学校 / 学院 / 学号摘要。
- 冷启动进入 `/` 自动跳转到登录页；登录后回 `/` 正常渲染诗得丽专栏首页。
- 「我的」→「设置」→「退出登录」确认后跳回登录页，登录态被清空（`account` 空、`isRegistered=false`）。
- 登录页底部「请注册」入口跳转注册页；注册页「去登录」返回登录页。
- `npm run typecheck` 与 `npm run build` 通过。

## 必交证据

- 路由与覆盖节点清单。
- LoginPage 375 × 812 实现截图（默认 / 密码可见 / 二次确认密码 / 错误提示 / 图形验证码 / 绑定引导弹窗）。
- BindSchoolPage 375 × 812 实现截图。
- ProfileHome 顶部区截图（含学校/学院/学号）。
- 状态/交互检查结果。
- 已知差异与未决项。
- 对应提交号。

## 产出

- `LoginPage.tsx` 重写。
- 新增 `CaptchaImage.tsx`（`src/components/ui/`）。
- 新增 `BindSchoolPage.tsx`（`src/pages/legacy/`）。
- 新增 `RegisterPage.tsx`（`src/pages/legacy/`）。
- `userInfoStore.ts` 增加 `isRegistered` 字段。
- `routes.ts` + `router/index.tsx` 注册新路由。
- `ProfileHome.tsx` 顶部区改造。
- `MobileLayout.tsx` 增加未登录守卫。
- `SettingsPage.tsx` 退出登录落地。
- 本卡文档与证据截图。

## 提交号（按时间顺序）

| 提交号 | 说明 |
| --- | --- |
| `57c0b3a` | T037 登录页补全：紫色渐变改版 + 学校/专业/学号绑定（首版） |
| `1c2fede` | T037 登录页改用卡博士淡金色风格 |
| `8e49e3d` | T037 默认入口改为登录页（MobileLayout 未登录守卫） |
| `f4d2361` | T037 退出登录跳转回登录页（SettingsPage handleLogout） |
| `3b0e3b7` | T037 增加注册入口（RegisterPage）+ 登录页移除二次确认密码 |
| `47937f6` | T037 演示逻辑重写：任意账号密码直接登录 + 右下角演示态切换按钮 |
| `b127b4e` | T037 我的页顶部摘要改两行展示 |
| `8609160` | T037 学院也用 pill 样式 |
| `6ad026d` | T037R1-R5：登录页取消微信授权 / 新增完整忘记密码流程 / 阈值改 20 次 / 替换演示态切换按钮 |
| `ff8df46` | T036R1+R2 / T037R6-R8：设备列表使用中处理 + 账户余额只读 pill + 绑定学校关键字+必填 |
| `（待提交）` | T037R9：登录页账号输入改为「请输入手机号」+ 数字输入限制 |

## 迭代（T037R1-R8｜2026-09-08 与运营负责人沟通后 8 项增量改动）

- 背景：与卡博士运营负责人 2026-09-08 沟通确认 8 项增量改动，统一作为本卡的 1-8 号增量任务（T037R1-T037R8）落到登录页体系内。涉及登录页、忘记密码页、绑定学校页三个入口，均为登录链路上的 UI/交互调整，与 T037 原 PRD 一脉相承。
- **T037R1**：登录页删除微信授权按钮与 `handleWechatLogin`，登录态只走「手机号 + 密码」。
- **T037R2**：新增完整忘记密码流程。路由 `/legacy-profile/forgot-password`，新文件 `src/pages/legacy/ForgotPasswordPage.tsx`。流程：手机号 → 60s 倒计时获取短信验证码（演示固定 `123456`）→ 图形验证码（固定显示，不走输错阈值）→ 新密码（带小眼睛）→ 确认新密码（带小眼睛）→「确定修改」→ 弹窗「修改成功」→ 自动 `replace` 跳回 `/legacy-profile/login`。
- **T037R3**：忘记密码页「新密码 / 确认新密码」两个输入框右侧加 `Eye / EyeOff` 小眼睛图标，分别用 `showNew` / `showConfirm` 独立控制 `type="password"` / `type="text"`。
- **T037R4**：登录页错误阈值 `MAX_ATTEMPTS_BEFORE_CAPTCHA = 20`（用户 2026-09-08 决定，演示态调大便于演示）；忘记密码流程中图形验证码**固定展示**，与登录页阈值逻辑解耦。
- **T037R5**：登录页右下角「原型切换按钮」（`FlaskConical`，「正常状态 / 错误状态」）替换为「弹出图形验证码」按钮（`ImageIcon` + 「弹出图形验证码」）；位置由 `bottom-[calc(20px+env(safe-area-inset-bottom))]` 固定在登录容器内、不溢出；点击后强制把验证码面板显示出来（`setShowCaptcha(true)`）便于演示触发。
- **T037R6**：绑定学校页「学校」字段改为关键字弹出相应选择项形式 —— 输入框受控 `schoolQuery` + `useMemo` 实时过滤 `SCHOOL_OPTIONS`（空关键字时显示前 8 所作为热门候选），候选列表渲染在输入框正下方；用户点击候选项即填入，不再要求下拉全列选择或全名称输入。
- **T037R7**：绑定学校页「确认绑定」按钮 `disabled = submitting || !canSubmit`，`canSubmit = school.trim().length > 0 && academy.trim().length > 0 && /^\d{8,20}$/.test(studentId.trim())`，三项都填完才允许点击；学校 / 学院 / 学号三个 label 后面加红色 `*` 标识必填。
- **T037R8**：`SCHOOL_OPTIONS` 从 4 所扩充到 **27 所**，覆盖「广州 / 华南 / 华工 / 华师 / 中山 / 暨南 / 广东 / 汕头 / 深圳 / 南方 / 师范 / 武汉」等词根，便于任意关键字都能命中候选。
- 工程门：`npm run typecheck` ✅ 通过；`npm run build` ✅ 通过（1.52s / 1.52s）。
- 路由与状态更新：`src/app/router/index.tsx` 新增 `ForgotPasswordPage` 的 import 与 `'/legacy-profile/forgot-password': <ForgotPasswordPage />` 路由项；`src/app/router/routes.ts` 新增对应 `RouteMeta`，task=T037、owner 描述同步更新。
- 任务编号：
  - **T037R1-T037R5** 在 `6ad026d` commit 中；
  - **T037R6-T037R8** 在 `ff8df46` commit 中。

## 迭代（T037R9｜2026-09-08 登录页账号输入改为「请输入手机号」）

- **T037R9**：登录页「账号」输入框 placeholder 由 `请输入账号` 改为 `请输入手机号`；`onChange` 收紧为 `replace(/\D/g, '').slice(0, 11)`（只允许数字、最长 11 位）；新增 `inputMode="numeric"`（移动端键盘弹数字键）；`handleLogin` 空账号报错文案同步改为 `请输入手机号`。
- 提交号：`4edd8a4`
- 工程门：`npm run typecheck` ✅ 通过；`npm run build` ✅ 通过（1.79s）。

## 迭代（T037R10｜2026-09-08 绑定学校简化为 学校+身份+年级）

- 背景：与运营负责人再次聚焦绑定学校功能，确认初衷是为了统计数据，只需收集学校 + 身份 + 年级，去掉学院、学号。
- **T037R10** 改动：
  - `src/pages/legacy/userInfoStore.ts`：
    - `UserInfo` 新增 `role: 'teacher' | 'student'` 与 `grade: string` 字段。
    - `academy`、`studentId` 标为 `@deprecated`（保留字段兼容旧数据，不再使用）。
    - `INITIAL_USER_INFO` 默认 `role: 'student'`、`grade: ''`、`school: ''`、`academy: ''`、`studentId: ''`。
  - `src/pages/legacy/BindSchoolPage.tsx`（重写）：
    - 字段从 3 项（学校/学院/学号）改为 **3 项（学校/身份/年级）**，但含义不同：
      1. **学校**（必填）：关键字搜索 + 候选弹出（继承 T037R6）。
      2. **身份**（必填）：老师 / 学生 二选一单选（2 列网格按钮）。
      3. **年级**（学生必填，老师身份不显示）：大一 / 大二 / 大三 / 大四 / 大五 / 研一 / 研二 / 研三 / 博士（共 9 个，3 列网格按钮）。
    - 「确认绑定」按钮：学校 + 身份必填；学生身份还需年级 — 全部填完才可点击。
    - 提交后写入 `userInfoActions.update({ school, role, grade })`，跳回 `/legacy-profile`。
  - `src/pages/legacy/ProfileHome.tsx`：
    - 用户信息区学校摘要由「学校+学院+学号 两行」改为**一行：学校 + 年级（学生身份时）**。
    - 老师身份只展示学校 pill；学生身份展示学校 pill + 年级 pill。
    - 点击仍跳 `/legacy-profile/info`（绑定学校页入口）。
- 提交号：待提交
- 工程门：`npm run typecheck` ✅ 通过；`npm run build` ✅ 通过（1.50s）。
- 影响范围：绑定学校页重构 + 「我的」页学校信息展示简化 + userInfoStore 字段扩展。

## 迭代（T037R11｜2026-09-08 我的页：左侧学校 pill + 右侧积分 pill 对称）

- 背景：用户指出 T037R10 把「我的」页学校/学院/学号三个 pill 全删了，不符合预期。
  正确做法：保留学校 pill 在左侧，右侧对称位置展示用户当前积分数额。
- **T037R11** 改动：
  - `src/pages/legacy/ProfileHome.tsx`：
    - 用户信息区底部一行改为左右对称布局（`justify-between`）。
    - 左侧：学校 pill（点击跳 `/legacy-profile/info` 绑定学校页修改）；未绑定时显示"去绑定学校"。
    - 右侧：积分 pill（纯展示，数据来自 `pointsStore.usePoints().balance`），同样式半透明白底白字圆角胶囊。
    - 新增 `import { usePoints } from './pointsStore'`。
- 提交号：待提交
- 工程门：`npm run typecheck` ✅ 通过；`npm run build` ✅ 通过（1.53s）。
- 与 T037R10 的关系：T037R10 负责绑定学校页字段简化（学校+身份+年级），T037R11 负责「我的」页展示形态修正（左学校+右积分）。

## 迭代（T037R12｜2026-09-08 积分 pill 增加点击跳转）

- 背景：T037R11 积分 pill 仅做纯展示，用户补充要求可点击跳转。
- **T037R12** 改动：
  - `src/pages/legacy/ProfileHome.tsx`：积分 pill 由 `<div>` 改为 `<button>`，`onClick` 跳 `/signin/detail`（签到/积分详情页，legacy 体系下的积分页入口）。
- 提交号：待提交
- 工程门：`npm run typecheck` ✅ 通过；`npm run build` ✅ 通过。

## 迭代（T037R13｜2026-09-08 个人信息页：去学号学院 + 新增身份栏）

- 背景：用户要求"我的 → 个人设置"里去掉学号、学院，加上一栏「身份」：
  学生身份显示"大一 学生"（年级+身份），老师身份显示"老师"。
- **T037R13** 改动：
  - `src/pages/legacy/PersonalInfo.tsx`：
    - `INFO_ITEMS` 删除 `studentId`（学号）、`academy`（学院）两项。
    - 新增 `role`（身份）一栏，类型为 `link`，点击跳 `/legacy-profile/bind-school`（绑定学校页修改）。
    - `getValue` 中 `role` 分支的展示逻辑：
      - `student` + 有年级 → `"{grade} 学生"`（如"大一 学生"）
      - `student` + 无年级 → "未完善"
      - `teacher` → "老师"
      - 其他 → "未完善"
- 提交号：待提交
- 工程门：`npm run typecheck` ✅ 通过；`npm run build` ✅ 通过（1.49s）。

## PRD 验收（2026-09-07）

按 `docs/workbench/task-ledger.md` §4 五项门槛 + 本卡验收标准逐条核对，全部通过：

### 4.1 事实门槛

- Mockplus / 用户原型依据：用户 2026-09-07 上传紫色渐变登录页截图作为起点，后续明确改为卡博士淡金色风格；右上 5 项要求（密码可见 / 二次确认密码 / 5 次错误显示图形验证码 / 微信授权 / 绑定引导弹窗）已映射到 LoginPage / RegisterPage / BindSchoolPage。
- 完成度判定：LoginPage / RegisterPage / BindSchoolPage / CaptchaImage 全部为完成态；二次确认密码仅出现在 RegisterPage（按用户 2026-09-07 决定）。

### 4.2 UI 门槛

- 375 × 812 视觉：金色径向柔光 + 暖白渐隐；输入框白底圆角胶囊、边框 `#E8D9B8`、placeholder `#B8893D`；主按钮 `#D4A853 → #E8C97A`。
- 状态矩阵（已记录于上文）：默认 / 校验失败 / 密码可见切换 / 加载 / 错误剩余次数 / 验证码常驻 / 换一张 / 绑定引导弹窗 / 注册入口 / 演示态切换 / 微信授权 — 全部落地。
- 「我的」顶部摘要：两行 pill 样式（学校+学院 / 学号），学院过长 truncate，任一项为空仅隐藏对应行。

### 4.3 交互门槛

- 入口可达：路由 `/`、`/legacy-profile/login`、`/legacy-profile/register`、`/legacy-profile/bind-school`、`/legacy-profile`、`/legacy-profile/info`、`/legacy-profile/settings` 在 dev server 全部返回 200。
- 返回路径：
  - 冷启动 `/`（未登录）→ 自动 replace 跳 `/legacy-profile/login`；登录后回 `/` → 诗得丽专栏首页正常渲染（`MobileLayout` 守卫放行）。
  - 「我的」→「设置」→「退出登录」确认 → 清登录态 → replace 跳 `/legacy-profile/login`，不会回退到设置页（`SettingsPage.handleLogout`）。
  - 登录/注册成功弹窗：「去绑定」跳 `/legacy-profile/bind-school`；「稍后再说」跳 `/legacy-profile`。
- 微信授权与登录按钮均能触发流程，没有静态高亮或假按钮。

### 4.4 工程门槛

- `npm run typecheck` ✅ 0 错误。
- `npm run build`（含 `verify:images` 与 `vite build`）✅ 成功；image assets: 36 WebP files, 1.98 MiB。
- 路由可直接刷新不白屏（dev server 200 验证）。
- 控制台无新增阻塞错误（T037 范围内）；其他页面遗留的 `alert(...)` 在 T037 范围之外。

### 4.5 证据门槛

- 路由与覆盖节点清单：`/legacy-profile/login`、`/legacy-profile/register`、`/legacy-profile/bind-school` 均在 `routes.ts` 与 `router/index.tsx` 注册；`/legacy-profile`、`/legacy-profile/info`、`/legacy-profile/settings` 复用既有路由。
- 原型依据：用户 2026-09-07 上传紫色渐变截图 + 后续「保持卡博士 APP 淡金色风格」决策；与已验收的 ProfileHome 金色顶部区视觉一致。
- 状态/交互检查：详见上文状态矩阵与交互矩阵。
- 已知差异与未决项：B-037（换绑后是否通知原手机号）/ B-038（学号学院数据接口）继承自 T026，不阻塞 T037 UI 验收。
- 对应提交号：`57c0b3a` → `8609160`（共 8 个本地 commit，见「提交号」表）。

### 验收标准核对（11/11 通过）

1. ✅ 账号 + 密码登录 + 密码可见切换。
2. ✅ 任何账号 + 密码直接登录成功。
3. ✅ 右下角「正常 / 错误」演示态切换。
4. ✅ 错误态 4 次提交递减 N 4→1，第 5 次强制图形验证码。
5. ✅ 注册页（手机号 + 验证码 + 密码 + 二次确认）。
6. ✅ 微信授权 + 立即登录均能触发。
7. ✅ 登录/注册成功弹窗引导绑定学校 / 专业 / 学号。
8. ✅ ProfileHome 顶部摘要两行 pill。
9. ✅ 「我的」→「设置」→「退出登录」确认后跳回登录页。
10. ✅ 冷启动 `/` 跳登录页；登录后回 `/` 正常渲染。
11. ✅ `npm run typecheck` 与 `npm run build` 通过。

### 结论

T037 全部门槛通过，状态由 `Doing` 推进为 `PASS`，已 `git push origin preview`（不 merge main，等待用户评审）。