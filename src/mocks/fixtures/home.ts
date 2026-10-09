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
 * 当前只提供一个带 category_id 的 Mock 通用体验包，以检验后台分类查询的只读 DTO。
 * 不假装服务端 category_id 已支持过滤；共享 Mock 不创造历史多 SKU 数据。
 * 售罄 / 泡泡值不足等边界由页面 / service 单测使用局部样本覆盖。
 */
export const COUPON_LIST_MOCK = {
  code: 0,
  msg: 'success',
  status: 'succ',
  data: {
    data: [
      {
        id: 1,
        name: 'Mock·通用体验包',
        category_id: '1',
        short_desc: '当前唯一开放的洗护体验包',
        image: null,
        points_number: '200',
        total_number: 1000,
        exchanged_nuuur: 128,
        extra_data: null,
        status: 10,
        create_time: '2026-09-01 12:00:00',
        update_time: '2026-09-01 12:00:00',
        delete_time: 0,
      },
    ],
    current_page: 1,
    per_page: 15,
    total: 1,
    last_page: 1,
  },
} as const
