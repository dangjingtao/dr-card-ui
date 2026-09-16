export interface AddressFixture {
  id: string
  name: string
  phone: string
  region: string
  detail: string
  isDefault: boolean
}

export const ADDRESS_FIXTURES: AddressFixture[] = [
  { id: 'a1', name: '张小鹿', phone: '13800008899', region: '北京市 北京市 朝阳区 青年路街道', detail: '青年路 5 号大悦城 B1-038 泡泡洗护柜台', isDefault: true },
  { id: 'a2', name: '李思棠', phone: '15600003021', region: '上海市 上海市 徐汇区 天平路街道', detail: '衡山路 88 号 3 号楼 502 室', isDefault: false },
  { id: 'a3', name: '王一诺', phone: '18900004477', region: '广东省 深圳市 南山区 粤海街道', detail: '科技园南区高新南七道数字技术园 A2 栋 12 层 1203 号工位（靠窗，到楼下请先电话联系）', isDefault: false },
]

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length !== 11) return phone
  return `${digits.slice(0, 3)}****${digits.slice(7)}`
}

export function sortAddresses(list: AddressFixture[]): AddressFixture[] {
  return [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
}

export const ADDRESS_REGION_OPTIONS = ADDRESS_FIXTURES.map((item) => ({ value: item.region, label: item.region }))

export const ADDRESS_COPY = {
  defaultTag: '默认',
  addAction: '添加新地址',
  editAction: '编辑',
  setDefaultHint: '设为默认地址',
  emptyTitle: '还没有收货地址',
  emptyDesc: '添加一个收货地址，兑换的洗护好物就能寄到你手上。',
  defaultToast: '已设为默认地址',
} as const

export const ADDRESS_FORM_COPY = {
  titleCreate: '添加新地址',
  titleEdit: '编辑地址',
  nameLabel: '收货人姓名',
  namePlaceholder: '请填写收货人姓名',
  phoneLabel: '手机号码',
  phonePlaceholder: '请填写手机号码',
  regionLabel: '省市区县-乡镇',
  regionPlaceholder: '请选择省市区县-乡镇',
  detailLabel: '街道、楼牌号等详细地址',
  detailPlaceholder: '请填写街道、楼牌号等详细地址',
  pasteAction: '粘贴识别收件信息',
  pasteUnavailable: '粘贴识别能力待接入',
  defaultSwitch: '设为默认地址',
  submit: '保存',
  savedToast: '地址已保存',
  updatedToast: '地址已更新',
  nameError: '请填写收货人姓名',
  phoneError: '请填写 11 位手机号码',
  regionError: '请选择省市区县-乡镇',
  detailError: '请填写街道、楼牌号等详细地址',
} as const

export interface AddressFormValue {
  name: string
  phone: string
  region: string
  detail: string
}
export type AddressFormErrors = Partial<Record<keyof AddressFormValue, string>>

export function validateAddressForm(value: AddressFormValue): AddressFormErrors {
  const errors: AddressFormErrors = {}
  if (!value.name.trim()) errors.name = ADDRESS_FORM_COPY.nameError
  if (!/^1\d{10}$/.test(value.phone.trim())) errors.phone = ADDRESS_FORM_COPY.phoneError
  if (!value.region.trim()) errors.region = ADDRESS_FORM_COPY.regionError
  if (!value.detail.trim()) errors.detail = ADDRESS_FORM_COPY.detailError
  return errors
}

export type OrderTabKey = 'all' | 'completed' | 'ongoing' | 'aftersale'
export type OrderStatusKey = Exclude<OrderTabKey, 'all'>
export type OrderDelivery = 'received' | 'shipped' | 'pending' | 'aftersale'

export interface OrderItemFixture { name: string; spec: string; price: number; qty: number }
export interface OrderFixture {
  id: string
  code: string
  createdAt: string
  status: OrderStatusKey
  delivery: OrderDelivery
  items: OrderItemFixture[]
  freight: number
  receiver: Omit<AddressFixture, 'id' | 'isDefault'>
}

export const ORDER_FIXTURES: OrderFixture[] = [
  { id: 'o1', code: '2024010814320001', createdAt: '2024-01-08 14:32', status: 'completed', delivery: 'received', items: [{ name: 'DearSeed 洗发水样包', spec: '单次使用', price: 29, qty: 1 }], freight: 0, receiver: { name: '张小鹿', phone: '13800008899', region: '北京市 北京市 朝阳区 青年路街道', detail: '青年路 5 号大悦城 B1-038 泡泡洗护柜台' } },
  { id: 'o2', code: '2024010609150002', createdAt: '2024-01-06 09:15', status: 'ongoing', delivery: 'shipped', items: [{ name: '洗发试用装', spec: '30ml 旅行装', price: 39, qty: 2 }], freight: 6, receiver: { name: '李思棠', phone: '15600003021', region: '上海市 上海市 徐汇区 天平路街道', detail: '衡山路 88 号 3 号楼 502 室' } },
  { id: 'o3', code: '2024010420480003', createdAt: '2024-01-04 20:48', status: 'ongoing', delivery: 'pending', items: [{ name: '核心洗发水体验券', spec: '线下门店核销', price: 68, qty: 1 }, { name: '洗护体验样包', spec: '洗发 + 护发两件套', price: 19, qty: 3 }], freight: 0, receiver: { name: '王一诺', phone: '18900004477', region: '广东省 深圳市 南山区 粤海街道', detail: '科技园南区高新南七道数字技术园 A2 栋 12 层 1203 号工位（靠窗，到楼下请先电话联系）' } },
  { id: 'o4', code: '2023122811060004', createdAt: '2023-12-28 11:06', status: 'aftersale', delivery: 'aftersale', items: [{ name: '现金减免体验券', spec: '满 199 减 30', price: 99, qty: 1 }], freight: 0, receiver: { name: '张小鹿', phone: '13800008899', region: '北京市 北京市 朝阳区 青年路街道', detail: '青年路 5 号大悦城 B1-038 泡泡洗护柜台' } },
  { id: 'o5', code: '2023121916240005', createdAt: '2023-12-19 16:24', status: 'completed', delivery: 'received', items: [{ name: '洗护体验样包', spec: '洗发 + 护发两件套', price: 19, qty: 2 }], freight: 0, receiver: { name: '李思棠', phone: '15600003021', region: '上海市 上海市 徐汇区 天平路街道', detail: '衡山路 88 号 3 号楼 502 室' } },
]

export const ORDER_TABS: { key: OrderTabKey; label: string }[] = [
  { key: 'all', label: '全部订单' },
  { key: 'completed', label: '已完成' },
  { key: 'ongoing', label: '进行中' },
  { key: 'aftersale', label: '售后中' },
]

export const ORDER_DELIVERY_LABEL: Record<OrderDelivery, string> = {
  received: '已收货', shipped: '已发货', pending: '待发货', aftersale: '售后处理中',
}

export function ordersByTab(tab: OrderTabKey): OrderFixture[] {
  if (tab === 'all') return ORDER_FIXTURES
  return ORDER_FIXTURES.filter((order) => order.status === tab)
}
export function resolveOrderTab(raw: string | null): OrderTabKey {
  const found = ORDER_TABS.find((item) => item.key === raw)
  return found?.key ?? 'all'
}
export function findOrder(id: string | undefined): OrderFixture | undefined { return ORDER_FIXTURES.find((order) => order.id === id) }
export function orderGoodsTotal(order: OrderFixture): number { return order.items.reduce((sum, item) => sum + item.price * item.qty, 0) }
export function orderPayable(order: OrderFixture): number { return orderGoodsTotal(order) + order.freight }
export function orderQuantity(order: OrderFixture): number { return order.items.reduce((sum, item) => sum + item.qty, 0) }
export function formatYuan(amount: number): string { return `¥${amount.toFixed(2)}` }

export const ORDER_COPY = {
  countPrefix: '共', countSuffix: '件商品', payableLabel: '实付款', goodsTotalLabel: '商品总价', freightLabel: '运费',
  codeLabel: '订单编号', createdLabel: '下单时间', receiverLabel: '收货地址', priceSectionTitle: '价格信息', orderSectionTitle: '订单信息', goodsSectionTitle: '商品信息', serviceAction: '联系客服',
  emptyTitle: '暂无订单', emptyDesc: '去兑换专区挑一件洗护好物，订单会出现在这里。', emptyAction: '去兑换专区', missingTitle: '订单不存在', missingDesc: '该订单可能已被删除，或链接已经失效。', missingAction: '返回订单管理',
} as const

export const ADDRESS_ORDER_RULE_STATUS = {
  addressEdit: { confirmed: false, blocker: 'B-027', note: '原型 §12 有「编辑」入口但未单独画编辑页，§13 的省市区县-乡镇也未给出行政区划数据源；此处复用 #60 表单结构做回填编辑，候选项取自地址夹具，待产品确认。' },
  addressPaste: { confirmed: false, blocker: 'B-028', note: '原型 §13 只画出「粘贴识别收件信息」按钮，未定义解析规则、失败提示与剪贴板权限降级；此处保留入口但不实现解析，点按仅提示能力待接入。' },
  orderStatus: { confirmed: false, blocker: 'B-029', note: '原型 §14 只给出四个 Tab 与「已收货」等少量配送状态，待付款、已取消、退款完成等状态及其流转未确认；夹具只覆盖原型出现过的状态，不自行补全。' },
  orderAmount: { confirmed: false, blocker: 'B-030', note: '原型 §15 只列出商品总价、运费、实付款三个字段，未给运费计算、优惠抵扣与泡泡值抵扣规则；运费按订单夹具声明，实付款只做「总价 + 运费」的算术求和。' },
} as const
