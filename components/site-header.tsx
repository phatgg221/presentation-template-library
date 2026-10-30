"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Presentation } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/templates/presentations", label: "Mẫu trình chiếu" },
  { href: "/my-files", label: "Bản trình chiếu của tôi" },
  { href: "/admin/templates", label: "Quản trị" },
]

export function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-200">
            <Presentation className="size-5" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Thư viện trình chiếu</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const active = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-2 text-sm transition sm:px-4",
                  active ? "bg-blue-50 font-medium text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
