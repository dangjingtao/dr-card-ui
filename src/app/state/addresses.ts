/**
 * 收货地址共享状态模块（T010）
 * -------------------------------------------------------------
 * 背景：地址列表 `/address` 与新增/编辑表单 `/address/new` 是两个独立路由，
 * 页面级 useState 会在「保存 → 返回列表」时重置，导致原型 §12/§13 的闭环
 * （新增后出现在列表、切换默认地址后置顶）无法验收。
 * 方案：沿用 state/notifications.ts 的模块级可变状态 + 订阅，
 * 只覆盖「地址集合 + 默认地址」这一份可变状态；初始数据仍来自 app/fixtures。
 *
 * 注意：这是 UI 还原用的最小共享状态，不是持久化存储；刷新页面回到夹具初始态，
 * 因此 `?state=` 夹具仍然可控可复现。
 */
import { useEffect, useMemo, useState } from 'react'
import { ADDRESS_FIXTURES, sortAddresses, type AddressFixture, type AddressFormValue } from '../fixtures'

let addresses: AddressFixture[] = ADDRESS_FIXTURES.map((item) => ({ ...item }))
let seq = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

/** 递增 id，不使用随机数，保证同一操作序列结果可复现 */
function nextId() {
  seq += 1
  return `a-new-${seq}`
}

/** 切换默认地址（原型 §12：点左侧圆圈切换，默认地址唯一） */
export function setDefaultAddress(id: string) {
  if (addresses.find((item) => item.id === id)?.isDefault) return
  addresses = addresses.map((item) => ({ ...item, isDefault: item.id === id }))
  emit()
}

/** 新增地址（原型 §13：保存后返回地址管理） */
export function addAddress(value: AddressFormValue, isDefault: boolean): AddressFixture {
  const created: AddressFixture = { id: nextId(), ...value, isDefault }
  addresses = isDefault
    ? [...addresses.map((item) => ({ ...item, isDefault: false })), created]
    : [...addresses, created]
  emit()
  return created
}

/** 更新已有地址（⚠️ 原型未单独画编辑页，见 B-027） */
export function updateAddress(id: string, value: AddressFormValue, isDefault: boolean) {
  addresses = addresses.map((item) => {
    if (item.id === id) return { ...item, ...value, isDefault }
    return isDefault ? { ...item, isDefault: false } : item
  })
  emit()
}

/** 复位到夹具初始态（供夹具切换/调试使用） */
export function resetAddresses() {
  addresses = ADDRESS_FIXTURES.map((item) => ({ ...item }))
  seq = 0
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 订阅共享地址集合，返回默认地址置顶后的列表 */
export function useAddresses(): { items: AddressFixture[]; defaultId: string | null } {
  const [version, setVersion] = useState(0)

  useEffect(() => subscribe(() => setVersion((value) => value + 1)), [])

  return useMemo(() => {
    void version
    const items = sortAddresses(addresses)
    return { items, defaultId: items.find((item) => item.isDefault)?.id ?? null }
  }, [version])
}

/** 按 id 取单条地址（编辑回填用） */
export function useAddress(id?: string | null): AddressFixture | undefined {
  const { items } = useAddresses()
  return items.find((item) => item.id === id)
}
