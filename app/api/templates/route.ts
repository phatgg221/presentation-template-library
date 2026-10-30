import { NextResponse } from "next/server"
import { handler, readJson, requireAdmin } from "@/lib/api"
import { templatesRepo } from "@/lib/repositories/templates"
import { templateCreateSchema, templateListQuerySchema } from "@/lib/schemas"

export const dynamic = "force-dynamic"

/** GET /api/templates?kind=&q=&category=&sort=newest|name&page=&limit= */
export const GET = handler(async (req) => {
  const params = Object.fromEntries(new URL(req.url).searchParams)
  const query = templateListQuerySchema.parse(params)
  return NextResponse.json(templatesRepo.list(query))
})

/** POST /api/templates (admin) — add a template; it shows up in the library without UI changes. */
export const POST = handler(async (req) => {
  requireAdmin(req)
  const input = await readJson(req, templateCreateSchema)
  return NextResponse.json(templatesRepo.create(input), { status: 201 })
})
