"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Info } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#030712] transition-colors duration-500">
      <Navbar />
      
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-28 md:py-36">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0C2E5E] dark:text-white mb-3">
            Điều khoản <span className="text-[#00C6FF]">Sử dụng</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Cập nhật lần cuối: 01/06/2026</p>
        </div>

        <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 md:p-12">
          <div className="flex items-start gap-3 p-4 mb-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-white/5">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-[#00C6FF]" />
            <p className="text-sm leading-relaxed font-medium">
              Bằng việc truy cập và sử dụng nền tảng AuraAcademic, bạn đồng ý tuân thủ các điều khoản và điều kiện được liệt kê dưới đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.
            </p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-[#0C2E5E] dark:prose-headings:text-white prose-a:text-[#00C6FF]">
            <h3>1. Chấp nhận điều khoản</h3>
            <p>
              Khi đăng ký tài khoản Giáo viên hoặc Học sinh trên AuraAcademic, bạn xác nhận rằng bạn đã đủ 13 tuổi trở lên (hoặc có sự đồng ý của phụ huynh/người giám hộ) và có đủ năng lực hành vi dân sự để đồng ý với các điều khoản này.
            </p>

            <h3>2. Quy định về tài khoản</h3>
            <ul>
              <li>Bạn phải cung cấp thông tin chính xác, đầy đủ và cập nhật mới nhất.</li>
              <li>Bạn chịu trách nhiệm bảo mật mật khẩu và mọi hoạt động diễn ra dưới tài khoản của mình.</li>
              <li>Nghiêm cấm hành vi chia sẻ tài khoản, mua bán tài khoản hoặc sử dụng hệ thống để phát tán mã độc.</li>
            </ul>

            <h3>3. Quy định về dữ liệu & AI Proctoring</h3>
            <p>
              Đối với Học sinh tham gia thi, hệ thống sẽ yêu cầu quyền truy cập Camera và Microphone. AuraAcademic sử dụng AI để <strong>phân tích hành vi theo thời gian thực</strong> (không lưu trữ video vĩnh viễn trừ khi Giáo viên yêu cầu lưu lại bằng chứng gian lận). Việc tiếp tục làm bài thi đồng nghĩa với việc bạn đồng ý cho phép AI phân tích hình ảnh của bạn trong suốt thời gian thi.
            </p>

            <h3>4. Quyền sở hữu trí tuệ</h3>
            <p>
              Mọi nội dung, mã nguồn, thiết kế đồ họa, logo và công nghệ AI của AuraAcademic đều thuộc sở hữu độc quyền của đội ngũ phát triển (lengthanhdat & trgiahuy). Các nội dung đề thi do Giáo viên tải lên thuộc quyền sở hữu của chính Giáo viên đó, chúng tôi chỉ đóng vai trò lưu trữ và xử lý.
            </p>

            <h3>5. Miễn trừ trách nhiệm</h3>
            <p>
              AuraAcademic cố gắng duy trì độ ổn định 99.9%, nhưng không chịu trách nhiệm pháp lý cho những thiệt hại gián tiếp do sự cố kết nối mạng từ phía người dùng, cúp điện, hoặc các trường hợp bất khả kháng khác trong quá trình diễn ra kỳ thi.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
