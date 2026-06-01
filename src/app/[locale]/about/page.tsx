"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Users, Target, ShieldCheck, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#030712] transition-colors duration-500">
      <Navbar />
      
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-28 md:py-36">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0C2E5E] dark:text-white mb-4">
            Về <span className="text-[#00C6FF]">AuraAcademic</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Sứ mệnh của chúng tôi là mang đến sự công bằng, minh bạch và hiệu quả tuyệt đối trong mọi kỳ thi.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 md:p-12">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h3 className="text-2xl font-bold text-[#0C2E5E] dark:text-white mb-4">Câu chuyện của chúng tôi</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
              AuraAcademic ra đời trong bối cảnh quá trình chuyển đổi số trong giáo dục đang diễn ra mạnh mẽ. Việc tổ chức các kỳ thi trực tuyến thường gặp phải nhiều vấn đề về bảo mật, tính công bằng và sự khó khăn trong khâu quản lý. Nhận thấy điều đó, đội ngũ của chúng tôi (gồm <strong>lengthanhdat</strong> và <strong>trgiahuy</strong>) đã bắt tay vào xây dựng một nền tảng thi trắc nghiệm không chỉ đáp ứng tính tiện dụng mà còn tích hợp các công nghệ AI tiên tiến nhất để giải quyết triệt để các bài toán này.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                <Target className="w-10 h-10 text-[#00C6FF] mb-4" />
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Tầm nhìn</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Trở thành nền tảng giáo dục số và khảo thí trực tuyến hàng đầu, mang chuẩn mực quốc tế đến mọi trường học và tổ chức giáo dục.</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                <ShieldCheck className="w-10 h-10 text-[#00C6FF] mb-4" />
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Giá trị cốt lõi</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Công bằng - Minh bạch - Tiện lợi - Công nghệ cao. Mọi tính năng đều xoay quanh việc bảo vệ tính chính trực của giáo dục.</p>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-[#0C2E5E] dark:text-white mb-4">Công nghệ nền tảng</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Chúng tôi sử dụng kiến trúc Microservices kết hợp hệ thống Giám sát bằng Trí tuệ nhân tạo (AI Proctoring) có khả năng theo dõi khuôn mặt, phát hiện hành vi bất thường, quản lý đa luồng thời gian thực. Tất cả được xây dựng để đáp ứng quy mô hàng ngàn học sinh thi cùng lúc mà vẫn đảm bảo độ ổn định 99.9%.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
