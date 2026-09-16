/* ────────────────────────── 福利官与客服 ────────────────────────── */

export const WELFARE_OFFICER = {
  brand: '诗得丽',
  role: '品牌福利官',
  name: '吴哥',
  lead: ['请添加我们的企业微信福利官', '获取更多福利咨询'],
  qrHint: '长按或扫描识别二维码，添加企业微信',
} as const

export interface WelfareOfficerService {
  key: string
  glyph: string
  title: string
}

export const WELFARE_OFFICER_SERVICES: WelfareOfficerService[] = [
  { key: 'human-service', glyph: '客', title: '人工客服' },
  { key: 'activity-consult', glyph: '咨', title: '活动咨询' },
  { key: 'welfare-lottery', glyph: '奖', title: '福利抽奖' },
]

export const WELFARE_OFFICER_RULE_STATUS = {
  serviceCopy: {
    confirmed: false,
    blocker: 'B-012',
    note: '原型 §8 只给出「人工客服 / 活动咨询 / 福利抽奖」三个名称，未给出副标题说明，故本页只列名称，不补写历史稿式描述。',
  },
  serviceEntry: {
    confirmed: false,
    blocker: 'B-012',
    note: '原型 §8 主要交互只有「返回 → 我的」，未给出服务项跳转目标，故三类服务渲染为说明列表而非可点按钮。',
  },
  qrAsset: {
    confirmed: false,
    blocker: 'B-012',
    note: '真实企业微信活码尚未入库，页面沿用可辨识的二维码占位表达，不伪造可扫码图形。',
  },
} as const

export const CHAT_BOT = {
  name: '小诗',
  role: 'AI 客服',
  glyph: '诗',
  welcome: '你好，我是诗得丽 AI 客服小诗，有什么可以帮你？',
  humanEntry: '人工客服',
  wecomEntry: '企微客服',
  inputPlaceholder: '请输入你的问题',
} as const

export type ChatRole = 'bot' | 'user'
export type ChatSendStatus = 'sent' | 'sending' | 'failed'

export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  status: ChatSendStatus
  glyph?: string
}

export const CHAT_WELCOME_MESSAGES: ChatMessage[] = [
  { id: 'bot-welcome', role: 'bot', text: CHAT_BOT.welcome, status: 'sent' },
]

export const CHAT_CONVERSATION_MESSAGES: ChatMessage[] = [
  ...CHAT_WELCOME_MESSAGES,
  { id: 'user-1', role: 'user', text: '我的洗发水体验券怎么用？', status: 'sent' },
  {
    id: 'bot-1',
    role: 'bot',
    text: '你可以在「卡包」中找到该券，到店出示二维码由门店扫码核销即可。',
    status: 'sent',
  },
]

export const CHAT_FAILED_MESSAGES: ChatMessage[] = [
  ...CHAT_WELCOME_MESSAGES,
  { id: 'user-failed', role: 'user', text: '门店周末营业到几点？', status: 'failed' },
]

export const CHAT_FAIL_KEYWORDS = ['断网', '发送失败'] as const
export const CHAT_HUMAN_KEYWORDS = ['人工客服', '转人工', '人工'] as const

export function resolveChatSendStatus(input: string): Extract<ChatSendStatus, 'sent' | 'failed'> {
  const text = input.trim()
  return CHAT_FAIL_KEYWORDS.some((keyword) => text.includes(keyword)) ? 'failed' : 'sent'
}

export function isChatHumanRequest(input: string): boolean {
  const text = input.trim()
  return CHAT_HUMAN_KEYWORDS.some((keyword) => text.includes(keyword))
}

export const CHAT_BOT_FALLBACK_REPLY =
  '已收到你的问题，我先为你查询。如需更详细的处理，可以点击「人工客服」联系福利官。'
export const CHAT_SEND_FAILED_HINT = '发送失败，请检查网络后重试'
export const CHAT_RETRY_LABEL = '重试'
export const CHAT_SEND_LATENCY_MS = 700

export const CHAT_HUMAN_PROMPT = {
  title: '请添加我们的企业微信福利官获取人工客服服务',
  cancelLabel: '取消',
} as const

export const CHAT_QUEUE = {
  queuing: {
    title: '正在为您接入人工客服...',
    aheadCount: 2,
    aheadText: '前面还有 2 位',
  },
  connected: {
    agentName: '小霜',
    title: '人工客服 小霜 为您服务',
  },
} as const

export const CHAT_AGENT_GREETING: ChatMessage = {
  id: 'agent-greeting',
  role: 'bot',
  text: '你好，我是人工客服小霜，已经看到你的问题，请稍等我为你处理。',
  status: 'sent',
  glyph: '霜',
}

export const CHAT_RULE_STATUS = {
  quickQuestions: {
    confirmed: false,
    blocker: 'B-013',
    note: '原型 §9 提到「热门问题快捷入口」但未给出条目，历史稿 T09 自创的 4 个问题已按任务卡验收标准废弃；本页在问题清单确认前不展示快捷入口。',
  },
  botAnswers: {
    confirmed: false,
    blocker: 'B-013',
    note: '原型未给出问答库，故所有非转人工输入统一返回 CHAT_BOT_FALLBACK_REPLY，不编造分场景回答。',
  },
  queueDynamics: {
    confirmed: false,
    blocker: 'B-014',
    note: '原型 §11 只给出「排队中 / 已接入」两个静态状态，未给出人数递减、等待倒计时与取消排队反馈，故本页不实现任何队列动态。',
  },
  wecomJump: {
    confirmed: false,
    blocker: 'B-013',
    note: '企业微信外跳能力与真实活码均未接入，「企微客服」与转人工统一落到二维码引导弹层（原型 §10）。',
  },
  humanQueueEntry: {
    confirmed: false,
    blocker: 'B-014',
    note: '原型 §10 弹层内容只列出「取消」，未给出进入 #70 的前进动作。该入口未确认，因此不实现：#71 只保留「取消」，#70 暂通过直达路由 /service/chat/human?state=queuing|connected 与 ?debug=1 验收。',
  },
  agentReplies: {
    confirmed: false,
    blocker: 'B-014',
    note: '原型 §11 只给出人工客服开场语，未给出后续问答。已接入态允许发送并显示自己的消息，但不编造坐席回复。',
  },
} as const
