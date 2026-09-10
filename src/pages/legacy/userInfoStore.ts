/* eslint-disable react-refresh/only-export-components */
/**
 * 卡博士个人中心 mock 用户信息 store（T026）
 * -------------------------------------------------------------
 * 单一事实源：PersonalInfo / PhoneChangePage / LoginPage 都从这里读写手机号。
 * 真实场景下应替换为后端 API + 全局状态管理（zustand / Redux / React Query）。
 */
import { create } from './createSimpleStore'

export type UserRole = 'teacher' | 'student'

export interface UserInfo {
  avatar: string
  username: string
  nickname: string
  realName: string
  phone: string
  email: string
  account: string
  /** @deprecated T037R10 后不再收集学号，仅保留字段兼容旧数据 */
  studentId: string
  school: string
  /** @deprecated T037R10 后不再收集学院，仅保留字段兼容旧数据 */
  academy: string
  /** T037R10：身份（老师 / 学生） */
  role: UserRole
  /** T037R10：年级（仅学生身份），如：大一 / 大二 / ... / 博士 */
  grade: string
  /** 充值账户余额（T028 退款原路返回到此账户） */
  balance: number
  /**
   * 账号是否已注册（T037）。
   * - true：当前账号已存在，登录页不显示「确认密码」输入框。
   * - false：账号未注册，登录页展示「确认密码」输入框，要求两次密码一致。
   * mock 默认 false，触发二次确认密码演示态。
   */
  isRegistered: boolean
  /**
   * 6 位消费密码（T039）。
   * 用于自助机器端"手机尾号 + 6 位消费密码"领取/核销场景。
   * mock 默认 000000。
   */
  pin: string
}

const INITIAL_USER_INFO: UserInfo = {
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=weixin',
  username: 'weixin_o1jPT0rReq40wuWbvu48ejq5p184',
  nickname: '微信用户',
  realName: '张三',
  phone: '15047757139',
  email: '',
  account: 'K011079469',
  studentId: '',
  school: '',
  academy: '',
  role: 'student',
  grade: '',
  balance: 100.0,
  isRegistered: false,
  pin: '000000',
}

/* 全局单例：所有引用都指向同一份 USER_INFO，确保换绑后个人信息同步刷新 */
export const [useUserInfo, userInfoActions] = create<UserInfo>(INITIAL_USER_INFO)

/** 11 位中国大陆手机号校验（1[3-9] 开头） */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}
