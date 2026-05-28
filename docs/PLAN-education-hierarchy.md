# Kế Hoạch Triển Khai Cấu Trúc Cấp Bậc (Từ Lớp 1 Đến Đại Học)

**File:** `PLAN-education-hierarchy.md`
**Mode:** PLANNING

## 1. Bối Cảnh (Context)
Hiện tại hệ thống sử dụng một danh sách môn học phẳng (`ALL_SUBJECTS`), gây khó khăn trong việc mở rộng quản lý cho các cấp học từ Lớp 1 đến Đại học. Mục tiêu là thiết kế lại cấu trúc dữ liệu và giao diện để hỗ trợ phân cấp rõ ràng (Khối lớp/Ngành học ➡️ Môn học), kèm theo bộ chọn (2 dropdowns) ở các tính năng như Tạo Đề Thi, Import Đề và Ngân Hàng Đề Thi.

## 2. Thiết Kế Cấu Trúc Dữ Liệu (Data Structure)

### 2.1 Cấu trúc tĩnh ở Frontend (Tạm thời hoặc cố định trong thư mục lib)
Tạo một file mới `src/lib/education-levels.ts` lưu trữ cây cấu trúc:

```typescript
export interface Subject {
  id: string;
  name: string;
}

export interface EducationLevel {
  id: string; // VD: "grade_1", "grade_12", "uni_it"
  name: string; // VD: "Lớp 1", "Lớp 12", "Đại học - CNTT"
  type: "K12" | "UNIVERSITY";
  subjects: Subject[];
}

export const EDUCATION_HIERARCHY: EducationLevel[] = [
  // Cấp phổ thông K-12
  {
    id: "grade_1",
    name: "Lớp 1",
    type: "K12",
    subjects: [{ id: "math", name: "Toán học" }, { id: "vietnamese", name: "Tiếng Việt" }]
  },
  // ... (Tương tự cho đến Lớp 12)
  {
    id: "grade_12",
    name: "Lớp 12",
    type: "K12",
    subjects: [
      { id: "math", name: "Toán học" },
      { id: "physics", name: "Vật lí" },
      { id: "chemistry", name: "Hóa học" }
    ]
  },
  
  // Cấp Đại học theo nhóm ngành
  {
    id: "uni_it",
    name: "Đại học - Công nghệ thông tin",
    type: "UNIVERSITY",
    subjects: [
      { id: "ds_algo", name: "Cấu trúc dữ liệu và Giải thuật" },
      { id: "database", name: "Cơ sở dữ liệu" },
      { id: "network", name: "Mạng máy tính" }
    ]
  },
  {
    id: "uni_econ",
    name: "Đại học - Kinh tế & Quản trị",
    type: "UNIVERSITY",
    subjects: [
      { id: "microecon", name: "Kinh tế vi mô" },
      { id: "macroecon", name: "Kinh tế vĩ mô" }
    ]
  }
];
```

### 2.2 Thay đổi cấu trúc Database (Backend)
Bảng `Exam` (Entity `Exam.java`) hiện đang lưu `subject` dưới dạng String.
- Bổ sung thêm trường `gradeLevel` (hoặc `educationLevel`) kiểu String.
- Ví dụ MongoDB/PostgreSQL Entity:
  - Bổ sung thuộc tính `gradeLevel` (VD: "Lớp 12", "Đại học - Công nghệ thông tin").
  - Thuộc tính `subject` giữ nguyên nhưng nay phụ thuộc vào cấp bậc đã chọn.

## 3. Lộ Trình Triển Khai (Task Breakdown)

### [ ] Task 1: Thiết lập cây cấu trúc (Frontend)
- **Mô tả:** Tạo file `src/lib/education-levels.ts` và định nghĩa dữ liệu cấp bậc từ Lớp 1 đến Đại học theo định dạng phân cấp.
- **Agent:** `@frontend-specialist`
- **Output:** File `education-levels.ts` đầy đủ.

### [ ] Task 2: Cập nhật API & Model (Backend)
- **Mô tả:** Thêm trường `gradeLevel` vào `Exam` entity, DTOs, và các hàm tìm kiếm trong `ExamController`, `ExamService`.
- **Agent:** `@backend-specialist`
- **Output:** Backend nhận và lưu được `gradeLevel` cùng với `subject`.

### [ ] Task 3: Nâng cấp Giao diện Thiết kế & Nhập Đề Thi (Frontend)
- **Mô tả:** Chỉnh sửa file `teacher/exams/page.tsx` và `teacher/exams/import/page.tsx`.
- **Action:** Đổi từ 1 dropdown hiện tại thành 2 dropdown phụ thuộc nhau (Chọn Cấp Bậc ➡️ Chọn Môn). Cập nhật payload `handleSave` truyền lên cả 2 tham số.
- **Agent:** `@frontend-specialist`
- **Output:** Giao diện có 2 dropdown hoạt động trơn tru.

### [ ] Task 4: Nâng cấp Giao diện Ngân Hàng Đề Thi
- **Mô tả:** Chỉnh sửa `teacher/exam-bank/page.tsx` và trang Admin tương ứng. 
- **Action:** Thêm dropdown lọc theo "Cấp Bậc" cạnh dropdown "Môn học". Cập nhật hàm logic filter. Cập nhật bảng hiển thị thêm cột hoặc badge cấp bậc.
- **Agent:** `@frontend-specialist`
- **Output:** Lọc đề thi trong ngân hàng theo đúng cấu trúc.

## 4. Kiểm Thử (Verification)
- Người dùng tạo được đề thi với cấp bậc "Lớp 10" và môn "Toán học".
- Bấm vào Ngân hàng đề thi, đề thi hiển thị đúng cấp bậc và có thể được lọc dễ dàng bằng 2 dropdown.
- Chọn cấp độ Đại học -> Danh sách môn tự động cập nhật môn chuyên ngành.
