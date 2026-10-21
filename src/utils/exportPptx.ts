import { GradeLevel } from '../types';

export interface SlideData {
  id: number;
  title: string;
  subtitle?: string;
  type: 'intro' | 'objective' | 'socratic' | 'content' | 'practice' | 'summary';
  bullets: string[];
  highlightText?: string;
  icon: string;
  bgGradient: string;
}

/**
 * Sinh nội dung bài giảng slide theo từng khối lớp và chủ đề Tin học tiểu học
 */
export function generateLessonSlides(grade: GradeLevel, topic: string): SlideData[] {
  return [
    {
      id: 1,
      title: `BÀI GIẢNG TIN HỌC ${grade.toUpperCase()}`,
      subtitle: `Chủ đề: ${topic} - Đồng hành cùng Robot NUTA AI`,
      type: 'intro',
      bullets: [
        'Trường Tiểu học: .....................................................',
        'Giáo viên giảng dạy: ...............................................',
        'Phương pháp: Dạy học gợi mở Socratic & Trải nghiệm tương tác',
      ],
      highlightText: '🚀 "Nghĩ trước - Hỏi sau - Tự khám phá lời giải!"',
      icon: '🤖',
      bgGradient: 'from-sky-600 via-indigo-600 to-purple-700',
    },
    {
      id: 2,
      title: '1. MỤC TIÊU BÀI HỌC (CHUẨN GDPT 2018)',
      subtitle: 'Những năng lực và phẩm chất các em sẽ đạt được sau tiết học:',
      type: 'objective',
      bullets: [
        '🎯 Năng lực Tin học: Nhận biết, gọi đúng tên và giải thích được nguyên lý cơ bản.',
        '🧠 Tư duy logic: Phân tích được nguyên nhân - kết quả trong các thao tác.',
        '🛡️ An toàn số: Có ý thức bảo vệ thiết bị và thông tin cá nhân trên môi trường số.',
        '🤝 Phẩm chất chăm chỉ: Chủ động thực hành, kiên trì tìm và sửa lỗi khi gặp sự cố.',
      ],
      highlightText: 'Chuẩn năng lực: NLA - Học vấn số & NLC - Giải quyết vấn đề',
      icon: '🎯',
      bgGradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    },
    {
      id: 3,
      title: '2. KHỞI ĐỘNG - CÂU HỎI GỢI MỞ SOCRATIC',
      subtitle: 'Hãy quan sát kỹ và cùng NUTA trả lời câu hỏi sau:',
      type: 'socratic',
      bullets: [
        '❓ Tình huống: "Khi chú mèo trong Scratch di chuyển đến mép màn hình, điều gì sẽ xảy ra nếu không có lệnh bật lại?"',
        '🤔 Bước 1 - Hỏi: Điều gì đang diễn ra trên màn hình?',
        '🧠 Bước 2 - Nghĩ: Em đã từng thấy tình huống này ở đâu?',
        '🔮 Bước 3 - Dự đoán: Nếu thêm một khối lệnh mới, kết quả sẽ thay đổi thế nào?',
      ],
      highlightText: '💡 "Không có đáp án sai, chỉ có những suy nghĩ đang được mài giũa!"',
      icon: '❓',
      bgGradient: 'from-amber-600 via-orange-600 to-rose-700',
    },
    {
      id: 4,
      title: '3. KHÁM PHÁ KIẾN THỨC MỚI',
      subtitle: 'Các bước thực hiện và điểm mấu chốt cần ghi nhớ:',
      type: 'content',
      bullets: [
        '📌 Điểm 1: Xác định rõ vị trí của khối lệnh điều kiện và khối lệnh di chuyển.',
        '📌 Điểm 2: Thao tác đặt ngón tay chuẩn: Ngón trỏ tay trái đặt phím F, ngón trỏ tay phải đặt phím J.',
        '📌 Điểm 3: Khi gặp link lạ hoặc người lạ xin mật khẩu: Nhớ nguyên tắc KHÔNG bấm, KHÔNG gửi và BÁO thầy cô ngay!',
      ],
      highlightText: 'Quy tắc vàng: "Quan sát kỹ từng chi tiết nhỏ trước khi bấm phím!"',
      icon: '🔍',
      bgGradient: 'from-blue-600 via-indigo-600 to-sky-700',
    },
    {
      id: 5,
      title: '4. NHIỆM VỤ THỰC HÀNH CÙNG NUTA',
      subtitle: 'Mở ứng dụng NUTA và hoàn thành các nhiệm vụ theo Mã HS:',
      type: 'practice',
      bullets: [
        '💻 Nhiệm vụ 1: Đăng nhập bằng Mã học sinh (Google Sheet) của em.',
        '🧩 Nhiệm vụ 2: Ghép khối lệnh gỡ lỗi thử thách chú Mèo tuần tra.',
        '⌨️ Nhiệm vụ 3: Đạt tối thiểu 80 điểm trong bài luyện gõ phím cơ sở.',
        '⭐ Mục tiêu: Tích lũy đủ 15 ngôi sao để nhận Huy hiệu Tin học!',
      ],
      highlightText: 'Thử thách: Bạn nào hoàn thành trước sẽ làm Huấn luyện viên hỗ trợ bạn bên cạnh!',
      icon: '💻',
      bgGradient: 'from-violet-600 via-purple-600 to-indigo-700',
    },
    {
      id: 6,
      title: '5. TỔNG KẾT & TUYÊN DƯƠNG NGÔI SAO NUTA',
      subtitle: 'Chúng mình đã cùng nhau học được những gì hôm nay?',
      type: 'summary',
      bullets: [
        '🎉 Chúc mừng cả lớp đã hoàn thành xuất sắc tiết học Tin học hôm nay!',
        '🌟 Ghi nhận thành tích tự chủ tư duy của các bạn trên bảng theo dõi Google Sheet.',
        '🏠 Nhiệm vụ về nhà: Nhắc nhở người thân về cách đặt mật khẩu an toàn.',
      ],
      highlightText: '🤖 "Cảm ơn các bạn nhỏ! NUTA hẹn gặp lại vào tiết học sau nhé!" 🚀',
      icon: '🌟',
      bgGradient: 'from-rose-600 via-pink-600 to-purple-700',
    },
  ];
}

/**
 * Tải file trình chiếu bài giảng tương thích PowerPoint (.ppt/.html presentation)
 */
export function exportPresentationHtml(grade: GradeLevel, topic: string): void {
  const slides = generateLessonSlides(grade, topic);

  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Slide Bài Giảng Tin Học ${grade} - ${topic}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #fff; margin: 0; padding: 20px; }
    .slide { max-width: 900px; margin: 0 auto 30px auto; background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 20px; padding: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 2px solid #334155; page-break-after: always; }
    h1 { font-size: 26pt; margin: 0 0 10px 0; color: #38bdf8; text-transform: uppercase; }
    h2 { font-size: 16pt; margin: 0 0 25px 0; color: #94a3b8; font-weight: normal; }
    ul { font-size: 16pt; line-height: 1.8; margin-bottom: 25px; }
    li { margin-bottom: 10px; }
    .highlight { background: rgba(56, 189, 248, 0.15); border-left: 5px solid #38bdf8; padding: 15px 20px; border-radius: 8px; font-size: 14pt; font-weight: bold; color: #facc15; }
    .footer { display: flex; justify-content: space-between; margin-top: 25px; font-size: 11pt; color: #64748b; border-top: 1px solid #334155; padding-top: 10px; }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .slide { box-shadow: none; border: 1px solid #ccc; background: #fff; color: #000; }
      h1 { color: #0369a1; }
      h2 { color: #475569; }
      .highlight { background: #f0fdf4; color: #166534; border-color: #22c55e; }
    }
  </style>
</head>
<body>
  ${slides
    .map(
      (s, idx) => `
    <div class="slide">
      <div style="font-size: 32pt; margin-bottom: 10px;">${s.icon}</div>
      <h1>${s.title}</h1>
      <h2>${s.subtitle || ''}</h2>
      <ul>
        ${s.bullets.map((b) => `<li>${b}</li>`).join('')}
      </ul>
      ${s.highlightText ? `<div class="highlight">${s.highlightText}</div>` : ''}
      <div class="footer">
        <span>🤖 NUTA AI - Trợ lý Tin học Tiểu học</span>
        <span>Slide ${idx + 1} / ${slides.length}</span>
      </div>
    </div>`
    )
    .join('')}
</body>
</html>`;

  const blob = new Blob(['\uFEFF' + htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Slide_Bai_Giang_Tin_Hoc_${grade.replace(/\s+/g, '_')}_${Date.now()}.html`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
