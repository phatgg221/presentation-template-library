"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Xác nhận",
  destructive,
  busy,
  onConfirm,
  onCancel,
}: {
  title: string
  description: React.ReactNode
  confirmLabel?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (destructive) cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCancel, destructive])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-2 text-sm text-slate-500">{description}</div>
        <div className="mt-6 flex justify-end gap-2">
          <Button ref={cancelRef} variant="outline" size="lg" onClick={onCancel}>
            Huỷ
          </Button>
          <Button
            size="lg"
            disabled={busy}
            onClick={onConfirm}
            className={destructive ? "bg-red-600 text-white hover:bg-red-700" : "bg-blue-600 text-white hover:bg-blue-700"}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
