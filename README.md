# Type-Safe API Client Generator

Типобезпечний API-клієнт на TypeScript. Вся перевірка endpoint'ів, methods, params, query та body виконується на рівні типів — ще до запуску коду.

## Швидкий старт

```bash
npm install
npm run build   # компіляція
npm run demo    # збірка + запуск демо
```

## Структура проєкту

```
src/
  types.ts         — всі utility-типи (ExtractRouteParams, BuildRequestConfig, ResponseOf, …)
  api-schema.ts    — визначення ApiSchema
  api-client.ts    — клас ApiClient + buildUrl + buildQuery
  demo.ts          — демонстрація з middleware і запитами
  type-tests.ts    — type tests (@ts-expect-error + satisfies)
```

## Можливості

### 1. `ExtractRouteParams` — витяг параметрів з path-рядка

```ts
type P = ExtractRouteParams<"/users/:id/posts/:postId">
// → { id: string } & { postId: string }
```

### 2. Типобезпечний `ApiClient`

```ts
const client = createApiClient<ApiSchema>("https://api.example.com")

// ✅ OK — query is optional
const users = await client.request("/users", "GET", { query: { page: 1 } })
// users: { id: number; name: string; email: string }[]

// ✅ OK — params derived from path string
const user = await client.request("/users/:id", "GET", { params: { id: "1" } })

// ❌ Помилка компіляції — 'DELETE' не задекларований для '/users'
client.request("/users", "DELETE", {})

// ❌ Помилка компіляції — відсутній обов'язковий params.id
client.request("/users/:id", "GET", {})

// ❌ Помилка компіляції — неправильний ключ параметра
client.request("/users/:id", "GET", { params: { userId: "1" } })
```

### 3. Utility types

```ts
type UserMethods  = MethodsOf<ApiSchema, "/users">
// → "GET" | "POST"

type UserResponse = ResponseOf<ApiSchema, "/users/:id", "GET">
// → { id: number; name: string; email: string }

type PostPaths    = PathsWithMethod<ApiSchema, "POST">
// → "/users"
```

### 4. Bonus: `buildUrl` і `buildQuery`

```ts
buildUrl("/users/:id/posts/:postId", { id: "1", postId: "10" })
// → "/users/1/posts/10"

buildQuery({ page: 1, limit: 10, search: "angular" })
// → "?page=1&limit=10&search=angular"
```

### 5. Bonus: Middleware

```ts
client.use({
  onRequest(ctx)  { console.log("→", ctx.method, ctx.url); return ctx },
  onResponse(ctx) { console.log("←", ctx.status); return ctx },
  onError(ctx)    { console.error("✗", ctx.error.message) },
})
```

## tsconfig highlights

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true
}
```

## Використані TypeScript-техніки

| Техніка | Де застосована |
|---|---|
| **Template literal types** | `ExtractRouteParams` — витяг `:param` з path |
| **Recursive conditional types** | `ExtractSegmentParams` — рекурсивний обхід сегментів |
| **`infer`** | `ExtractResponse`, `BuildRequestConfig` |
| **Mapped types** | `PathsWithMethod` — фільтрація по методу |
| **Indexed access types** | `ExtractEndpoint<TSchema, TPath, TMethod>` |
| **`keyof`** | `ExtractMethods`, перевірка наявності params |
| **Generic constraints** | `TSchema extends ApiSchemaConstraint` |
| **Utility types** | `NonNullable`, `Record`, `Partial` |
| **`satisfies`** | Type assertions у type-tests.ts |
