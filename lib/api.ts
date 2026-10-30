import "server-only"
import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { ZodError, type ZodType } from "zod"
import { ConflictError } from "./repositories/templates"
import { uuidSchema } from "./schemas"

export type ErrorCode = "VALIDATION_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | "CONFLICT" | "PAYLOAD_TOO_LARGE" | "INTERNAL"

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export const MAX_BODY_BYTES = 1_000_000

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: { code: error.code, message: error.message, details: error.details } }, { status: error.status })
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Dữ liệu không hợp lệ", details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) } },
      { status: 400 },
    )
  }
  if (error instanceof ConflictError) {
    return NextResponse.json({ error: { code: "CONFLICT", message: error.message } }, { status: 409 })
  }
  // Never leak stack traces or internals to the client.
  console.error("[api] unexpected error", error)
  return NextResponse.json({ error: { code: "INTERNAL", message: "Đã xảy ra lỗi máy chủ" } }, { status: 500 })
}

type RouteCtx<P> = { params: Promise<P> }

/** Wraps a route handler so every thrown error becomes a consistent JSON error response. */
export function handler<P = Record<string, never>>(fn: (req: Request, ctx: RouteCtx<P>) => Promise<Response> | Response) {
  return async (req: Request, ctx: RouteCtx<P>) => {
    try {
      return await fn(req, ctx)
    } catch (error) {
      return errorResponse(error)
    }
  }
}

export function parseId(id: string): string {
  const result = uuidSchema.safeParse(id)
  if (!result.success) throw new ApiError(400, "VALIDATION_ERROR", "ID không hợp lệ")
  return result.data
}

export async function readJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const length = Number(req.headers.get("content-length") ?? 0)
  if (length > MAX_BODY_BYTES) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Nội dung vượt quá 1MB")
  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Nội dung vượt quá 1MB")
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new ApiError(400, "VALIDATION_ERROR", "Body phải là JSON hợp lệ")
  }
  return schema.parse(data)
}

export function notFound(message = "Không tìm thấy"): never {
  throw new ApiError(404, "NOT_FOUND", message)
}

/** Development fallback token so the admin page works out of the box; set ADMIN_TOKEN in production. */
export function adminToken(): string | null {
  return process.env.ADMIN_TOKEN || (process.env.NODE_ENV === "production" ? null : "dev-admin-token")
}

export function requireAdmin(req: Request) {
  const expected = adminToken()
  const given = req.headers.get("x-admin-token") ?? ""
  const ok =
    expected !== null &&
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  if (!ok) throw new ApiError(401, "UNAUTHORIZED", "Sai hoặc thiếu mã quản trị (x-admin-token)")
}
