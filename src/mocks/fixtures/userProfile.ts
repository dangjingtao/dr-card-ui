/**
 * Mock 会员资料。
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
    grade: '大二',
    avatar_img: 0,
  },
} as const