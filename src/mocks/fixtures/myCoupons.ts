import type { MyCouponRecord, MyCouponType } from '../../services/myCoupons'

/**
 * MyCoupons Mock：字段与老伙伴 H5 契约保持一致，名称显式标记为 Mock，
 * 只用于 preview/dev 的网络级模拟，不作为 test/prod API 失败兜底。
 */
export const MY_COUPONS_RECORDS_MOCK: Record<MyCouponType, MyCouponRecord[]> = {
  unused: [
    {
      id: 91001,
      active_name: 'Mock 新人体验活动',
      get_amount: '30.00',
      used_amount: '0.00',
      enable_amount: '30.00',
      valid_date_range: '2026-09-30 ~ 2026-10-30',
      dc_type: 10,
      dc_type_format: '满减券',
    },
    {
      id: 91002,
      active_name: 'Mock 洗护体验券',
      get_amount: 20,
      used_amount: 5,
      enable_amount: 15,
      valid_date_range: '2026-09-20 ~ 2026-10-20',
      dc_type: '10',
      dc_type_format: '满减券',
    },
  ],
  used: [
    {
      id: 92001,
      active_name: 'Mock 已使用体验券',
      get_amount: '20.00',
      used_amount: '20.00',
      enable_amount: '0.00',
      valid_date_range: '2026-09-01 ~ 2026-09-30',
      dc_type: 10,
      dc_type_format: '满减券',
    },
  ],
  out_of_date: [
    {
      id: 93001,
      active_name: 'Mock 已过期体验券',
      get_amount: '10.00',
      used_amount: '0.00',
      enable_amount: '10.00',
      valid_date_range: '2026-08-01 ~ 2026-08-31',
      dc_type: 10,
      dc_type_format: '满减券',
    },
  ],
}
