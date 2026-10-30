type Handler<P> = (req: Request, ctx: { params: Promise<P> }) => Promise<Response>

/** Calls a Next.js route handler directly, without an HTTP server. */
export async function call<P = Record<string, never>>(
  handler: Handler<P>,
  url: string,
  init: RequestInit & { params?: P; json?: unknown } = {},
) {
  const { params, json, ...rest } = init
  const req = new Request(`http://localhost${url}`, {
    ...rest,
    ...(json !== undefined ? { body: JSON.stringify(json), headers: { "content-type": "application/json", ...rest.headers } } : {}),
  })
  const res = await handler(req, { params: Promise.resolve((params ?? {}) as P) })
  const type = res.headers.get("content-type") ?? ""
  const body = type.includes("application/json") ? await res.json() : null
  return { res, status: res.status, body }
}

export const ADMIN = { "x-admin-token": "dev-admin-token" }
