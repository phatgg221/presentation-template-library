"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ExternalLink, Loader2, X } from "lucide-react"
import { TemplateDetail } from "@/components/template-detail"
import { apiFetch } from "@/lib/client-api"
import type { Template } from "@/lib/repositories/types"

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; template: Template }

/** Modal preview; its id lives in the URL (?preview=) so previews are linkable and Back closes them. */
export function TemplatePreviewDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const [state, setState] = useState<State>({ status: "loading" })
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: "loading" })
    apiFetch<Template>(`/api/templates/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then((template) => setState({ status: "ready", template }))
      .catch((error: Error) => !controller.signal.aborted && setState({ status: "error", message: error.message }))
    return () => controller.abort()
  }, [id])

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-2 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Xem trước mẫu"
      onClick={onClose}
    >
      <div
        className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-3 top-3 z-10 flex gap-1">
          {state.status === "ready" && (
            <Link
              href={`/templates/presentations/${state.template.id}`}
              className="rounded-lg bg-white/90 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Mở trang riêng"
              title="Mở trang riêng"
            >
              <ExternalLink className="size-4" />
            </Link>
          )}
          <button
            ref={closeRef}
            className="rounded-lg bg-white/90 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>
        {state.status === "loading" && (
          <div className="flex flex-1 items-center justify-center text-slate-400">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}
        {state.status === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center" role="alert">
            <AlertTriangle className="size-8 text-amber-500" />
            <h3 className="mt-4 font-semibold">Không thể mở mẫu này</h3>
            <p className="mt-1 text-sm text-slate-500">{state.message}</p>
          </div>
        )}
        {state.status === "ready" && <TemplateDetail template={state.template} />}
      </div>
    </div>
  )
}
