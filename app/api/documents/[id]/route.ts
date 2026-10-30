import { NextResponse } from "next/server"
import { handler, notFound, parseId, readJson } from "@/lib/api"
import { documentsRepo } from "@/lib/repositories/documents"
import { documentPatchSchema } from "@/lib/schemas"

type Params = { id: string }

export const GET = handler<Params>(async (_req, { params }) => {
  const document = documentsRepo.get(parseId((await params).id))
  if (!document) notFound("Không tìm thấy tài liệu")
  return NextResponse.json(document)
})

/** PATCH /api/documents/:id { title?, content? } — only ever touches the documents table. */
export const PATCH = handler<Params>(async (req, { params }) => {
  const id = parseId((await params).id)
  const patch = await readJson(req, documentPatchSchema)
  const document = documentsRepo.update(id, patch)
  if (!document) notFound("Không tìm thấy tài liệu")
  return NextResponse.json({ id: document.id, title: document.title, updatedAt: document.updatedAt })
})

export const DELETE = handler<Params>(async (_req, { params }) => {
  if (!documentsRepo.delete(parseId((await params).id))) notFound("Không tìm thấy tài liệu")
  return new Response(null, { status: 204 })
})
