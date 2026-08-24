import type { LucideIcon } from 'lucide-react'
import { CircleDot, Headset, Home, QrCode, UserRound } from 'lucide-react'

/**
 * T004 路由注册表（单一事实源）
 * -------------------------------------------------------------
 * 把 60 个实施节点映射到「路由 + fixture 状态 / overlay」。
 * 业务页视觉由 T005–T013 各自完成；本注册表只负责路径、节点、入口、
 * 返回目标、状态参数与任务卡归属，保证每个节点可复现定位。
 *
 * 主导航决策（2026-08-21 用户确认，记录于 docs/workbench/route-table.md）：
 * - 保留底部 Tab：首页 / 卡包 / 兑换 / 我的（用户确认"不靠谱的设计历史"中的
 *   Tab 结构为可靠参考，主入口为 APP 首页）。
 * - 根路由 `/` = APP 首页；`/dearseed` = 独立的诗得丽专栏。
 * - H5 商城（#17/#48/#49）承载为 WebView 边界页。
 */

export type OverlayType = 'dialog' | 'sheet'

export interface RouteState {
  /** URL `?state=` 取值 */
  key: string
  /** 对应摹客节点 */
  node: number
  /** 状态说明 */
  label: string
}

export interface RouteOverlay {
  /** URL `?overlay=` 取值 */
  key: string
  /** 对应摹客节点 */
  node: number
  label: string
  type: OverlayType
}

export interface RouteMeta {
  path: string
  /** 是否一级 Tab（显示底部导航） */
  tab?: boolean
  /** 一级 Tab 从左到右顺序 */
  tabOrder?: number
  /** 是否为中间凸起的主操作 */
  tabFab?: boolean
  /** Tab 标签 */
  label?: string
  icon?: LucideIcon
  /** TopAppBar / 页面标题 */
  title: string
  /** 标题栏模式；默认二级页为 back */
  titleBar?: 'plain' | 'back' | 'hidden'
  /** 标题栏展示文案与页面业务标题不同时单独指定 */
  titleBarTitle?: string
  /** 标题栏右侧动作 */
  titleBarAction?: 'settings' | 'notifications'
  /** 本路由承载的实施节点 */
  nodes: number[]
  /** 所属任务卡 */
  task: string
  /** 入口描述 */
  entry?: string
  /** 返回目标 */
  returnTo?: string
  /** 确定性 fixture 状态（`?state=`） */
  states?: RouteState[]
  /** 可复现弹层（`?overlay=`） */
  overlays?: RouteOverlay[]
  /** 边界类型：H5 WebView 边界页 */
  boundary?: 'webview'
  /** 页面归属说明 */
  owner?: string
}

export const ROUTES: RouteMeta[] = [
  /* ────────── 一级 Tab：以 reference/首页.html 的五项 TabBar 为准 ────────── */
  {
    path: '/',
    tab: true,
    tabOrder: 1,
    label: '首页',
    icon: Home,
    title: '卡博士',
    titleBar: 'plain',
    titleBarTitle: '首页',
    nodes: [],
    task: 'T005',
    entry: 'APP 主入口',
    returnTo: '—（根首页）',
    owner: '卡博士 APP 首页（与诗得丽专栏分离）',
  },
  {
    path: '/card',
    title: '卡包',
    titleBarTitle: '卡包',
    titleBar: 'back',
    nodes: [54, 62, 63, 64],
    task: 'T009',
    entry: '底部 Tab「卡包」；我的-卡包',
    returnTo: '底部 Tab；我的',
    states: [
      { key: 'available', node: 62, label: '卡包-可用' },
      { key: 'used', node: 63, label: '卡包-已使用' },
      { key: 'expired', node: 64, label: '卡包-已过期' },
    ],
    overlays: [{ key: 'use', node: 62, label: '使用方式选择', type: 'sheet' }],
    owner: '卡包（T009；reference 标准页）',
  },
  {
    path: '/exchange',
    title: '洗护兑换专区',
    nodes: [18, 37, 38],
    task: 'T008',
    entry: '底部 Tab「兑换」；首页-兑换商城',
    returnTo: '底部 Tab；首页',
    states: [
      { key: 'sort-exchange', node: 37, label: '兑换量排行' },
      { key: 'sort-points', node: 38, label: '泡泡值排行' },
    ],
    overlays: [{ key: 'redeem', node: 39, label: '商品兑换弹窗', type: 'sheet' }],
    owner: '洗护兑换专区（T008 施工；语义已从「兑换码页」纠正）',
  },
  {
    path: '/profile',
    tab: true,
    tabOrder: 5,
    label: '我的',
    icon: UserRound,
    title: '我的',
    titleBarAction: 'notifications',
    nodes: [19, 20],
    task: 'T011',
    entry: '底部 Tab「我的」；首页-个人区',
    returnTo: '底部 Tab；首页',
    overlays: [{ key: 'app-prompt', node: 20, label: 'APP 弹窗（能力引导）', type: 'dialog' }],
    owner: '我的（T011 已施工；reference 标准页）',
  },

  /* ────────────────────────── T005 专栏首页与新人流程 ────────────────────────── */
  {
    path: '/dearseed',
    title: '诗得丽专栏',
    titleBarTitle: 'DearSeed',
    titleBarAction: 'notifications',
    nodes: [2, 23],
    task: 'T005',
    entry: '卡博士首页-「诗得丽品牌专栏」',
    returnTo: '卡博士首页',
    states: [{ key: 'claimed', node: 23, label: '领取完专栏状态' }],
    overlays: [
      { key: 'reminder', node: 4, label: '每日打卡提示', type: 'dialog' },
      { key: 'newcomer', node: 12, label: '新人弹窗', type: 'dialog' },
      { key: 'app-guide', node: 13, label: '引导弹窗（APP 下载）', type: 'dialog' },
    ],
    owner: '诗得丽品牌专栏独立业务首页（用户 2026-08-24 确认与 APP 首页分离）',
  },
  {
    path: '/onboarding',
    title: '完善信息',
    nodes: [14, 24],
    task: 'T005',
    entry: '首页-新人弹窗「去完善信息」',
    returnTo: '诗得丽专栏首页',
    states: [{ key: 'student', node: 24, label: '完善信息（学生）' }],
    owner: '完善信息分步 onboarding（T005 施工）',
  },
  {
    path: '/onboarding/success',
    title: '填写完成后领取成功',
    /* 原型是叠在专栏首页上的成功弹窗，非独立页面：标题栏与首页一致，不出返回箭头 */
    titleBar: 'plain',
    titleBarTitle: 'DearSeed',
    nodes: [25],
    task: 'T005',
    entry: '完善信息「确认信息」提交成功',
    returnTo: '诗得丽专栏首页',
    owner: '新人资料完成后的权益反馈（T005 施工）',
  },
  {
    path: '/claim/success',
    title: '领取成功',
    /* 同 #25：专栏背景 + 遮罩 + 居中弹窗，标题栏沿用专栏 */
    titleBar: 'plain',
    titleBarTitle: 'DearSeed',
    nodes: [15],
    task: 'T005',
    entry: '诗得丽专栏-本期活动达标领取',
    returnTo: '诗得丽专栏首页（已领取态）',
    owner: '活动卡券领取反馈（T005 施工）',
  },
  {
    path: '/brand-culture',
    title: '品牌文化',
    nodes: [16],
    task: 'T005',
    entry: '诗得丽专栏-「品牌文化」',
    returnTo: '诗得丽专栏首页',
    owner: '品牌文化长页（T005 施工；用户定案只铺原型长图、无浮动 CTA，B-001 已关闭）',
  },

  /* ────────────────────────── T006 会员、泡泡值、打卡与澡运 ────────────────────────── */
  {
    path: '/points',
    tab: true,
    tabOrder: 2,
    label: '泡泡',
    icon: CircleDot,
    title: '泡泡值明细',
    nodes: [5],
    task: 'T006',
    entry: '诗得丽专栏/我的-泡泡值余额；会员中心',
    returnTo: '诗得丽专栏首页 / 我的',
    states: [
      { key: 'income', node: 5, label: '泡泡值明细-仅收入' },
      { key: 'expense', node: 5, label: '泡泡值明细-仅消耗' },
      { key: 'empty', node: 5, label: '泡泡值明细-无记录' },
    ],
    owner: '泡泡值资产流水（T006 施工）',
  },
  {
    path: '/membership',
    tab: true,
    tabOrder: 4,
    label: '服务',
    icon: Headset,
    title: '会员中心',
    titleBarAction: 'settings',
    nodes: [6],
    task: 'T006',
    entry: '诗得丽专栏-「会员空间」',
    returnTo: '诗得丽专栏首页',
    owner: '会员玩法分发（T006 施工）',
  },
  {
    path: '/membership/levels',
    title: '会员等级',
    nodes: [26],
    task: 'T006',
    entry: '会员中心-等级入口',
    returnTo: '会员中心',
    owner: '会员等级展示稿（T006 施工）',
  },
  {
    path: '/checkin',
    title: '打卡日历',
    titleBarTitle: '每日打卡',
    nodes: [21, 8, 4, 22],
    task: 'T006',
    entry: '诗得丽专栏-本期活动「打卡」；会员中心',
    returnTo: '诗得丽专栏首页 / 会员中心',
    states: [{ key: 'success', node: 8, label: '打卡成功' }],
    overlays: [
      { key: 'reminder', node: 4, label: '打卡提示弹窗', type: 'dialog' },
      { key: 'make-up-success', node: 22, label: '补打卡成功弹窗', type: 'dialog' },
    ],
    owner: '月度签到/补签（T006 施工）',
  },
  {
    path: '/luck',
    title: '今日澡运',
    nodes: [7],
    task: 'T006',
    entry: '诗得丽专栏-本期活动「今日澡运」；会员中心',
    returnTo: '诗得丽专栏首页 / 会员中心',
    states: [{ key: 'drawn', node: 7, label: '今日澡运-当天已抽过' }],
    owner: '每日抽签玩法（T006 施工）',
  },
  {
    path: '/luck/result',
    title: '抽取成功',
    titleBarTitle: '今日澡运',
    nodes: [41],
    task: 'T006',
    entry: '今日澡运-抽取',
    returnTo: '今日澡运 / 诗得丽专栏首页',
    states: [
      { key: 'great', node: 41, label: '抽取成功-大吉' },
      { key: 'good', node: 41, label: '抽取成功-中吉' },
      { key: 'minor', node: 41, label: '抽取成功-小吉' },
    ],
    owner: '抽签结果（T006 施工；确定性 fixture，去随机化）',
  },

  /* ────────────────────────── T007 搭子与邀请闭环 ────────────────────────── */
  {
    path: '/buddy',
    title: '洗头搭子',
    nodes: [27, 28],
    task: 'T007',
    entry: '首页/我的-绑定搭子',
    returnTo: '诗得丽专栏首页 / 我的',
    /* #28 原型画了 4 行完全相同的「小美」，属占位重复；multi 档仅为覆盖「多搭子」，
     * 不引入历史 T07 稿的 4 人 mock（B-004）。 */
    states: [
      { key: 'empty', node: 27, label: '搭子（无）' },
      { key: 'list', node: 28, label: '搭子（有）-单搭子' },
      { key: 'multi', node: 28, label: '搭子（有）-多搭子' },
    ],
    owner: '搭子空态/有态（T007 施工；默契值 #31 先不做，见 T014）',
  },
  {
    path: '/buddy/invite',
    title: '邀请搭子',
    nodes: [29],
    task: 'T007',
    entry: '搭子-二维码邀请',
    returnTo: '搭子',
    owner: '二维码邀请卡与更多分享方式（T007 施工）',
  },
  {
    path: '/buddy/invite/qrcode',
    title: '邀请搭子',
    nodes: [34, 35],
    task: 'T007',
    entry: '邀请搭子-保存到本地 / 复制链接',
    returnTo: '邀请搭子',
    /* ⚠️ 原型只画了保存成功（#34）与复制成功（#35）；两个 *-failed 是任务卡要求的
     * 可复现失败态，按 D-056 只能由 `?state=` 驱动，页面内真实操作恒定成功（B-005）。 */
    states: [
      { key: 'saved', node: 34, label: '二维码保存到本地（成功）' },
      { key: 'poster-failed', node: 34, label: '海报保存失败（仅 ?state= 复现）' },
      { key: 'link-copied', node: 35, label: '生成分享链接（复制成功）' },
      { key: 'link-failed', node: 35, label: '链接复制失败（仅 ?state= 复现）' },
    ],
    owner: '分享海报/链接（T007 施工；统一走分享适配层）',
  },
  {
    path: '/buddy/invite/phone',
    title: '手机号邀请',
    /* 摹客 #32 标题栏写的是「搜索搭子」，页面树名是「手机号邀请」；
     * 标题栏取原型实际文案，页面树名保留在 title 供索引与任务卡对齐。 */
    titleBarTitle: '搜索搭子',
    nodes: [32, 33],
    task: 'T007',
    entry: '搭子-手机号邀请',
    returnTo: '搭子',
    states: [
      { key: 'searching', node: 32, label: '搜索中' },
      { key: 'invitable', node: 32, label: '搜索结果-可邀请' },
      { key: 'not-found', node: 32, label: '搜索结果-未找到' },
      { key: 'invited', node: 32, label: '搜索结果-已邀请（重复邀请）' },
      { key: 'success', node: 33, label: '手机号邀请成功' },
    ],
    owner: '手机号搜索邀请（T007 施工；号码→结果为确定性映射，禁止随机）',
  },
  {
    path: '/buddy/invite/scan',
    title: '邀请搭子（没 APP）',
    nodes: [30],
    task: 'T007',
    /* 用户 2026-08-24 定案（D-055）：#30 只有一行「应用商店H5」占位文案，
     * 按「WebView 边界页 + 唤起弹窗」两态承载，不伪造任何应用商店视觉。 */
    states: [
      { key: 'no-app', node: 30, label: '未安装 APP-应用商店 H5' },
      { key: 'has-app', node: 30, label: '已安装 APP-弹窗提示跳转' },
    ],
    entry: '微信扫描搭子邀请二维码',
    returnTo: '（外部承接，无应用内返回）',
    owner: '被邀请人扫码承接（T007 施工；显式标注边界，不实现真实唤起）',
  },
  {
    path: '/buddy/accept',
    title: '接受邀请',
    /* 原型是诗得丽专栏首页背景 + 邀请弹窗，不出现二级返回栏。 */
    titleBar: 'plain',
    titleBarTitle: 'DearSeed',
    nodes: [36],
    task: 'T007',
    entry: '被邀请人链路（深链 / 扫码后已装 APP）',
    returnTo: '搭子（已绑定）',
    /* #36 只有一个「接受邀请」按钮 + 右上角关闭图标，没有取消按钮；
     * dismissed 即点关闭图标后停留在专栏首页背景上的取消路径。 */
    states: [
      { key: 'dismissed', node: 36, label: '取消（关闭弹窗）' },
    ],
    owner: '接受邀请确认（T007 施工）',
  },

  /* ────────────────────────── T008 洗护兑换与商城链路 ────────────────────────── */
  {
    path: '/mall',
    title: '卡博士商城',
    nodes: [17],
    task: 'T008',
    boundary: 'webview',
    entry: '诗得丽专栏-服务区「核心商城」',
    returnTo: '诗得丽专栏首页',
    states: [
      { key: 'loading', node: 17, label: 'H5 加载中' },
      { key: 'loaded', node: 17, label: 'H5 已加载' },
      { key: 'error', node: 17, label: 'H5 失败' },
    ],
    owner: 'H5 商城（WebView 边界页，用户确认）',
  },
  {
    path: '/mall/goods/:id',
    title: '商品详情',
    nodes: [48],
    task: 'T008',
    boundary: 'webview',
    entry: 'H5 商城-商品',
    returnTo: 'H5 商城列表',
    owner: 'H5 商城商品详情（WebView 边界页）',
  },
  {
    path: '/mall/cart',
    title: '购物车',
    nodes: [49],
    task: 'T008',
    boundary: 'webview',
    entry: 'H5 商城-购物车入口',
    returnTo: 'H5 商城列表',
    owner: 'H5 商城购物车（WebView 边界页）',
  },
  {
    path: '/exchange/result',
    title: '存入卡包',
    nodes: [40],
    task: 'T008',
    entry: '洗护兑换专区-商品兑换确认',
    returnTo: '洗护兑换专区',
    owner: '兑换成功入包反馈（T008 施工）',
  },

  /* ────────────────────────── T009 卡包、核销、转赠与兑换码 ────────────────────────── */
  {
    path: '/redeem',
    title: '兑换卡券',
    nodes: [68, 69],
    task: 'T009',
    entry: '我的-卡券兑换；卡包入口',
    returnTo: '我的 / 卡包',
    states: [
      { key: 'success', node: 69, label: '兑换成功' },
      { key: 'format', node: 68, label: '兑换失败-格式错误' },
      { key: 'invalid', node: 68, label: '兑换失败-兑换码无效' },
      { key: 'used', node: 68, label: '兑换失败-已被使用' },
      { key: 'network', node: 68, label: '兑换失败-网络异常' },
    ],
    owner: '兑换码输入（T009 施工；8/11/12 位规则 ⚠️ 待确认 B-009，规则收在 REDEEM_CODE_RULE）',
  },
  {
    path: '/card/share',
    title: '分享',
    nodes: [65, 66],
    task: 'T009',
    entry: '卡包-可用券「转赠」按钮（reference/卡包.html 原型按钮文案；本页标题按 reference/分享.html 为「分享」）',
    returnTo: '卡包',
    states: [{ key: 'success', node: 66, label: '分享成功' }],
    owner: '分享对象选择与分享成功（T009；B-015 已关闭，按原型做搭子列表夹具，不做接受/次数/时效/持久化）',
  },
  {
    path: '/card/verify',
    tab: true,
    tabOrder: 3,
    tabFab: true,
    label: '扫码',
    icon: QrCode,
    title: '扫码核销',
    titleBar: 'hidden',
    nodes: [67],
    task: 'T009',
    entry: '卡包-可用券「使用」',
    returnTo: '卡包',
    owner: '扫码核销（T009；reference 标准页）',
  },
  {
    path: '/card/verify/password',
    title: '消费密码核销',
    titleBarTitle: '消费密码核销',
    titleBar: 'back',
    nodes: [67],
    task: 'T009',
    entry: '卡包-使用-消费密码核销',
    returnTo: '卡包',
    owner: '6 位消费密码核销（T009；reference 标准页）',
  },
  {
    path: '/card/verify/confirm',
    title: '确认核销',
    titleBar: 'plain',
    titleBarTitle: '确认核销',
    nodes: [67],
    task: 'T009',
    entry: '扫码/密码核销确认',
    returnTo: '卡包',
    states: [
      { key: 'done', node: 67, label: '核销成功' },
      { key: 'repeat', node: 67, label: '重复核销拦截' },
    ],
    owner: '确认核销与核销结果（T009；reference 标准页；重复核销判定 ⚠️ 待确认）',
  },

  /* ────────────────────────── T010 地址与订单 ────────────────────────── */
  {
    path: '/address',
    title: '地址管理',
    titleBarTitle: '地址管理',
    titleBar: 'back',
    nodes: [55],
    task: 'T010',
    entry: '我的-地址管理；H5 商城地址',
    returnTo: '我的 / H5 商城',
    states: [{ key: 'empty', node: 55, label: '无收货地址' }],
    owner: '商城地址列表（T010；默认置顶 + 切换默认地址）',
  },
  {
    path: '/address/new',
    title: '添加新地址',
    titleBarTitle: '添加新地址',
    titleBar: 'back',
    nodes: [60],
    task: 'T010',
    entry: '地址管理-添加新地址 / 编辑（?id=）',
    returnTo: '地址管理',
    states: [{ key: 'invalid', node: 60, label: '必填校验未通过' }],
    owner: '新增与回填编辑收货地址（T010；编辑页与行政区划 ⚠️ 待确认 B-027，粘贴识别 ⚠️ 待确认 B-028）',
  },
  {
    path: '/orders',
    title: '订单管理',
    titleBarTitle: '订单管理',
    titleBar: 'back',
    nodes: [56],
    task: 'T010',
    entry: '我的-订单管理',
    returnTo: '我的',
    states: [
      { key: 'completed', node: 56, label: '已完成 Tab' },
      { key: 'ongoing', node: 56, label: '进行中 Tab' },
      { key: 'aftersale', node: 56, label: '售后中 Tab' },
      { key: 'empty', node: 56, label: '暂无订单' },
    ],
    owner: '商城订单列表（T010；四 Tab；订单状态全集 ⚠️ 待确认 B-029）',
  },
  {
    path: '/orders/:id',
    title: '订单详情',
    titleBarTitle: '订单详情',
    titleBar: 'back',
    nodes: [72],
    task: 'T010',
    entry: '订单管理-订单项',
    returnTo: '订单管理',
    owner: '单笔订单详情（T010；金额与运费规则 ⚠️ 待确认 B-030）',
  },

  /* ────────────────────────── T011 我的、设置与 APP 引导 ────────────────────────── */
  {
    path: '/settings',
    title: '资料设置',
    titleBarTitle: '资料设置',
    titleBar: 'back',
    nodes: [59, 61],
    task: 'T011',
    entry: '我的-资料区/头像',
    returnTo: '我的',
    overlays: [{ key: 'discard', node: 61, label: '放弃修改确认', type: 'dialog' }],
    owner: '资料修改闭环（T011；reference 标准页）',
  },

  /* ────────────────────────── T012 通知与消息详情 ────────────────────────── */
  {
    path: '/notifications',
    title: '通知',
    titleBarTitle: '通知',
    titleBar: 'back',
    nodes: [11, 42, 43],
    task: 'T012',
    entry: '首页/我的-通知入口',
    returnTo: '诗得丽专栏首页 / 我的',
    states: [{ key: 'unread', node: 42, label: '通知副本（未读数量）' }],
    overlays: [{ key: 'clear', node: 43, label: '清除消息确认', type: 'dialog' }],
    owner: '消息列表（T012；reference 标准页 4 Tab）',
  },
  {
    path: '/notifications/:id',
    title: '消息详情',
    titleBarTitle: '消息详情',
    titleBar: 'back',
    nodes: [44],
    task: 'T012',
    entry: '通知-消息项',
    returnTo: '通知列表',
    owner: '单条消息正文（T012；reference 标准页）',
  },

  /* ────────────────────────── T013 福利官、智能/人工客服 ────────────────────────── */
  {
    path: '/service/welfare-officer',
    title: '品牌福利官',
    nodes: [57],
    task: 'T013',
    entry: '我的-品牌福利官',
    returnTo: '我的',
    owner: '企业微信福利官（T013 施工）',
  },
  {
    path: '/service/chat',
    title: '智能客服',
    nodes: [58, 71],
    task: 'T013',
    entry: '我的-客服中心',
    returnTo: '我的',
    states: [
      { key: 'conversation', node: 58, label: '有对话' },
      { key: 'failed', node: 58, label: '发送失败' },
    ],
    overlays: [{ key: 'request-human', node: 71, label: '请求人工客服', type: 'sheet' }],
    owner: 'AI 客服对话（T013 施工）',
  },
  {
    path: '/service/chat/human',
    title: '人工客服排队',
    nodes: [70],
    task: 'T013',
    entry: '智能客服-转人工',
    returnTo: '智能客服',
    states: [
      { key: 'queuing', node: 70, label: '排队中' },
      { key: 'connected', node: 70, label: '已接入' },
    ],
    owner: '排队中/已接入（T013 施工）',
  },
]

export const TAB_ROUTES = ROUTES.filter((route) => route.tab).sort(
  (a, b) => (a.tabOrder ?? Number.MAX_SAFE_INTEGER) - (b.tabOrder ?? Number.MAX_SAFE_INTEGER),
)

/**
 * 判断路径是否命中一级 Tab（仅一级 Tab 自身显示底部导航）
 * 这里必须精确匹配：Tab 路由的子路径（如 /membership/levels、/card/verify/password、
 * /card/verify/confirm）都是二级页，按壳层约定不显示底部导航。
 * 注意 BottomNav 内部的高亮判定仍用前缀匹配，两者职责不同，不要合并。
 */
export function isTabPath(pathname: string): boolean {
  return TAB_ROUTES.some((route) => route.path === pathname)
}

/** 精确匹配；无则尝试 `:param` 动态路由匹配 */
export function findRouteByPathname(pathname: string): RouteMeta | undefined {
  const exact = ROUTES.find((route) => route.path === pathname)
  if (exact) return exact
  return ROUTES.find((route) => {
    if (!route.path.includes(':')) return false
    const segs = route.path.split('/')
    const parts = pathname.split('/')
    if (segs.length !== parts.length) return false
    return segs.every((seg, i) => seg.startsWith(':') || seg === parts[i])
  })
}
