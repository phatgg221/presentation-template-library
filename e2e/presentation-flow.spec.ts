import { expect, test } from "@playwright/test"
import { readFile } from "node:fs/promises"
import JSZip from "jszip"

test("search → preview → use template → edit → theme → present → download PPTX", async ({ page, request }) => {
  await page.goto("/templates/presentations")
  await page.getByPlaceholder(/Tìm kiếm mẫu trình chiếu/).fill("pitch")
  await expect(page).toHaveURL(/q=pitch/)
  await expect(page.getByText(/mẫu trình chiếu cho “pitch”/)).toBeVisible()

  // Preview: navigate slides with the keyboard.
  await page.getByRole("button", { name: "Xem trước Pitch Deck Startup" }).click()
  const dialog = page.getByRole("dialog", { name: "Xem trước mẫu" })
  await expect(dialog.getByRole("heading", { name: "Pitch Deck Startup", exact: true })).toBeVisible()
  await expect(dialog.getByText("1 / 7")).toBeVisible()
  await page.keyboard.press("ArrowRight")
  await expect(dialog.getByText("2 / 7")).toBeVisible()
  const templateId = new URL(page.url()).searchParams.get("preview")!
  const before = await (await request.get(`/api/templates/${templateId}`)).json()

  // Use the template → editor.
  await dialog.getByRole("button", { name: "Dùng mẫu này" }).click()
  await expect(page).toHaveURL(/\/presentations\/[0-9a-f-]{36}$/)

  // Inline-edit the cover title (click selects the placeholder, typing replaces it).
  await page.getByRole("button", { name: "Sửa: Tiêu đề bài trình bày" }).click()
  await page.keyboard.type("FinFlow AI")
  await page.keyboard.press("Enter")
  await page.getByRole("button", { name: /Ocean Teal/ }).click()
  await page.getByLabel("Tên bản trình chiếu").fill("Pitch FinFlow")
  await expect(page.getByText("Đã lưu")).toBeVisible({ timeout: 10_000 })

  // Persisted after reload.
  await page.reload()
  await expect(page.getByLabel("Tên bản trình chiếu")).toHaveValue("Pitch FinFlow")
  await expect(page.getByRole("button", { name: /Ocean Teal/ })).toHaveAttribute("aria-pressed", "true")

  // Present mode.
  await page.getByRole("button", { name: "Trình chiếu" }).click()
  const show = page.getByRole("dialog", { name: "Chế độ trình chiếu" })
  await expect(show).toBeVisible()
  await page.keyboard.press("ArrowRight")
  await expect(show.getByText("2 / 7")).toBeAttached()
  await page.keyboard.press("Escape")
  await expect(show).toBeHidden()

  // Download PPTX and inspect it.
  await page.getByRole("button", { name: /Tải xuống/ }).click()
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("menuitem", { name: /PowerPoint/ }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe("Pitch FinFlow.pptx")
  const zip = await JSZip.loadAsync(await readFile((await download.path())!))
  expect(Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))).toHaveLength(7)
  expect(await zip.file("ppt/slides/slide1.xml")!.async("string")).toContain("FinFlow AI")

  // The template is unchanged.
  const after = await (await request.get(`/api/templates/${templateId}`)).json()
  expect(after.content).toEqual(before.content)
  expect(after.version).toBe(before.version)

  await page.goto("/my-files")
  await expect(page.getByRole("link", { name: "Pitch FinFlow", exact: true })).toBeVisible()
})

test("category filter, empty state and not-found page", async ({ page }) => {
  await page.goto("/templates/presentations")
  await page.getByRole("tab", { name: /Đào tạo/ }).click()
  await expect(page).toHaveURL(/category=/)
  await expect(page.getByText("1 mẫu trình chiếu")).toBeVisible()

  await page.getByPlaceholder(/Tìm kiếm mẫu trình chiếu/).fill("zzzz khong co")
  await expect(page.getByText("Không tìm thấy mẫu phù hợp")).toBeVisible()
  await page.getByRole("button", { name: "Xoá bộ lọc" }).click()
  await expect(page.getByText("4 mẫu trình chiếu")).toBeVisible()

  await page.goto("/presentations/00000000-0000-4000-8000-000000000000")
  await expect(page.getByRole("heading", { name: "Không tìm thấy nội dung" })).toBeVisible()
})
