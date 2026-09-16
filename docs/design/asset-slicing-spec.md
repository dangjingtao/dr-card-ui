# 移动端物料切图规格表

面向设计同事的物料替换清单。只覆盖**位图物料**（32 个），不含 icon —— 项目内所有功能图标走 Lucide 矢量，页面背景、光晕、卡片底纹全部由 CSS 渐变 Token 实现，均**不需要切图**。

## 1. 尺寸口径

| 项 | 约定 |
| --- | --- |
| 设计基准视口 | 375 × 812 pt |
| 切图换算基准宽度 | **480 pt**（页面根容器 `PageContainer` 上限为 `max-w-[480px]`，大屏手机会拉伸到 480pt，按上限出图才不虚） |
| 展示尺寸（pt） | 素材在界面里的实际占位，单位为逻辑像素 |
| @2x | 展示尺寸 × 2 —— iOS @2x / Android xhdpi |
| @3x | 展示尺寸 × 3 —— iOS @3x / Android xxhdpi |
| 交付底线 | 至少满足 @3x；一张 @3x 图可由客户端降采样兼容 @2x |

**裁切方式的含义（决定构图要求）：**

- `cover`：素材会被**等比裁切填满**容器。主体必须居中留安全边，四周允许被切掉。
- `contain`：素材**完整显示**、不裁切。需要透明背景，且素材自身画面比例要与表中展示比例一致，否则会留白。

## 2. 全宽物料

宽度跟随容器，是最容易出错的一类。容器实际宽度已按 480pt 基准算好。

| 素材 | 展示尺寸 (pt) | 裁切 | @2x | @3x | 路由 | 页面位置 | 现有源图 | 需重出 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `home/home-banner-carousel.webp` | 480 × 269 | cover | 960 × 538 | 1440 × 807 | `/dearseed` | 页面顶部通栏 banner（375:210） | 375 × 210 | ⚠️ 是 |
| `home/home-banner-checkin.webp` | 448 × 149 | cover | 896 × 298 | 1344 × 448 | `/` | 首页轮播第 1 帧（3:1） | 2172 × 724 | 否 |
| `home/home-banner-wash-care.webp` | 448 × 149 | cover | 896 × 298 | 1344 × 448 | `/` | 首页轮播第 2 帧（3:1） | 1774 × 887 | 否 |
| `ip/brand-culture-longpage.webp` | 480 × 1697 | 原比例整图 | 960 × 3394 | 1440 × 5092 | `/brand-culture` | 品牌文化整页长图（1683:5950） | 1683 × 5950 | 否 |
| `member/member-lv4-hero.webp` | 448 × 自适应（约 180） | cover | 896 × 360 | 1344 × 540 | `/membership` | 顶部会员卡背景铺底 | 1672 × 941 | 否 |
| `member/membership-levels-reference-hero.webp` | 464 × 232 | cover | 928 × 464 | 1392 × 696 | `/membership/levels` | 顶部等级说明主视觉（2:1） | 768 × 384 | ⚠️ 是 |
| `member/checkin-dearseed-kit.webp` | 448 × 154 | cover | 896 × 308 | 1344 × 462 | `/dearseed` | 「本期活动」卡片底图（35% 透明度铺底） | 1920 × 1920 | 否，但需横构图 |

> `checkin-dearseed-kit.webp` 现为 1:1 方图，铺在 448×154 的横向卡片里会被裁掉上下大部分。像素量够，但建议单独出一版横构图。

## 3. 主视觉 / 插画

| 素材 | 展示尺寸 (pt) | 裁切 | @2x | @3x | 路由 | 页面位置 | 现有源图 | 需重出 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `bubble/checkin-ritual-hero-v2.webp` | 152 × 168 | contain | 304 × 336 | 456 × 504 | `/checkin` | 顶部打卡主视觉（右下角贴边） | 480 × 533 | 否（刚够） |
| `bubble/checkin-ritual-hero-v2.webp` | 128 × 128 | contain | 256 × 256 | 384 × 384 | `/checkin?overlay=…` | 打卡提醒弹窗内居中图（同素材复用） | 480 × 533 | 否 |
| `bubble/points-benefit-hero-v2.webp` | 235 × 190 | cover | 470 × 380 | 705 × 570 | `/points` | 顶部权益主视觉（右上角，左侧有渐隐蒙版） | 900 × 724 | 否 |
| `buddy/buddy-empty-hero-v2.webp` | 220 × 196 | contain | 440 × 392 | 660 × 588 | `/buddy` | 空态插画 | 1330 × 1182 | 否 |
| `luck/luck-draw-hero.webp` | 326 × 311 | contain | 652 × 622 | 978 × 933 | `/luck` | 抽奖主视觉（底部对齐） | 342 × 326 | ⚠️ 是 |
| `dialog/dialog-prompt-bottle.webp` | 78 × 106 | contain | 156 × 212 | 234 × 318 | `/dearseed?overlay=newcomer`<br>`/dearseed?overlay=app-guide`<br>`/profile` 弹窗 | 弹窗内产品瓶（3 处同尺寸复用） | 132 × 247 | ⚠️ 是 |

> 左侧渐隐是代码里的 CSS 蒙版实现，`points-benefit-hero-v2.webp` 出图时**不要自带渐隐**，给完整画面即可。

## 4. 商品 / 卡面

| 素材 | 展示尺寸 (pt) | 裁切 | @2x | @3x | 路由 | 页面位置 | 现有源图 | 需重出 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `exchange/exchange-pick-shampoo-a.webp` | 64 × 96 | contain | 128 × 192 | 192 × 288 | `/checkin`、`/dearseed` | 两页的商品二选一 / 精选卡图框（2:3） | 155 × 290 | ⚠️ 是 |
| `exchange/exchange-pick-shampoo-b.webp` | 64 × 96 | contain | 128 × 192 | 192 × 288 | `/checkin`、`/dearseed` | 同上，第 2 款 | 133 × 246 | ⚠️ 是 |
| `exchange/profile-hot-berry.webp` | 202 × 152 | cover | 404 × 304 | 606 × 456 | `/exchange` | 兑换列表商品图（两列，4:3） | 104 × 146 | ⚠️ 是 |
| `exchange/profile-hot-honey.webp` | 202 × 152 | cover | 404 × 304 | 606 × 456 | `/exchange` | 同上 | 104 × 146 | ⚠️ 是 |
| `exchange/profile-hot-seasalt.webp` | 202 × 152 | cover | 404 × 304 | 606 × 456 | `/exchange` | 同上 | 104 × 146 | ⚠️ 是 |
| `exchange/profile-hot-herbal.webp` | 202 × 152 | cover | 404 × 304 | 606 × 456 | `/exchange` | 同上 | 104 × 146 | ⚠️ 是 |
| `member/checkin-dearseed-kit.webp` | 92 × 92 | cover | 184 × 184 | 276 × 276 | `/membership` | 活动卡右侧缩略图 | 1920 × 1920 | 否 |
| `member/member-card-rose.webp` | 164 × 96 | cover | 328 × 192 | 492 × 288 | `/membership/levels` | 卡面列表第 1 张（77:45） | 770 × 450 | 否 |
| `member/member-card-lavender.webp` | 164 × 96 | cover | 328 × 192 | 492 × 288 | `/membership/levels` | 卡面列表第 2 张 | 770 × 450 | 否 |
| `member/member-card-ocean.webp` | 164 × 96 | cover | 328 × 192 | 492 × 288 | `/membership/levels` | 卡面列表第 3 张 | 770 × 450 | 否 |
| `member/member-card-emerald.webp` | 164 × 96 | cover | 328 × 192 | 492 × 288 | `/membership/levels` | 卡面列表第 4 张 | 770 × 450 | 否 |

> `profile-hot-*.webp` 四张图一图三用：`/exchange` 列表 202×152（4:3 横）、`/exchange` 兑换弹层 80×80（1:1）、`/profile` 热门体验券 104×104（1:1）。**按最大的 202×152 出图，且主体居中**，才能同时满足方图裁切。

## 5. 小尺寸功能图

| 素材 | 展示尺寸 (pt) | 裁切 | @2x | @3x | 路由 | 页面位置 | 现有源图 | 需重出 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `home/home-icon-shower.webp` | 64 × 64 | cover | 128 × 128 | 192 × 192 | `/` | 快捷入口「淋浴」 | 1024 × 1024 | 否 |
| `home/home-icon-water.webp` | 64 × 64 | cover | 128 × 128 | 192 × 192 | `/` | 快捷入口「饮水」 | 1024 × 1024 | 否 |
| `home/home-icon-dryer.webp` | 64 × 64 | cover | 128 × 128 | 192 × 192 | `/` | 快捷入口「烘干」 | 1024 × 1024 | 否 |
| `home/home-icon-blower.webp` | 64 × 64 | cover | 128 × 128 | 192 × 192 | `/` | 快捷入口「吹风」 | 1024 × 1024 | 否 |
| `bubble/points-benefit-checkin.webp` | 72 × 72 | contain | 144 × 144 | 216 × 216 | `/points` | 权益列表「每日打卡」行图 | 384 × 384 | 否 |
| `bubble/points-benefit-voucher.webp` | 72 × 72 | contain | 144 × 144 | 216 × 216 | `/points` | 权益列表「兑换券」行图 | 384 × 384 | 否 |
| `bubble/checkin-bubble-3d.webp` | 24 × 24 | contain | 48 × 48 | 72 × 72 | `/exchange` | 顶部泡泡值余额按钮内小球 | 148 × 153 | 否 |

> 快捷入口四张图是 64×64 圆角容器内 `cover` 铺满，**不是透明 icon**，是带底色的方形贴图，替换时需保留自带背景。

## 6. 头像占位图

均为圆形裁切，出图需按方图、主体居中。

| 素材 | 展示尺寸 (pt) | 裁切 | @2x | @3x | 路由 | 页面位置 | 现有源图 | 需重出 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `home/home-avatar.webp` | 64 × 64（最大用例） | cover 圆形 | 128 × 128 | 192 × 192 | `/profile` 64、`/dearseed` 48、`/settings` 44、`/` 40 | 4 处头像，同一素材 | 1920 × 1920 | 否 |
| `buddy/buddy-avatar-xiaomei.webp` | 80 × 80（最大用例） | cover 圆形 | 160 × 160 | 240 × 240 | `/buddy/accept` 80、`/buddy` 48、`/buddy/invite/phone` 48 | 好友头像 | 1398 × 817 | 否，但需方构图 |
| `buddy/buddy-avatar-self.webp` | 56 × 56 | cover 圆形 | 112 × 112 | 168 × 168 | `/buddy/invite` | 本人头像 | 1288 × 2048 | 否，但需方构图 |

> 两张 `buddy-avatar-*` 现为非方图（1398×817 横、1288×2048 竖），圆形裁切后会切掉大量画面。像素量够，建议出方图。

## 7. 需重新出图汇总（11 张）

以下素材现有源图**达不到 @3x**（部分连 @2x 都不够），是本次替换的优先项：

| 素材 | 现有源图 | @3x 需求 | 缺口 |
| --- | --- | --- | --- |
| `home/home-banner-carousel.webp` | 375 × 210 | 1440 × 807 | 仅 1x，缺口最大 |
| `member/membership-levels-reference-hero.webp` | 768 × 384 | 1392 × 696 | 连 @2x（928×464）都不够 |
| `luck/luck-draw-hero.webp` | 342 × 326 | 978 × 933 | 连 @2x（652×622）都不够 |
| `dialog/dialog-prompt-bottle.webp` | 132 × 247 | 234 × 318 | 连 @2x（156×212）都不够 |
| `exchange/exchange-pick-shampoo-a.webp` | 155 × 290 | 192 × 288 | 宽度不足 |
| `exchange/exchange-pick-shampoo-b.webp` | 133 × 246 | 192 × 288 | 宽高均不足 |
| `exchange/profile-hot-berry.webp` | 104 × 146 | 606 × 456 | 严重不足 |
| `exchange/profile-hot-honey.webp` | 104 × 146 | 606 × 456 | 严重不足 |
| `exchange/profile-hot-seasalt.webp` | 104 × 146 | 606 × 456 | 严重不足 |
| `exchange/profile-hot-herbal.webp` | 104 × 146 | 606 × 456 | 严重不足 |
| `member/checkin-dearseed-kit.webp` | 1920 × 1920 | 1344 × 462 | 像素够，但需补横构图版本 |

## 8. 未纳入本表的素材

`src/assets/brand/` 下另有 3 个文件在代码中**已无任何引用**，不在替换范围内：

- `bubble/points-benefit-hero.webp`（页面已切换到 `-v2`）
- `member/member-levels-hero.webp`
- `buddy/buddy-ip-shower.webp`

摹客原型中尚未落地到代码的素材同样不在本表内。
