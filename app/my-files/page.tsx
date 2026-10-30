"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Download, Pencil, Plus, Presentation, RotateCcw, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { apiFetch, formatDate } from "@/lib/client-api"
import { normalizeSearch } from "@/lib/text"
import type { DocumentSummary } from "@/lib/repositories/types"

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; items: DocumentSummary[] }

export default function MyFilesPage() {
  const [state, setState] = useState<State>({ status: "loading" })
  const [query, setQuery] = useState("")
  const [reload, setReload] = useState(0)
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState<DocumentSummary | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setState({ status: "loading" })
    apiFetch<{ items: DocumentSummary[] }>("/api/documents?kind=presentation")
      .then((res) => setState({ status: "ready", items: res.items }))
      .catch((error: Error) => setState({ status: "error", message: error.message }))
  }, [reload])

  const items = useMemo(() => {
    if (state.status !== "ready") return []
    const q = normalizeSearch(query)
    return q ? state.items.filter((d) => normalizeSearch(`${d.title} ${d.templateName ?? ""}`).includes(q)) : state.items
  }, [state, query])

  async function rename() {
    if (!renaming) return
    const title = renaming.title.trim()
    if (!title) return toast.error("Tên không được để trống")
    setBusy(true)
    try {
      await apiFetch(`/api/documents/${renaming.id}`, { method: "PATCH", body: JSON.stringify({ title }) })
      setState((s) =>
        s.status === "ready" ? { ...s, items: s.items.map((d) => (d.id === renaming.id ? { ...d, title } : d)) } : s,
      )
      toast.success("Đã đổi tên")
      setRenaming(null)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!deleting) return
    setBusy(true)
    try {
      await apiFetch(`/api/documents/${deleting.id}`, { method: "DELETE" })
      setState((s) => (s.status === "ready" ? { ...s, items: s.items.filter((d) => d.id !== deleting.id) } : s))
      toast.success("Đã xoá bản trình chiếu")
      setDeleting(null)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate-500">Không gian làm việc</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Bản trình chiếu của tôi</h1>
          </div>
          <div className="flex gap-2">
            <label className="relative">
              <span className="sr-only">Tìm bản trình chiếu</span>
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm bản trình chiếu"
                className="h-9 w-48 rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <Link href="/templates/presentations" className={cn(buttonVariants({ size: "lg" }), "bg-blue-600 text-white hover:bg-blue-700")}>
              <Plus /> Tạo từ mẫu
            </Link>
          </div>
        </div>

        {state.status === "loading" && (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        )}

        {state.status === "error" && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
            <AlertTriangle className="mx-auto size-8 text-red-400" />
            <p className="mt-3 font-medium text-red-900">Không tải được danh sách bản trình chiếu</p>
            <p className="text-sm text-red-700">{state.message}</p>
            <Button variant="outline" className="mt-4" onClick={() => setReload((r) => r + 1)}>
              <RotateCcw /> Thử lại
            </Button>
          </div>
        )}

        {state.status === "ready" && state.items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
            <Presentation className="mx-auto size-10 text-slate-300" />
            <h2 className="mt-4 font-semibold">Chưa có bản trình chiếu nào</h2>
            <p className="mt-1 text-sm text-slate-500">Chọn một mẫu trong thư viện để tạo bản trình chiếu đầu tiên.</p>
            <Link href="/templates/presentations" className={cn(buttonVariants({ variant: "outline" }), "mt-5")}>
              Mở thư viện mẫu
            </Link>
          </div>
        )}

        {state.status === "ready" && state.items.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="hidden grid-cols-[1fr_200px_170px_132px] border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 md:grid">
              <span>Tên bản trình chiếu</span>
              <span>Tạo từ mẫu</span>
              <span>Cập nhật</span>
              <span />
            </div>
            {items.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Không có bản trình chiếu khớp “{query}”.</p>}
            <ul className="divide-y divide-slate-100">
              {items.map((d) => (
                <li key={d.id} className="grid grid-cols-[1fr_auto] items-center gap-2 px-5 py-4 hover:bg-slate-50 md:grid-cols-[1fr_200px_170px_132px]">
                  <Link href={`/presentations/${d.id}`} className="flex min-w-0 items-center gap-3">
                    <span className="rounded-lg bg-orange-50 p-2 text-orange-600">
                      <Presentation className="size-4" />
                    </span>
                    <span className="truncate font-medium hover:underline">{d.title}</span>
                  </Link>
                  <span className="hidden truncate text-sm text-slate-500 md:block">{d.templateName ?? "Mẫu đã xoá"}</span>
                  <span className="hidden text-sm text-slate-500 md:block">{formatDate(d.updatedAt)}</span>
                  <div className="flex justify-end gap-1">
                    <a href={`/api/documents/${d.id}/export?format=pptx`} download className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label={`Tải ${d.title}`} title="Tải PPTX">
                      <Download />
                    </a>
                    <Button variant="ghost" size="icon" aria-label={`Đổi tên ${d.title}`} title="Đổi tên" onClick={() => setRenaming({ id: d.id, title: d.title })}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Xoá ${d.title}`} title="Xoá" onClick={() => setDeleting(d)}>
                      <Trash2 className="text-red-500" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {renaming && (
        <ConfirmDialog
          title="Đổi tên bản trình chiếu"
          confirmLabel="Lưu"
          busy={busy}
          onCancel={() => setRenaming(null)}
          onConfirm={rename}
          description={
            <input
              autoFocus
              value={renaming.title}
              maxLength={200}
              onChange={(e) => setRenaming({ ...renaming, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && rename()}
              aria-label="Tên mới"
              className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          }
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Xoá bản trình chiếu?"
          destructive
          confirmLabel="Xoá"
          busy={busy}
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
          description={
            <>
              Bản trình chiếu <strong>{deleting.title}</strong> sẽ bị xoá vĩnh viễn. Mẫu gốc không bị ảnh hưởng.
            </>
          }
        />
      )}
    </>
  )
}
