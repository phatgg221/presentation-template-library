import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { PresentationEditor } from "@/components/editor/presentation-editor"
import { documentsRepo } from "@/lib/repositories/documents"
import { uuidSchema } from "@/lib/schemas"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ id: string }> }

function load(id: string) {
  return uuidSchema.safeParse(id).success ? documentsRepo.get(id) : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: load((await params).id)?.title ?? "Không tìm thấy bản trình chiếu" }
}

export default async function PresentationPage({ params }: Props) {
  const document = load((await params).id)
  if (!document || document.kind !== "presentation") notFound()
  return <PresentationEditor document={document} />
}
