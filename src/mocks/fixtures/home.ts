import bannerCheckin from '../../assets/brand/home/home-banner-checkin.webp'
import bannerWashCare from '../../assets/brand/home/home-banner-wash-care.webp'

/**
 * 首页接口 Mock 数据（契约来源：2026-09-28 首页联调文档）。
 *
 * 字段名与真实接口保持一致；轮播素材沿用首页已验收的品牌图，
 * 保证 mock 模式下视觉与 preview 基线一致。取值明确可识别为 Mock，不伪装成真实后台数据
 * （轮播 id 用 1/2 与文档示例同量级，券名带「Mock·」前缀）。
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

export const BRAND_CULTURE_SETTING_MOCK = {
  code: 0,
  msg: 'success',
  status: 'succ',
  data: {
    key: 'brand_culture_setting',
    value: '<h2>极地种子品牌故事</h2><p>Mock 富文本：了解品牌起源与匠心洗护。</p>',
  },
} as const

export const WELFARE_SETTING_MOCK = {
  code: 0,
  msg: 'success',
  status: 'succ',
  data: {
    key: 'welfare',
    value: '<h2>公益板块</h2><p>Mock 富文本：每次打卡助力公益，传递温暖。</p>',
  },
} as const

/**
 * `GET /api/coupons/index` Mock 数据（契约来源：客户端《签到页面接口文档》第 4 节「体验券列表」）。
 *
 * 券名统一带「Mock·」前缀，明确可识别为 Mock，不伪装真实后台数据。
 * 当前不模拟 category_id：后端分类能力尚未确认，Mock 不应反向制造接口契约。
 * 覆盖卡片状态：可兑换、已兑完（exchanged_nuuur >= total_number）。
 */
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
        points_number: '100',
        total_number: 500,
        exchanged_nuuur: 37,
        extra_data: null,
        status: 10,
        create_time: '2026-09-01 12:00:00',
        update_time: '2026-09-01 12:00:00',
        delete_time: 0,
      },
      {
        id: 2,
        name: 'Mock·洗护体验券',
        short_desc: '洗发 / 护发 / 沐浴体验，限到店核销',
        image: null,
        points_number: '200',
        total_number: 300,
        exchanged_nuuur: 12,
        extra_data: null,
        status: 10,
        create_time: '2026-09-01 12:00:00',
        update_time: '2026-09-01 12:00:00',
        delete_time: 0,
      },
      {
        id: 3,
        name: 'Mock·洗护组合体验券',
        short_desc: '洗发 + 护发组合体验，限到店核销',
        image: null,
        points_number: '200',
        total_number: 2000,
        exchanged_nuuur: 1860,
        extra_data: null,
        status: 10,
        create_time: '2026-09-01 12:00:00',
        update_time: '2026-09-01 12:00:00',
        delete_time: 0,
      },
      {
        id: 4,
        name: 'Mock·核心洗发水体验券',
        short_desc: '限到店核销',
        image: null,
        points_number: '480',
        total_number: 2000,
        exchanged_nuuur: 1240,
        extra_data: null,
        status: 10,
        create_time: '2026-09-01 12:00:00',
        update_time: '2026-09-01 12:00:00',
        delete_time: 0,
      },
      {
        id: 5,
        name: 'Mock·洗护体验券（已兑完）',
        short_desc: '单次洗发体验，限到店核销',
        image: null,
        points_number: '320',
        total_number: 720,
        exchanged_nuuur: 720,
        extra_data: null,
        status: 10,
        create_time: '2026-09-01 12:00:00',
        update_time: '2026-09-01 12:00:00',
        delete_time: 0,
      },
    ],
    current_page: 1,
    per_page: 15,
    total: 5,
    last_page: 1,
  },
} as const
