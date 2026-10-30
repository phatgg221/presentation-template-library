"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/client-api"
import { cn } from "@/lib/utils"

/** Creates an independent copy of the template (POST /api/documents) and opens it in the editor. */
export function UseTemplateButton({
  templateId,
  className,
  size = "lg",
  label = "Sử dụng mẫu này",
}: {
  templateId: string
  className?: string
  size?: "sm" | "lg" | "default"
  label?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function create() {
    setLoading(true)
    try {
      const doc = await apiFetch<{ id: string }>("/api/documents", { method: "POST", body: JSON.stringify({ templateId }) })
      toast.success("Đã tạo bản trình chiếu mới từ mẫu")
      router.push(`/presentations/${doc.id}`)
    } catch (error) {
      toast.error((error as Error).message)
      setLoading(false)
    }
  }

  return (
    <Button size={size} onClick={create} disabled={loading} className={cn("bg-blue-600 text-white hover:bg-blue-700", className)}>
      {loading ? <Loader2 className="animate-spin" /> : <Plus />}
      {loading ? "Đang tạo..." : label}
    </Button>
  )
}
