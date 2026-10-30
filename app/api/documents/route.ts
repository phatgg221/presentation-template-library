import { NextResponse } from "next/server"
import { handler, notFound, readJson } from "@/lib/api"
import { documentsRepo } from "@/lib/repositories/documents"
import { documentCreateSchema, kindSchema } from "@/lib/schemas"

export const dynamic = "force-dynamic"

/** GET /api/documents?kind= — "Tài liệu của tôi". */
export const GET = handler(async (req) => {
  const kind = new URL(req.url).searchParams.get("kind")
  return NextResponse.json({ items: documentsRepo.list(kind ? kindSchema.parse(kind) : undefined) })
})

/** POST /api/documents { templateId, title? } — create an independent copy of a template. */
export const POST = handler(async (req) => {
  const { templateId, title } = await readJson(req, documentCreateSchema)
  const document = documentsRepo.createFromTemplate(templateId, title)
  if (!document) notFound("Không tìm thấy mẫu")
  return NextResponse.json(document, { status: 201, headers: { Location: `/api/documents/${document.id}` } })
})
