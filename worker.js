/**
 * Máy chủ trung gian cho Xưởng Mô Hình Toán (chạy trên Cloudflare Workers).
 *
 * Mục đích: giữ khóa API Gemini ở phía máy chủ, để học sinh dùng trang
 * mà không nhìn thấy khóa và không cần tự tạo khóa.
 *
 * Cách dùng:
 *   1. Tạo một Worker mới trên Cloudflare, dán toàn bộ tệp này vào rồi Deploy.
 *   2. Trong phần cài đặt biến (Variables and Secrets) của Worker, thêm:
 *        GEMINI_API_KEY  loại Secret  khóa API Gemini của bạn
 *        ALLOWED_ORIGIN  loại Text    địa chỉ trang web, ví dụ https://tenban.github.io
 *                                     (nhiều địa chỉ thì cách nhau dấu phẩy)
 *   3. Chép địa chỉ Worker (dạng https://....workers.dev) vào PROXY_URL ở đầu phần mã của index.html.
 *
 * Lưu ý: nếu để trống ALLOWED_ORIGIN, trang web nào cũng gọi được máy chủ này
 * (chỉ nên để trống lúc thử nghiệm). Mọi lượt gọi đều tính vào hạn mức khóa của bạn.
 */

const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash"];
const MAX_BYTES = 8 * 1024 * 1024; // ảnh đề đã được trang thu nhỏ, 8 MB là dư

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = String(env.ALLOWED_ORIGIN || "")
      .split(",")
      .map(s => s.trim().replace(/\/$/, ""))
      .filter(Boolean);
    const originOk = allowed.length === 0 || allowed.includes(origin);

    const cors = {
      "Access-Control-Allow-Origin": originOk ? (origin || "*") : "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };
    const reply = (status, message) =>
      new Response(JSON.stringify({ error: { message } }), {
        status,
        headers: { ...cors, "Content-Type": "application/json; charset=utf-8" }
      });

    if (request.method === "OPTIONS") return new Response(null, { status: originOk ? 204 : 403, headers: cors });
    if (!originOk) return reply(403, "Trang này không được phép dùng máy chủ trung gian.");
    if (request.method !== "POST") return reply(405, "Máy chủ chỉ nhận yêu cầu POST.");
    if (!env.GEMINI_API_KEY) return reply(500, "Máy chủ chưa được cài khóa GEMINI_API_KEY.");

    const declared = Number(request.headers.get("Content-Length") || 0);
    if (declared > MAX_BYTES) return reply(413, "Yêu cầu quá lớn.");

    let body;
    try {
      const raw = await request.text();
      if (raw.length > MAX_BYTES) return reply(413, "Yêu cầu quá lớn.");
      body = JSON.parse(raw);
    } catch (e) {
      return reply(400, "Dữ liệu gửi lên không hợp lệ.");
    }

    // Chỉ chuyển tiếp đúng một lượt hỏi, với các mô hình trong danh sách cho phép.
    if (!body || !Array.isArray(body.contents) || body.contents.length !== 1) {
      return reply(400, "Dữ liệu gửi lên không đúng khuôn.");
    }
    const model = MODELS.includes(body.model) ? body.model : MODELS[0];

    let upstream;
    try {
      upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
          body: JSON.stringify({ contents: body.contents })
        }
      );
    } catch (e) {
      return reply(502, "Máy chủ trung gian không kết nối được tới Gemini.");
    }

    // Trả nguyên phản hồi của Gemini về cho trang (trang tự đọc lỗi và kết quả).
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { ...cors, "Content-Type": "application/json; charset=utf-8" }
    });
  }
};
