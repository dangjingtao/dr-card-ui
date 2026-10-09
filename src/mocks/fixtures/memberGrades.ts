/** H040 会员等级示例：仅供 MSW，名称刻意标识 Mock。与个人资料 Mock 的 grade_id=1 对齐。 */
export const MEMBER_GRADES_MOCK = [
  { id: 1, name: 'Mock普通会员', icon_image: null, min_exp_number: 0, benefit_desc: '模拟基础权益', sort_number: 1, is_default_switch: 1, status: 10 },
  { id: 2, name: 'Mock白银会员', icon_image: null, min_exp_number: 100, benefit_desc: '模拟进阶权益', sort_number: 2, is_default_switch: 0, status: 10 },
  { id: 3, name: 'Mock黄金会员', icon_image: null, min_exp_number: 300, benefit_desc: '', sort_number: 3, is_default_switch: 0, status: 10 },
] as const
