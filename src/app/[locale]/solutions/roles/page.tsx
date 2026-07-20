"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Users, Shield, GraduationCap, Building2, Key } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function RolesSolutionPage() {
  const t = useTranslations("Footer"); 

  return (
    <main className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#030712] transition-colors duration-500">
      <Navbar />
      
      <div className="flex-1 w-full mx-auto pb-20">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50/30 dark:from-[#1a1306] dark:to-[#040d1a] -z-10" />
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold text-sm mb-6">
              <Building2 className="w-4 h-4" /> Giải pháp
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#0C2E5E] dark:text-white mb-6 leading-tight">
              Mô Hình <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400">Phân Quyền Tổ Chức</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-3xl mx-auto">
              Kiểm soát hệ thống toàn diện với kiến trúc đa tầng (Multi-tenant) dành cho trường học, trung tâm đào tạo và doanh nghiệp.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
            <div className="order-2 md:order-1 group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-amber-900/20 border border-slate-200 dark:border-cyan-950/40 bg-slate-50 dark:bg-[#0B1D33] aspect-[4/3] flex items-center justify-center">
                <Image src="/images/roles_mockup.png" alt="Roles Management Interface Mockup" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-700" priority />
                <div className="absolute inset-0 border border-black/5 dark:border-white/5 rounded-2xl pointer-events-none" />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold text-[#0C2E5E] dark:text-white mb-6">Phân Cấp Quyền Hạn Rõ Ràng</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                AuraAcademic cung cấp 3 nhóm vai trò chuyên biệt (Quản trị viên, Giáo viên, Học sinh) với các luồng thao tác được tinh chỉnh riêng biệt, giúp vận hành tổ chức giáo dục quy mô lớn một cách an toàn và chuyên nghiệp.
              </p>
              <ul className="space-y-4">
                {[
                  "Admin: Quản lý toàn bộ tổ chức, phê duyệt giáo viên.",
                  "Giáo viên: Mở lớp học, tạo đề thi, quản lý điểm số.",
                  "Học sinh: Làm bài, xem lại đáp án và kết quả.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 hover:-translate-y-1 transition-transform shadow-lg shadow-slate-200/50 dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Admin Tối Cao</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Tài khoản admin có quyền bao quát toàn bộ hoạt động của trường học: duyệt/xóa giáo viên, kiểm soát ngân hàng đề thi chung, và xem báo cáo tổng thể.
              </p>
            </div>
            
            <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 hover:-translate-y-1 transition-transform shadow-lg shadow-slate-200/50 dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Không Gian Lớp Học</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Mỗi lớp học là một khu vực riêng biệt. Học sinh chỉ được thấy đề thi và tài liệu thuộc về lớp mà mình được mời tham gia, đảm bảo bảo mật đề thi.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0A1F3E]/20 border border-slate-200 dark:border-cyan-950/40 rounded-2xl p-8 hover:-translate-y-1 transition-transform shadow-lg shadow-slate-200/50 dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-6">
                <Key className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">SSO & Xác Thực An Toàn</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Bảo vệ tài khoản bằng hệ thống phân quyền JWT hiện đại. Phân tách hoàn toàn dữ liệu giữa các vai trò để tránh rò rỉ thông tin nhạy cảm.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
