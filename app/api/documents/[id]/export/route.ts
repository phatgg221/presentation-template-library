import { z } from "zod"
import { handler, notFound, parseId } from "@/lib/api"
import { documentsRepo } from "@/lib/repositories/documents"
import { PPTX_MIME, deckToPptx } from "@/lib/exporters/pptx"
import { contentDisposition } from "@/lib/text"

const formatSchema = z.enum(["pptx", "json"]).default("pptx")

/** GET /api/documents/:id/export?format=pptx|json */
export const GET = handler<{ id: string }>(async (req, { params }) => {
  const id = parseId((await params).id)
  const format = formatSchema.parse(new URL(req.url).searchParams.get("format") ?? undefined)
  const document = documentsRepo.get(id)
  if (!document) notFound("Không tìm thấy bản trình chiếu")
  const headers = { "Content-Disposition": contentDisposition(document.title, format), "Cache-Control": "no-store" }
  if (format === "json") {
    return new Response(JSON.stringify(document.content, null, 2), {
      headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
    })
  }
  const buffer = await deckToPptx(document.content, { title: document.title })
  return new Response(new Uint8Array(buffer), { headers: { ...headers, "Content-Type": PPTX_MIME } })
})
