/**
 * Mock 会员资料读取（`GET /api/user/detail`）。
 *
 * 字段名与 7002 真实用户实体保持一致（实测来源：`/api/oauth/login` 的 `userInfo`、
 * `usercards` 关联返回的 `user`）；取值明确可识别为 Mock，不伪装成真实线上数据。
 */
export const USER_PROFILE_DETAIL_MOCK = {
  code: 0,
  msg: 'success',
  data: {
    id: 1,
    nick_name: 'Mock会员昵称',
    // `grade` may be a membership title; the actual school year is student_grade.
    grade: '普通会员',
    student_grade: '大二',
    avatar_img: 0,
  },
} as const

/**
 * Mock「我的页」个人资料（`GET /api/user/profile`）。
 *
 * 逐字段对齐客户端《我的（个人中心）页面接口接入文档》的响应示例，
 * 取值明确可识别为 Mock（昵称带 `Mock` 前缀、kbs_id 用占位号码），不伪装成真实线上数据。
 *
 * 覆盖口径：
 * - `nextGrade` 有下一等级（对象形态）；
 * - `avatar_img` / `real_name` 为空串（未设置），用于验证页面「未设置」兜底；
 * - `couponsCount` / `points` 为真实数字，`0` 是合法值（另见 `USER_PROFILE_MOCK_NO_NEXT_GRADE`）。
 */
export const USER_PROFILE_MOCK = {
  code: 0,
  msg: 'success',
  status: 'succ',
  data: {
    couponsCount: 2,
    grade: '普通会员',
    grade_id: 1,
    nextGrade: { id: 2, name: '白银会员', min_exp_number: 100 },
    nick_name: 'Mock用户28123456',
    avatar_img: '',
    country: '中国',
    city: '南宁',
    province: '广西',
    mobile: '151****2709',
    real_name: '',
    points: 128,
    kbs_id: 'K016998956',
  },
} as const

/**
 * `nextGrade` 为**空字符串**的边界样例：后端在「没有下一等级」时返回 `""`（不是 `null` / `{}`）。
 * 用于验证页面不因该形态崩溃，并正确隐藏升级进度文案。
 */
export const USER_PROFILE_MOCK_NO_NEXT_GRADE = {
  code: 0,
  msg: 'success',
  status: 'succ',
  data: {
    ...USER_PROFILE_MOCK.data,
    grade: '钻石会员',
    grade_id: 5,
    nextGrade: '',
  },
} as const

/** Mock `POST /api/user/update` 成功响应（后端返回完整用户实体，此处只取文档示例字段）。 */
export const USER_UPDATE_MOCK = {
  code: 0,
  msg: 'success',
  status: 'succ',
  data: {
    id: 5,
    nick_name: 'Mock用户28123456',
    gender: '1',
    platform: 'MP-WEIXIN',
    avatar_img: '',
    kbs_id: 'K016998956',
    country: '中国',
    province: '广西',
    city: '南宁',
    balance: '49.75',
    points: 128,
    mobile: '15177272709',
    real_name: '',
    grade_id: 1,
    last_login_time: 1758000000,
    last_login_ip: '1.2.3.4',
    status: 10,
    message: null,
    position: '',
    student_grade: '初二',
    create_time: '2026-06-02 13:52:59',
    update_time: '2026-06-02 13:52:59',
    delete_time: 0,
  },
} as const
