# 🚀 Kế hoạch Tái cấu trúc Luồng Thiết Kế & Cấu Hình Đề Thi (Kho Đề Thi)

Hệ thống hiện tại gộp chung luồng thiết kế bộ câu hỏi và cấu hình kỳ thi vào một màn hình duy nhất (`/teacher/exams`). Để tăng tính tái sử dụng và tối ưu UX, kế hoạch này tách biệt hai luồng:
1. **Thiết kế đề thi** (`/teacher/exams`): Chỉ dùng để soạn thảo, nhập liệu, AI tạo câu hỏi và lưu thành **Đề thi mẫu (Exam Template)** trong **Kho đề**.
2. **Kho đề thi** (`/teacher/exam-bank`): Quản lý các đề thi mẫu. Khi giáo viên muốn giao bài, họ sẽ bấm **"Cấu hình & Giao bài"**, một Drawer cấu hình sẽ hiện ra để tạo ra một **Kỳ thi thực tế (Exam Session)** độc lập. Thay đổi trên đề thi gốc sau đó sẽ không ảnh hưởng đến kỳ thi thực tế đã tạo (đảm bảo tính nhất quán của dữ liệu thi).

---

## 1. 🏛️ Project Type & Tech Stack

* **Project Type:** WEB (Frontend Next.js) + BACKEND (Spring Boot & MongoDB)
* **Tech Stack:**
  * **Frontend:** React, Next.js (App Router), TailwindCSS, Radix UI / Shadcn UI components.
  * **Backend:** Spring Boot, Spring Data MongoDB.
  * **Database:** MongoDB (Collections: `exams` cho kỳ thi thực tế, và chúng ta có thể sử dụng thêm collection hoặc trường phân biệt cho Đề gốc).
    * *Giải pháp lưu trữ dữ liệu:* Ta sẽ thêm cờ `isTemplate: true` vào collection `exams` để đánh dấu đề thi mẫu trong Kho đề. Khi giáo viên cấu hình giao bài, ta sẽ nhân bản (clone) tài liệu đề thi mẫu đó, xóa cờ `isTemplate`, thêm các trường cấu hình kỳ thi thực tế (`classroomId`, `startTime`, `duration`, v.v.) và lưu thành một bản ghi `Exam` mới với trạng thái `PUBLISHED` hoặc `DRAFT`. Cách này giúp đảm bảo **Phương án A**: sửa đề mẫu không ảnh hưởng đến kỳ thi thực tế đã giao.

---

## 2. 🎯 Success Criteria

- [ ] Trang **Thiết kế đề thi** (`/teacher/exams`) không còn Sidebar cấu hình kỳ thi ở bên phải, chỉ tập trung vào soạn câu hỏi. Thay nút "Xuất bản" bằng nút "Lưu vào Kho đề".
- [ ] Trang **Kho đề thi** (`/teacher/exam-bank` và thư mục con) hiển thị danh sách các đề thi mẫu (`isTemplate: true`).
- [ ] Bổ sung chức năng **"Cấu hình & Giao bài"** tại trang Kho đề:
  - Khi click, mở một Drawer bên phải chứa đầy đủ cấu hình (Thời gian, Số lượng đề, Xáo trộn, AI Proctoring, Chọn lớp học để giao).
  - Xác nhận sẽ gọi API tạo Kỳ thi thực tế độc lập từ đề mẫu.
- [ ] Chỉnh sửa đề thi gốc trong Kho đề sau khi đã giao bài hoàn toàn **không ảnh hưởng** đến nội dung câu hỏi của Kỳ thi đã giao trước đó.
- [ ] Giữ nguyên các chức năng xem kết quả, giám sát từ kỳ thi thực tế.

---

## 3. 📂 File Structure Changes

Các file chính sẽ bị tác động hoặc tạo mới:

### Frontend (`d:\AUAC\AuraAcademic`)
* `src/app/[locale]/teacher/exams/page.tsx` -> Loại bỏ sidebar cấu hình, đổi modal lưu.
* `src/app/[locale]/teacher/exam-bank/page.tsx` -> Thêm Drawer cấu hình kỳ thi, tích hợp nút giao bài.
* `src/app/[locale]/teacher/exam-bank/[folderId]/page.tsx` -> Cập nhật tương tự cho chế độ xem thư mục.
* `src/components/exam/ExamConfigDrawer.tsx` -> (Tạo mới) Component Drawer chứa cấu hình kỳ thi.

### Backend (`d:\AUAC\AuraAcademic_BE`)
* `src/main/java/com/auracademic/backend/model/Exam.java` -> Bổ sung trường `boolean isTemplate` để phân biệt đề mẫu và kỳ thi thực tế.
* `src/main/java/com/auracademic/backend/controller/ExamController.java` -> Bổ sung endpoint tạo Kỳ thi thực tế từ đề mẫu (`POST /api/exams/{templateId}/publish`).
* `src/main/java/com/auracademic/backend/service/ExamService.java` -> Xử lý logic nhân bản câu hỏi/phiên bản đề thi khi giao bài.

---

## 4. 🛠️ Task Breakdown

### Phase 1: Database & Backend Foundations (P0)

#### **Task BE-1: Bổ sung thuộc tính và API nhân bản đề thi**
* **Agent:** `backend-specialist` (Skill: `database-design`, `api-patterns`)
* **Dependencies:** None
* **INPUT:** Model `Exam.java` hiện tại.
* **OUTPUT:**
  1. Thêm trường `private boolean isTemplate = false;` vào `Exam.java` kèm getter/setter.
  2. Tạo endpoint `POST /api/exams/{id}/clone-to-session` nhận payload cấu hình kỳ thi (`duration`, `shuffle`, `aiProctoring`, `classroomId`, `scheduledStartTime`, v.v.).
  3. Logic Java sẽ tìm đề gốc có ID `{id}`, clone toàn bộ câu hỏi/phiên bản, gán các trường cấu hình từ payload, set `isTemplate = false` và lưu thành bản ghi mới.
* **VERIFY:** Dùng Postman/cURL gọi thử endpoint clone đề, kiểm tra DB xem có bản ghi mới độc lập được tạo ra không.

---

### Phase 2: Frontend Refactoring (P1)

#### **Task FE-1: Tách Sidebar cấu hình khỏi trang Thiết kế Đề thi**
* **Agent:** `frontend-specialist` (Skill: `clean-code`, `frontend-design`)
* **Dependencies:** BE-1
* **INPUT:** `src/app/[locale]/teacher/exams/page.tsx`
* **OUTPUT:**
  1. Loại bỏ UI Sidebar cấu hình kỳ thi ở cột bên phải.
  2. Chuyển nút "Xuất bản" thành "Lưu vào Kho đề".
  3. Khi bấm "Lưu vào Kho đề", mở Modal yêu cầu nhập: Tên bộ đề, Môn học, Khối lớp, Độ khó mặc định. Sau đó gọi API lưu đề thi với cờ `isTemplate = true`.
* **VERIFY:** Truy cập `/teacher/exams`, kiểm tra giao diện thiết kế thoáng, sạch sẽ, chỉ tập trung soạn câu hỏi và lưu thành công.

#### **Task FE-2: Xây dựng Component Cấu hình Drawer (`ExamConfigDrawer`)**
* **Agent:** `frontend-specialist` (Skill: `frontend-design`)
* **Dependencies:** FE-1
* **INPUT:** Các trường cấu hình cũ từ sidebar của trang thiết kế.
* **OUTPUT:** Tạo mới component `src/components/exam/ExamConfigDrawer.tsx` sử dụng Drawer của Shadcn/Radix. Drawer này hiển thị các thông tin:
  - Thời gian làm bài (phút)
  - Số lượng đề (phiên bản)
  - Lên lịch thi tự động (ngày giờ)
  - Lớp học nhận bài thi (Fetch danh sách lớp của giáo viên)
  - Các cấu hình nâng cao: Xáo trộn đề, AI Proctoring.
  - Nút xác nhận "Giao bài".
* **VERIFY:** Component render đúng, nhận dữ liệu đầu vào là Đề mẫu và các callback, hỗ trợ validate dữ liệu nhập vào đầy đủ.

#### **Task FE-3: Tích hợp nút Cấu hình vào trang Kho Đề (`exam-bank`)**
* **Agent:** `frontend-specialist` (Skill: `clean-code`)
* **Dependencies:** FE-2
* **INPUT:** `src/app/[locale]/teacher/exam-bank/page.tsx` và `[folderId]/page.tsx`
* **OUTPUT:**
  1. Thêm nút "Cấu hình & Giao bài" (icon `send` hoặc `settings`) bên cạnh mỗi đề thi mẫu trong danh sách Kho đề.
  2. Khi bấm nút, mở `ExamConfigDrawer` đã thiết kế ở Task FE-2.
  3. Bấm xác nhận trong Drawer sẽ gọi API `/api/exams/{templateId}/clone-to-session` với payload cấu hình để giao bài cho học sinh.
  4. Hiển thị thông báo Toast thành công và chuyển giáo viên sang trang quản lý kỳ thi thực tế (Kỳ thi của tôi).
* **VERIFY:** Giáo viên có thể giao bài từ kho đề mượt mà, kỳ thi thực tế xuất hiện trong danh sách "Kỳ thi của tôi".

---

## 5. 🏁 Phase X: Final Verification

Sau khi hoàn thành tất cả các task, chạy quy trình kiểm thử toàn diện:
- [x] Chạy build frontend để đảm bảo không lỗi type/lint: `npm run build`
- [x] Kiểm tra luồng tạo đề bằng AI / file -> Lưu vào Kho đề thành công.
- [x] Kiểm tra luồng Giao bài từ Kho đề -> Tạo ra kỳ thi thực tế trong lớp học.
- [x] Chạy thử kỳ thi với tài khoản học sinh, nộp bài bình thường.
- [x] Chỉnh sửa đề mẫu gốc trong Kho đề, xác nhận đề thi học sinh đang làm không bị thay đổi nội dung.
- [x] Chạy script quét bảo mật và tối ưu hóa hiệu năng:
  ```bash
  python .agent/scripts/verify_all.py . --url http://localhost:3000
  ```

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-05-31
