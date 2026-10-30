import { describe, expect, it } from "vitest"
import { cloneContent } from "@/lib/content/clone"
import { LAYOUTS } from "@/lib/content/types"
import { presentationTemplates } from "@/lib/seed/presentation-templates"
import { THEMES } from "@/lib/slides/themes"
import { CANVAS, blankSlide, getField, layoutSlide, setField } from "@/lib/slides/layout"
import { deckSchema } from "@/lib/schemas"
import { normalizeSearch } from "@/lib/text"

describe("seed templates", () => {
  it("has at least 3 decks, each valid with a name, description and several slides", () => {
    expect(presentationTemplates.length).toBeGreaterThanOrEqual(3)
    for (const t of presentationTemplates) {
      expect(t.name && t.description).toBeTruthy()
      expect(t.content.slides.length).toBeGreaterThanOrEqual(5)
      expect(deckSchema.safeParse(t.content).success).toBe(true)
    }
  })
})

describe("cloneContent", () => {
  it("deep-copies a deck so edits never reach the template", () => {
    const source = presentationTemplates[0].content
    const snapshot = JSON.stringify(source)
    const copy = cloneContent(source)
    copy.slides[0].title = "Đã sửa"
    copy.slides[1].left!.bullets.push("mới")
    copy.theme.primary = "#000000"
    copy.slides.pop()
    expect(JSON.stringify(source)).toBe(snapshot)
  })
})

describe("layout engine", () => {
  it("keeps every box of every layout inside or bleeding past the 1280×720 canvas only for decorations", () => {
    for (const layout of LAYOUTS) {
      for (const box of layoutSlide(blankSlide(layout), THEMES.midnight)) {
        if (box.kind !== "text") continue
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.y).toBeGreaterThanOrEqual(0)
        expect(box.x + box.w).toBeLessThanOrEqual(CANVAS.width)
        expect(box.y + box.h).toBeLessThanOrEqual(CANVAS.height)
      }
    }
  })

  it("maps every editable text box to a slide field", () => {
    const slide = blankSlide("two-column")
    const fields = layoutSlide(slide, THEMES.ocean)
      .filter((b) => b.kind === "text" && b.field)
      .map((b) => (b.kind === "text" ? b.field : ""))
    expect(fields).toEqual(["title", "left.heading", "left.bullets", "right.heading", "right.bullets"])
  })

  it("lays out one card per stat", () => {
    const slide = { ...blankSlide("stats"), stats: [{ value: "1", label: "a" }, { value: "2", label: "b" }] }
    const values = layoutSlide(slide, THEMES.ocean).filter((b) => b.kind === "text" && b.field.endsWith(".value"))
    expect(values).toHaveLength(2)
  })

  it("reads and writes nested fields immutably; bullet fields split by line", () => {
    const slide = blankSlide("two-column")
    const next = setField(slide, "left.bullets", "Một\n\n  Hai  \n")
    expect(next.left!.bullets).toEqual(["Một", "Hai"])
    expect(slide.left!.bullets).toEqual(["Ý thứ nhất", "Ý thứ hai"])
    expect(getField(next, "left.bullets")).toBe("Một\nHai")
    const stats = setField(blankSlide("stats"), "stats.1.value", "99%")
    expect(stats.stats![1].value).toBe("99%")
    expect(getField(stats, "stats.1.value")).toBe("99%")
  })

  it("keeps title and notes when switching layout", () => {
    const original = { ...blankSlide("title-content"), title: "Giữ lại", notes: "Ghi chú" }
    const switched = blankSlide("quote", original)
    expect(switched).toMatchObject({ id: original.id, layout: "quote", title: "Giữ lại", notes: "Ghi chú" })
  })
})

describe("deck validation", () => {
  it("rejects unknown layouts, bad colours, unsupported fonts and empty decks", () => {
    const valid = presentationTemplates[0].content
    expect(deckSchema.safeParse({ ...valid, slides: [] }).success).toBe(false)
    expect(deckSchema.safeParse({ ...valid, theme: { ...valid.theme, primary: "red" } }).success).toBe(false)
    expect(deckSchema.safeParse({ ...valid, theme: { ...valid.theme, fontBody: "Comic Sans" } }).success).toBe(false)
    expect(deckSchema.safeParse({ ...valid, slides: [{ id: "x", layout: "video" }] }).success).toBe(false)
  })
})

describe("text utils", () => {
  it("normalizes Vietnamese for accent-insensitive search", () => {
    expect(normalizeSearch("  Báo CÁO   kinh doanh ")).toBe("bao cao kinh doanh")
  })
})
