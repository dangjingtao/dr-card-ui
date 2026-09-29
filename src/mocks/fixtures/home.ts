import bannerCheckin from '../../assets/brand/home/home-banner-checkin.webp'
import bannerWashCare from '../../assets/brand/home/home-banner-wash-care.webp'

/**
 * 首页接口 Mock 数据（契约来源：2026-09-28 首页联调文档）。
 *
 * 字段名与真实接口保持一致；轮播素材沿用首页已验收的品牌图，
 * 保证 mock 模式下视觉与 preview 基线一致。取值明确可识别为 Mock，不伪装成真实后台数据
 * （轮播 id 用 1/2 与文档示例同量级，券名带「Mock·」前缀，settings 使用待联调确认的第一候选字段名）。
 */
export const HOME_BANNERS_MOCK = {
  code: 0,
  msg: 'success',
  status: 'succ',
  data: {
    data: [
      {
        id: 1,
        title: '卡博士·诗得丽 每日打卡 洗护好礼',
        image: bannerCheckin,
        link_url: '#/checkin',
        link_type: 10,
        sort: 100,
        position: 10,
        status: 10,
        create_time: '2026-09-20 10:00:00',
        update_time: '2026-09-20 10:00:00',
        delete_time: null,
      },
      {
        id: 2,
        title: '黑金洗护养护新人福利',
        image: bannerWashCare,
        link_url: '#/dearseed?overlay=newcomer',
        link_type: 10,
        sort: 90,
        position: 10,
        status: 10,
        create_time: '2026-09-20 10:00:00',
        update_time: '2026-09-20 10:00:00',
        delete_time: null,
      },
    ],
    current_page: 1,
    per_page: 10,
    total: 2,
    last_page: 1,
  },
} as const

/** settings 字段名待联调确认（见 src/services/settings.ts 别名表），这里使用第一候选。 */
export const HOME_SETTINGS_MOCK = {
  code: 0,
  msg: 'success',
  status: 'succ',
  data: {
    brand_culture: '了解极地种子品牌起源与匠心洗护',
    cause: '每次打卡助力公益，传递温暖',
  },
} as const

export const COUPON_LIST_MOCK = {
  code: 0,
  msg: 'success',
  status: 'succ',
  data: {
    data: [
      {
        id: 1,
        name: 'Mock·10 元无门槛券',
        short_desc: '全场通用，满 0 元可用',
        image: null,
        category_id: '1',
        points_number: '100',
        total_number: 500,
        exchanged_nuuur: 37,
        extra_data: null,
        status: 10,
        create_time: '2026-09-01 12:00:00',
        update_time: '2026-09-01 12:00:00',
        delete_time: null,
      },
      {
        id: 2,
        name: 'Mock·洗护体验券',
        short_desc: '限到店核销',
        image: null,
        category_id: '2',
        points_number: '200',
        total_number: 300,
        exchanged_nuuur: 12,
        extra_data: null,
        status: 10,
        create_time: '2026-09-01 12:00:00',
        update_time: '2026-09-01 12:00:00',
        delete_time: null,
      },
    ],
    current_page: 1,
    per_page: 50,
    total: 2,
    last_page: 1,
  },
} as const