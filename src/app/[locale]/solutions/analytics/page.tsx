"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BarChart3, PieChart, Activity, LineChart, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function AnalyticsSolutionPage() {
  const t = useTranslations("Footer"); 

  return (
    <main className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#030712] transition-colors duration-500">
      <Navbar />
      
      <div className="flex-1 w-full mx-auto pb-20">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50/30 dark:from-[#0f172a] dark:to-[#040d1a] -z-10" />
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold text-sm mb-6">
              <BarChart3 className="w-4 h-4" /> Giải pháp
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#0C2E5E] dark:text-white mb-6 leading-tight">
              Hệ Thống <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-400">Thống Kê & Phổ Điểm</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-3xl mx-auto">
              Nhìn thấu chất lượng giảng dạy và năng lực học sinh thông qua hệ thống báo cáo phân tích mạnh mẽ, trực quan và chi tiết tới từng câu hỏi.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
            <div className="order-2 md:order-1 group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/20 border border-slate-200 dark:border-cyan-950/40 bg-slate-50 dark:bg-[#0B1D33] aspect-[4/3] flex items-center justify-center">
                <Image src="/images/analytics_mockup.png" alt="Analytics Dashboard Mockup" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-700" priority />
                <div className="absolute inset-0 border border-black/5 dark:border-white/5 rounded-2xl pointer-events-none" />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold text-[#0C2E5E] dark:text-white mb-6">Biến Dữ Liệu Thành Quyết Định</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Tạm biệt các file Excel thủ công và những con số khô khan. AuraAcademic tự động hóa hoàn toàn quy trình chấm điểm và tạo ra các biểu đồ phân tích sâu sắc, giúp giáo viên nắm bắt ngay lập tức tình hình lớp học.
              </p>
              <ul className="space-y-4">
                {[
                  "Biểu đồ phổ điểm trực quan (Distribution Curve).",
                  "Thống kê tỉ lệ đúng/sai chi tiết trên từng câu hỏi.",
                  "Theo dõi sự tiến bộ của từng học sinh qua các kỳ thi.",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 hover:-translate-y-1 transition-transform shadow-lg shadow-slate-200/50 dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center mb-6">
                <PieChart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Phân loại học lực</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Tự động gom nhóm học sinh theo mức độ hoàn thành bài (Giỏi, Khá, Trung bình, Yếu) để dễ dàng lập kế hoạch bồi dưỡng.
              </p>
            </div>
            
            <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 hover:-translate-y-1 transition-transform shadow-lg shadow-slate-200/50 dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Tốc độ làm bài</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Ghi nhận thời gian hoàn thành bài thi trung bình của lớp, giúp giáo viên đánh giá được độ dài và độ khó của đề thi.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 hover:-translate-y-1 transition-transform shadow-lg shadow-slate-200/50 dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Xuất báo cáo Excel</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Tải xuống toàn bộ dữ liệu bảng điểm, kết quả thi, và lịch sử vi phạm chỉ với một cú click chuột để lưu trữ hồ sơ.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
