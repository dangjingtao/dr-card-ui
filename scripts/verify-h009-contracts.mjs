import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
})

try {
  const { AppError } = await server.ssrLoadModule('/src/services/http/appError.ts')
  const { parseH009MockPayload } = await server.ssrLoadModule(
    '/src/services/contracts/h009MockExample.ts',
  )

  assert.deepEqual(
    parseH009MockPayload({
      id: 'mock-1',
      label: 'H009 contract probe',
      enabled: true,
      additiveField: 'ignored safely',
    }),
    {
      id: 'mock-1',
      label: 'H009 contract probe',
      enabled: true,
    },
  )

  await assert.rejects(
    async () =>
      parseH009MockPayload({
        id: '',
        label: 'broken payload',
        enabled: 'yes',
      }),
    (error) =>
      error instanceof AppError &&
      error.kind === 'contract' &&
      error.code === 'CONTRACT_VALIDATION_FAILED' &&
      error.details?.source === 'mock' &&
      error.details?.contract === 'h009.mock-example' &&
      Array.isArray(error.details?.issues) &&
      error.details.issues.some((issue) => issue.path?.[0] === 'enabled'),
  )

  const sensitiveValue = 'h009-secret-probe-do-not-leak'
  try {
    parseH009MockPayload({
      id: 'mock-2',
      label: 'sensitive probe',
      enabled: sensitiveValue,
    })
    assert.fail('invalid Mock payload unexpectedly passed contract validation')
  } catch (error) {
    assert.equal(error instanceof AppError, true)
    assert.equal(error.kind, 'contract')
    assert.equal(JSON.stringify(error.details).includes(sensitiveValue), false)
  }

  console.log(
    'H009 CONTRACT PASS: valid Mock data parses, invalid structure becomes AppError(contract), and raw payload data is not leaked.',
  )
} finally {
  await server.close()
}
