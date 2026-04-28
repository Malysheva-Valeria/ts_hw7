// ─── HTTP primitives ─────────────────────────────────────────────────────────

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'

// Reference shape for a single endpoint — documents the expected schema structure
export type EndpointDef = {
  params?: Record<string, string>
  query?: Record<string, unknown>
  body?: Record<string, unknown>
  response: unknown
}

// Minimum structural constraint for any API schema object
export type ApiSchemaConstraint = Record<string, Record<string, unknown>>

// ─── Route param extraction ───────────────────────────────────────────────────

// Internal recursive helper: walks the path segment-by-segment
type ExtractSegmentParams<TPath extends string> =
  TPath extends `${string}/:${infer Param}/${infer Rest}`
    ? { [K in Param]: string } & ExtractSegmentParams<Rest>
    : TPath extends `${string}/:${infer Param}`
      ? { [K in Param]: string }
      : Record<never, never>

/**
 * Extracts route parameters from a path string via template literal inference.
 *
 * ExtractRouteParams<"/users/:id/posts/:postId">
 *   → { id: string } & { postId: string }
 *
 * ExtractRouteParams<"/users">
 *   → Record<never, never>  (empty — no params)
 */
export type ExtractRouteParams<TPath extends string> =
  ExtractSegmentParams<TPath>

// ─── Schema navigation ────────────────────────────────────────────────────────

// All route paths declared in the schema
export type ExtractPaths<TSchema> = keyof TSchema & string

// Valid HTTP methods declared for a given path
export type ExtractMethods<TSchema, TPath extends keyof TSchema> =
  keyof TSchema[TPath] & HttpMethod

// The endpoint definition for a specific path + method pair
export type ExtractEndpoint<
  TSchema,
  TPath extends keyof TSchema,
  TMethod extends keyof TSchema[TPath]
> = TSchema[TPath][TMethod]

// Response payload type inferred from an endpoint definition
export type ExtractResponse<TEndpoint> =
  TEndpoint extends { response: infer R } ? R : never

// ─── Request config builder ───────────────────────────────────────────────────

/**
 * Derives the exact request config type from the route path and endpoint definition.
 *
 * - params: derived from the path string (required when path has :params; forbidden otherwise)
 * - query:  from the schema (optional when defined; forbidden otherwise)
 * - body:   from the schema (required when defined; forbidden otherwise)
 */
export type BuildRequestConfig<TPath extends string, TEndpoint> =
  (keyof ExtractRouteParams<TPath> extends never
    ? { params?: never }
    : { params: ExtractRouteParams<TPath> }) &
  (TEndpoint extends { query: infer Q }
    ? { query?: Q }
    : { query?: never }) &
  (TEndpoint extends { body: infer B }
    ? { body: B }
    : { body?: never })

// ─── Public utility types ─────────────────────────────────────────────────────

/** Response type for a specific schema path + method. */
export type ResponseOf<
  TSchema extends ApiSchemaConstraint,
  TPath extends ExtractPaths<TSchema>,
  TMethod extends ExtractMethods<TSchema, TPath>
> = ExtractResponse<ExtractEndpoint<TSchema, TPath, TMethod>>

/** Union of HTTP methods available for a given path. */
export type MethodsOf<
  TSchema extends ApiSchemaConstraint,
  TPath extends ExtractPaths<TSchema>
> = ExtractMethods<TSchema, TPath>

/** Union of paths in the schema that support a given HTTP method. */
export type PathsWithMethod<
  TSchema extends ApiSchemaConstraint,
  TMethod extends HttpMethod
> = {
  [TPath in ExtractPaths<TSchema>]: TMethod extends ExtractMethods<TSchema, TPath>
    ? TPath
    : never
}[ExtractPaths<TSchema>]

// ─── Middleware types ─────────────────────────────────────────────────────────

export type RequestContext = {
  url: string
  method: string
  headers: Record<string, string>
  body?: unknown
}

export type ResponseContext<TData = unknown> = {
  data: TData
  status: number
  headers: Record<string, string>
}

export type ErrorContext = {
  error: Error
  url: string
  method: string
}

export type Middleware = {
  onRequest?: (ctx: RequestContext) => RequestContext | Promise<RequestContext>
  onResponse?: (
    ctx: ResponseContext<unknown>
  ) => ResponseContext<unknown> | Promise<ResponseContext<unknown>>
  onError?: (ctx: ErrorContext) => void | Promise<void>
}
