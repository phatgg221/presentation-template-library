# Tài liệu API — Thư viện mẫu trình chiếu

Base URL: `http://localhost:3001`. Body request/response là JSON (trừ tải file).

## Định dạng lỗi

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Dữ liệu không hợp lệ", "details": [{ "path": "content.slides.0.layout", "message": "..." }] } }
```

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body/query sai schema, ID không phải UUID, JSON hỏng |
| 401 | `UNAUTHORIZED` | Thiếu/sai `x-admin-token` cho API quản trị |
| 404 | `NOT_FOUND` | Không tìm thấy mẫu/bản trình chiếu (hoặc mẫu đang ẩn) |
| 409 | `CONFLICT` | Trùng `slug` |
| 413 | `PAYLOAD_TOO_LARGE` | Body > 1MB |
| 500 | `INTERNAL` | Lỗi không mong muốn (không lộ chi tiết) |

---

## Templates

### `GET /api/templates`
Danh sách mẫu đã xuất bản. Không kèm toàn bộ nội dung — chỉ `theme`, `slideCount` và tối đa 4 slide đầu (`previewSlides`) để vẽ thumbnail.

| Query | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `kind` | `document` \| `presentation` | — | Lọc theo loại |
| `q` | string ≤ 100 | — | Tìm không dấu trên tên, mô tả, danh mục, thẻ và chữ trong slide; khớp tên/mô tả xếp trước |
| `category` | string | — | Lọc danh mục |
| `sort` | `newest` \| `name` | `newest` | `name` theo thứ tự tiếng Việt |
| `page`, `limit` | int | 1, 24 | `limit` ≤ 100 |

```json
{
  "items": [{
    "id": "59480f64-...", "slug": "pitch-deck-startup", "kind": "presentation",
    "name": "Pitch Deck Startup", "description": "...", "category": "Kinh doanh", "tags": ["gọi vốn"],
    "thumbnailUrl": null, "fileUrl": "/api/templates/59480f64-.../file", "originalFile": null,
    "version": 1, "isPublished": true, "createdAt": "...", "updatedAt": "...",
    "slideCount": 7,
    "theme": { "name": "Midnight Orange", "primary": "#1E1B4B", "...": "..." },
    "previewSlides": [{ "id": "seed-1", "layout": "title", "title": "[Tên startup]" }]
  }],
  "total": 4, "page": 1, "limit": 24
}
```

### `GET /api/templates/categories?kind=presentation`
`{ "items": [{ "category": "Kinh doanh", "count": 1 }, ...] }`

### `GET /api/templates/:id`
Chi tiết mẫu, kèm `content` (`SlideDeck`). Mẫu đang ẩn chỉ admin xem được.

### `GET /api/templates/:id/file`
Tải file `.pptx` gốc của mẫu. Render một lần từ nội dung rồi lưu; các lần sau trả về đúng file đó.

### `POST /api/templates` *(admin, header `x-admin-token`)*
```json
{
  "kind": "presentation",
  "slug": "gioi-thieu-san-pham",
  "name": "Giới thiệu sản phẩm",
  "category": "Marketing",
  "description": "Mẫu ra mắt sản phẩm",
  "tags": ["sản phẩm"],
  "thumbnailUrl": null,
  "isPublished": true,
  "content": {
    "theme": {
      "name": "Ocean Teal", "primary": "#0F766E", "onPrimary": "#F0FDFA", "secondary": "#F59E0B",
      "background": "#FFFFFF", "surface": "#ECFDF5", "text": "#134E4A", "muted": "#5B7C79",
      "fontHeading": "Segoe UI", "fontBody": "Segoe UI"
    },
    "slides": [
      { "id": "s1", "layout": "title", "kicker": "RA MẮT", "title": "[Tên sản phẩm]", "subtitle": "[Ngày]" },
      { "id": "s2", "layout": "stats", "title": "Kết quả", "stats": [{ "value": "2x", "label": "Nhanh hơn" }] },
      { "id": "s3", "layout": "closing", "title": "Cảm ơn!", "subtitle": "[Email]", "notes": "Mời đặt câu hỏi" }
    ]
  }
}
```
→ `201` + template. Mẫu xuất hiện ngay trong thư viện.

### `PUT /api/templates/:id` *(admin)*
Cập nhật một phần (mọi trường trừ `kind`). Đổi `content` → `version + 1` và file `.pptx` gốc mới; bản trình chiếu đã tạo không bị ảnh hưởng.
`{ "isPublished": false }` để ẩn mẫu.

### `GET /api/admin/templates` *(admin)*
Như `GET /api/templates` nhưng gồm cả mẫu đang ẩn.

---

## Bản trình chiếu (documents)

### `POST /api/documents`
`{ "templateId": "59480f64-...", "title": "Pitch FinFlow" }` → `201`, header `Location`. Sao chép sâu bộ slide; template không bị ghi.

```json
{
  "id": "19d065d2-...", "kind": "presentation", "templateId": "59480f64-...", "templateVersion": 1,
  "templateName": "Pitch Deck Startup", "title": "Pitch FinFlow",
  "content": { "theme": { }, "slides": [] }, "createdAt": "...", "updatedAt": "..."
}
```

### `GET /api/documents?kind=presentation`
`{ "items": [DocumentSummary] }` — không kèm `content`, mới cập nhật trước.

### `GET /api/documents/:id`
Bản trình chiếu đầy đủ.

### `PATCH /api/documents/:id`
`{ "title"?: string, "content"?: SlideDeck }` (cần ít nhất một trường) → `{ "id", "title", "updatedAt" }`.

### `DELETE /api/documents/:id`
→ `204`.

### `GET /api/documents/:id/export?format=pptx|json`
`pptx`: file PowerPoint 16:9 (text box chỉnh sửa được, màu/font chủ đề, ghi chú người trình bày). `json`: `SlideDeck`.
Tên file theo tiêu đề (hỗ trợ tiếng Việt qua `filename*`).

---

## Mô hình `SlideDeck`

| Trường slide | Dùng ở bố cục | Giới hạn |
|---|---|---|
| `title` | tất cả trừ `quote` | ≤ 200 ký tự |
| `subtitle` | title, section, stats, closing | ≤ 300 |
| `kicker` | title, closing (nhãn nhỏ), section (số thứ tự) | ≤ 60 |
| `bullets` | title-content | ≤ 10 dòng |
| `left`, `right` `{ heading, bullets }` | two-column | ≤ 10 dòng mỗi cột |
| `stats[] { value, label }` | stats | ≤ 4 |
| `items[] { label, text }` | timeline | ≤ 5 |
| `quote`, `author` | quote | ≤ 500 / 120 |
| `notes` | tất cả (ghi chú người trình bày) | ≤ 5000 |

Màu: `#RRGGBB`. Font: `Arial`, `Calibri`, `Georgia`, `Segoe UI`, `Tahoma`, `Times New Roman`, `Trebuchet MS`, `Verdana`.
Bộ slide: 1–60 slide.

## Thêm / cập nhật mẫu mà không build lại
1. Trang quản trị `/admin/templates` → "Thêm mẫu" (có thể nhân bản từ mẫu sẵn có) hoặc "Sửa"; hoặc
2. API `POST /api/templates` / `PUT /api/templates/:id`; hoặc
3. Seed: thêm vào `lib/seed/presentation-templates.ts` (áp dụng cho database mới).
