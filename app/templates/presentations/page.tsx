import { Suspense } from "react"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { TemplateLibrary } from "@/components/template-library"

export const metadata: Metadata = { title: "Mẫu trình chiếu" }

export default function PresentationTemplatesPage() {
  return (
    <>
      <SiteHeader />
      <Suspense>
        <TemplateLibrary kind="presentation" />
      </Suspense>
    </>
  )
}
