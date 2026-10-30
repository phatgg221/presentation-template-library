import { NextResponse } from "next/server"
import { handler, notFound, parseId, readJson, requireAdmin } from "@/lib/api"
import { templatesRepo } from "@/lib/repositories/templates"
import { templateUpdateSchema } from "@/lib/schemas"

type Params = { id: string }

/** GET /api/templates/:id — unpublished templates are only visible to admins. */
export const GET = handler<Params>(async (req, { params }) => {
  const template = templatesRepo.get(parseId((await params).id))
  if (!template) notFound("Không tìm thấy mẫu")
  if (!template.isPublished) {
    try {
      requireAdmin(req)
    } catch {
      notFound("Không tìm thấy mẫu")
    }
  }
  return NextResponse.json(template)
})

/** PUT /api/templates/:id (admin) — partial update; content changes bump `version`. */
export const PUT = handler<Params>(async (req, { params }) => {
  requireAdmin(req)
  const id = parseId((await params).id)
  const input = await readJson(req, templateUpdateSchema)
  const template = templatesRepo.update(id, input)
  if (!template) notFound("Không tìm thấy mẫu")
  return NextResponse.json(template)
})
