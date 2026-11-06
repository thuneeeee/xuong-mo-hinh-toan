# Xưởng Mô Hình Toán

Trang web mô hình hóa bài toán thực tế cho học sinh THPT, bám theo sách Toán 10, 11, 12 bộ *Kết nối tri thức với cuộc sống*.

Mỗi bài đi đủ bốn bước của chu trình mô hình hóa: tình huống thực tế → lập mô hình → giải toán → đối chiếu với thực tế.

- **Lớp 10 · Ném bóng vào rổ** (hàm số bậc hai): khớp parabol với vị trí quả bóng đo từ video.
- **Lớp 11 · Vòng đu quay** (hàm số lượng giác): tìm thời gian cabin ở trên một độ cao, so với số đo áp kế.
- **Lớp 12 · Hộp giấy không nắp** (ứng dụng đạo hàm): tìm cạnh cắt cho thể tích lớn nhất.
- **Đề của em**: dán đề hoặc ảnh chụp đề, Gemini đọc đề và trang tự dựng đồ thị, thanh trượt, lời giải 4 bước.

Mọi số đo trong các bài mẫu là dữ liệu mẫu để minh họa.

## Dùng thẻ "Đề của em"

Mở mục **Cài đặt Gemini** trên trang, dán khóa API lấy ở [Google AI Studio](https://aistudio.google.com/) (mục "Get API key"). Khóa chỉ lưu trong trình duyệt của người dùng và được gửi thẳng tới Google.

**Không dán khóa API vào mã trang**: kho này công khai, ai cũng đọc được.

## Cho cả lớp dùng mà không cần khóa riêng

1. Đăng tệp `worker.js` lên Cloudflare Workers (hướng dẫn ở đầu tệp).
2. Đặt biến bí mật `GEMINI_API_KEY` và biến `ALLOWED_ORIGIN` là địa chỉ trang web này.
3. Điền địa chỉ Worker vào `PROXY_URL` ở đầu phần mã trong `index.html`.
