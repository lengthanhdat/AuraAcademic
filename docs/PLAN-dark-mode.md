# KẾ HOẠCH TRIỂN KHAI: HỆ THỐNG DARK MODE MIDNIGHT NAVY 🌌

> **Mã công việc:** PLAN-dark-mode
> **Trạng thái:** Sẵn sàng triển khai
> **Mục tiêu:** Tích hợp tính năng Dark Mode cao cấp trên nền tảng Space Navy-to-Cyan, đồng bộ tự động qua `localStorage` và Cấu hình Hệ điều hành của người dùng.

---

## 🏗️ PHẦN 1: YÊU CẦU & KIẾN TRÚC KỸ THUẬT

### 1. Thông số Kỹ thuật
*   **Công nghệ lõi:** `next-themes` (hỗ trợ Server-Side Rendering chống Hydration Flash).
*   **Cơ chế hoạt động:** Lớp CSS `.dark` được kích hoạt trên thẻ `<html>` (Tailwind `darkMode: 'class'`).
*   **Đồng bộ:** Tự động phát hiện cài đặt OS (`prefers-color-scheme`) lần đầu, lưu vết lựa chọn thủ công vào `localStorage`.

### 2. Bảng Màu Đêm Vũ Trụ (Midnight Navy Palette)
Giao diện tối sẽ áp dụng tông màu công nghệ huyền ảo, tôn vinh nhận diện thương hiệu:
*   **Nền chính (Main BG):** `#051329` (Midnight Space Navy - Xanh đen đậm sâu thẳm).
*   **Nền thẻ chứa (Card/Surface BG):** `#0A1F3E / bg-[#0A1F3E]/80` (Nền kính mờ ánh xanh huyền bí).
*   **Viền ranh giới (Borders):** `border-slate-800 / border-cyan-950` (Hạn chế chói mắt).
*   **Chữ chính (Text Header):** `#E2E8F0` (Slate-200) / **Chữ phát sáng:** `#00C6FF` (Electric Cyan).
*   **Hào quang (Hover Glow):** `shadow-[0_0_30px_-5px_rgba(0,198,255,0.15)]`.

---

## 📅 PHẦN 2: LỘ TRÌNH PHÁT TRIỂN (4 PHASES)

### 🚀 Giai đoạn 1: Thiết lập Core Theme & Provider (Cơ sở Hạ tầng)
- [ ] **Cài đặt dependencies:** Cài đặt `next-themes` vào thư mục `AuraAcademic`.
- [ ] **Cấu hình Tailwind:** Kích hoạt `darkMode: 'class'` trong `tailwind.config.ts`.
- [ ] **Xây dựng ThemeProvider:** Tạo component client-side wrapper `ThemeProvider.tsx` để ôm lấy toàn bộ ứng dụng trong `src/app/[locale]/layout.tsx`.
- [ ] **Cập nhật Hệ thống Thiết kế:** Nhúng bảng màu Midnight Navy vào tệp MASTER.md.

### 🎨 Giai đoạn 2: Xây dựng Nút chuyển động Theme Toggle (UI Component)
- [ ] **Thiết kế Component `ThemeToggle.tsx`:**
    - Sử dụng biểu tượng Google Material Symbols (`light_mode` / `dark_mode`).
    - Áp dụng hiệu ứng chuyển động **Xoay 360 độ mượt mà (Smooth Spin Transition)** khi chuyển đổi chế độ.
    - Tích hợp `mounted` check để triệt tiêu lỗi Hydration không khớp (mismatch) đặc trưng của React SSR.
- [ ] **Vị trí tích hợp:** Nhúng nút bấm vào **Header** của cả 3 Portal:
    - [StudentHeader.tsx](file:///c:/AuAc/AuraAcademic/src/components/layout/StudentHeader.tsx) (Cạnh chuông thông báo).
    - [TeacherHeader.tsx](file:///c:/AuAc/AuraAcademic/src/components/layout/TeacherHeader.tsx) (Cạnh clock/switcher).
    - [AdminHeader.tsx](file:///c:/AuAc/AuraAcademic/src/components/layout/AdminHeader.tsx) (Cạnh nút Settings).

### 🛠️ Giai đoạn 3: Phổ cập CSS Dark Classes (Implementation)
Bổ sung tiền tố `dark:` vào các khối bố cục trọng điểm:
- [ ] **Layouts & Sidebars:** Cập nhật Sidebar sang `dark:bg-[#0A1F3E]/90 dark:border-cyan-950/40`.
- [ ] **Main Containers:** Áp dụng `dark:bg-[#051329]` cho toàn bộ màn hình làm việc của học sinh, giáo viên và admin.
- [ ] **Bento Cards:** Thẻ dữ liệu khi bật Dark Mode sẽ chuyển sang nền `dark:bg-[#0A1F3E]` và tỏa ánh sáng xanh Cyan mềm mại khi rê chuột.
- [ ] **Tables & Modals:** Điều chỉnh toàn bộ bảng quản trị sang chữ sáng màu và viền tối sang trọng.

### 🧪 Giai đoạn 4: Kiểm tra & Tối ưu hóa (Testing & QA)
- [ ] **Kiểm tra Flash Prevention:** Tải lại trang (Hard reload) để đảm bảo màn hình không bị chớp sáng trắng trước khi chuyển sang nền đen.
- [ ] **OS Preference Syncing:** Thử chuyển đổi Dark/Light mode trên Windows Settings xem AuraAcademic có tự động cập nhật theo thời gian thực hay không.
- [ ] **Accessibility Check:** Đo kiểm độ tương phản chữ trên nền tối để đảm bảo người dùng làm bài thi ban đêm không bị mỏi mắt.

---

## 🛡️ PHÂN CÔNG AGENT & CÔNG CỤ KIỂM ĐỊNH

| Vai trò | Agent chịu trách nhiệm | Công cụ kiểm soát |
|---|---|---|
| **Kiến trúc & Provider** | `@[project-planner]` | `next-themes` APIs |
| **Mỹ thuật UI/UX** | `@[frontend-specialist]` | `MASTER.md` / CSS Transitions |
| **Phổ cập Code** | `@[orchestrator]` | Tailwind Classes Audit |

---

## 📝 DANH SÁCH TỆP TIN DỰ KIẾN CẦN CHỈNH SỬA
*   `package.json` (Cài đặt next-themes)
*   `tailwind.config.ts` (Cấu hình darkMode)
*   `src/app/[locale]/layout.tsx` (Nhúng Provider)
*   `src/components/providers/ThemeProvider.tsx` (Tạo mới)
*   `src/components/ui/ThemeToggle.tsx` (Tạo mới)
*   Các tệp Header: `StudentHeader.tsx`, `TeacherHeader.tsx`, `AdminHeader.tsx`
*   Các tệp Sidebar: `StudentSidebar.tsx`, `TeacherSidebar.tsx`, `AdminSidebar.tsx`

---
*Kế hoạch đã hoàn tất. Xin vui lòng phê duyệt để bắt đầu thực thi công việc!*
