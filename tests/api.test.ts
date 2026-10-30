import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { GET as listTemplates, POST as createTemplate } from "@/app/api/templates/route"
import { GET as getTemplate, PUT as updateTemplate } from "@/app/api/templates/[id]/route"
import { GET as getTemplateFile } from "@/app/api/templates/[id]/file/route"
import { GET as getCategories } from "@/app/api/templates/categories/route"
import { GET as listDocuments, POST as createDocument } from "@/app/api/documents/route"
import { DELETE as deleteDocument, GET as getDocument, PATCH as patchDocument } from "@/app/api/documents/[id]/route"
import { GET as exportDocument } from "@/app/api/documents/[id]/export/route"
import { ADMIN, call } from "./helpers"
import { presentationTemplates } from "@/lib/seed/presentation-templates"
import type { SlideDeck } from "@/lib/content/types"

const sampleDeck = (title: string): SlideDeck => ({
  theme: presentationTemplates[0].content.theme,
  slides: [{ id: "a", layout: "title", title }, { id: "b", layout: "title-content", title: "Nội dung", bullets: ["Một", "Hai"] }],
})

type Id = { id: string }
const MISSING = "00000000-0000-4000-8000-000000000000"

async function firstTemplate(q = "pitch deck") {
  const { body } = await call(listTemplates, `/api/templates?kind=presentation&q=${encodeURIComponent(q)}`)
  return body.items[0] as { id: string; name: string; version: number }
}

const sha = (buffer: ArrayBuffer) => createHash("sha256").update(Buffer.from(buffer)).digest("hex")

describe("GET /api/templates", () => {
  it("lists seeded templates with pagination metadata and preview HTML", async () => {
    const { status, body } = await call(listTemplates, "/api/templates?kind=presentation")
    expect(status).toBe(200)
    expect(body.total).toBe(4)
    expect(body.items[0]).toMatchObject({ kind: "presentation", slideCount: expect.any(Number), theme: expect.any(Object) })
    expect(body.items[0].previewSlides.length).toBeLessThanOrEqual(4)
    expect(body.items[0].content).toBeUndefined() // list stays light
  })

  it("searches accent-insensitively and ranks name matches first", async () => {
    const { body } = await call(listTemplates, "/api/templates?q=bao%20cao")
    expect(body.items[0].name).toBe("Báo cáo kinh doanh quý")
  })

  it("filters by category", async () => {
    const { body } = await call(listTemplates, `/api/templates?category=${encodeURIComponent("Đào tạo")}`)
    expect(body.total).toBe(1)
    expect(body.items.every((t: { category: string }) => t.category === "Đào tạo")).toBe(true)
  })

  it("returns an empty list (not an error) when nothing matches", async () => {
    const { status, body } = await call(listTemplates, "/api/templates?q=khongtontai")
    expect(status).toBe(200)
    expect(body).toMatchObject({ total: 0, items: [] })
  })

  it("validates query parameters", async () => {
    const { status, body } = await call(listTemplates, "/api/templates?kind=spreadsheet")
    expect(status).toBe(400)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("returns categories with counts", async () => {
    const { body } = await call(getCategories, "/api/templates/categories?kind=presentation")
    expect(body.items).toContainEqual({ category: "Kinh doanh", count: 1 })
  })
})

describe("GET /api/templates/:id", () => {
  it("returns 400 for a malformed id and 404 for an unknown one", async () => {
    expect((await call<Id>(getTemplate, "/x", { params: { id: "abc" } })).status).toBe(400)
    const missing = await call<Id>(getTemplate, "/x", { params: { id: MISSING } })
    expect(missing.status).toBe(404)
    expect(missing.body.error.code).toBe("NOT_FOUND")
  })
})

describe("creating a document from a template", () => {
  it("creates an independent copy and never modifies the template or its file", async () => {
    const template = await firstTemplate()
    const before = await call<Id>(getTemplate, "/x", { params: { id: template.id } })
    const fileBefore = sha(await (await getTemplateFile(new Request("http://x"), { params: Promise.resolve({ id: template.id }) })).arrayBuffer())

    const created = await call(createDocument, "/api/documents", { method: "POST", json: { templateId: template.id } })
    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({ templateId: template.id, templateVersion: 1, title: template.name })
    expect(created.body.content).toEqual(before.body.content)

    const edited = sampleDeck("Bản trình chiếu đã sửa")
    const patched = await call<Id>(patchDocument, "/x", {
      method: "PATCH",
      params: { id: created.body.id },
      json: { title: "Bản của tôi", content: edited },
    })
    expect(patched.status).toBe(200)

    const after = await call<Id>(getTemplate, "/x", { params: { id: template.id } })
    expect(after.body.content).toEqual(before.body.content)
    expect(after.body.version).toBe(before.body.version)
    const fileAfter = sha(await (await getTemplateFile(new Request("http://x"), { params: Promise.resolve({ id: template.id }) })).arrayBuffer())
    expect(fileAfter).toBe(fileBefore)

    const saved = await call<Id>(getDocument, "/x", { params: { id: created.body.id } })
    expect(saved.body).toMatchObject({ title: "Bản của tôi", content: edited })
  })

  it("rejects unknown templates and invalid input", async () => {
    expect((await call(createDocument, "/api/documents", { method: "POST", json: { templateId: MISSING } })).status).toBe(404)
    expect((await call(createDocument, "/api/documents", { method: "POST", json: { templateId: "nope" } })).status).toBe(400)
    expect((await call(createDocument, "/api/documents", { method: "POST", body: "{not json" })).status).toBe(400)
  })

  it("rejects decks with unsupported layouts", async () => {
    const template = await firstTemplate()
    const created = await call(createDocument, "/api/documents", { method: "POST", json: { templateId: template.id } })
    const res = await call<Id>(patchDocument, "/x", {
      method: "PATCH",
      params: { id: created.body.id },
      json: { content: { ...sampleDeck("x"), slides: [{ id: "x", layout: "video" }] } },
    })
    expect(res.status).toBe(400)
    expect(res.body.error.details[0].path).toContain("content")
  })

  it("rejects bodies larger than 1MB", async () => {
    const template = await firstTemplate()
    const created = await call(createDocument, "/api/documents", { method: "POST", json: { templateId: template.id } })
    const huge = { title: "x".repeat(1_100_000) }
    const res = await call<Id>(patchDocument, "/x", { method: "PATCH", params: { id: created.body.id }, json: huge })
    expect(res.status).toBe(413)
  })

  it("exports the presentation as PPTX and JSON, lists and deletes it", async () => {
    const template = await firstTemplate()
    const { body: created } = await call(createDocument, "/api/documents", { method: "POST", json: { templateId: template.id } })

    const pptx = await call<Id>(exportDocument, "/x?format=pptx", { params: { id: created.id } })
    expect(pptx.status).toBe(200)
    expect(pptx.res.headers.get("content-type")).toContain("presentationml")
    expect(pptx.res.headers.get("content-disposition")).toContain("attachment")

    const json = await call<Id>(exportDocument, "/x?format=json", { params: { id: created.id } })
    expect(json.body.slides).toHaveLength(7)
    expect((await call<Id>(exportDocument, "/x?format=exe", { params: { id: created.id } })).status).toBe(400)

    expect((await call(listDocuments, "/api/documents?kind=presentation")).body.items).toHaveLength(1)
    expect((await call<Id>(deleteDocument, "/x", { method: "DELETE", params: { id: created.id } })).status).toBe(204)
    expect((await call<Id>(getDocument, "/x", { params: { id: created.id } })).status).toBe(404)
  })
})

describe("template management (admin)", () => {
  const newTemplate = {
    kind: "presentation",
    slug: "gioi-thieu-san-pham",
    name: "Giới thiệu sản phẩm",
    category: "Marketing",
    description: "Mẫu ra mắt sản phẩm",
    tags: ["sản phẩm"],
    content: sampleDeck("Ra mắt sản phẩm"),
  }

  it("requires the admin token", async () => {
    const res = await call(createTemplate, "/api/templates", { method: "POST", json: newTemplate })
    expect(res.status).toBe(401)
    const wrong = await call(createTemplate, "/api/templates", { method: "POST", json: newTemplate, headers: { "x-admin-token": "wrong" } })
    expect(wrong.status).toBe(401)
  })

  it("adds a template that immediately appears in the library; duplicate slugs conflict", async () => {
    const res = await call(createTemplate, "/api/templates", { method: "POST", json: newTemplate, headers: ADMIN })
    expect(res.status).toBe(201)
    const { body } = await call(listTemplates, "/api/templates?q=gioi%20thieu")
    expect(body.items[0].name).toBe("Giới thiệu sản phẩm")
    const dup = await call(createTemplate, "/api/templates", { method: "POST", json: newTemplate, headers: ADMIN })
    expect(dup.status).toBe(409)
  })

  it("validates template input", async () => {
    const res = await call(createTemplate, "/api/templates", {
      method: "POST",
      headers: ADMIN,
      json: { ...newTemplate, slug: "Có Dấu", content: { theme: newTemplate.content.theme, slides: [] } },
    })
    expect(res.status).toBe(400)
    const paths = res.body.error.details.map((d: { path: string }) => d.path)
    expect(paths).toEqual(expect.arrayContaining(["slug", "content.slides"]))
  })

  it("bumps the version on content updates; existing documents keep their copy", async () => {
    const template = await firstTemplate()
    const { body: document } = await call(createDocument, "/api/documents", { method: "POST", json: { templateId: template.id } })
    const res = await call<Id>(updateTemplate, "/x", {
      method: "PUT",
      headers: ADMIN,
      params: { id: template.id },
      json: { content: sampleDeck("Phiên bản mới") },
    })
    expect(res.body.version).toBe(2)
    const kept = await call<Id>(getDocument, "/x", { params: { id: document.id } })
    expect(kept.body.content).toEqual(document.content)
    expect(kept.body.templateVersion).toBe(1)
  })

  it("hides unpublished templates from the library and blocks new copies", async () => {
    const template = await firstTemplate()
    await call<Id>(updateTemplate, "/x", { method: "PUT", headers: ADMIN, params: { id: template.id }, json: { isPublished: false } })
    expect((await call(listTemplates, "/api/templates?q=pitch%20deck")).body.total).toBe(0)
    expect((await call<Id>(getTemplate, "/x", { params: { id: template.id } })).status).toBe(404)
    expect((await call(createDocument, "/api/documents", { method: "POST", json: { templateId: template.id } })).status).toBe(404)
  })
})
