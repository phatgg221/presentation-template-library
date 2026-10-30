import { NextResponse } from "next/server"
import { handler, requireAdmin } from "@/lib/api"
import { templatesRepo } from "@/lib/repositories/templates"
import { templateListQuerySchema } from "@/lib/schemas"

export const dynamic = "force-dynamic"

/** GET /api/admin/templates — admin listing including unpublished templates. */
export const GET = handler(async (req) => {
  requireAdmin(req)
  const query = templateListQuerySchema.parse({ ...Object.fromEntries(new URL(req.url).searchParams), limit: 100 })
  return NextResponse.json(templatesRepo.list({ ...query, includeUnpublished: true }))
})
