export type DeviceType = 'shower' | 'laundry' | 'water' | 'hairdryer' | 'vending'

export interface DeviceInfo {
  id: string
  name: string
  location: string
  /** 设备编号 */
  code: string
  status: 'idle' | 'in-use' | 'offline'
}

export interface DeviceThemeConfig {
  type: DeviceType
  label: string
  iconBg: string
  themeAttr: string
  pageTitle: string
  /** 设备卡片上的按钮文案（空闲态） */
  buttonText: string
  /** 底部固定扫码按钮文案 */
  scanButtonText: string
}

export const DEVICE_THEMES: Record<DeviceType, DeviceThemeConfig> = {
  shower: {
    type: 'shower',
    label: '淋浴',
    iconBg: 'linear-gradient(135deg, #8671F5 0%, #5A42D1 100%)',
    themeAttr: 'shower',
    pageTitle: '自助淋浴',
    /* T040：设备列表按钮回滚到"扫码启动"语义 */
    buttonText: '扫码启动',
    scanButtonText: '立即扫码',
  },
  laundry: {
    type: 'laundry',
    label: '洗烘',
    iconBg: 'linear-gradient(135deg, #52D9BA 0%, #0E8A6E 100%)',
    themeAttr: 'laundry',
    pageTitle: '自助洗烘',
    /* T040：设备列表按钮回滚到"扫码启动"语义 */
    buttonText: '扫码启动',
    scanButtonText: '立即扫码',
  },
  water: {
    type: 'water',
    label: '饮水',
    iconBg: 'linear-gradient(135deg, #6BA3FF 0%, #1F55BD 100%)',
    themeAttr: 'water',
    pageTitle: '直饮水',
    /* T040：饮水场景对应"扫码取水" */
    buttonText: '扫码取水',
    scanButtonText: '立即扫码',
  },
  hairdryer: {
    type: 'hairdryer',
    label: '吹风',
    iconBg: 'linear-gradient(135deg, #FFC942 0%, #BB7708 100%)',
    themeAttr: 'hairdryer',
    pageTitle: '吹风机',
    /* T040：设备列表按钮回滚到"扫码启动"语义 */
    buttonText: '扫码启动',
    scanButtonText: '立即扫码',
  },
  /* T042：自助售货机 - 扫码购买洗发水体验包 */
  vending: {
    type: 'vending',
    label: '售货',
    iconBg: 'linear-gradient(135deg, #FF8A65 0%, #E64A19 100%)',
    themeAttr: 'vending',
    pageTitle: '自助售货机',
    buttonText: '扫码购买',
    scanButtonText: '立即扫码',
  },
}

export const DEVICE_LISTS: Record<DeviceType, DeviceInfo[]> = {
  /* T041：淋浴扩到 4 个设备，用于演示「≥3 时广告位于第 2、3 个设备中间」 */
  shower: [
    {
      id: 'shower-001',
      name: 'A栋1楼301室',
      location: 'A栋1楼',
      code: 'B42000059E',
      status: 'idle',
    },
    {
      id: 'shower-002',
      name: 'A栋1楼302室',
      location: 'A栋1楼',
      code: 'B42000060F',
      /* 2026-09-08：硬件不一定能回传使用状态，列表不再区分 in-use，统一 idle */
      status: 'idle',
    },
    {
      id: 'shower-003',
      name: 'B栋1楼103室',
      location: 'B栋1楼',
      code: 'B42000061G',
      status: 'idle',
    },
    {
      id: 'shower-004',
      name: 'B栋2楼205室',
      location: 'B栋2楼',
      code: 'B42000062H',
      status: 'idle',
    },
  ],
  /* T041：洗烘仅 1 个设备，演示「<3 时广告位末尾展示」 */
  laundry: [
    {
      id: 'laundry-001',
      name: 'A栋2楼洗衣房',
      location: 'A栋2楼',
      code: 'B42000071G',
      status: 'idle',
    },
  ],
  /* T041：饮水仅 1 个设备，演示「<3 时广告位末尾展示」 */
  water: [
    {
      id: 'water-001',
      name: 'A栋1楼饮水机',
      location: 'A栋1楼大厅',
      code: 'B42000083I',
      status: 'idle',
    },
  ],
  /* T041：吹风仅 1 个设备，演示「<3 时广告位末尾展示」 */
  hairdryer: [
    {
      id: 'hairdryer-001',
      name: 'A栋1楼吹风机',
      location: 'A栋1楼淋浴区',
      code: 'B42000095K',
      status: 'idle',
    },
  ],
  /* T042：自助售货机 - 2 台用于演示 */
  vending: [
    {
      id: 'vending-001',
      name: 'A栋1楼售货机',
      location: 'A栋1楼大厅',
      code: 'V42000101A',
      status: 'idle',
    },
    {
      id: 'vending-002',
      name: 'B栋2楼售货机',
      location: 'B栋2楼走廊',
      code: 'V42000102B',
      status: 'idle',
    },
  ],
}

/** @deprecated 改用 DEVICE_THEMES[type].pageTitle */
export const DEVICE_PAGE_TITLES: Record<DeviceType, string> = {
  shower: '自助淋浴',
  laundry: '自助洗烘',
  water: '直饮水',
  hairdryer: '吹风机',
  vending: '自助售货机',
}
