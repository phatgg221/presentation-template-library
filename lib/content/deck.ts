import type { SlideDeck } from "./types"

/** Plain text of a deck for search indexing. */
export function deckPlainText(deck: SlideDeck, limit = 3000): string {
  const parts: string[] = []
  for (const slide of deck.slides) {
    parts.push(slide.title ?? "", slide.subtitle ?? "", slide.quote ?? "", ...(slide.bullets ?? []))
    for (const col of [slide.left, slide.right]) if (col) parts.push(col.heading, ...col.bullets)
    for (const st of slide.stats ?? []) parts.push(st.value, st.label)
    for (const it of slide.items ?? []) parts.push(it.label, it.text)
  }
  return parts.filter(Boolean).join(" ").slice(0, limit)
}
