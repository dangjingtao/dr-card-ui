/** 与 GET /api/settings/detail?key=brand_welfare_setting 同形的可辨识 Mock。 */
export const WELFARE_OFFICER_CONFIG_MOCK = {
  code: 0,
  msg: 'success',
  status: 'succ',
  data: {
    title: 'Mock：添加福利官获取咨询',
    subtitle: 'Mock：品牌福利官',
    qrcode: '',
    benefits: [
      { image: '', title: 'Mock 人工客服', description: '模拟人工客服支持' },
      { image: '', title: 'Mock 活动咨询', description: '模拟活动咨询服务' },
      { image: '', title: 'Mock 福利抽奖', description: '模拟福利活动说明' },
    ],
  },
} as const
