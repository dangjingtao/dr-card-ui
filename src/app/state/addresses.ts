/**
 * 收货地址共享状态模块（H010 Zustand migration）
 * -------------------------------------------------------------
 * 地址列表 `/address` 与新增/编辑表单 `/address/new` 跨路由共享同一份客户端状态。
 * Zustand 只负责这一份会话内客户端状态；初始数据仍来自 app/fixtures。
 *
 * 注意：这不是持久化存储；刷新页面仍回到夹具初始态。未来若确认需要持久化，
 * 必须通过 H011 Storage Adapter，而不是在 store 内直接访问 Web Storage。
 */
import { useMemo } from 'react'
import { create } from 'zustand'

import { ADDRESS_FIXTURES, sortAddresses, type AddressFixture, type AddressFormValue } from '../fixtures'

interface AddressStoreState {
  addresses: AddressFixture[]
  seq: number
  setDefaultAddress: (id: string) => void
  addAddress: (value: AddressFormValue, isDefault: boolean) => AddressFixture
  updateAddress: (id: string, value: AddressFormValue, isDefault: boolean) => void
  resetAddresses: () => void
}

function initialAddresses() {
  return ADDRESS_FIXTURES.map((item) => ({ ...item }))
}

/**
 * Zustand 原始 store 仅供状态模块与基础验证使用。
 * 页面继续通过本文件导出的领域 hook/action 访问，避免把 getState/setState 散落到 UI。
 */
export const useAddressStore = create<AddressStoreState>((set, get) => ({
  addresses: initialAddresses(),
  seq: 0,

  setDefaultAddress: (id) => {
    const { addresses } = get()
    if (addresses.find((item) => item.id === id)?.isDefault) return

    set({
      addresses: addresses.map((item) => ({ ...item, isDefault: item.id === id })),
    })
  },

  addAddress: (value, isDefault) => {
    const nextSeq = get().seq + 1
    const created: AddressFixture = { id: `a-new-${nextSeq}`, ...value, isDefault }

    set((state) => ({
      seq: nextSeq,
      addresses: isDefault
        ? [...state.addresses.map((item) => ({ ...item, isDefault: false })), created]
        : [...state.addresses, created],
    }))

    return created
  },

  updateAddress: (id, value, isDefault) => {
    set((state) => ({
      addresses: state.addresses.map((item) => {
        if (item.id === id) return { ...item, ...value, isDefault }
        return isDefault ? { ...item, isDefault: false } : item
      }),
    }))
  },

  resetAddresses: () => {
    set({ addresses: initialAddresses(), seq: 0 })
  },
}))

/** 切换默认地址（原型 §12：点左侧圆圈切换，默认地址唯一） */
export function setDefaultAddress(id: string) {
  useAddressStore.getState().setDefaultAddress(id)
}

/** 新增地址（原型 §13：保存后返回地址管理） */
export function addAddress(value: AddressFormValue, isDefault: boolean): AddressFixture {
  return useAddressStore.getState().addAddress(value, isDefault)
}

/** 更新已有地址（⚠️ 原型未单独画编辑页，见 B-027） */
export function updateAddress(id: string, value: AddressFormValue, isDefault: boolean) {
  useAddressStore.getState().updateAddress(id, value, isDefault)
}

/** 复位到夹具初始态（供夹具切换/调试使用） */
export function resetAddresses() {
  useAddressStore.getState().resetAddresses()
}

/** 订阅共享地址集合，返回默认地址置顶后的列表 */
export function useAddresses(): { items: AddressFixture[]; defaultId: string | null } {
  const addresses = useAddressStore((state) => state.addresses)

  return useMemo(() => {
    const items = sortAddresses(addresses)
    return { items, defaultId: items.find((item) => item.isDefault)?.id ?? null }
  }, [addresses])
}

/** 按 id 取单条地址（编辑回填用） */
export function useAddress(id?: string | null): AddressFixture | undefined {
  return useAddressStore((state) => state.addresses.find((item) => item.id === id))
}
