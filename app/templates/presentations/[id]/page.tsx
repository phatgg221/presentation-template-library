import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { TemplateDetail } from "@/components/template-detail"
import { templatesRepo } from "@/lib/repositories/templates"
import { uuidSchema } from "@/lib/schemas"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ id: string }> }

function load(id: string) {
  if (!uuidSchema.safeParse(id).success) return null
  const template = templatesRepo.get(id)
  return template?.isPublished && template.kind === "presentation" ? template : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const template = load((await params).id)
  return { title: template ? template.name : "Không tìm thấy mẫu" }
}

export default async function TemplatePage({ params }: Props) {
  const template = load((await params).id)
  if (!template) notFound()
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1240px] px-5 pb-12 pt-6 lg:px-8">
        <Link href="/templates/presentations" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="size-4" /> Quay lại thư viện
        </Link>
        <div className="flex h-[calc(100vh-150px)] min-h-[640px] overflow-hidden rounded-2xl border border-slate-200">
          <TemplateDetail template={template} />
        </div>
      </main>
    </>
  )
}
