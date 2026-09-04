/**
 * 卡博士服务中心 fixture 数据（T034）
 */

/* ─── 热门问题 ─── */
export interface HotQuestion {
  id: string
  title: string
  reasons: string[]
}

const HOT_QUESTIONS_BATCH_A: HotQuestion[] = [
  {
    id: 'q1',
    title: '衣服洗完还有泡沫',
    reasons: ['洗涤剂投放过量', '洗涤程序选择不当', '水压偏低导致漂洗不充分'],
  },
  {
    id: 'q2',
    title: '屏幕 HEAT',
    reasons: ['设备正在加热中，属于正常状态', '等待加热完成后屏幕会恢复正常显示'],
  },
  {
    id: 'q3',
    title: '设备离线',
    reasons: ['设备网络信号弱', '设备电源被断开', '设备通讯模块异常'],
  },
]

const HOT_QUESTIONS_BATCH_B: HotQuestion[] = [
  {
    id: 'q4',
    title: '温度异常',
    reasons: ['温度过高', '风道堵塞', '核心部件故障'],
  },
  {
    id: 'q5',
    title: '设备无法启动',
    reasons: ['余额不足', '设备处于故障状态', '扫码失败，请重试'],
  },
  {
    id: 'q6',
    title: '出水慢',
    reasons: ['水压偏低', '过滤网堵塞', '出水管道有弯折'],
  },
]

export const HOT_QUESTION_BATCHES: HotQuestion[][] = [
  HOT_QUESTIONS_BATCH_A,
  HOT_QUESTIONS_BATCH_B,
]

/* ─── 报修项目 ─── */
export interface RepairProject {
  id: string
  name: string
  giftAmount: number
}

export const REPAIR_PROJECTS: RepairProject[] = [
  {
    id: 'p1',
    name: '内蒙古大学创业学院直饮水',
    giftAmount: 1.85,
  },
  {
    id: 'p2',
    name: '呼和浩特职业学院洗浴',
    giftAmount: 5.0,
  },
  {
    id: 'p3',
    name: '师范大学盛乐校区洗衣',
    giftAmount: 3.2,
  },
]

/* ─── 故障现象选项 ─── */
export const FAULT_OPTIONS: string[] = [
  '设备详情页面显示异常',
  '订单无法支付',
  '订单详情页面显示异常',
  '设备无法启动',
  '漏水',
  '不出水',
  '水表异响',
  '热水阀门坏',
  '水表无显示',
  '水温低',
  '其它',
]

/* ─── 账号信息 ─── */
export const ACCOUNT_INFO = {
  account: 'K011079469',
  totalBalance: 9.16,
}

/* ─── 维修员信息（底部占位） ─── */
export const REPAIR_STAFF = {
  name: '张师傅',
  phone: '138****8888',
}
