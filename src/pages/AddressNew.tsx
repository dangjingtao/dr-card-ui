import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ClipboardPaste } from 'lucide-react'
import { Button, Input, Select, Switch, Toast } from '../components/ui'
import PageContainer from '../components/mobile/PageContainer'
import DebugPanel from '../components/mobile/DebugPanel'
import { findRouteByPathname } from '../app/router/routes'
import { useFixtureState } from '../app/fixtures/useFixture'
import { ADDRESS_FORM_COPY, ADDRESS_REGION_OPTIONS } from '../app/fixtures'
import { addressFormSchema, type AddressFormData } from '../app/forms/address'
import { addAddress, updateAddress, useAddress } from '../app/state/addresses'

const EMPTY_FORM: AddressFormData = {
  name: '',
  phone: '',
  region: '',
  detail: '',
  isDefault: false,
}

/** `?state=invalid` 用的确定性错误样本：姓名为空 + 手机号位数不足 */
const INVALID_FORM: AddressFormData = {
  name: '',
  phone: '138000',
  region: '',
  detail: '青年路 5 号大悦城 B1-038',
  isDefault: false,
}

/**
 * #60 添加新地址（T010）
 * 原型 04 §13：姓名 / 手机号 / 省市区县-乡镇 / 详细地址 + 粘贴识别 + 设为默认 + 保存。
 * ⚠️ 编辑态复用本页表单（B-027）；粘贴识别只保留入口不实现解析（B-028）。
 */
export default function AddressNew() {
  const route = findRouteByPathname('/address/new')
  const { state } = useFixtureState(route)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const editId = searchParams.get('id')
  const editing = useAddress(editId)

  const initial = useMemo<AddressFormData>(() => {
    if (editing) {
      const { name, phone, region, detail, isDefault } = editing
      return { name, phone, region, detail, isDefault }
    }
    if (state?.key === 'invalid') return INVALID_FORM
    return EMPTY_FORM
  }, [editing, state?.key])

  const {
    control,
    handleSubmit,
    reset,
    trigger,
    clearErrors,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: initial,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    shouldFocusError: false,
  })

  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null)

  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])
  const track = (fn: () => void, delay: number) => {
    timers.current.push(window.setTimeout(fn, delay))
  }

  /** `?state=` 或编辑目标变化时重新同步表单，保证深链可复现 */
  useEffect(() => {
    reset(initial)
    if (state?.key === 'invalid') void trigger()
  }, [initial, reset, state?.key, trigger])

  /** ⚠️ 粘贴识别原型只画了入口，未定义解析规则（B-028），这里只给可关闭的说明性提示 */
  const onPaste = () => {
    setToast({ message: ADDRESS_FORM_COPY.pasteUnavailable, ok: false })
    track(() => setToast(null), 1600)
  }

  const onSubmit = (data: AddressFormData) => {
    const { isDefault, ...value } = data

    if (editing) updateAddress(editing.id, value, isDefault)
    else addAddress(value, isDefault)

    setToast({ message: editing ? ADDRESS_FORM_COPY.updatedToast : ADDRESS_FORM_COPY.savedToast, ok: true })
    track(() => navigate('/address'), 900)
  }

  return (
    <PageContainer inset={false} className="flex min-h-full flex-col pb-6">
      <div className="space-y-4 px-4 pt-4">
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              label={ADDRESS_FORM_COPY.nameLabel}
              placeholder={ADDRESS_FORM_COPY.namePlaceholder}
              value={field.value}
              error={fieldState.error?.message}
              onBlur={field.onBlur}
              onChange={(event) => {
                field.onChange(event.target.value)
                clearErrors('name')
              }}
            />
          )}
        />
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              label={ADDRESS_FORM_COPY.phoneLabel}
              placeholder={ADDRESS_FORM_COPY.phonePlaceholder}
              type="tel"
              inputMode="numeric"
              maxLength={11}
              value={field.value}
              error={fieldState.error?.message}
              onBlur={field.onBlur}
              onChange={(event) => {
                field.onChange(event.target.value.replace(/\D/g, ''))
                clearErrors('phone')
              }}
            />
          )}
        />
        <Controller
          name="region"
          control={control}
          render={({ field, fieldState }) => (
            <Select
              label={ADDRESS_FORM_COPY.regionLabel}
              placeholder={ADDRESS_FORM_COPY.regionPlaceholder}
              options={ADDRESS_REGION_OPTIONS}
              value={field.value}
              error={fieldState.error?.message}
              onBlur={field.onBlur}
              onChange={(event) => {
                field.onChange(event.target.value)
                clearErrors('region')
              }}
            />
          )}
        />
        <Controller
          name="detail"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              label={ADDRESS_FORM_COPY.detailLabel}
              placeholder={ADDRESS_FORM_COPY.detailPlaceholder}
              value={field.value}
              error={fieldState.error?.message}
              onBlur={field.onBlur}
              onChange={(event) => {
                field.onChange(event.target.value)
                clearErrors('detail')
              }}
            />
          )}
        />

        <Button
          variant="outline"
          leadingIcon={ClipboardPaste}
          className="w-full"
          onClick={onPaste}
        >
          {ADDRESS_FORM_COPY.pasteAction}
        </Button>

        <div className="flex items-center justify-between rounded-container bg-surface px-4 py-3 shadow-card">
          <span className="text-sm text-text-primary">{ADDRESS_FORM_COPY.defaultSwitch}</span>
          <Controller
            name="isDefault"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={field.onChange}
                label={ADDRESS_FORM_COPY.defaultSwitch}
              />
            )}
          />
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto bg-background px-4 pb-[env(safe-area-inset-bottom)] pt-3">
        <Button size="large" className="w-full rounded-pill" onClick={handleSubmit(onSubmit)}>
          {ADDRESS_FORM_COPY.submit}
        </Button>
      </div>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-40 flex justify-center px-6">
          <Toast message={toast.message} status={toast.ok ? 'success' : 'info'} />
        </div>
      )}

      <DebugPanel route={route} />
    </PageContainer>
  )
}
