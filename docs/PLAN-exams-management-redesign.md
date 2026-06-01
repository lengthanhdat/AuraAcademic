# Kế hoạch chi tiết tái cấu trúc trang Quản lý Kỳ thi (Exam Sessions Management Layout Plan) - AuraAcademic

> **Bản kế hoạch chi tiết thiết kế lại giao diện trang "Kỳ thi của tôi" cho Giáo viên và Admin, chuyển đổi mục tiêu từ quản lý tài liệu tĩnh sang giám sát và điều hành các phiên thi thực tế (Exam Sessions) theo thời gian thực.**

---

## 🗺️ ĐỊNH TUYẾN & DANH SÁCH FILE LIÊN QUAN

Các trang giao diện cần chỉnh sửa và kiểm tra:

1. **Giao diện Giáo viên**:
   * [teacher/my-exams/page.tsx](file:///d:/AUAC/AuraAcademic/src/app/[locale]/teacher/my-exams/page.tsx): Trang danh sách Kỳ thi của tôi (cần thiết kế lại thành Dashboard quản lý phiên thi).
   * [teacher/exam-templates/page.tsx](file:///d:/AUAC/AuraAcademic/src/app/[locale]/teacher/exam-templates/page.tsx): Kho đề của tôi (giữ nguyên làm nơi chứa các bản mẫu thiết kế đề thi).

2. **Giao diện Admin**:
   * [admin/exams/page.tsx](file:///d:/AUAC/AuraAcademic/src/app/[locale]/admin/exams/page.tsx): Trang quản lý kỳ thi toàn hệ thống của Admin.
   * [admin/my-exams/page.tsx](file:///d:/AUAC/AuraAcademic/src/app/[locale]/admin/my-exams/page.tsx): Hiện tại là trang tạo đề thi bằng AI/thủ công của admin (Exam Builder).

3. **Thành phần dùng chung**:
   * [components/ExamConfigDrawer.tsx](file:///d:/AUAC/AuraAcademic/src/components/ExamConfigDrawer.tsx): Ngăn kéo cấu hình tạo kỳ thi từ bản mẫu.

---

## 🎨 THIẾT KẾ ĐỊNH HƯỚNG MỚI (EXAM SESSION MANAGEMENT)

Trang quản lý kỳ thi mới sẽ tập trung vào vai trò điều phối phòng thi (Exam Proctoring Hub), loại bỏ hoàn toàn các thông tin liên quan đến biên soạn/câu hỏi tĩnh, thay vào đó hiển thị các chỉ số động và các nút điều khiển trực tiếp:

### 1. Phân nhóm trạng thái phiên thi (Exam Session Statuses)
* **🟢 Đang diễn ra (LIVE / STARTED)**:
  * Trọng tâm: Số lượng học sinh đang online làm bài thi, thời gian còn lại (tính ngược từ `startTime` + `duration`).
  * Hành động chính nổi bật: **"Giám sát"** (chuyển hướng đến trang giám sát AI Room), **"Chia sẻ mã"** (Copy mã phòng thi), **"Đóng phòng"** (Kết thúc sớm).
* **🔵 Sẵn sàng / Đã lên lịch (SCHEDULED / PUBLISHED)**:
  * Trọng tâm: Thời gian đếm ngược tới giờ thi tự động bắt đầu, lớp học liên kết.
  * Hành động chính nổi bật: **"Bắt đầu ngay"** (Kích hoạt thủ công trước giờ), **"Sửa lịch"**, **"Hủy lịch"**.
* **🟡 Bản nháp (DRAFT)**:
  * Trọng tâm: Đề thi đã cấu hình nhưng chưa phát hành mã phòng.
  * Hành động chính nổi bật: **"Phát hành"** (Mở phòng thi), **"Sửa cấu hình"**, **"Xóa"**.
* **⚪ Đã kết thúc (FINISHED / COMPLETED)**:
  * Trọng tâm: Tổng số lượt làm bài nộp thành công (`submissionCount`), thống kê phổ điểm sơ bộ.
  * Hành động chính nổi bật: **"Xem kết quả"** (Xem danh sách điểm), **"Mở lại phòng"**, **"Xóa vĩnh viễn"**.

### 2. Các điểm cải tiến giao diện cụ thể
* **Hiển thị lớp học liên kết**:
  * Hiện tại trường `classroomId` chỉ lưu ID thô.
  * Cần fetch thông tin lớp học từ API `GET /api/classrooms/teacher` và hiển thị tên lớp rõ ràng (ví dụ: *"Lớp: 12A1"*).
* **Nút bấm trực diện (No Hidden Actions)**:
  * Loại bỏ cơ chế hover hiện nút nhỏ ở góc dưới.
  * Thiết kế lại Card dạng danh sách (List/Grid) với phần chứa nút bấm hành động to, rõ ràng, phân biệt màu sắc chức năng (nút giám sát màu xanh lục/cyan, nút đóng phòng màu đỏ, nút xem kết quả màu xanh dương).
* **AI Proctoring Indicator**:
  * Hiển thị biểu tượng AI rõ ràng nếu phòng thi bật tính năng giám sát AI (AI Proctoring).
* **Đồng bộ hóa giao diện giữa Giáo viên và Admin**:
  * Admin quản lý bài thi toàn hệ thống (`admin/exams/page.tsx`) sẽ được thiết kế lại thành bảng điều khiển động, bổ sung bộ lọc trạng thái và cho phép Admin can thiệp đóng/mở/giám sát bất kỳ phòng thi nào trên hệ thống.

---

## 🏁 KẾ HOẠCH TRIỂN KHAI CHI TIẾT (IMPLEMENTATION PLAN)

### Phase 1: Chuẩn bị & Fetch Dữ liệu Bổ sung (Data Fetching Setup)
* [x] Đọc và phân tích API `/api/exams/teacher/{teacherId}` (chỉ trả về các phiên thi thực tế, loại bỏ templates).
* [x] Cập nhật cơ chế fetch lớp học trong `teacher/my-exams/page.tsx` để ánh xạ `classroomId` sang tên lớp học tương ứng.
* [x] Cập nhật cơ chế fetch lớp học tương tự trong `admin/exams/page.tsx`.

### Phase 2: Thiết kế lại trang Giáo viên (`teacher/my-exams/page.tsx`)
* [x] Thay đổi tiêu đề Banner từ "Kỳ thi của tôi" thành "Bảng điều khiển Phòng thi & Giám sát".
* [x] Viết hàm helper định dạng hiển thị thời gian bắt đầu đã lên lịch hoặc thời gian còn lại của phòng LIVE.
* [x] Xây dựng lại giao diện Grid/List Card:
  * Thay đổi cấu trúc Card: đưa thông tin Lớp học, Trạng thái đếm ngược lên trung tâm.
  * Đặt hàng nút hành động trực diện:
    * `STARTED`: Nút **Vào Giám sát** (Màu Emerald), nút **Đóng Phòng** (Màu Red), nút **Mã phòng** (Mono, copy).
    * `PUBLISHED` (Scheduled): Nút **Bắt đầu ngay** (Màu Blue), nút **Sửa lịch** (Màu Slate), nút **Hủy lịch** (Màu Red).
    * `FINISHED`/`COMPLETED`: Nút **Xem kết quả** (Màu Cyan), nút **Mở lại** (Màu Slate), nút **Xóa** (Màu Slate/Red).
  * [x] Loại bỏ hoàn toàn nút share vào ngân hàng đề thi khỏi trang này (vì đây là các phiên thi thực tế, việc đưa vào ngân hàng đề chỉ thực hiện ở trang Đề thi mẫu `teacher/exam-templates`).
  * [x] Giữ nguyên nút "Tạo đề thi mới" và điều hướng giáo viên tới trang thiết kế đề thi (Builder) `/teacher/exams?mode=ai` hoặc `/teacher/exams?mode=manual`.

### Phase 3: Thiết kế lại trang Admin (`admin/exams/page.tsx`)
* [x] Chuyển đổi giao diện bảng quản lý tĩnh hiện tại sang dạng Dashboard quản lý phiên thi năng động.
* [x] Thêm các bộ lọc trạng thái giống trang của Giáo viên (Tất cả, Đang diễn ra, Sẵn sàng, Đã đóng).
* [x] Nâng cấp danh sách dòng trong bảng thành dạng Grid Card đồng nhất:
  * Hiển thị số lượng học sinh đang online nếu phòng đang LIVE.
  * Hiển thị nút **Giám sát trực tuyến** và **Xem kết quả** trực tiếp trên từng card tương ứng với trạng thái phòng thi.
  * Hiển thị thông tin lớp học liên kết.

### Phase 4: Kiểm tra & Tối ưu hóa (Verification)
* [x] Chạy build TypeScript `npx tsc --noEmit` để đảm bảo không lỗi kiểu dữ liệu.
* [x] Chạy linter kiểm tra cú pháp và định dạng.
* [x] Kiểm tra thực tế luồng tương tác trên trình duyệt ở cả 2 tài khoản Teacher và Admin.

---

## 🧪 TIÊU CHÍ KIỂM TRA CHẤT LƯỢNG (VERIFICATION CHECKLIST)
- [x] **Tên lớp học hiển thị chuẩn xác**: Các kỳ thi được gán cho một lớp học cụ thể phải hiển thị chính xác tên lớp học đó thay vì hiển thị ID thô.
- [x] **Tính toán thời gian động**: Các phòng thi LIVE hiển thị thời gian còn lại chính xác; phòng SCHEDULED hiển thị thời gian đếm ngược thông minh.
- [x] **Nút bấm rõ ràng**: Tuyệt đối không dùng hiệu ứng ẩn nút bấm khi hover; các nút chức năng cốt lõi như giám sát, xem kết quả, đóng/mở phòng luôn hiển thị trực quan.
- [x] **Ngăn chặn lỗi thiết kế (Purple Ban)**: Đảm bảo giao diện sử dụng gam màu xanh navy đậm (`#0C2E5E`), cyan (`#00C6FF`), emerald, ruby/red. Không được sử dụng màu tím, tím violet hay indigo làm tông màu chủ đạo.
