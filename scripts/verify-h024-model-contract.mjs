import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createServer as createViteServer } from 'vite'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

process.env.VITE_API_BASE_URL = 'https://h024.mock.invalid'

const vite = await createViteServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
})

let mockServer

try {
  const { handlers } = await vite.ssrLoadModule('/src/mocks/handlers/index.ts')
  const {
    USER_POINTS_INDEX_PATH,
    listUserPointRecords,
  } = await vite.ssrLoadModule('/src/services/userPoints/index.ts')
  const { AppError } = await vite.ssrLoadModule('/src/services/http/appError.ts')

  mockServer = setupServer(...handlers)
  mockServer.listen({ onUnhandledRequest: 'error' })

  const firstPage = await listUserPointRecords({ page: 1, pageSize: 15 })
  assert.equal(firstPage.records.length, 15)
  assert.deepEqual(firstPage.pagination, {
    page: 1,
    pageSize: 15,
    total: 15,
    lastPage: 1,
  })
  assert.equal(firstPage.records[0].kind, 'income')
  assert.equal(firstPage.records[0].title, '任务泡泡值')

  const emptyPage = await listUserPointRecords({ page: 2, pageSize: 15 })
  assert.deepEqual(emptyPage.records, [])
  assert.equal(emptyPage.pagination.page, 2)

  mockServer.use(
    http.get(`*${USER_POINTS_INDEX_PATH}`, () =>
      HttpResponse.json({
        code: 200,
        msg: 'success',
        data: {
          data: [
            {
              id: 1,
              userId: 10001,
              points: 10,
              before_points: 0,
              after_points: 10,
              type: 10,
            },
          ],
          current_page: 1,
          per_page: 15,
          total: 1,
          last_page: 1,
        },
      }),
    ),
  )

  await assert.rejects(
    listUserPointRecords(),
    (error) =>
      error instanceof AppError &&
      error.kind === 'contract' &&
      error.code === 'CONTRACT_VALIDATION_FAILED',
    'camelCase userId must not silently replace confirmed backend user_id',
  )

  const contractSource = fs.readFileSync('src/services/userPoints/contracts.ts', 'utf8')
  assert.match(contractSource, /user_id/)
  assert.match(contractSource, /before_points/)
  assert.match(contractSource, /after_points/)
  assert.match(contractSource, /object_type/)
  assert.doesNotMatch(contractSource, /userId:/)

  const serviceSource = fs.readFileSync('src/services/userPoints/index.ts', 'utf8')
  assert.match(serviceSource, /\/api\/userpoints\/index/)
  assert.doesNotMatch(serviceSource, /runtimePolicy|VITE_DATA_MODE|mockScenario|Authorization/)

  const pageSource = fs.readFileSync('src/pages/PointsDetail.tsx', 'utf8')
  assert.match(pageSource, /listUserPointRecords/)
  assert.doesNotMatch(pageSource, /filterBubbleRecords|BUBBLE_RECORDS|setTimeout/)

  console.log(
    'H024 PASS: PointsDetail uses model contract → service/adapter → HTTP → MSW, success and empty pagination are deterministic, malformed renamed transport fields fail contract validation, and the page has no Mock/API branch.',
  )
} finally {
  mockServer?.close()
  await vite.close()
}
