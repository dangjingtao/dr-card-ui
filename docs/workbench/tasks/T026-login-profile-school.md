# T026｜注册登录与个人信息

## 状态与类型

- 状态：`Done`
- 类型：Feature / UI
- 优先级：P2

## 当前事实与差距

- 当前 APP 已接入微信授权登录，但登录后绑定学校与学号未实现。

- 会议讨论决定：可提供换绑功能（参照小程序逻辑）。

- 头像：原有付费头像方案取消，改为免费修改头像。

- 学号学院显示功能缺失，需要带明确信息展示。

## 目标

1. 注册登录支持换绑（参照小程序）。
2. 头像支持免费修改（取消付费方案）。
3. 个人信息页面展示学号与学院信息。

## 原型范围

- 需求来源：`卡博士APP缺失及新增功能.xlsx` Sheet1「注册/登录」「头像」「学号学院」「编辑」+ 2026-08-31 会议笔记。

## 不在范围

- 不做付费头像库。

- 不做头像框等装饰性增值功能。

## 落地

- `PersonalInfo.tsx`：USER\_INFO 新增 `realName/studentId/school/academy`（mock：广州大学 / 计算机科学与网络工程学院 / 20221145141215），INFO\_ITEMS 顺序：头像/用户名/昵称/真实姓名/学号/学校/学院/手机/邮箱，手机项跳 `/legacy-profile/phone-change`，头像项 + 真实姓名项合并指向 `/legacy-profile/edit`（合一编辑）。手机号字段改为从 `userInfoStore` 读取，换绑成功后自动同步刷新。

- `EditProfile.tsx`（新建，T026 实施要求第 4 条）：合一编辑 头像/昵称/真实姓名，含 9 宫格头像选择、字长度校验、loading、保存回写 store 后跳回 `/legacy-profile/info`。

- `AvatarEditPage.tsx`（独立改头像入口）：28×28 头像预览 + 相机浮标 + 4×3 共 9 个预置头像网格 + 相册/拍照 + 淡金保存。保存时调用 `userInfoActions.update({ avatar })` 回写 store，PersonalInfo 头像列实时刷新。

- `PhoneChangePage.tsx`：三步式「原号验证 → 新号验证 → 换绑成功」，步骤 1 自动带入当前手机号（只读）+ 验证码，步骤 2 输入新号 + 验证码；11 位中国大陆手机号格式校验；独立 60s 倒计时；异步请求模拟（步骤 2 15% 概率失败以演示错误态）；步骤 3 显示新/旧手机号对比 + 「返回个人中心」按钮。成功后调用 `userInfoActions.update({ phone })` 回写个人信息。

- `LoginPage.tsx`：微信授权登录主按钮 + 协议勾选 + 模拟授权成功回调 + 「换绑手机号」二级入口（参照小程序交互：登录页提供换绑链接，方便换设备后切回原账号）。

- `EditNickname.tsx`：保存时回写 `userInfoActions.update({ nickname })`，PersonalInfo 昵称列实时刷新。

- `userInfoStore.ts` + `createSimpleStore.ts`（新建）：极简跨页面共享 store（useXxx hook + actions），PersonalInfo / PhoneChangePage / AvatarEditPage / EditProfile / EditNickname / LoginPage 共享同一份用户信息。

- 路由注册：`src/app/router/index.tsx`（imports + `customPages`）与 `src/app/router/routes.ts`（ROUTES 数组）同步添加 `avatar-edit / phone-change / login / edit` 四条新路径（避免 `*` NotFound 兜底）。

- `npm run typecheck` 通过。

## 依赖与阻塞决策

| 编号    | 阻塞项       | 风险 | 说明                |
| ----- | --------- | -- | ----------------- |
| B-037 | 换绑手机号通知规则 | 中  | 换绑后是否通知原手机号，需产品确认 |
| B-038 | 学号学院数据来源  | 高  | 需确认学号学院数据接口与展示字段  |

## 实施要求

- 注册登录页增加「换绑」入口，交互参照小程序。

- 个人信息页（`/profile` 或 `/settings`）增加头像编辑入口，支持从相册选择/拍照。

- 个人信息页增加学号、学院字段展示。

- 编辑资料页支持头像、昵称、个人信息的修改。

## 状态与交互矩阵

- 注册登录默认态（微信授权）。

- 换绑操作流程（获取验证码 → 确认 → 换绑成功）。

- 头像编辑（相册选择 / 拍照 / 预览 / 保存）。

- 学号学院展示态。

## 验收标准

- 用户可完成换绑操作，流程与小程序一致。

- 头像可免费修改，保存后更新。

- 学号与学院在个人信息页正确展示。

