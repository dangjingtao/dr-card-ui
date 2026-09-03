export type DeviceType = 'shower' | 'laundry' | 'water' | 'hairdryer'

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
    buttonText: '扫码使用',
    scanButtonText: '立即扫码',
  },
  laundry: {
    type: 'laundry',
    label: '洗烘',
    iconBg: 'linear-gradient(135deg, #52D9BA 0%, #0E8A6E 100%)',
    themeAttr: 'laundry',
    pageTitle: '自助洗烘',
    buttonText: '扫码使用',
    scanButtonText: '立即扫码',
  },
  water: {
    type: 'water',
    label: '饮水',
    iconBg: 'linear-gradient(135deg, #6BA3FF 0%, #1F55BD 100%)',
    themeAttr: 'water',
    pageTitle: '直饮水',
    buttonText: '扫码取水',
    scanButtonText: '扫码取水',
  },
  hairdryer: {
    type: 'hairdryer',
    label: '吹风',
    iconBg: 'linear-gradient(135deg, #FFC942 0%, #BB7708 100%)',
    themeAttr: 'hairdryer',
    pageTitle: '吹风机',
    buttonText: '扫码使用',
    scanButtonText: '立即扫码',
  },
}

export const DEVICE_LISTS: Record<DeviceType, DeviceInfo[]> = {
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
      status: 'in-use',
    },
  ],
  laundry: [
    {
      id: 'laundry-001',
      name: 'A栋2楼洗衣房',
      location: 'A栋2楼',
      code: 'B42000071G',
      status: 'idle',
    },
    {
      id: 'laundry-002',
      name: 'B栋1楼洗烘区',
      location: 'B栋1楼',
      code: 'B42000072H',
      status: 'in-use',
    },
  ],
  water: [
    {
      id: 'water-001',
      name: 'A栋1楼饮水机',
      location: 'A栋1楼大厅',
      code: 'B42000083I',
      status: 'idle',
    },
    {
      id: 'water-002',
      name: 'B栋3楼饮水机',
      location: 'B栋3楼走廊',
      code: 'B42000084J',
      status: 'idle',
    },
  ],
  hairdryer: [
    {
      id: 'hairdryer-001',
      name: 'A栋1楼吹风机',
      location: 'A栋1楼淋浴区',
      code: 'B42000095K',
      status: 'idle',
    },
    {
      id: 'hairdryer-002',
      name: 'B栋2楼吹风机',
      location: 'B栋2楼',
      code: 'B42000096L',
      status: 'in-use',
    },
  ],
}

/** @deprecated 改用 DEVICE_THEMES[type].pageTitle */
export const DEVICE_PAGE_TITLES: Record<DeviceType, string> = {
  shower: '自助淋浴',
  laundry: '自助洗烘',
  water: '直饮水',
  hairdryer: '吹风机',
}
