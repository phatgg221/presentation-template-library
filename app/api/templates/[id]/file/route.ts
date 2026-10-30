import { handler, notFound, parseId } from "@/lib/api"
import { templatesRepo } from "@/lib/repositories/templates"
import { getTemplateOriginalFile } from "@/lib/template-files"
import { PPTX_MIME } from "@/lib/exporters/pptx"
import { contentDisposition } from "@/lib/text"

/** GET /api/templates/:id/file — download the template's original .pptx (read-only). */
export const GET = handler<{ id: string }>(async (_req, { params }) => {
  const id = parseId((await params).id)
  const template = templatesRepo.get(id)
  if (!template || !template.isPublished) notFound("Không tìm thấy mẫu")
  const body = await getTemplateOriginalFile(template)
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": PPTX_MIME,
      "Content-Disposition": contentDisposition(`Mau - ${template.name}`, "pptx"),
      "Cache-Control": "no-store",
    },
  })
})
