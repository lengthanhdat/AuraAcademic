# KẾ HOẠCH XÂY DỰNG HỆ THỐNG CHAT REALTIME KẾT HỢP AI (docs/PLAN-chatbox.md)

## 🎯 TỔNG QUAN DỰ ÁN (OVERVIEW)
Xây dựng hệ thống trò chuyện trực tuyến thời gian thực (Realtime Chat) cho nền tảng AuraAcademic. Hệ thống cho phép Sinh viên/Giáo viên kết nối trực tiếp với Ban quản trị (Admin) thông qua một Chatbox tích hợp ở góc phải màn hình. Điểm đặc biệt của hệ thống là tích hợp **AI Trợ lý Tự động (AI Auto-Responder)**: Khi Admin bật chế độ tự động toàn cục, mọi thắc mắc của người dùng sẽ được định tuyến thông minh qua máy chủ Python AI Service để phản hồi ngay lập tức bằng mô hình ngôn ngữ lớn (LLM).

## 🛠️ KIẾN TRÚC CÔNG NGHỆ (TECH STACK)
*   **Kiến trúc Máy chủ WebSocket:** Cài đặt trực tiếp trên Spring Boot (`AuraAcademic_BE`) sử dụng **Spring Message Broker (STOMP)** và **SockJS** hỗ trợ dự phòng kết nối tốt trên mọi trình duyệt.
*   **Định tuyến Luồng AI:** Spring Boot đóng vai trò trung gian, lắng nghe Tin nhắn gửi lên ➡️ chuyển tiếp API HTTP REST sang Python AI Service ➡️ nhận kết quả tổng hợp từ LLM ➡️ đẩy kết quả ngược lại cổng Websocket về Client.
*   **Lưu trữ (Database Persistence):** Sử dụng PostgreSQL (JPA/Hibernate) để lưu vết toàn bộ hội thoại (`ChatMessage`, `ChatRoom`) phục vụ việc hiển thị lịch sử trò chuyện khi làm mới trang.
*   **Khách hàng mục tiêu (Audience):** Bảo mật khép kín, chỉ cho phép Tài khoản hợp lệ trong hệ thống (đã đăng nhập có JWT token) sử dụng.

---

## 📂 DANH MỤC TỆP TIN DỰ KIẾN (FILE STRUCTURE)

### 🖥️ Backend Service (`AuraAcademic_BE`)
*   `src/main/java/com/aura/config/WebSocketConfig.java`: Cấu hình STOMP Broker endpoint (`/ws`), cho phép đa nguồn (CORS) và định tuyến prefix tin nhắn (`/app`, `/topic`).
*   `src/main/java/com/aura/model/ChatMessage.java`: Thực thể lưu trữ Tin nhắn (id, senderId, content, timestamp, isFromAi).
*   `src/main/java/com/aura/model/ChatRoom.java`: Thực thể gom nhóm hội thoại giữa 1 User và Admin.
*   `src/main/java/com/aura/repository/ChatMessageRepository.java`: Truy vấn lịch sử trò chuyện.
*   `src/main/java/com/aura/controller/ChatController.java`: Nhận tin nhắn STOMP (`@MessageMapping`) và chuyển tiếp tin.
*   `src/main/java/com/aura/controller/ChatSettingsController.java`: API REST cho Admin bật/tắt AI Auto-respond toàn cục.
*   `src/main/java/com/aura/service/AiChatService.java`: Service gọi API HTTP sang máy chủ AI Python.

### 🖥️ Frontend Website (`AuraAcademic`)
*   `src/components/chat/ChatBox.tsx`: Component Chatbox góc phải màn hình (giao diện Glassmorphism cao cấp, thu nhỏ/mở rộng mượt mà).
*   `src/app/[locale]/admin/chat/page.tsx`: Trang Dashboard tập trung cho Admin quản lý toàn bộ các ô chat đang hoạt động, lịch sử chat, và nút Switch bật/tắt AI Auto-Respond toàn cục.
*   `src/lib/chatApi.ts`: Quản lý các lệnh gọi API Rest lấy lịch sử trò chuyện, thiết lập trạng thái AI.

### 🖥️ AI Service (`AuraAcademic_AI`)
*   Thêm endpoint `/api/ai/chat` xử lý prompt tin nhắn hỏi đáp học thuật hỗ trợ người dùng.

---

## 🚀 KẾ HOẠCH THỰC HIỆN (TASK BREAKDOWN)

### 🏁 GIAI ĐOẠN 1: NỀN TẢNG DỮ LIỆU & AI (Priority: P0)
> Giai đoạn này định hình khung cấu trúc tin nhắn và thiết lập cổng kết nối Python AI.

| Mã Task | Tên Nhiệm vụ | Thực hiện | Rủi ro & Hướng xử lý | Đầu ra Mong đợi (Verify) |
| :--- | :--- | :--- | :--- | :--- |
| **DB-01** | Dựng Schema JPA cho `ChatRoom` và `ChatMessage` | `database-architect` | Thiếu indexes gây chậm khi tìm kiếm lịch sử. ➡️ Thêm chỉ mục `sender_id`, `timestamp`. | Tệp Entity khởi tạo thành công, sinh bảng PostgreSQL không lỗi. |
| **AI-01** | Viết API Endpoint `/api/ai/chat` nhận câu hỏi và sinh câu trả lời | `backend-specialist` | LLM trả về quá lâu gây nghẽn kết nối HTTP. ➡️ Đặt Timeout gọi API 15 giây. | `POST /api/ai/chat` trả về JSON string câu trả lời mượt mà. |

### 🏁 GIAI ĐOẠN 2: MÁY CHỦ WEBSOCKET TRÊN SPRING BOOT (Priority: P1)
> Giai đoạn lõi - Thiết lập kênh truyền tải thời gian thực và cơ chế chen ngang của AI.

| Mã Task | Tên Nhiệm vụ | Thực hiện | Rủi ro & Hướng xử lý | Đầu ra Mong đợi (Verify) |
| :--- | :--- | :--- | :--- | :--- |
| **WS-01** | Cấu hình `WebSocketConfig` hỗ trợ STOMP endpoint `/ws` | `backend-specialist` | Lỗi CORS khi frontend Next.js kết nối tới. ➡️ Cấu hình `setAllowedOriginPatterns("*")`. | Endpoint `/ws/info` trả về mã 200 JSON hợp lệ qua HTTP. |
| **WS-02** | Viết `ChatController` lắng nghe tin nhắn đầu cuối | `backend-specialist` | Tin nhắn bị mất khi gửi song song. ➡️ Dùng `SimpMessagingTemplate` để broadcast an toàn. | Có thể gửi và nhận tin nhắn giả lập (Mock message) qua Websocket. |
| **WS-03** | Tích hợp Luồng Kiểm Soát AI Auto-Respond | `backend-specialist` | Server AI sập làm ngắt luồng chat. ➡️ Nếu gọi AI lỗi, trả về câu mặc định: "AI đang bận, Admin sẽ hỗ trợ sớm". | Khi bật chế độ AI, người dùng gửi tin ➡️ Tự động nhận lại tin nhắn trả lời của hệ thống sau 2 giây. |

### 🏁 GIAI ĐOẠN 3: GIAO DIỆN NGƯỜI DÙNG & QUẢN TRỊ (Priority: P2)
> Khoác lên hệ thống chat lớp áo Midnight Dark Mode thời thượng.

| Mã Task | Tên Nhiệm vụ | Thực hiện | Rủi ro & Hướng xử lý | Đầu ra Mong đợi (Verify) |
| :--- | :--- | :--- | :--- | :--- |
| **UI-01** | Dựng Component `ChatBox.tsx` mờ kính Glassmorphism góc phải | `frontend-specialist` | Gây giật lag hoặc che mất nội dung dưới trang. ➡️ Sử dụng `fixed bottom-6 right-6 z-50` và nút toggle gọn nhẹ. | Nút bong bóng Chat tròn rực sáng Cyan, click mở ra khung chat lung linh chống lóa. |
| **UI-02** | Kết nối `@stomp/stompjs` và đồng bộ tin nhắn lên màn hình | `frontend-specialist` | Rò rỉ kết nối (Connection leaks) khi chuyển trang. ➡️ Tận dụng Hook Cleanup để tự ngắt socket khi unmount. | Nhắn tin và nhận phản hồi hiển thị tức thì lên bong bóng chat mà không cần F5. |
| **UI-03** | Dựng Trung Tâm Chat Quản Trị (`admin/chat`) | `frontend-specialist` | Khó theo dõi nhiều người nhắn cùng lúc. ➡️ Thiết kế bố cục 2 cột: Cột trái ds hàng chờ, cột phải ô chat chi tiết. | Giao diện Admin phân chia rõ ràng, có nút Gạt bật/tắt "AI Tự Động Phản Hồi" trên thanh tiêu đề. |

---

## 🏁 PHASE X: KIỂM THỬ & NGHIỆM THU (VERIFICATION)

- [ ] **Độ trễ Realtime:** Tin nhắn gửi đi giữa hai trình duyệt khác nhau hiển thị trong < 200ms.
- [ ] **Độ ổn định của AI:** Khi bật AI Switch, các câu hỏi học thuật cơ bản nhận được câu trả lời hợp lý từ hệ thống tự động.
- [ ] **Lưu vết Lịch sử:** Tắt trình duyệt, mở lại trang ➡️ Nội dung trò chuyện cũ vẫn hiển thị đầy đủ và đúng thứ tự thời gian.
- [ ] **Tương thích Dark Mode:** Chatbox và trang Admin Chat tuân thủ 100% dải màu **Deep Space Navy (#051329)** và viền **Electric Cyan**. Không dính lỗi trắng lóa.
- [ ] **Rò rỉ Bộ nhớ:** Kiểm tra không có hiện tượng nhân bản luồng kết nối Websocket trong tab Network của Console DevTool.

---
💡 **Cột mốc tiếp theo:** Bạn hãy duyệt qua bản kế hoạch kiến trúc này. Khi sẵn sàng triển khai, hãy gõ `/create` để tôi bắt đầu từng bước thực thi xây dựng hệ thống Chat Realtime cực đỉnh này cho bạn nhé! 🚀✨🌌
