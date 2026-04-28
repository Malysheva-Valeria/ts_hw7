/**
 * Type tests — compiled by tsc but never executed.
 * Valid calls must type-check silently.
 * Invalid calls are annotated with @ts-expect-error; if the error disappears the test fails.
 */

import { createApiClient } from './api-client.js'
import type { ApiSchema } from './api-schema.js'
import type {
  ExtractRouteParams,
  MethodsOf,
  PathsWithMethod,
  ResponseOf,
} from './types.js'

// ─── Compile-time equality helpers ───────────────────────────────────────────

// Expect<T extends true> = T — fails at the type parameter if T is not true
type Expect<T extends true> = T
// Bidirectional extends check handles unions and intersections correctly
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

// ─── Client under test ────────────────────────────────────────────────────────

const client = createApiClient<ApiSchema>()

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — Valid calls (must compile without errors)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /users — query is optional
client.request('/users', 'GET', {})
client.request('/users', 'GET', { query: { page: 1 } })
client.request('/users', 'GET', { query: { page: 1, limit: 10 } })
client.request('/users', 'GET', { query: { limit: 5 } })

// GET /users/:id — params required
client.request('/users/:id', 'GET', { params: { id: '1' } })

// POST /users — body required
client.request('/users', 'POST', { body: { name: 'Ann', email: 'ann@mail.com' } })

// PATCH /users/:id — params required, all body fields optional
client.request('/users/:id', 'PATCH', { params: { id: '1' }, body: {} })
client.request('/users/:id', 'PATCH', { params: { id: '1' }, body: { name: 'Ann' } })
client.request('/users/:id', 'PATCH', {
  params: { id: '1' },
  body: { name: 'Ann', email: 'ann@mail.com' },
})

// DELETE /users/:id
client.request('/users/:id', 'DELETE', { params: { id: '1' } })

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — Invalid calls (each must produce a TypeScript error)
// ═══════════════════════════════════════════════════════════════════════════════

// @ts-expect-error — '/unknown' is not a declared path in ApiSchema
client.request('/unknown', 'GET', {})

// @ts-expect-error — 'DELETE' is not declared for '/users' (only GET | POST)
client.request('/users', 'DELETE', {})

// @ts-expect-error — 'PUT' is not declared for any path
client.request('/users', 'PUT', {})

// @ts-expect-error — params is required for '/users/:id'
client.request('/users/:id', 'GET', {})

// @ts-expect-error — body is required for POST '/users'
client.request('/users', 'POST', {})

// @ts-expect-error — body is forbidden for GET '/users' (body?: never)
client.request('/users', 'GET', { body: { name: 'John' } })

// @ts-expect-error — query is forbidden for GET '/users/:id' (query?: never)
client.request('/users/:id', 'GET', { params: { id: '1' }, query: { page: 1 } })

// @ts-expect-error — wrong param key: 'userId' instead of 'id'
client.request('/users/:id', 'GET', { params: { userId: '123' } })

// @ts-expect-error — params is forbidden for GET '/users' (params?: never)
client.request('/users', 'GET', { params: { id: '1' } })

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — ExtractRouteParams
// ═══════════════════════════════════════════════════════════════════════════════

// Each line uses `satisfies` to assert the equality at compile time without declaring a variable.
// If Equal<A,B> resolves to false, Expect<false> fails the constraint `extends true`.

true satisfies Expect<Equal<ExtractRouteParams<'/users'>, Record<never, never>>>

true satisfies Expect<Equal<ExtractRouteParams<'/users/:id'>, { id: string }>>

true satisfies Expect<Equal<
  ExtractRouteParams<'/users/:id/posts/:postId'>,
  { id: string } & { postId: string }
>>

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — ResponseOf
// ═══════════════════════════════════════════════════════════════════════════════

true satisfies Expect<Equal<
  ResponseOf<ApiSchema, '/users', 'GET'>,
  { id: number; name: string; email: string }[]
>>

true satisfies Expect<Equal<
  ResponseOf<ApiSchema, '/users/:id', 'GET'>,
  { id: number; name: string; email: string }
>>

true satisfies Expect<Equal<
  ResponseOf<ApiSchema, '/users/:id', 'DELETE'>,
  { success: boolean }
>>

true satisfies Expect<Equal<
  ResponseOf<ApiSchema, '/users', 'POST'>,
  { id: number; name: string; email: string }
>>

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — MethodsOf
// ═══════════════════════════════════════════════════════════════════════════════

true satisfies Expect<Equal<MethodsOf<ApiSchema, '/users'>, 'GET' | 'POST'>>

true satisfies Expect<Equal<MethodsOf<ApiSchema, '/users/:id'>, 'GET' | 'PATCH' | 'DELETE'>>

// Compile-time rejection: assigning a disallowed method to MethodsOf
// @ts-expect-error — 'DELETE' is not in MethodsOf<ApiSchema, '/users'>
export const _invalidMethod: MethodsOf<ApiSchema, '/users'> = 'DELETE'

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — PathsWithMethod
// ═══════════════════════════════════════════════════════════════════════════════

true satisfies Expect<Equal<PathsWithMethod<ApiSchema, 'POST'>, '/users'>>

true satisfies Expect<Equal<PathsWithMethod<ApiSchema, 'GET'>, '/users' | '/users/:id'>>

true satisfies Expect<Equal<PathsWithMethod<ApiSchema, 'PATCH'>, '/users/:id'>>

// @ts-expect-error — '/users/:id' does not support POST
export const _invalidPostPath: PathsWithMethod<ApiSchema, 'POST'> = '/users/:id'

export {}
