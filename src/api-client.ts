import type {
  ApiSchemaConstraint,
  BuildRequestConfig,
  ErrorContext,
  ExtractEndpoint,
  ExtractMethods,
  ExtractPaths,
  ExtractResponse,
  ExtractRouteParams,
  Middleware,
  RequestContext,
  ResponseContext,
} from './types.js'

// ─── URL utilities ────────────────────────────────────────────────────────────

/**
 * Replaces :param placeholders in a path template with concrete values.
 * The params type is inferred from the path string itself.
 *
 * buildUrl("/users/:id/posts/:postId", { id: "1", postId: "10" })
 *   → "/users/1/posts/10"
 */
export function buildUrl<TPath extends string>(
  path: TPath,
  params: ExtractRouteParams<TPath>
): string {
  // Safe cast: ExtractRouteParams always produces { [param]: string } objects
  const entries = Object.entries(params) as [string, string][]
  return entries.reduce(
    (acc, [key, value]) => acc.replace(`:${key}`, value),
    path as string
  )
}

/**
 * Serialises a plain object into a query string.
 *
 * buildQuery({ page: 1, limit: 10, search: "angular" })
 *   → "?page=1&limit=10&search=angular"
 */
export function buildQuery(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  }
  const qs = searchParams.toString()
  return qs.length > 0 ? `?${qs}` : ''
}

// ─── Runtime validation ───────────────────────────────────────────────────────

function validateConfig(config: unknown): void {
  if (config === null || typeof config !== 'object') {
    throw new TypeError('Request config must be a non-null object')
  }
  const cfg = config as Record<string, unknown>
  if ('params' in cfg && (cfg['params'] === null || typeof cfg['params'] !== 'object')) {
    throw new TypeError('config.params must be a non-null object')
  }
  if ('query' in cfg && (cfg['query'] === null || typeof cfg['query'] !== 'object')) {
    throw new TypeError('config.query must be a non-null object')
  }
}

// ─── Internal type ────────────────────────────────────────────────────────────

type InternalConfig = {
  params?: Record<string, string>
  query?: Record<string, unknown>
  body?: unknown
}

// ─── ApiClient ────────────────────────────────────────────────────────────────

export class ApiClient<TSchema extends ApiSchemaConstraint> {
  private readonly baseUrl: string
  private readonly middlewares: Middleware[]

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
    this.middlewares = []
  }

  /** Registers a middleware. Returns `this` for fluent chaining. */
  use(middleware: Middleware): this {
    this.middlewares.push(middleware)
    return this
  }

  async request<
    TPath extends ExtractPaths<TSchema>,
    TMethod extends ExtractMethods<TSchema, TPath>
  >(
    path: TPath,
    method: TMethod,
    config: BuildRequestConfig<TPath, ExtractEndpoint<TSchema, TPath, TMethod>>
  ): Promise<ExtractResponse<ExtractEndpoint<TSchema, TPath, TMethod>>> {
    // Runtime guard — type safety catches most issues at compile time
    validateConfig(config)

    const { params, query, body } = config as InternalConfig

    // Substitute :param placeholders using buildUrl
    const resolvedPath = params !== undefined
      ? buildUrl(path, params as ExtractRouteParams<typeof path>)
      : (path as string)

    // Append query string using buildQuery
    const qs = query !== undefined ? buildQuery(query) : ''
    const fullUrl = `${this.baseUrl}${resolvedPath}${qs}`

    // Build initial request context for middleware pipeline
    let requestCtx: RequestContext = {
      url: fullUrl,
      method: method as string,
      headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body } : {}),
    }

    // Apply onRequest middleware chain
    for (const mw of this.middlewares) {
      if (mw.onRequest !== undefined) {
        requestCtx = await mw.onRequest(requestCtx)
      }
    }

    const init: RequestInit = {
      method: requestCtx.method,
      headers: requestCtx.headers,
      ...(requestCtx.body !== undefined
        ? { body: JSON.stringify(requestCtx.body) }
        : {}),
    }

    let httpResponse: Response
    try {
      httpResponse = await fetch(requestCtx.url, init)
    } catch (err) {
      const errorCtx: ErrorContext = {
        error: err instanceof Error ? err : new Error(String(err)),
        url: requestCtx.url,
        method: requestCtx.method,
      }
      for (const mw of this.middlewares) {
        if (mw.onError !== undefined) {
          await mw.onError(errorCtx)
        }
      }
      throw errorCtx.error
    }

    if (!httpResponse.ok) {
      const error = new Error(`HTTP ${httpResponse.status}: ${httpResponse.statusText}`)
      const errorCtx: ErrorContext = {
        error,
        url: requestCtx.url,
        method: requestCtx.method,
      }
      for (const mw of this.middlewares) {
        if (mw.onError !== undefined) {
          await mw.onError(errorCtx)
        }
      }
      throw error
    }

    // json() returns Promise<any> — we assert the correct return type here
    const rawData: unknown = await httpResponse.json()

    // Build response context for middleware pipeline
    const responseHeaders: Record<string, string> = {}
    httpResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    let responseCtx: ResponseContext<unknown> = {
      data: rawData,
      status: httpResponse.status,
      headers: responseHeaders,
    }

    // Apply onResponse middleware chain
    for (const mw of this.middlewares) {
      if (mw.onResponse !== undefined) {
        responseCtx = await mw.onResponse(responseCtx)
      }
    }

    // Cast is safe: the schema guarantees the response shape
    return responseCtx.data as ExtractResponse<ExtractEndpoint<TSchema, TPath, TMethod>>
  }
}

export function createApiClient<TSchema extends ApiSchemaConstraint>(
  baseUrl: string = ''
): ApiClient<TSchema> {
  return new ApiClient<TSchema>(baseUrl)
}
