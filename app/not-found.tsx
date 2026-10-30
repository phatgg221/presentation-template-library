import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-lg flex-col items-center px-5 py-24 text-center">
        <FileQuestion className="size-12 text-slate-300" />
        <h1 className="mt-6 text-2xl font-semibold">Không tìm thấy nội dung</h1>
        <p className="mt-2 text-slate-500">Mẫu hoặc bản trình chiếu bạn tìm không tồn tại, đã bị xoá hoặc đường dẫn không đúng.</p>
        <Link href="/templates/presentations" className={cn(buttonVariants({ size: "lg" }), "mt-6 bg-blue-600 text-white hover:bg-blue-700")}>
          Về thư viện mẫu
        </Link>
      </main>
    </>
  )
}
