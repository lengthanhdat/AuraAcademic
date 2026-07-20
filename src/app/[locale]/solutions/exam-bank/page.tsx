"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Database, Search, Share2, Layers, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function ExamBankSolutionPage() {
  const t = useTranslations("Footer"); // For some common keys if needed

  return (
    <main className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#030712] transition-colors duration-500">
      <Navbar />
      
      <div className="flex-1 w-full mx-auto pb-20">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50/30 dark:from-[#07182b] dark:to-[#040d1a] -z-10" />
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold text-sm mb-6">
              <Database className="w-4 h-4" /> Giải pháp
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#0C2E5E] dark:text-white mb-6 leading-tight">
              Hệ Sinh Thái <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-[#00C6FF]">Ngân Hàng Đề Thi</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-3xl mx-auto">
              Lưu trữ không giới hạn, phân loại thông minh và chia sẻ tài nguyên giảng dạy dễ dàng trong toàn bộ tổ chức giáo dục của bạn.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
            <div className="order-2 md:order-1 group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20 border border-slate-200 dark:border-cyan-950/40 bg-slate-50 dark:bg-[#0B1D33] aspect-[4/3] flex items-center justify-center">
                <Image src="/images/exam_bank_mockup.png" alt="Exam Bank Interface Mockup" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-700" priority />
                <div className="absolute inset-0 border border-black/5 dark:border-white/5 rounded-2xl pointer-events-none" />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold text-[#0C2E5E] dark:text-white mb-6">Lưu trữ tập trung & Khai thác tối đa</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Quản lý hàng ngàn câu hỏi trắc nghiệm, tài liệu ôn tập và đề thi trong các chuyên mục được sắp xếp gọn gàng. AuraAcademic giúp giáo viên tiết kiệm 80% thời gian ra đề bằng cách tái sử dụng hệ thống câu hỏi có sẵn.
              </p>
              <ul className="space-y-4">
                {[
                  "Tạo chuyên đề (Folder) không giới hạn",
                  "Hỗ trợ câu hỏi có công thức Toán học (LaTeX)",
                  "Gắn thẻ (Tags) và tìm kiếm cực nhanh",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 hover:-translate-y-1 transition-transform shadow-lg shadow-slate-200/50 dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6">
                <Share2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Chia sẻ nội bộ</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Cho phép giáo viên trong cùng một tổ chức/nhà trường có thể chia sẻ đề thi cho nhau, tạo nên một cộng đồng học thuật vững mạnh.
              </p>
            </div>
            
            <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 hover:-translate-y-1 transition-transform shadow-lg shadow-slate-200/50 dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Sinh đề tự động</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Lấy ngẫu nhiên câu hỏi từ ngân hàng để tạo ra các đề thi mới (Mix questions), hạn chế gian lận trong kiểm tra.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 hover:-translate-y-1 transition-transform shadow-lg shadow-slate-200/50 dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-6">
                <Search className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Tìm kiếm siêu tốc</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Tích hợp công cụ tìm kiếm toàn văn bản giúp định vị chính xác từng câu hỏi, nội dung đề thi chỉ trong chớp mắt.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
