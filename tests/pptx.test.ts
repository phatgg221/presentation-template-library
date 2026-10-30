import { describe, expect, it } from "vitest"
import JSZip from "jszip"
import { deckToPptx } from "@/lib/exporters/pptx"
import { presentationTemplates } from "@/lib/seed/presentation-templates"

async function open(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer)
  const slides = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
  const read = (f: string) => zip.file(f)!.async("string")
  return { zip, slides, read }
}

describe("deckToPptx", () => {
  it("produces a valid .pptx with one PowerPoint slide per deck slide", async () => {
    for (const t of presentationTemplates) {
      const buffer = await deckToPptx(t.content, { title: t.name })
      expect(buffer.subarray(0, 2).toString()).toBe("PK")
      const { slides } = await open(buffer)
      expect(slides).toHaveLength(t.content.slides.length)
    }
  })

  it("writes editable Vietnamese text, theme colours/fonts, bullets and speaker notes", async () => {
    const deck = presentationTemplates[0].content
    const { read, zip } = await open(await deckToPptx(deck, { title: "Pitch" }))
    const cover = await read("ppt/slides/slide1.xml")
    expect(cover).toContain("[Tên startup]")
    expect(cover).toContain(deck.theme.primary.slice(1).toUpperCase()) // background shape colour
    expect(cover).toContain(`typeface="${deck.theme.fontHeading}"`)
    const bullets = await read("ppt/slides/slide4.xml") // "title-content" slide
    expect(bullets).toContain("<a:buChar")
    expect(bullets).toContain("Mô hình kinh doanh")
    const presentation = await read("ppt/presentation.xml")
    expect(presentation).toContain('cx="12192000"') // 13.333in widescreen
    const notes = Object.keys(zip.files).filter((f) => /notesSlide\d+\.xml$/.test(f))
    const allNotes = (await Promise.all(notes.map((f) => read(f)))).join("")
    expect(allNotes).toContain("Giới thiệu bản thân")
  })
})
