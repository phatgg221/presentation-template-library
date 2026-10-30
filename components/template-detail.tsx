"use client"

import { useState } from "react"
import { CalendarDays, Download, Hash, Layers, Palette, Tag } from "lucide-react"
import { SlideViewer } from "@/components/slide-viewer"
import { UseTemplateButton } from "@/components/use-template-button"
import { buttonVariants } from "@/components/ui/button"
import { formatDate } from "@/lib/client-api"
import type { Template } from "@/lib/repositories/types"
import { cn } from "@/lib/utils"

/** Template preview body shared by the preview dialog and the /templates/presentations/[id] page. */
export function TemplateDetail({ template }: { template: Template }) {
  const [index, setIndex] = useState(0)
  const { theme } = template.content
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-8">
        <SlideViewer deck={template.content} index={index} onIndex={setIndex} />
      </div>
      <aside className="flex w-full shrink-0 flex-col overflow-y-auto border-t border-slate-100 p-6 lg:w-[340px] lg:border-l lg:border-t-0">
        <span className="w-fit rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{template.category}</span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">{template.name}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">{template.description}</p>
        <div className="mt-6 flex flex-col gap-3">
          <UseTemplateButton templateId={template.id} className="w-full" label="Dùng mẫu này" />
          <a href={template.fileUrl} download className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}>
            <Download /> Tải PPTX mẫu
          </a>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-400">
          “Dùng mẫu này” tạo một bản trình chiếu độc lập để chỉnh sửa. Mẫu gốc không bị thay đổi.
        </p>
        <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Layers className="size-4" />
            <dt className="sr-only">Số slide</dt>
            <dd>
              {template.content.slides.length} slide • Phiên bản {template.version}
            </dd>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Palette className="size-4" />
            <dt className="sr-only">Chủ đề</dt>
            <dd className="flex items-center gap-2">
              {theme.name}
              <span className="flex">
                {[theme.primary, theme.secondary, theme.surface].map((c) => (
                  <span key={c} className="-ml-1 size-4 rounded-full ring-2 ring-white first:ml-0" style={{ background: c }} />
                ))}
              </span>
            </dd>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <CalendarDays className="size-4" />
            <dt className="sr-only">Cập nhật</dt>
            <dd>Cập nhật {formatDate(template.updatedAt)}</dd>
          </div>
          {template.tags.length > 0 && (
            <div className="flex items-start gap-2 text-slate-500">
              <Tag className="mt-0.5 size-4" />
              <dt className="sr-only">Thẻ</dt>
              <dd className="flex flex-wrap gap-1.5">
                {template.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs">
                    #{tag}
                  </span>
                ))}
              </dd>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-400">
            <Hash className="size-4" />
            <dt className="sr-only">Mã</dt>
            <dd className="truncate font-mono text-xs">{template.slug}</dd>
          </div>
        </dl>
      </aside>
    </div>
  )
}
