"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Eye, KeyRound, Loader2, LogOut, Pencil, Plus, RotateCcw, X } from "lucide-react"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import { ScaledSlide } from "@/components/slides/slide-canvas"
import { Button } from "@/components/ui/button"
import { ClientApiError, apiFetch, formatDate } from "@/lib/client-api"
import { deckSchema } from "@/lib/schemas"
import { slugify } from "@/lib/text"
import type { SlideDeck } from "@/lib/content/types"
import type { Paginated, Template, TemplateSummary } from "@/lib/repositories/types"

const TOKEN_KEY = "ptl-admin-token"

export default function AdminTemplatesPage() {
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setToken(sessionStorage.getItem(TOKEN_KEY))
    setReady(true)
  }, [])

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
        <p className="text-sm font-medium text-slate-500">Quản trị nội dung</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Quản lý mẫu trình chiếu</h1>
        {ready &&
          (token ? (
            <AdminPanel
              token={token}
              onLogout={() => {
                sessionStorage.removeItem(TOKEN_KEY)
                setToken(null)
              }}
            />
          ) : (
            <TokenForm
              onSubmit={(t) => {
                sessionStorage.setItem(TOKEN_KEY, t)
                setToken(t)
              }}
            />
          ))}
      </main>
    </>
  )
}

function TokenForm({ onSubmit }: { onSubmit: (token: string) => void }) {
  const [value, setValue] = useState("")
  return (
    <form
      className="mt-8 max-w-md rounded-2xl border border-slate-200 p-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (value.trim()) onSubmit(value.trim())
      }}
    >
      <KeyRound className="size-6 text-blue-600" />
      <h2 className="mt-3 font-semibold">Nhập mã quản trị</h2>
      <p className="mt-1 text-sm text-slate-500">
        Giá trị biến môi trường <code className="rounded bg-slate-100 px-1">ADMIN_TOKEN</code> (môi trường dev mặc định:{" "}
        <code className="rounded bg-slate-100 px-1">dev-admin-token</code>).
      </p>
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Mã quản trị"
        className="mt-4 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Button type="submit" size="lg" className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
        Tiếp tục
      </Button>
    </form>
  )
}

function AdminPanel({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [state, setState] = useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "ready"; items: TemplateSummary[] }
  >({ status: "loading" })
  const [reload, setReload] = useState(0)
  const [editor, setEditor] = useState<{ mode: "create" } | { mode: "edit"; id: string } | null>(null)
  const headers = useMemo(() => ({ "x-admin-token": token }), [token])

  useEffect(() => {
    setState({ status: "loading" })
    apiFetch<Paginated<TemplateSummary>>("/api/admin/templates?kind=presentation", { headers })
      .then((res) => setState({ status: "ready", items: res.items }))
      .catch((error: ClientApiError) => {
        if (error.status === 401) {
          toast.error("Mã quản trị không đúng")
          onLogout()
        } else setState({ status: "error", message: error.message })
      })
  }, [headers, reload, onLogout])

  async function togglePublished(t: TemplateSummary) {
    try {
      await apiFetch(`/api/templates/${t.id}`, { method: "PUT", headers, body: JSON.stringify({ isPublished: !t.isPublished }) })
      setState((s) =>
        s.status === "ready" ? { ...s, items: s.items.map((x) => (x.id === t.id ? { ...x, isPublished: !t.isPublished } : x)) } : s,
      )
      toast.success(t.isPublished ? "Đã ẩn mẫu khỏi thư viện" : "Đã xuất bản mẫu")
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const categories = state.status === "ready" ? [...new Set(state.items.map((t) => t.category))] : []

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Mẫu mới xuất hiện ngay trong thư viện — giao diện không cần sửa đổi.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="lg" onClick={onLogout}>
            <LogOut /> Thoát
          </Button>
          <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setEditor({ mode: "create" })}>
            <Plus /> Thêm mẫu
          </Button>
        </div>
      </div>

      {state.status === "loading" && <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />}
      {state.status === "error" && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="mx-auto size-6 text-red-400" />
          <p className="mt-2 text-sm text-red-700">{state.message}</p>
          <Button variant="outline" className="mt-3" onClick={() => setReload((r) => r + 1)}>
            <RotateCcw /> Thử lại
          </Button>
        </div>
      )}
      {state.status === "ready" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Tên mẫu</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3">Phiên bản</th>
                <th className="px-4 py-3">Slide</th>
                <th className="px-4 py-3">Cập nhật</th>
                <th className="px-4 py-3">Hiển thị</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.items.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.name}</div>
                    <div className="font-mono text-xs text-slate-400">{t.slug}</div>
                  </td>
                  <td className="px-4 py-3">{t.category}</td>
                  <td className="px-4 py-3">v{t.version}</td>
                  <td className="px-4 py-3 text-slate-500">{t.slideCount}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(t.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={t.isPublished} onChange={() => togglePublished(t)} className="size-4 accent-blue-600" />
                      <span className="text-xs text-slate-500">{t.isPublished ? "Công khai" : "Ẩn"}</span>
                    </label>
                  </td>
                  <td className="space-x-3 whitespace-nowrap px-4 py-3 text-right">
                    <button onClick={() => setEditor({ mode: "edit", id: t.id })} className="inline-flex items-center gap-1 text-slate-600 hover:underline">
                      <Pencil className="size-4" /> Sửa
                    </button>
                    {t.isPublished && (
                      <Link href={`/templates/presentations/${t.id}`} className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                        <Eye className="size-4" /> Xem
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editor && state.status === "ready" && (
        <TemplateFormDialog
          headers={headers}
          editId={editor.mode === "edit" ? editor.id : null}
          templates={state.items}
          categories={categories}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null)
            setReload((r) => r + 1)
          }}
        />
      )}
    </div>
  )
}

type FormState = { name: string; slug: string; category: string; description: string; tags: string; thumbnailUrl: string }
const EMPTY_FORM: FormState = { name: "", slug: "", category: "", description: "", tags: "", thumbnailUrl: "" }

/** Create a template (from scratch or by duplicating one) or edit an existing one (PUT bumps version). */
function TemplateFormDialog({
  headers,
  editId,
  templates,
  categories,
  onClose,
  onSaved,
}: {
  headers: Record<string, string>
  editId: string | null
  templates: TemplateSummary[]
  categories: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(Boolean(editId))
  const [json, setJson] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ path: string; message: string }[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)

  const loadFrom = useCallback(
    async (id: string, asCopy: boolean) => {
      setLoading(true)
      try {
        const t = await apiFetch<Template>(`/api/templates/${id}`, { headers })
        setJson(JSON.stringify(t.content, null, 2))
        if (!asCopy) {
          setForm({ name: t.name, slug: t.slug, category: t.category, description: t.description, tags: t.tags.join(", "), thumbnailUrl: t.thumbnailUrl ?? "" })
        } else if (!form.category) {
          setForm((f) => ({ ...f, category: t.category }))
        }
      } catch (error) {
        toast.error((error as Error).message)
      } finally {
        setLoading(false)
      }
    },
    [headers, form.category],
  )

  useEffect(() => {
    const source = editId ?? templates[0]?.id
    if (source) void loadFrom(source, !editId)
    else setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value, ...(key === "name" && !slugTouched ? { slug: slugify(value) } : {}) }))
  }

  const parsed = useMemo((): { deck?: SlideDeck; error?: string } => {
    if (!json.trim()) return {}
    try {
      const result = deckSchema.safeParse(JSON.parse(json))
      if (!result.success) {
        const issue = result.error.issues[0]
        return { error: `${issue.path.join(".")}: ${issue.message}` }
      }
      return { deck: result.data as SlideDeck }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [json])

  const deck = parsed.deck
  const slide = deck?.slides[Math.min(previewIndex, deck.slides.length - 1)]

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErrors([])
    if (!deck) return toast.error("Nội dung JSON chưa hợp lệ")
    setSaving(true)
    const body = {
      name: form.name,
      slug: form.slug,
      category: form.category,
      description: form.description,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      thumbnailUrl: form.thumbnailUrl.trim() || null,
      content: deck,
    }
    try {
      if (editId) {
        await apiFetch(`/api/templates/${editId}`, { method: "PUT", headers, body: JSON.stringify(body) })
        toast.success("Đã cập nhật mẫu (phiên bản mới)")
      } else {
        await apiFetch("/api/templates", { method: "POST", headers, body: JSON.stringify({ kind: "presentation", ...body }) })
        toast.success("Đã thêm mẫu mới vào thư viện")
      }
      onSaved()
    } catch (error) {
      const err = error as ClientApiError
      setErrors(err.details ?? [{ path: "", message: err.message }])
    } finally {
      setSaving(false)
    }
  }

  const field = "mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label={editId ? "Sửa mẫu" : "Thêm mẫu"}>
      <form onSubmit={submit} className="flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold">{editId ? "Sửa mẫu trình chiếu" : "Thêm mẫu trình chiếu"}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X className="size-4" />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 md:grid-cols-[1fr_1fr]">
          <div className="space-y-4 overflow-y-auto p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Tên mẫu *
                <input required value={form.name} onChange={set("name")} className={field} maxLength={120} />
              </label>
              <label className="text-sm font-medium">
                Slug *
                <input
                  required
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    set("slug")(e)
                  }}
                  className={`${field} font-mono`}
                />
              </label>
              <label className="text-sm font-medium">
                Danh mục *
                <input required list="categories" value={form.category} onChange={set("category")} className={field} maxLength={60} />
                <datalist id="categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
              <label className="text-sm font-medium">
                Thẻ (phân cách bởi dấu phẩy)
                <input value={form.tags} onChange={set("tags")} className={field} placeholder="báo cáo, quý" />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Mô tả ngắn
              <textarea value={form.description} onChange={set("description")} maxLength={500} rows={2} className={`${field} h-auto py-2`} />
            </label>
            <label className="block text-sm font-medium">
              Ảnh thumbnail (URL, không bắt buộc — mặc định dùng slide đầu)
              <input type="url" value={form.thumbnailUrl} onChange={set("thumbnailUrl")} className={field} placeholder="https://..." />
            </label>
            <div>
              <div className="flex items-end justify-between gap-2">
                <span className="text-sm font-medium">Nội dung bộ slide (JSON: theme + slides)</span>
                {!editId && templates.length > 0 && (
                  <select
                    aria-label="Bắt đầu từ mẫu"
                    onChange={(e) => e.target.value && loadFrom(e.target.value, true)}
                    defaultValue=""
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
                  >
                    <option value="">Nhân bản từ mẫu...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <textarea
                value={json}
                onChange={(e) => setJson(e.target.value)}
                rows={16}
                spellCheck={false}
                aria-label="Nội dung JSON"
                disabled={loading}
                className="mt-2 w-full rounded-lg border border-slate-200 p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
              {parsed.error && <p className="text-xs text-red-600">JSON chưa hợp lệ — {parsed.error}</p>}
            </div>
            {errors.length > 0 && (
              <ul role="alert" className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errors.map((err, i) => (
                  <li key={i}>
                    {err.path && <code className="mr-1 font-mono text-xs">{err.path}:</code>}
                    {err.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="hidden min-h-0 overflow-y-auto bg-slate-100 p-6 md:block">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Xem trước</p>
            {loading && <Loader2 className="size-5 animate-spin text-slate-400" />}
            {deck && slide ? (
              <>
                <ScaledSlide slide={slide} theme={deck.theme} className="rounded-lg shadow-md" />
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {deck.slides.map((s, i) => (
                    <button key={s.id + i} type="button" onClick={() => setPreviewIndex(i)} className={i === previewIndex ? "rounded ring-2 ring-blue-600" : "rounded ring-1 ring-slate-200"}>
                      <ScaledSlide slide={s} theme={deck.theme} className="rounded" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              !loading && <p className="text-sm text-slate-400">Chưa có nội dung hợp lệ để xem trước.</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-6 py-4">
          <p className="text-xs text-slate-500">{editId ? "Lưu nội dung mới sẽ tăng phiên bản; bản trình chiếu đã tạo trước đó không bị ảnh hưởng." : ""}</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="lg" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" size="lg" disabled={saving || loading || !deck} className="bg-blue-600 text-white hover:bg-blue-700">
              {saving && <Loader2 className="animate-spin" />} Lưu mẫu
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
