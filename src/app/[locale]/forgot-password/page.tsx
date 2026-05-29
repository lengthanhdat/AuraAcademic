"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("http://localhost:8088/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMessage(
          data.message || "Yêu cầu đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư email của bạn."
        );
      } else {
        setError(data.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#020C1B] transition-colors duration-300 overflow-hidden">
      {/* Premium Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center bg-transparent pointer-events-none">
        <div className="pointer-events-auto">
          {/* Logo visible on mobile/tablet but hidden on desktop since it is in the left panel */}
          <Link href="/" className="lg:hidden hover:opacity-90 transition-all hover:scale-[1.02]">
            <img src="/logoweb.png" alt="Aura Academic Logo" className="h-8 object-contain dark:hidden" />
            <img src="/logoweb-dark.png" alt="Aura Academic Logo" className="h-8 object-contain hidden dark:block" />
          </Link>
        </div>
        <div className="flex gap-4 pointer-events-auto">
          <Link href="/login" className="p-2.5 rounded-xl bg-white/80 dark:bg-cyan-950/60 backdrop-blur-md border border-slate-200/60 dark:border-cyan-900/40 text-[#0C2E5E] dark:text-[#00C6FF] hover:bg-slate-50 dark:hover:bg-cyan-900/60 hover:shadow-md active:scale-95 transition-all flex items-center gap-2 px-5 text-sm font-extrabold shadow-sm">
            <span className="material-symbols-outlined text-sm font-black">arrow_back</span> Quay lại đăng nhập
          </Link>
        </div>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row h-full">
        {/* Left Panel: Branding & High-End Visuals */}
        <section className="hidden lg:flex lg:w-[45%] h-full bg-gradient-to-br from-[#0C2E5E] via-[#0E3E7A] to-[#051630] relative items-center justify-center p-16 overflow-hidden">
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]"></div>

          {/* Radiant Glow inside */}
          <div className="absolute right-0 top-1/4 w-72 h-72 bg-[#00C6FF]/15 rounded-full blur-[80px]" />

          <div className="absolute top-12 left-12 z-20">
            <Link href="/" className="hover:opacity-90 transition-all hover:scale-[1.02]">
              <img src="/logoweb-dark.png" alt="Aura Academic Logo" className="h-11 object-contain brightness-125" />
            </Link>
          </div>

          <div className="relative z-10 max-w-md space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-lg">
                <span className="material-symbols-outlined text-[#00C6FF]" style={{ fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
                <span className="text-blue-100 text-xs font-bold tracking-widest uppercase">Bảo mật tài khoản</span>
              </div>
              <h1 className="text-5xl font-extrabold text-white leading-[1.15] tracking-tight">
                Lấy lại mật khẩu dễ dàng & an toàn
              </h1>
              <p className="text-blue-100/80 text-lg leading-relaxed font-medium">
                Nhập email của bạn để chúng tôi gửi link xác thực đặt lại mật khẩu của bạn thông qua luồng mã hóa bảo mật cao của Aura Academic.
              </p>
            </div>
          </div>

          <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] opacity-10 rotate-12 pointer-events-none">
            <img className="w-full h-full object-contain" alt="Abstract digital network visualization" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1wQU1_5JaGL5yUrnjfLOk2yd0Ig6_YkehO-ZtSe6PYTMDWiAs48UXK6w0Z90EMnGHmVn4PqbXmiqEAuyaSjtKgGSY123DNY7NLj361uXNLbKnZ7BiO7AxOEcrvSEpHsJZZ1YYhE4USYJHst3itrbox9z9c6RUsXvWHvXxktZLTZSoAr50vNcB_mwbKugxdHXZ5TWEGNw8djuJZyoFu4j1RhO-uT8tL3zCpro9MqB0KvH7M1VxjVTORsOroiBZbGw3ZU7_Th-us90" />
          </div>
        </section>

        {/* Right Panel: Forgot Password Form inside Floating Glass Card */}
        <section className="w-full lg:w-[55%] h-full flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-20 bg-[radial-gradient(circle_at_80%_20%,rgba(0,198,255,0.08),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(220,168,55,0.03),transparent_45%)] relative z-10">
          <div className="w-full max-w-[480px] bg-white/60 dark:bg-cyan-950/20 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200/60 dark:border-cyan-900/30 p-8 sm:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] space-y-8 animate-fadeIn">
            <div className="text-center sm:text-left space-y-3">
              <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Quên mật khẩu?</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-base">Nhập email đăng ký để nhận mã và link khôi phục mật khẩu.</p>
            </div>

            <div className="space-y-4">
              {message && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-sm font-medium flex items-start gap-3 shadow-inner-sm">
                  <span className="material-symbols-outlined mt-0.5 text-lg text-emerald-500">check_circle</span>
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-medium flex items-start gap-3 shadow-inner-sm">
                  <span className="material-symbols-outlined mt-0.5 text-lg text-red-500">error</span>
                  <span>{error}</span>
                </div>
              )}

              {!message && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Địa chỉ Email</label>
                    <div className="relative group">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#0C2E5E] dark:group-focus-within:text-[#00C6FF] transition-colors">mail</span>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white/70 dark:bg-cyan-950/30 border border-slate-200/80 dark:border-cyan-900/40 focus:ring-4 focus:ring-[#00C6FF]/10 focus:border-[#00C6FF] focus:bg-white dark:focus:bg-[#0A1F3E] transition-all outline-none font-bold text-[#0C2E5E] dark:text-[#E2E8F0] placeholder:text-slate-400 shadow-sm"
                        placeholder="example@domain.com"
                        type="email"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      disabled={loading}
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#0C2E5E] to-[#00C6FF] text-white font-extrabold text-lg py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,198,255,0.25)] hover:shadow-[0_15px_40px_rgba(0,198,255,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Đang gửi yêu cầu...</span>
                        </>
                      ) : (
                        "Gửi liên kết khôi phục"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="text-center pt-2 space-y-4">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Quay lại màn hình <Link className="text-[#00C6FF] font-extrabold hover:text-[#0C2E5E] transition-colors ml-1" href="/login">Đăng nhập</Link>
              </p>

              <div className="pt-4 border-t border-slate-200/40 dark:border-cyan-950/40">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                  © 2026 Aura Academic. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
