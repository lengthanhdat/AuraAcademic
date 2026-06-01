"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#030712] transition-colors duration-500">
      <Navbar />
      
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-28 md:py-36">
        <div className="text-center mb-12">
          <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-[#00C6FF]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0C2E5E] dark:text-white mb-3">
            Chính sách <span className="text-[#00C6FF]">Bảo mật</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Bảo vệ quyền riêng tư của bạn là ưu tiên hàng đầu của chúng tôi.</p>
        </div>

        <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 md:p-12">
          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-[#0C2E5E] dark:prose-headings:text-white">
            <h3>1. Dữ liệu chúng tôi thu thập</h3>
            <p>
              Khi bạn sử dụng AuraAcademic, chúng tôi thu thập các thông tin sau để đảm bảo nền tảng hoạt động trơn tru:
            </p>
            <ul>
              <li><strong>Thông tin định danh:</strong> Tên, địa chỉ email, ảnh đại diện, trường học/tổ chức.</li>
              <li><strong>Dữ liệu hoạt động:</strong> Lịch sử bài làm, lịch sử tạo đề, nhật ký hệ thống.</li>
              <li><strong>Dữ liệu giám sát (Proctoring):</strong> Trong lúc làm bài, hệ thống AI phân tích biểu cảm khuôn mặt, hướng nhìn, âm thanh nền để phát hiện gian lận. Dữ liệu này chỉ được ghi đè và tự hủy sau kỳ thi, trừ khi bị đánh dấu là "vi phạm".</li>
            </ul>

            <h3>2. Cách chúng tôi sử dụng dữ liệu</h3>
            <p>
              Dữ liệu của bạn được sử dụng ĐỘC QUYỀN cho các mục đích:
            </p>
            <ul>
              <li>Xác thực danh tính và cấp quyền truy cập.</li>
              <li>Cung cấp kết quả thi, báo cáo phân tích năng lực cho Giáo viên.</li>
              <li>Phát hiện gian lận và đảm bảo sự công bằng của bài kiểm tra.</li>
              <li>Cải thiện độ chính xác của AI phân tích hành vi.</li>
            </ul>

            <h3>3. Cam kết không bán dữ liệu</h3>
            <p>
              AuraAcademic tuyệt đối KHÔNG bán, cho thuê hoặc trao đổi dữ liệu cá nhân của người dùng (kể cả dữ liệu khuôn mặt) cho bất kỳ bên thứ ba nào vì mục đích quảng cáo hoặc thương mại. Toàn bộ cơ sở dữ liệu được mã hóa chuẩn AES-256 trên đám mây.
            </p>

            <h3>4. Xóa tài khoản & Dữ liệu</h3>
            <p>
              Người dùng có quyền yêu cầu trích xuất toàn bộ dữ liệu cá nhân hoặc xóa vĩnh viễn tài khoản của mình khỏi hệ thống. Khi tài khoản bị xóa, các kết quả thi có thể được làm ẩn danh (anonymized) để lưu trữ thống kê chung cho tổ chức giáo dục nhưng không thể truy xuất ngược lại cá nhân.
            </p>

            <h3>5. Liên hệ với bộ phận DPO (Data Protection Officer)</h3>
            <p>
              Nếu bạn có bất kỳ lo ngại nào về quyền riêng tư hoặc cách chúng tôi xử lý dữ liệu của bạn, vui lòng gửi email về <strong>privacy@auraacademic.edu.vn</strong> để được giải đáp trong 24 giờ.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
