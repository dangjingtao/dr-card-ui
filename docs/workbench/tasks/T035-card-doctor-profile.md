# T035｜卡博士个人中心

## 状态与类型

- 状态：`Done`
- 类型：UI / Profile / Account
- 优先级：P0

## 施工范围（7 个页面）

| 页面 | 路由 | 说明 |
| --- | --- | --- |
| 个人中心首页 | `/legacy-profile` | 淡金渐变顶 + 头像+昵称+账号+设置 / 我的订单五宫格 / 快捷功能四宫格 |
| 个人信息 | `/legacy-profile/info` | 二维码+账号 / 头像 / 用户名 / 昵称 / 真实姓名 / 手机 / 邮箱 |
| 修改昵称 | `/legacy-profile/nickname` | 输入框 + 保存按钮 |
| 绑定邮箱 | `/legacy-profile/email` | 邮箱输入 + 验证码 + 获取验证码倒计时 + 绑定 |
| 绑定手机 | `/legacy-profile/phone` | 手机号 + 验证码 + 密码 + 密码提示 + 绑定 |
| 设置 | `/legacy-profile/settings` | 8 项列表（退款/退款记录/支付配置/修改密码/在线设备/协议/隐私/注销）+ 退出登录 |
| 订单列表 | `/legacy-profile/orders` | 6 Tab 切换 + 订单卡片列表 + 空状态 |

## 设计风格

- 卡博士淡金风格（主色 `#D4A853` / `#B8893D` / `#E8C97A`）
- 浅色背景 `#F8F8FA`，白色卡片带细边框
- 顶部个人中心页用淡金渐变背景，其余二级页浅色 + 居中标题 + 返回按钮
- 底部导航三项：首页 / 服务 / 我的（高亮正确切换）

## 已完成项

- [x] 个人中心首页（头像区 + 我的订单五宫格 + 快捷功能四宫格）
- [x] 个人信息页（二维码 + 6 项信息列表）
- [x] 修改昵称页
- [x] 绑定邮箱页（含获取验证码倒计时）
- [x] 绑定手机页（含密码显示/隐藏、密码规则提示）
- [x] 设置页（8 项设置 + 退出登录确认弹窗）
- [x] 订单列表页（6 Tab + 订单卡片 + 空状态）
- [x] 底部导航「我的」Tab 跳转与高亮
- [x] 路由注册与 typecheck 通过

## 跳转关系

- 底部 Tab「我的」→ `/legacy-profile`
- 头像/昵称 → `/legacy-profile/info`
- 设置齿轮 → `/legacy-profile/settings`
- 我的订单 → `/legacy-profile/orders?tab=all`（各 Tab 对应 ?tab=xxx）
- 我的小票 → 占位（待 T025/T031 定义）
- 常用设备 / 收藏设备 → 占位
- 报修 → `/legacy-service/repair/projects`
- 昵称 → `/legacy-profile/nickname`
- 手机 → `/legacy-profile/phone`
- 邮箱 → `/legacy-profile/email`

## 工程信息

- 新增文件：`src/pages/legacy/` 下 7 个页面组件
- 修改文件：`src/app/router/routes.ts`、`src/app/router/index.tsx`
- typecheck：通过
- build：待验证

## 已知遗留项

- 我的小票、常用设备、收藏设备入口暂未做跳转（对应功能页尚未定义）
- 设置页各子项（退款、支付流程配置等）暂为占位，点击无跳转
- 订单详情页未做（「订单详情」按钮为视觉占位）
