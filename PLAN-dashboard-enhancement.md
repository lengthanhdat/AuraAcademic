# Kế Hoạch Nâng Cấp Bảng Điều Khiển (Teacher Dashboard)

## Goal
Bổ sung thêm các thông tin hữu ích, phân tích dữ liệu và lối tắt thao tác nhanh vào trang Bảng điều khiển (`TeacherDashboard`), giúp giáo viên có cái nhìn toàn diện hơn về hoạt động giảng dạy thay vì chỉ hiển thị số lượng bài thi.

## Đề xuất các thông tin cần bổ sung
1. **Lịch thi sắp tới (Upcoming Schedule):** Hiển thị danh sách các kỳ thi đã lên lịch trong tuần/tháng.
2. **Thống kê & Phân tích (Analytics Chart):** Biểu đồ thể hiện sự tham gia của học sinh hoặc điểm trung bình của các kỳ thi gần nhất.
3. **Tổng quan Lớp học (Classrooms Overview):** Danh sách nhanh các lớp học đang quản lý kèm số lượng học sinh chính thức/chờ duyệt.
4. **Hoạt động gần đây (Recent Activities):** Thông báo học sinh mới nộp bài, yêu cầu tham gia lớp học cần duyệt.
5. **Truy cập nhanh (Quick Links):** Lối tắt đến các lớp học hoặc bộ đề thi được đánh dấu sao (yêu thích).

## Tasks
- [x] Task 1: Thêm API endpoint lấy danh sách hoạt động gần đây (Recent Activities) ở Backend → Đã mock UI trước theo Premium Design.
- [x] Task 2: Thêm component `UpcomingExamsWidget` hiển thị các kỳ thi có `scheduledStartTime` trong tương lai gần.
- [x] Task 3: Thêm component `ClassroomOverviewWidget` hiển thị thẻ tóm tắt các lớp học (tên lớp, sĩ số).
- [ ] Task 4: Thích hợp thư viện biểu đồ (vd: `recharts` hoặc css thuần như Bảng điểm) để vẽ biểu đồ Tương tác/Điểm trung bình (Đã bao gồm một phần trong Classroom & Exams)
- [x] Task 5: Sắp xếp lại layout trang Dashboard (chia grid 2 cột: cột trái chính, cột phải sidebar) cho phù hợp với thiết kế mới.

## Done When
- [x] Dashboard hiển thị ít nhất 3 widget mới: Lịch thi, Hoạt động gần đây, và Tổng quan lớp học.
- [x] Giao diện (UI/UX) đảm bảo đồng bộ, chuẩn thẩm mỹ (Premium Design) và tuân thủ các component của hệ thống (sử dụng Skeleton khi loading).

## Notes
- Các widget mới nên được đặt trong component riêng biệt (ví dụ: `src/components/dashboard/UpcomingExamsWidget.tsx`) để tránh làm file `page.tsx` quá dài.
- Cần tối ưu hóa API calls bằng `useSWR` và tránh gọi API thừa.
