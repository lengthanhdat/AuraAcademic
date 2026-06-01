"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BookOpen, Key, MonitorPlay, FileText } from "lucide-react";

export default function GuidePage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#030712] transition-colors duration-500">
      <Navbar />
      
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-28 md:py-36">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0C2E5E] dark:text-white mb-3">
            Tài liệu <span className="text-[#00C6FF]">Hướng dẫn</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Mọi thứ bạn cần biết để sử dụng AuraAcademic một cách hiệu quả nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {[
            { icon: <Key className="w-5 h-5" />, title: "Bắt đầu nhanh", desc: "Cách đăng ký, đăng nhập và thiết lập tài khoản lần đầu cho Giáo viên và Học sinh." },
            { icon: <BookOpen className="w-5 h-5" />, title: "Tạo đề thi & Ngân hàng", desc: "Hướng dẫn tạo câu hỏi, import từ Word/PDF và sử dụng AI để tự động sinh đề." },
            { icon: <MonitorPlay className="w-5 h-5" />, title: "Tổ chức & Giám sát thi", desc: "Cách mở phòng thi, chia sẻ mã phòng và theo dõi học sinh qua camera AI thời gian thực." },
            { icon: <FileText className="w-5 h-5" />, title: "Xem báo cáo phổ điểm", desc: "Cách truy xuất kết quả thi, xuất file CSV và đánh giá chất lượng bài kiểm tra." }
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-6 hover:border-[#00C6FF]/40 transition-colors group cursor-pointer shadow-sm dark:shadow-none">
              <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-500/10 rounded-lg flex items-center justify-center text-[#00C6FF] mb-4">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-[#0C2E5E] dark:text-white mb-3">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#0C2E5E] dark:bg-gradient-to-r dark:from-slate-900 dark:to-[#0A1F3E] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C6FF]/20 rounded-full blur-[80px]" />
          <h3 className="text-2xl font-bold mb-4 relative z-10">Bạn cần hỗ trợ trực tiếp?</h3>
          <p className="text-blue-100/80 mb-8 relative z-10 max-w-xl mx-auto">
            Đội ngũ kỹ thuật của AuraAcademic luôn sẵn sàng 24/7 để hỗ trợ bạn giải quyết bất kỳ sự cố nào trong quá trình tổ chức thi.
          </p>
          <a href="/contact" className="inline-block px-8 py-3 bg-gradient-to-r from-[#00C6FF] to-[#0072FF] text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all hover:-translate-y-1 relative z-10">
            Liên hệ hỗ trợ ngay
          </a>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
