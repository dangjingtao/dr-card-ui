import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { zodResolver } from '@hookform/resolvers/zod'

const server = await createServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
})

try {
  const formModule = await server.ssrLoadModule('/src/app/forms/address.ts')
  const fixtureModule = await server.ssrLoadModule('/src/app/fixtures/addressOrders.ts')
  const { addressFormSchema } = formModule
  const { ADDRESS_FORM_COPY } = fixtureModule

  const valid = {
    name: '张小鹿',
    phone: '13800008899',
    region: '北京市 北京市 朝阳区 青年路街道',
    detail: '青年路 5 号大悦城 B1-038 泡泡洗护柜台',
    isDefault: true,
  }

  const parsed = addressFormSchema.safeParse(valid)
  assert.equal(parsed.success, true)
  if (!parsed.success) throw new Error('valid H012 address probe unexpectedly failed')
  assert.deepEqual(parsed.data, valid)

  const whitespacePreserved = addressFormSchema.safeParse({
    ...valid,
    name: '  张小鹿  ',
    phone: ' 13800008899 ',
  })
  assert.equal(whitespacePreserved.success, true)
  if (!whitespacePreserved.success) throw new Error('whitespace preservation probe unexpectedly failed')
  assert.equal(whitespacePreserved.data.name, '  张小鹿  ')
  assert.equal(whitespacePreserved.data.phone, ' 13800008899 ')

  const invalid = {
    name: '',
    phone: '138000',
    region: '',
    detail: '',
    isDefault: false,
  }
  const invalidResult = addressFormSchema.safeParse(invalid)
  assert.equal(invalidResult.success, false)
  if (invalidResult.success) throw new Error('invalid H012 address probe unexpectedly passed')

  const issueByPath = Object.fromEntries(
    invalidResult.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
  )
  assert.deepEqual(issueByPath, {
    name: ADDRESS_FORM_COPY.nameError,
    phone: ADDRESS_FORM_COPY.phoneError,
    region: ADDRESS_FORM_COPY.regionError,
    detail: ADDRESS_FORM_COPY.detailError,
  })

  const resolveAddress = zodResolver(addressFormSchema)
  const resolverResult = await resolveAddress(invalid, {}, {
    criteriaMode: 'firstError',
    fields: {},
    names: undefined,
    shouldUseNativeValidation: false,
  })
  assert.equal(resolverResult.errors.name?.message, ADDRESS_FORM_COPY.nameError)
  assert.equal(resolverResult.errors.phone?.message, ADDRESS_FORM_COPY.phoneError)
  assert.equal(resolverResult.errors.region?.message, ADDRESS_FORM_COPY.regionError)
  assert.equal(resolverResult.errors.detail?.message, ADDRESS_FORM_COPY.detailError)

  const invalidSwitch = addressFormSchema.safeParse({ ...valid, isDefault: 'yes' })
  assert.equal(invalidSwitch.success, false)

  const pageSource = await readFile('src/pages/AddressNew.tsx', 'utf8')
  for (const required of [
    'useForm<AddressFormData>',
    'zodResolver(addressFormSchema)',
    '<Controller',
    'reset(initial)',
    'handleSubmit(onSubmit)',
  ]) {
    assert.equal(pageSource.includes(required), true, `AddressNew.tsx is missing H012 integration: ${required}`)
  }
  for (const retired of ['validateAddressForm', 'AddressFormErrors', 'setErrors(', 'setValue(']) {
    assert.equal(pageSource.includes(retired), false, `AddressNew.tsx still contains retired manual form state: ${retired}`)
  }

  const fixtureSource = await readFile('src/app/fixtures/addressOrders.ts', 'utf8')
  for (const retired of ['validateAddressForm', 'AddressFormErrors', 'interface AddressFormValue']) {
    assert.equal(fixtureSource.includes(retired), false, `addressOrders.ts still owns retired validation: ${retired}`)
  }

  const stateSource = await readFile('src/app/state/addresses.ts', 'utf8')
  assert.equal(
    stateSource.includes("import type { AddressFormValue } from '../forms/address'"),
    true,
    'address state must consume the schema-derived AddressFormValue type',
  )

  const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
  assert.equal(packageJson.dependencies['react-hook-form'], '7.88.0')
  assert.equal(packageJson.dependencies['@hookform/resolvers'], '5.9.1')

  console.log(
    'H012 FORM PASS: RHF + Zod resolver integration, single address validation source, edit/reset wiring, legacy validation retirement, and validation behavior are verified.',
  )
} finally {
  await server.close()
}
