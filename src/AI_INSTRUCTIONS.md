# Các quy tắc phát triển và vận hành dự án (AI Instructions)

Tài liệu này ghi lại các quy tắc đã được thống nhất để AI hoặc các nhà phát triển sau này tuân thủ khi chỉnh sửa dự án.

## 1. Cấu hình Model AI & Cơ chế Fallback
- **Model mặc định**: `gemini-3-flash-preview`
- **Model dự phòng**: Tự động chuyển đổi nếu model hiện tại gặp lỗi/quá tải:
  1. `gemini-3-flash-preview`
  2. `gemini-3-pro-preview`
  3. `gemini-2.5-flash`
- **Cơ chế Retry & Tích hợp**:
  - Nếu có API key và một model gặp sự cố, hệ thống **tự động** chuyển đổi sang model tiếp theo trong danh sách.
  - Nếu không có API key hoặc kết nối bị gián đoạn, hệ thống **tự động kích hoạt bộ máy Socratic thông minh tích hợp sẵn**, đảm bảo học sinh và giáo viên không bao giờ bị dừng gián đoạn tiết học.

## 2. Quản lý API Key (Tùy chọn - Không bắt buộc)
- **Cơ chế**:
  - Khóa API là **tùy chọn (Optional)**: Khi khởi động ứng dụng, **không** bắt buộc và **không** tự động bật Modal đòi hỏi API key.
  - Ứng dụng tích hợp sẵn bộ máy Socratic chuyên sâu cho môn Tin học Tiểu học (Lập trình Scratch, Thao tác máy tính, An toàn số), cho phép mở app là học tập và tương tác được ngay lập tức 100%.
  - Nếu người dùng muốn sử dụng tài khoản Google Gemini cá nhân riêng với hạn mức cao hơn, họ có thể nhấn nút "Cài đặt AI" trên thanh Header để nhập API key từ Google AI Studio (`aistudio.google.com/api-keys`).
  - Key được lưu trong `localStorage` của trình duyệt.
- **Giao diện**:
  - Nút **"Cài đặt AI"** trên thanh Header hiển thị với nhãn phụ "API Key (Tùy chọn)", không hiển thị thông báo cảnh báo màu đỏ hay ép buộc người dùng.
  - Modal Cài đặt AI luôn có nút đóng (X) và nút "Đóng", người dùng có thể đóng bất kỳ lúc nào mà không cần nhập key.
  - Cho phép người dùng xóa key hoặc lưu trống để quay về chế độ trợ lý tích hợp sẵn.

## 3. Quản lý Trạng thái & Lỗi (State Management)
- **Tiến trình**:
  - Phản hồi từ trợ lý Socratic tích hợp đầy đủ 4 phần: Lời chào (Greeting), Gợi ý (Hint), Hành động (Action), và Ghi chú sư phạm (Metadata).
  - Progress bar và các bước tư duy (Hỏi → Nghĩ → Dự đoán → Thử → Kiểm chứng → Giải thích) vận hành mượt mà, ghi nhận dữ liệu đánh giá năng lực học sinh đầy đủ.

## 4. Triển khai (Deployment)
- **Nền tảng**: Vercel / Web SPA.
- **File bắt buộc**: `vercel.json` ở root để xử lý SPA routing.
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
