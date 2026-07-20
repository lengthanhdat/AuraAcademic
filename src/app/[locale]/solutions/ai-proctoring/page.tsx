"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ShieldCheck, Video, Eye, Smartphone, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function AIProctoringSolutionPage() {
  const t = useTranslations("Footer"); 

  return (
    <main className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#030712] transition-colors duration-500">
      <Navbar />
      
      <div className="flex-1 w-full mx-auto pb-20">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50/30 dark:from-[#051a14] dark:to-[#040d1a] -z-10" />
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold text-sm mb-6">
              <ShieldCheck className="w-4 h-4" /> Giải pháp
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#0C2E5E] dark:text-white mb-6 leading-tight">
              Công Nghệ <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Giám Sát AI Độc Quyền</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-3xl mx-auto">
              Sử dụng mô hình YOLOv8 tiên tiến nhất để phân tích hành vi thời gian thực, đảm bảo sự công bằng tuyệt đối cho mọi kỳ thi trực tuyến.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
            <div className="order-2 md:order-1 group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/20 border border-slate-200 dark:border-cyan-950/40 bg-slate-50 dark:bg-[#0B1D33] aspect-[4/3] flex items-center justify-center">
                <Image src="/images/ai_proctoring_mockup.png" alt="AI Proctoring Interface Mockup" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-700" priority />
                <div className="absolute inset-0 border border-black/5 dark:border-white/5 rounded-2xl pointer-events-none" />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold text-[#0C2E5E] dark:text-white mb-6">Proctoring Bằng Computer Vision</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Hệ thống nhận diện khuôn mặt và khung xương liên tục phân tích hình ảnh từ webcam với độ trễ siêu thấp (dưới 1s), ngay lập tức đánh cờ (flag) và ghi hình khi phát hiện hành vi đáng ngờ.
              </p>
              <ul className="space-y-4">
                {[
                  "Phát hiện sự vắng mặt hoặc có nhiều hơn 1 khuôn mặt.",
                  "Phát hiện sử dụng thiết bị điện tử, điện thoại di động.",
                  "Ghi hình bằng chứng (video 5 giây) khi có vi phạm.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 hover:-translate-y-1 transition-transform shadow-lg shadow-slate-200/50 dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-6">
                <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Phân tích hướng nhìn</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Nhận biết chuẩn xác hành vi quay trái, quay phải, gục mặt hay liếc nhìn tài liệu, và liên tục cảnh báo trên màn hình học sinh.
              </p>
            </div>
            
            <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 hover:-translate-y-1 transition-transform shadow-lg shadow-slate-200/50 dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Chống sử dụng điện thoại</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Tối ưu hóa ngưỡng phát hiện điện thoại thông minh (smartphone) để bắt gọn các hành vi gian lận công nghệ cao trong nháy mắt.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 hover:-translate-y-1 transition-transform shadow-lg shadow-slate-200/50 dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-6">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Chống chuyển Tab</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Tích hợp công nghệ bảo mật trình duyệt, cấm toàn bộ các thao tác mở tab mới, thoát chế độ toàn màn hình hay dùng phím tắt copy/paste.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
