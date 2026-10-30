"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, Eye, Grid2X2, Layers, List, RotateCcw, Search, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScaledSlide } from "@/components/slides/slide-canvas"
import { TemplatePreviewDialog } from "@/components/template-preview-dialog"
import { UseTemplateButton } from "@/components/use-template-button"
import { apiFetch } from "@/lib/client-api"
import type { Paginated, TemplateSummary } from "@/lib/repositories/types"
import type { TemplateKind } from "@/lib/content/types"
import { cn } from "@/lib/utils"

type Category = { category: string; count: number }
type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: Paginated<TemplateSummary> }

const SORTS = [
  { value: "newest", label: "Mới nhất" },
  { value: "name", label: "Tên A–Z" },
] as const

const COPY: Record<TemplateKind, { title: string; subtitle: string; search: string; unit: string }> = {
  document: {
    title: "Tìm mẫu văn bản phù hợp cho công việc của bạn",
    subtitle: "Chọn một mẫu, xem trước và tạo tài liệu mới để chỉnh sửa ngay trên trình duyệt. Mẫu gốc luôn được giữ nguyên.",
    search: "Tìm kiếm mẫu văn bản (VD: hợp đồng, bien ban...)",
    unit: "mẫu văn bản",
  },
  presentation: {
    title: "Chọn bộ slide đẹp, tạo bài trình chiếu trong vài giây",
    subtitle: "Xem trước từng slide, tạo bản trình chiếu mới để chỉnh sửa ngay trên trình duyệt và tải về PPTX. Mẫu gốc luôn được giữ nguyên.",
    search: "Tìm kiếm mẫu trình chiếu (VD: pitch, bao cao...)",
    unit: "mẫu trình chiếu",
  },
}

/**
 * Generic template library: everything is driven by the API and the `kind` prop, so new
 * templates (or a new kind) appear without touching this component. Filters live in the URL.
 */
export function TemplateLibrary({ kind = "presentation" }: { kind?: TemplateKind }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const q = searchParams.get("q") ?? ""
  const category = searchParams.get("category") ?? ""
  const sort = searchParams.get("sort") === "name" ? "name" : "newest"
  const view = searchParams.get("view") === "list" ? "list" : "grid"
  const previewId = searchParams.get("preview")

  const [input, setInput] = useState(q)
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [categories, setCategories] = useState<Category[]>([])
  const [reloadKey, setReloadKey] = useState(0)
  const copy = COPY[kind]

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  // Keep the input in sync when the URL changes (back/forward, "Xoá bộ lọc").
  useEffect(() => setInput(q), [q])

  // Debounced search -> URL.
  useEffect(() => {
    if (input.trim() === q) return
    const timer = setTimeout(() => setParams({ q: input.trim() || null }), 300)
    return () => clearTimeout(timer)
  }, [input, q, setParams])

  useEffect(() => {
    const controller = new AbortController()
    apiFetch<{ items: Category[] }>(`/api/templates/categories?kind=${kind}`, { signal: controller.signal })
      .then((res) => setCategories(res.items))
      .catch(() => {})
    return () => controller.abort()
  }, [kind, reloadKey])

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ kind, sort, limit: "48" })
    if (q) params.set("q", q)
    if (category) params.set("category", category)
    setState({ status: "loading" })
    apiFetch<Paginated<TemplateSummary>>(`/api/templates?${params}`, { signal: controller.signal })
      .then((data) => setState({ status: "ready", data }))
      .catch((error: Error) => {
        if (!controller.signal.aborted) setState({ status: "error", message: error.message })
      })
    return () => controller.abort()
  }, [kind, q, category, sort, reloadKey])

  const total = useMemo(() => categories.reduce((sum, c) => sum + c.count, 0), [categories])
  const hasFilters = Boolean(q || category)

  return (
    <main className="mx-auto max-w-[1240px] px-5 pb-20 pt-10 lg:px-8">
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
          <Sparkles className="size-3.5" /> Thư viện mẫu
        </div>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{copy.title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">{copy.subtitle}</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Tìm kiếm</span>
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={copy.search}
            maxLength={100}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none ring-blue-500 transition focus:ring-2"
          />
          {input && (
            <button
              type="button"
              onClick={() => setInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
              aria-label="Xoá từ khoá"
            >
              <X className="size-4" />
            </button>
          )}
        </label>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setParams({ view: null })}
              className={cn("rounded-md p-2", view === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-400")}
              aria-label="Dạng lưới"
              aria-pressed={view === "grid"}
            >
              <Grid2X2 className="size-4" />
            </button>
            <button
              onClick={() => setParams({ view: "list" })}
              className={cn("rounded-md p-2", view === "list" ? "bg-slate-100 text-slate-900" : "text-slate-400")}
              aria-label="Dạng danh sách"
              aria-pressed={view === "list"}
            >
              <List className="size-4" />
            </button>
          </div>
          <label className="sr-only" htmlFor="sort">
            Sắp xếp
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setParams({ sort: e.target.value === "newest" ? null : e.target.value })}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Danh mục">
        {[{ category: "", count: total }, ...categories].map((item) => {
          const active = category === item.category
          return (
            <button
              key={item.category || "all"}
              role="tab"
              aria-selected={active}
              onClick={() => setParams({ category: item.category || null })}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800",
              )}
            >
              {item.category || "Tất cả"}
              <span className="ml-1.5 text-xs opacity-60">{item.count}</span>
            </button>
          )
        })}
      </div>

      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{category || `Tất cả ${copy.unit}`}</h2>
          <p className="mt-1 text-sm text-slate-400" aria-live="polite">
            {state.status === "ready" ? `${state.data.total} ${copy.unit}${q ? ` cho “${q}”` : ""}` : "Đang tải..."}
          </p>
        </div>
      </div>

      {state.status === "loading" && <SkeletonGrid view={view} />}

      {state.status === "error" && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center">
          <AlertTriangle className="mx-auto size-8 text-red-400" />
          <h3 className="mt-4 font-semibold text-red-900">Không tải được danh sách mẫu</h3>
          <p className="mt-1 text-sm text-red-700">{state.message}</p>
          <Button variant="outline" className="mt-5" onClick={() => setReloadKey((k) => k + 1)}>
            <RotateCcw /> Thử lại
          </Button>
        </div>
      )}

      {state.status === "ready" && state.data.items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 py-20 text-center">
          <Search className="mx-auto size-8 text-slate-300" />
          <h3 className="mt-4 font-semibold">Không tìm thấy mẫu phù hợp</h3>
          <p className="mt-1 text-sm text-slate-500">Thử từ khoá khác hoặc xoá bộ lọc danh mục.</p>
          {hasFilters && (
            <Button variant="outline" className="mt-5" onClick={() => setParams({ q: null, category: null })}>
              Xoá bộ lọc
            </Button>
          )}
        </div>
      )}

      {state.status === "ready" && state.data.items.length > 0 && (
        <div
          className={
            view === "grid" ? "grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-3"
          }
        >
          {state.data.items.map((t) =>
            view === "grid" ? (
              <TemplateCard key={t.id} template={t} onPreview={() => setParams({ preview: t.id })} />
            ) : (
              <TemplateRow key={t.id} template={t} onPreview={() => setParams({ preview: t.id })} />
            ),
          )}
        </div>
      )}

      {previewId && <TemplatePreviewDialog id={previewId} onClose={() => setParams({ preview: null })} />}
    </main>
  )
}

function Thumbnail({ template, small }: { template: TemplateSummary; small?: boolean }) {
  if (template.thumbnailUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={template.thumbnailUrl} alt="" className="aspect-video w-full rounded-md object-cover" />
  }
  const [cover, ...rest] = template.previewSlides
  return (
    <div>
      <ScaledSlide slide={cover} theme={template.theme} className="rounded-md shadow-sm ring-1 ring-black/5" label={`Slide bìa ${template.name}`} />
      {!small && rest.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {rest.slice(0, 3).map((slide) => (
            <ScaledSlide key={slide.id} slide={slide} theme={template.theme} className="rounded ring-1 ring-black/5" />
          ))}
        </div>
      )}
    </div>
  )
}

function TemplateCard({ template, onPreview }: { template: TemplateSummary; onPreview: () => void }) {
  return (
    <article className="group flex min-w-0 flex-col">
      <div className="relative mb-4 rounded-xl bg-slate-100/80 p-3 transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-slate-100 group-hover:shadow-lg group-hover:shadow-slate-200/60">
        <button onClick={onPreview} className="block w-full text-left" aria-label={`Xem trước ${template.name}`}>
          <Thumbnail template={template} />
        </button>
        <div className="absolute inset-x-5 bottom-5 flex items-center justify-center gap-2 opacity-100 transition-all duration-200 sm:pointer-events-none sm:translate-y-2 sm:opacity-0 sm:group-focus-within:pointer-events-auto sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100 sm:group-hover:pointer-events-auto sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          <Button size="sm" variant="secondary" className="h-8 bg-white text-xs shadow-md" onClick={onPreview}>
            <Eye /> Xem trước
          </Button>
          <UseTemplateButton templateId={template.id} size="sm" label="Dùng mẫu" className="h-8 text-xs shadow-md" />
        </div>
      </div>
      <div className="px-1">
        <h3 className="truncate font-semibold text-slate-900">{template.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{template.description}</p>
      </div>
      <div className="mt-3 flex items-center gap-2 px-1 text-xs text-slate-400">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{template.category}</span>
        <span className="inline-flex items-center gap-1">
          <Layers className="size-3.5" /> {template.slideCount} slide
        </span>
        <span>·</span>
        <span>{template.theme.name}</span>
      </div>
    </article>
  )
}

function TemplateRow({ template, onPreview }: { template: TemplateSummary; onPreview: () => void }) {
  return (
    <article className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm">
      <button onClick={onPreview} className="w-40 shrink-0" aria-label={`Xem trước ${template.name}`}>
        <Thumbnail template={template} small />
      </button>
      <div className="min-w-0 flex-1">
        <Link href={`/templates/presentations/${template.id}`} className="font-semibold text-slate-900 hover:underline">
          {template.name}
        </Link>
        <p className="mt-1 line-clamp-1 text-sm text-slate-500">{template.description}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{template.category}</span>
          {template.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-400">
              #{tag}
            </span>
          ))}
        </div>
      </div>
      <div className="hidden shrink-0 gap-2 sm:flex">
        <Button size="sm" variant="outline" onClick={onPreview}>
          <Eye /> Xem trước
        </Button>
        <UseTemplateButton templateId={template.id} size="sm" label="Dùng mẫu" />
      </div>
    </article>
  )
}

function SkeletonGrid({ view }: { view: "grid" | "list" }) {
  const items = Array.from({ length: 6 })
  if (view === "list") {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Đang tải">
        {items.slice(0, 5).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Đang tải">
      {items.map((_, i) => (
        <div key={i}>
          <div className="aspect-video animate-pulse rounded-xl bg-slate-100" />
          <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-full animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}
