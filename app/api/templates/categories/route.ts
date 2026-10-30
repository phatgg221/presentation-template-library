import { NextResponse } from "next/server"
import { handler } from "@/lib/api"
import { templatesRepo } from "@/lib/repositories/templates"
import { kindSchema } from "@/lib/schemas"

export const dynamic = "force-dynamic"

/** GET /api/templates/categories?kind= */
export const GET = handler(async (req) => {
  const kind = new URL(req.url).searchParams.get("kind")
  return NextResponse.json({ items: templatesRepo.categories(kind ? kindSchema.parse(kind) : undefined) })
})
