import { buildQuery, buildUrl, createApiClient } from './api-client.js'
import type { ApiSchema } from './api-schema.js'
import type { Middleware } from './types.js'

// ─── Middleware setup ─────────────────────────────────────────────────────────

const loggingMiddleware: Middleware = {
  onRequest(ctx) {
    console.log(`→ ${ctx.method} ${ctx.url}`)
    return ctx
  },
  onResponse(ctx) {
    console.log(`← ${ctx.status} (${typeof ctx.data === 'object' ? JSON.stringify(ctx.data).slice(0, 80) : ctx.data})`)
    return ctx
  },
  onError(ctx) {
    console.error(`✗ ${ctx.method} ${ctx.url} — ${ctx.error.message}`)
  },
}

const client = createApiClient<ApiSchema>('https://jsonplaceholder.typicode.com')
  .use(loggingMiddleware)

// ─── buildUrl demo ────────────────────────────────────────────────────────────

const url1 = buildUrl('/users/:id', { id: '42' })
console.log('buildUrl("/users/:id", { id: "42" })          →', url1)

const url2 = buildUrl('/users/:id/posts/:postId', { id: '1', postId: '10' })
console.log('buildUrl("/users/:id/posts/:postId", {...})   →', url2)

// ─── buildQuery demo ──────────────────────────────────────────────────────────

const qs = buildQuery({ page: 1, limit: 10, search: 'angular' })
console.log('buildQuery({ page:1, limit:10, search:"angular" }) →', qs)

console.log('\n─── API requests ─────────────────────────────────────────────')

async function main(): Promise<void> {
  // GET /users — response is { id: number; name: string; email: string }[]
  const users = await client.request('/users', 'GET', {
    query: { page: 1, limit: 3 },
  })
  // noUncheckedIndexedAccess: first element may be undefined
  const first = users[0]
  if (first !== undefined) {
    console.log('\nFirst user:', first.id, first.name, first.email)
  }

  // GET /users/:id — response is a single user object
  const user = await client.request('/users/:id', 'GET', {
    params: { id: '1' },
  })
  console.log('\nUser #1:', user.id, user.name)

  // POST /users — body required, response is the created user
  const created = await client.request('/users', 'POST', {
    body: { name: 'John Doe', email: 'john@example.com' },
  })
  console.log('\nCreated user id:', created.id, created.name)

  // PATCH /users/:id — params required, body fields are all optional
  const patched = await client.request('/users/:id', 'PATCH', {
    params: { id: '1' },
    body: { name: 'John Updated' },
  })
  console.log('\nPatched user:', patched.id, patched.name)

  // DELETE /users/:id — response is { success: boolean }
  const deleted = await client.request('/users/:id', 'DELETE', {
    params: { id: '1' },
  })
  console.log('\nDeleted:', deleted.success)
}

main().catch(console.error)
