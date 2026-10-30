"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center px-5 py-24 text-center" role="alert">
      <AlertTriangle className="size-12 text-amber-500" />
      <h1 className="mt-6 text-2xl font-semibold">Đã xảy ra lỗi</h1>
      <p className="mt-2 text-slate-500">Vui lòng thử lại. Nếu lỗi tiếp diễn, hãy tải lại trang.</p>
      <Button size="lg" className="mt-6" onClick={reset}>
        Thử lại
      </Button>
    </main>
  )
}
