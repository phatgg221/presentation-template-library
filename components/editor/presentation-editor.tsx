"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileJson,
  Info,
  Loader2,
  Play,
  Plus,
  Presentation,
  Save,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ScaledSlide } from "@/components/slides/slide-canvas"
import { PresentMode } from "@/components/editor/present-mode"
import { apiFetch } from "@/lib/client-api"
import { FONTS, LAYOUTS, type FontName, type Slide, type SlideDeck, type SlideLayout, type Theme } from "@/lib/content/types"
import { LAYOUT_LABELS, blankSlide, newSlideId, setField } from "@/lib/slides/layout"
import { THEME_PRESETS } from "@/lib/slides/themes"
import type { DocumentRecord } from "@/lib/repositories/types"
import { cn } from "@/lib/utils"

type SaveStatus = "saved" | "dirty" | "saving" | "error"
const AUTOSAVE_MS = 1500

export function PresentationEditor({ document: initial }: { document: DocumentRecord }) {
  const [deck, setDeck] = useState<SlideDeck>(initial.content)
  const [title, setTitle] = useState(initial.title)
  const [index, setIndex] = useState(0)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [status, setStatus] = useState<SaveStatus>("saved")
  const [presenting, setPresenting] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)

  // Latest values for the autosave closure; a revision counter detects edits made during a save.
  const latest = useRef({ deck, title })
  latest.current = { deck, title }
  const revision = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const inFlight = useRef<Promise<boolean> | null>(null)

  const save = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) await inFlight.current
    const rev = revision.current
    const run = (async () => {
      setStatus("saving")
      try {
        await apiFetch(`/api/documents/${initial.id}`, {
          method: "PATCH",
          body: JSON.stringify({ title: latest.current.title.trim() || "Bản trình chiếu không tên", content: latest.current.deck }),
        })
        setStatus(revision.current === rev ? "saved" : "dirty")
        return true
      } catch (error) {
        setStatus("error")
        toast.error(`Lưu thất bại: ${(error as Error).message}`)
        return false
      } finally {
        inFlight.current = null
      }
    })()
    inFlight.current = run
    return run
  }, [initial.id])

  const saveRef = useRef(save)
  saveRef.current = save

  const markDirty = useCallback(() => {
    revision.current += 1
    setStatus("dirty")
    clearTimeout(timer.current)
    timer.current = setTimeout(() => void saveRef.current(), AUTOSAVE_MS)
  }, [])

  const updateDeck = useCallback(
    (fn: (d: SlideDeck) => SlideDeck) => {
      setDeck((d) => fn(d))
      markDirty()
    },
    [markDirty],
  )

  const updateSlide = (i: number, fn: (s: Slide) => Slide) =>
    updateDeck((d) => ({ ...d, slides: d.slides.map((s, j) => (j === i ? fn(s) : s)) }))

  const slide = deck.slides[Math.min(index, deck.slides.length - 1)]

  // --- slide operations ---
  function addSlide(layout: SlideLayout) {
    setAddOpen(false)
    const created = blankSlide(layout)
    updateDeck((d) => ({ ...d, slides: [...d.slides.slice(0, index + 1), created, ...d.slides.slice(index + 1)] }))
    setIndex(index + 1)
  }
  function duplicateSlide() {
    const copy = { ...structuredClone(slide), id: newSlideId() }
    updateDeck((d) => ({ ...d, slides: [...d.slides.slice(0, index + 1), copy, ...d.slides.slice(index + 1)] }))
    setIndex(index + 1)
  }
  function moveSlide(delta: -1 | 1) {
    const target = index + delta
    if (target < 0 || target >= deck.slides.length) return
    updateDeck((d) => {
      const slides = [...d.slides]
      ;[slides[index], slides[target]] = [slides[target], slides[index]]
      return { ...d, slides }
    })
    setIndex(target)
  }
  function deleteSlide() {
    if (deck.slides.length <= 1) return toast.error("Bản trình chiếu cần ít nhất 1 slide")
    updateDeck((d) => ({ ...d, slides: d.slides.filter((_, i) => i !== index) }))
    setIndex(Math.max(0, index - 1))
    toast("Đã xoá slide", {
      action: { label: "Hoàn tác", onClick: () => updateDeck((d) => ({ ...d, slides: [...d.slides.slice(0, index), slide, ...d.slides.slice(index)] })) },
    })
  }
  const setTheme = (patch: Partial<Theme>) => updateDeck((d) => ({ ...d, theme: { ...d.theme, ...patch } }))

  // --- keyboard: Ctrl/Cmd+S, Alt+↑/↓ to switch slides ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        clearTimeout(timer.current)
        void saveRef.current().then((ok) => ok && toast.success("Đã lưu"))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (status === "saved") return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [status])

  useEffect(() => () => clearTimeout(timer.current), [])

  async function download(format: "pptx" | "json") {
    setDownloadOpen(false)
    clearTimeout(timer.current)
    if (status !== "saved" && !(await save())) return
    const a = window.document.createElement("a")
    a.href = `/api/documents/${initial.id}/export?format=${format}`
    a.download = ""
    a.click()
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      {/* Top bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link href="/my-files" aria-label="Quay lại bản trình chiếu của tôi" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
            <Presentation className="size-4" />
          </div>
          <input
            value={title}
            maxLength={200}
            onChange={(e) => {
              setTitle(e.target.value)
              markDirty()
            }}
            className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-base font-semibold outline-none hover:bg-slate-50 focus:bg-slate-50 focus:ring-2 focus:ring-blue-500 sm:max-w-md"
            aria-label="Tên bản trình chiếu"
          />
          <SaveIndicator status={status} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="lg" onClick={() => setPresenting(true)}>
            <Play /> Trình chiếu
          </Button>
          <Button
            variant="outline"
            size="lg"
            disabled={status === "saving"}
            onClick={() => {
              clearTimeout(timer.current)
              void save().then((ok) => ok && toast.success("Đã lưu"))
            }}
          >
            <Save /> Lưu
          </Button>
          <div className="relative">
            <Button
              size="lg"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setDownloadOpen((o) => !o)}
              aria-expanded={downloadOpen}
              aria-haspopup="menu"
            >
              <Download /> Tải xuống <ChevronDown />
            </Button>
            {downloadOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDownloadOpen(false)} />
                <div role="menu" className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <MenuItem icon={<Presentation className="size-4 text-orange-500" />} title="PowerPoint (.pptx)" hint="Mở bằng PowerPoint, Keynote, Google Slides" onClick={() => download("pptx")} />
                  <MenuItem icon={<FileJson className="size-4 text-slate-500" />} title="Dữ liệu JSON" hint="Nội dung + chủ đề (sao lưu / tích hợp)" onClick={() => download("json")} />
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-5 py-2 text-xs text-blue-800">
        <Info className="size-3.5 shrink-0" />
        <span>
          Tạo từ mẫu: <strong>{initial.templateName ?? "mẫu đã bị xoá"}</strong> (phiên bản {initial.templateVersion}) — bản sao độc lập, mẫu gốc không bị thay đổi.
          Nhấp vào chữ trên slide để sửa.
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Slide list */}
        <aside className="flex w-44 shrink-0 flex-col border-r border-slate-200 bg-white sm:w-52" aria-label="Danh sách slide">
          <ol className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            {deck.slides.map((s, i) => (
              <li key={s.id} className="flex gap-2">
                <span className="w-4 pt-1 text-right text-xs text-slate-400">{i + 1}</span>
                <button
                  onClick={() => {
                    setIndex(i)
                    setActiveField(null)
                  }}
                  aria-label={`Slide ${i + 1}: ${s.title ?? LAYOUT_LABELS[s.layout]}`}
                  aria-current={i === index}
                  className={cn("flex-1 rounded-md p-0.5 transition", i === index ? "ring-2 ring-blue-600" : "ring-1 ring-slate-200 hover:ring-slate-400")}
                >
                  <ScaledSlide slide={s} theme={deck.theme} className="rounded" />
                </button>
              </li>
            ))}
          </ol>
          <div className="space-y-2 border-t border-slate-200 p-3">
            <div className="relative">
              <Button className="w-full bg-blue-600 text-white hover:bg-blue-700" onClick={() => setAddOpen((o) => !o)} aria-expanded={addOpen}>
                <Plus /> Thêm slide
              </Button>
              {addOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAddOpen(false)} />
                  <div role="menu" className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {LAYOUTS.map((l) => (
                      <button key={l} role="menuitem" onClick={() => addSlide(l)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">
                        {LAYOUT_LABELS[l]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1">
              <IconAction label="Nhân bản slide" onClick={duplicateSlide}>
                <Copy />
              </IconAction>
              <IconAction label="Đưa lên" onClick={() => moveSlide(-1)} disabled={index === 0}>
                <ArrowUp />
              </IconAction>
              <IconAction label="Đưa xuống" onClick={() => moveSlide(1)} disabled={index === deck.slides.length - 1}>
                <ArrowDown />
              </IconAction>
              <IconAction label="Xoá slide" onClick={deleteSlide} disabled={deck.slides.length <= 1}>
                <Trash2 className="text-red-500" />
              </IconAction>
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto w-full max-w-5xl">
            <ScaledSlide
              key={slide.id}
              slide={slide}
              theme={deck.theme}
              className="rounded-lg shadow-xl ring-1 ring-black/5"
              edit={{
                activeField,
                onActivate: setActiveField,
                onCommit: (field, value) => {
                  setActiveField(null)
                  updateSlide(index, (s) => setField(s, field, value))
                },
              }}
            />
            <label className="mt-4 block text-sm font-medium text-slate-600">
              Ghi chú người trình bày
              <textarea
                value={slide.notes ?? ""}
                onChange={(e) => updateSlide(index, (s) => ({ ...s, notes: e.target.value }))}
                rows={3}
                maxLength={5000}
                placeholder="Ghi chú chỉ người trình bày thấy (được xuất vào PPTX)"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm font-normal outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>
        </main>

        {/* Properties */}
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-5 lg:block" aria-label="Thuộc tính">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bố cục slide</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {LAYOUTS.map((l) => (
              <button
                key={l}
                onClick={() => updateSlide(index, (s) => blankSlide(l, s))}
                aria-pressed={slide.layout === l}
                className={cn(
                  "rounded-lg border px-2 py-2 text-left text-xs transition",
                  slide.layout === l ? "border-blue-600 bg-blue-50 font-medium text-blue-700" : "border-slate-200 hover:border-slate-300",
                )}
              >
                {LAYOUT_LABELS[l]}
              </button>
            ))}
          </div>

          <h2 className="mt-8 text-xs font-semibold uppercase tracking-wider text-slate-500">Chủ đề (cả bộ slide)</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {THEME_PRESETS.map((t) => (
              <button
                key={t.name}
                onClick={() => setTheme(t)}
                aria-pressed={deck.theme.name === t.name}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition",
                  deck.theme.name === t.name ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300",
                )}
              >
                <span className="flex">
                  <span className="size-4 rounded-full" style={{ background: t.primary }} />
                  <span className="-ml-1.5 size-4 rounded-full ring-2 ring-white" style={{ background: t.secondary }} />
                </span>
                <span className="truncate">{t.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <ColorInput label="Màu chính" value={deck.theme.primary} onChange={(v) => setTheme({ primary: v })} />
            <ColorInput label="Màu nhấn" value={deck.theme.secondary} onChange={(v) => setTheme({ secondary: v })} />
            <ColorInput label="Nền" value={deck.theme.background} onChange={(v) => setTheme({ background: v })} />
            <ColorInput label="Chữ" value={deck.theme.text} onChange={(v) => setTheme({ text: v })} />
          </div>
          <div className="mt-4 space-y-3">
            <FontSelect label="Font tiêu đề" value={deck.theme.fontHeading} onChange={(v) => setTheme({ fontHeading: v })} />
            <FontSelect label="Font nội dung" value={deck.theme.fontBody} onChange={(v) => setTheme({ fontBody: v })} />
          </div>
        </aside>
      </div>

      {presenting && <PresentMode deck={deck} start={index} onClose={(i) => { setPresenting(false); setIndex(i) }} />}
    </div>
  )
}

function MenuItem({ icon, title, hint, onClick }: { icon: React.ReactNode; title: string; hint: string; onClick: () => void }) {
  return (
    <button role="menuitem" onClick={onClick} className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left hover:bg-slate-50">
      <span className="mt-0.5">{icon}</span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="text-xs text-slate-500">{hint}</span>
      </span>
    </button>
  )
}

function IconAction({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 [&_svg]:size-4"
    >
      {children}
    </button>
  )
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-600">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="size-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5" />
      {label}
    </label>
  )
}

function FontSelect({ label, value, onChange }: { label: string; value: FontName; onChange: (v: FontName) => void }) {
  return (
    <label className="block text-xs text-slate-600">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as FontName)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm">
        {FONTS.map((f) => (
          <option key={f} value={f} style={{ fontFamily: f }}>
            {f}
          </option>
        ))}
      </select>
    </label>
  )
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const map = {
    saved: { icon: <Check className="size-3.5" />, text: "Đã lưu", className: "text-emerald-600" },
    dirty: { icon: null, text: "Có thay đổi chưa lưu", className: "text-amber-600" },
    saving: { icon: <Loader2 className="size-3.5 animate-spin" />, text: "Đang lưu...", className: "text-slate-500" },
    error: { icon: <AlertCircle className="size-3.5" />, text: "Lưu thất bại", className: "text-red-600" },
  }[status]
  return (
    <span className={`hidden shrink-0 items-center gap-1 text-xs sm:flex ${map.className}`} aria-live="polite">
      {map.icon}
      {map.text}
    </span>
  )
}
