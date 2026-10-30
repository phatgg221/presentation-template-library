import type { Slide, SlideDeck, Theme } from "../content/types"
import { THEMES as themes } from "../slides/themes"
import type { TemplateCreateInput } from "../schemas"

/**
 * Seed presentation templates. Adding one here (or via the admin page / POST /api/templates)
 * makes it appear in the library automatically; the UI never hard-codes templates.
 */
let n = 0
const s = (slide: Omit<Slide, "id">): Slide => ({ id: `seed-${++n}`, ...slide })



const deck = (theme: Theme, slides: Slide[]): SlideDeck => ({ theme, slides })

export const presentationTemplates: Omit<TemplateCreateInput, "isPublished">[] = [
  {
    kind: "presentation",
    slug: "pitch-deck-startup",
    name: "Pitch Deck Startup",
    category: "Kinh doanh",
    description: "Bộ slide gọi vốn: vấn đề, giải pháp, thị trường, mô hình kinh doanh, lộ trình và đề nghị đầu tư.",
    tags: ["gọi vốn", "startup", "pitch", "nhà đầu tư"],
    content: deck(themes.midnight, [
      s({ layout: "title", kicker: "PITCH DECK 2026", title: "[Tên startup]", subtitle: "Giải pháp [lĩnh vực] cho [khách hàng mục tiêu]\n[Người trình bày] • [Ngày]", notes: "Giới thiệu bản thân và tầm nhìn trong 30 giây." }),
      s({ layout: "two-column", title: "Vấn đề & Giải pháp", left: { heading: "Vấn đề", bullets: ["[Nỗi đau lớn nhất của khách hàng]", "[Chi phí / thời gian đang bị lãng phí]", "[Giải pháp hiện tại chưa hiệu quả vì sao]"] }, right: { heading: "Giải pháp của chúng tôi", bullets: ["[Sản phẩm giải quyết vấn đề thế nào]", "[Điểm khác biệt cốt lõi]", "[Lợi ích đo lường được]"] } }),
      s({ layout: "stats", title: "Quy mô thị trường", stats: [{ value: "[$5 tỷ]", label: "TAM – tổng thị trường" }, { value: "[$800 tr]", label: "SAM – thị trường phục vụ" }, { value: "[$40 tr]", label: "SOM – mục tiêu 3 năm" }], subtitle: "Nguồn: [báo cáo thị trường, năm]" }),
      s({ layout: "title-content", title: "Mô hình kinh doanh", bullets: ["Doanh thu từ [gói thuê bao / phí giao dịch]", "Giá trung bình: [x] VNĐ / khách hàng / tháng", "Kênh bán hàng: [trực tiếp, đối tác, online]", "Biên lợi nhuận gộp mục tiêu: [y]%"] }),
      s({ layout: "timeline", title: "Lộ trình phát triển", items: [{ label: "Q1/2026", text: "Ra mắt MVP, 100 khách hàng đầu tiên" }, { label: "Q3/2026", text: "Mở rộng tính năng, hoà vốn đơn vị" }, { label: "Q1/2027", text: "Mở rộng ra [thị trường mới]" }, { label: "2028", text: "[Mục tiêu dài hạn]" }] }),
      s({ layout: "stats", title: "Đề nghị đầu tư", stats: [{ value: "[$500K]", label: "Vòng hạt giống" }, { value: "18 tháng", label: "Runway" }], subtitle: "Phân bổ: 50% sản phẩm • 30% tăng trưởng • 20% vận hành" }),
      s({ layout: "closing", kicker: "CẢM ƠN", title: "Cùng xây dựng [Tên startup]", subtitle: "[Email] • [Số điện thoại] • [Website]" }),
    ]),
  },
  {
    kind: "presentation",
    slug: "bao-cao-kinh-doanh-quy",
    name: "Báo cáo kinh doanh quý",
    category: "Báo cáo",
    description: "Trình bày kết quả kinh doanh theo quý: chỉ số chính, phân tích, so sánh kế hoạch và hành động tiếp theo.",
    tags: ["báo cáo", "quý", "doanh thu", "kpi"],
    content: deck(themes.ocean, [
      s({ layout: "title", kicker: "BÁO CÁO NỘI BỘ", title: "Kết quả kinh doanh Quý [III/2026]", subtitle: "Phòng Kinh doanh • [Ngày trình bày]" }),
      s({ layout: "stats", title: "Chỉ số nổi bật", stats: [{ value: "[12,4 tỷ]", label: "Doanh thu (+18% so với cùng kỳ)" }, { value: "[1.250]", label: "Khách hàng mới" }, { value: "[92%]", label: "Tỷ lệ giữ chân khách hàng" }, { value: "[105%]", label: "Hoàn thành kế hoạch" }], subtitle: "Số liệu tính đến [30/09/2026]" }),
      s({ layout: "section", kicker: "01", title: "Phân tích kết quả", subtitle: "Doanh thu theo kênh, sản phẩm và khu vực" }),
      s({ layout: "two-column", title: "Điểm sáng & Thách thức", left: { heading: "Điểm sáng", bullets: ["[Kênh online tăng 35%]", "[Sản phẩm A vượt chỉ tiêu]", "[Ký hợp đồng với đối tác lớn]"] }, right: { heading: "Thách thức", bullets: ["[Chi phí marketing tăng]", "[Khu vực B chưa đạt kế hoạch]", "[Thời gian giao hàng kéo dài]"] } }),
      s({ layout: "title-content", title: "Kế hoạch hành động Quý tới", bullets: ["[Tối ưu ngân sách quảng cáo, mục tiêu CAC giảm 10%]", "[Tăng cường đội bán hàng tại khu vực B]", "[Ra mắt chương trình khách hàng thân thiết]", "[Rút ngắn thời gian giao hàng còn 48 giờ]"] }),
      s({ layout: "closing", kicker: "HỎI & ĐÁP", title: "Cảm ơn Ban Giám đốc", subtitle: "Đầu mối: [Họ tên] • [Email]" }),
    ]),
  },
  {
    kind: "presentation",
    slug: "dao-tao-nhan-vien-moi",
    name: "Đào tạo nhân viên mới",
    category: "Đào tạo",
    description: "Bộ slide onboarding: giới thiệu công ty, văn hoá, quy trình làm việc, lộ trình 30-60-90 ngày.",
    tags: ["đào tạo", "onboarding", "nhân sự", "văn hoá"],
    content: deck(themes.violet, [
      s({ layout: "title", kicker: "CHÀO MỪNG BẠN!", title: "Hành trình hội nhập tại [Tên công ty]", subtitle: "Chương trình đào tạo nhân viên mới • [Tháng/Năm]" }),
      s({ layout: "quote", quote: "[Sứ mệnh của công ty — một câu ngắn gọn, truyền cảm hứng.]", author: "[Họ tên], CEO" }),
      s({ layout: "title-content", title: "Giá trị cốt lõi", bullets: ["Khách hàng là trung tâm", "Chính trực và minh bạch", "Học hỏi không ngừng", "Cùng nhau tạo nên khác biệt"] }),
      s({ layout: "two-column", title: "Quy trình làm việc", left: { heading: "Công cụ", bullets: ["Email & lịch: [công cụ]", "Trao đổi nhóm: [công cụ]", "Quản lý công việc: [công cụ]"] }, right: { heading: "Quy định", bullets: ["Giờ làm việc: [8:30 – 17:30]", "Nghỉ phép: đăng ký trước [3] ngày", "Bảo mật thông tin khách hàng"] } }),
      s({ layout: "timeline", title: "Lộ trình 30 – 60 – 90 ngày", items: [{ label: "30 ngày", text: "Hiểu sản phẩm, quy trình, làm quen đồng đội" }, { label: "60 ngày", text: "Tự thực hiện công việc chính với hỗ trợ" }, { label: "90 ngày", text: "Làm việc độc lập, đề xuất cải tiến" }] }),
      s({ layout: "closing", kicker: "BẮT ĐẦU NÀO", title: "Chúng tôi luôn sẵn sàng hỗ trợ bạn", subtitle: "Buddy: [Họ tên] • HR: [Email]" }),
    ]),
  },
  {
    kind: "presentation",
    slug: "ke-hoach-du-an",
    name: "Kế hoạch dự án",
    category: "Dự án",
    description: "Khởi động dự án: mục tiêu, phạm vi, nhân sự, mốc thời gian, rủi ro và ngân sách.",
    tags: ["dự án", "kế hoạch", "kick-off", "quản lý"],
    content: deck(themes.classic, [
      s({ layout: "title", kicker: "PROJECT KICK-OFF", title: "Dự án [Tên dự án]", subtitle: "Quản lý dự án: [Họ tên] • [Ngày]" }),
      s({ layout: "title-content", title: "Mục tiêu & Phạm vi", bullets: ["Mục tiêu: [kết quả kinh doanh mong muốn]", "Trong phạm vi: [hạng mục 1], [hạng mục 2]", "Ngoài phạm vi: [hạng mục không thực hiện]", "Tiêu chí thành công: [chỉ số đo lường]"] }),
      s({ layout: "timeline", title: "Mốc thời gian chính", items: [{ label: "Tuần 1–2", text: "Khảo sát, chốt yêu cầu" }, { label: "Tuần 3–6", text: "Thiết kế & phát triển" }, { label: "Tuần 7–8", text: "Kiểm thử, UAT" }, { label: "Tuần 9", text: "Triển khai & bàn giao" }] }),
      s({ layout: "two-column", title: "Nhân sự & Rủi ro", left: { heading: "Đội dự án", bullets: ["Sponsor: [Họ tên]", "PM: [Họ tên]", "Dev: [số người] • QA: [số người]"] }, right: { heading: "Rủi ro chính", bullets: ["[Thay đổi yêu cầu] → quản lý change request", "[Thiếu nhân sự] → kế hoạch dự phòng", "[Tích hợp hệ thống] → PoC sớm"] } }),
      s({ layout: "stats", title: "Ngân sách", stats: [{ value: "[1,2 tỷ]", label: "Tổng ngân sách" }, { value: "[9 tuần]", label: "Thời gian" }, { value: "[8]", label: "Thành viên" }] }),
      s({ layout: "closing", kicker: "BƯỚC TIẾP THEO", title: "Thống nhất kế hoạch", subtitle: "Phản hồi trước [ngày] • [Email PM]" }),
    ]),
  },
]
