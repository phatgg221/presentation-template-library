import Link from "next/link"
import { ArrowRight, FileText, Presentation } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { templatesRepo } from "@/lib/repositories/templates"
import { documentsRepo } from "@/lib/repositories/documents"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const total = templatesRepo.list({ kind: "presentation", sort: "newest", page: 1, limit: 1 }).total
  const recent = documentsRepo.list("presentation").slice(0, 5)
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1240px] px-5 pb-20 pt-12 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tạo bài trình chiếu từ bộ slide mẫu</h1>
        <p className="mt-3 max-w-2xl text-slate-500">
          Chọn mẫu, xem trước từng slide, tạo bản sao để chỉnh sửa, trình chiếu ngay trên trình duyệt và tải về PowerPoint.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Link
            href="/templates/presentations"
            className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-orange-50 to-white p-7 transition hover:border-orange-300 hover:shadow-lg"
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Presentation className="size-5" />
            </div>
            <h2 className="mt-5 text-xl font-semibold">Thư viện mẫu trình chiếu</h2>
            <p className="mt-2 text-sm text-slate-500">{total} bộ slide PPTX: pitch deck, báo cáo quý, đào tạo, kế hoạch dự án...</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-orange-700">
              Mở thư viện <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
          <div className="rounded-2xl border border-dashed border-slate-200 p-7">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <FileText className="size-5" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-700">Thư viện mẫu văn bản</h2>
            <p className="mt-2 text-sm text-slate-500">Sản phẩm 1 (DOCX) — chạy riêng tại cổng 3000, cùng kiến trúc.</p>
          </div>
        </div>
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Bản trình chiếu gần đây</h2>
            <Link href="/my-files" className="text-sm font-medium text-orange-700 hover:underline">
              Xem tất cả
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              Chưa có bản trình chiếu nào. Hãy chọn một mẫu để bắt đầu.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {recent.map((d) => (
                <li key={d.id}>
                  <Link href={`/presentations/${d.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50">
                    <Presentation className="size-4 text-orange-500" />
                    <span className="flex-1 truncate font-medium">{d.title}</span>
                    <span className="hidden text-xs text-slate-400 sm:block">{d.templateName ?? "Mẫu đã xoá"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  )
}
