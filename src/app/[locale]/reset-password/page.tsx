"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const criteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    match: password.length > 0 && password === confirmPassword,
  };

  const isValid = Object.values(criteria).every(Boolean);

  useEffect(() => {
    if (!token) {
      setError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || !token) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Không thể đặt lại mật khẩu.");
      }

      setMessage("Mật khẩu đã được đặt lại thành công. Đang chuyển về trang đăng nhập...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#061326] flex flex-col">
      <main className="flex-1 flex min-h-screen">
        <section className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#0C2E5E] via-[#0E3E7A] to-[#051630] relative items-center justify-center p-16 overflow-hidden">
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]"></div>

          {/* Radiant Glow inside */}
          <div className="absolute right-0 top-1/4 w-72 h-72 bg-[#00C6FF]/15 rounded-full blur-[80px]" />

          <div className="absolute top-12 left-12 z-20">
            <Link href="/" className="hover:opacity-90 transition-all hover:scale-[1.02]">
              <Image src="/logoweb-dark.png" alt="Aura Academic Logo" width={200} height={44} className="h-11 w-auto object-contain brightness-125" priority />
            </Link>
          </div>

          <div className="relative z-10 max-w-md space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-lg">
                <span className="material-symbols-outlined text-[#00C6FF]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                <span className="text-blue-100 text-xs font-bold tracking-widest uppercase">Chuẩn OWASP</span>
              </div>
              <h1 className="text-5xl font-extrabold text-white leading-[1.15] tracking-tight">
                Thiết lập mật khẩu an toàn tối đa
              </h1>
              <p className="text-blue-100/80 text-lg leading-relaxed font-medium">
                Aura Academic yêu cầu mật khẩu có độ phức tạp cao để bảo vệ tài khoản của bạn khỏi các cuộc tấn công brute force.
              </p>
            </div>
          </div>

          <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] opacity-10 rotate-12 pointer-events-none">
            <Image className="w-full h-full object-contain" alt="Abstract digital network visualization" width={800} height={800} unoptimized src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1wQU1_5JaGL5yUrnjfLOk2yd0Ig6_YkehO-ZtSe6PYTMDWiAs48UXK6w0Z90EMnGHmVn4PqbXmiqEAuyaSjtKgGSY123DNY7NLj361uXNLbKnZ7BiO7AxOEcrvSEpHsJZZ1YYhE4USYJHst3itrbox9z9c6RUsXvWHvXxktZLTZSoAr50vNcB_mwbKugxdHXZ5TWEGNw8djuJZyoFu4j1RhO-uT8tL3zCpro9MqB0KvH7M1VxjVTORsOroiBZbGw3ZU7_Th-us90" />
          </div>
        </section>

        {/* Right Panel: Reset Password Form inside Floating Glass Card */}
        <section className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-20 bg-[radial-gradient(circle_at_80%_20%,rgba(0,198,255,0.08),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(220,168,55,0.03),transparent_45%)] relative z-10">
          <div className="w-full max-w-[480px] bg-white/60 dark:bg-cyan-950/20 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200/60 dark:border-cyan-900/30 p-8 sm:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] space-y-8">
            <div className="text-center sm:text-left space-y-3">
              <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Đặt lại mật khẩu</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-base">Vui lòng thiết lập mật khẩu mới có tính bảo mật cao.</p>
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
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Mật khẩu mới</label>
                    <div className="relative group">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#0C2E5E] dark:group-focus-within:text-[#00C6FF] transition-colors">lock</span>
                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-14 pr-14 py-4 rounded-2xl bg-white/70 dark:bg-cyan-950/30 border border-slate-200/80 dark:border-cyan-900/40 focus:ring-4 focus:ring-[#00C6FF]/10 focus:border-[#00C6FF] focus:bg-white dark:focus:bg-[#0A1F3E] transition-all outline-none font-bold text-[#0C2E5E] dark:text-[#E2E8F0] placeholder:text-slate-400 shadow-sm"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={showPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                        title={showPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                        className="absolute right-4 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#0C2E5E] dark:text-slate-500 dark:hover:bg-cyan-950/60 dark:hover:text-[#00C6FF]"
                      >
                        <span className="material-symbols-outlined text-[21px]">{showPassword ? "visibility_off" : "visibility"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Xác nhận mật khẩu</label>
                    <div className="relative group">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-[#0C2E5E] dark:group-focus-within:text-[#00C6FF] transition-colors">lock_reset</span>
                      <input
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-14 pr-14 py-4 rounded-2xl bg-white/70 dark:bg-cyan-950/30 border border-slate-200/80 dark:border-cyan-900/40 focus:ring-4 focus:ring-[#00C6FF]/10 focus:border-[#00C6FF] focus:bg-white dark:focus:bg-[#0A1F3E] transition-all outline-none font-bold text-[#0C2E5E] dark:text-[#E2E8F0] placeholder:text-slate-400 shadow-sm"
                        placeholder="••••••••"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
                        title={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
                        className="absolute right-4 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#0C2E5E] dark:text-slate-500 dark:hover:bg-cyan-950/60 dark:hover:text-[#00C6FF]"
                      >
                        <span className="material-symbols-outlined text-[21px]">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Checklist */}
                  <div className="bg-slate-100/50 dark:bg-cyan-950/20 p-5 rounded-2xl border border-slate-200/50 dark:border-cyan-900/30 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-2">Yêu cầu bảo mật:</h4>
                    <ul className="text-xs space-y-2 font-medium">
                      <li className={`flex items-center gap-2 transition-all duration-300 ${criteria.length ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                        <span className="material-symbols-outlined text-sm font-bold">{criteria.length ? "check_circle" : "radio_button_unchecked"}</span>
                        <span>Tối thiểu 8 ký tự</span>
                      </li>
                      <li className={`flex items-center gap-2 transition-all duration-300 ${criteria.uppercase ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                        <span className="material-symbols-outlined text-sm font-bold">{criteria.uppercase ? "check_circle" : "radio_button_unchecked"}</span>
                        <span>Ít nhất 1 chữ hoa (A-Z)</span>
                      </li>
                      <li className={`flex items-center gap-2 transition-all duration-300 ${criteria.lowercase ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                        <span className="material-symbols-outlined text-sm font-bold">{criteria.lowercase ? "check_circle" : "radio_button_unchecked"}</span>
                        <span>Ít nhất 1 chữ thường (a-z)</span>
                      </li>
                      <li className={`flex items-center gap-2 transition-all duration-300 ${criteria.number ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                        <span className="material-symbols-outlined text-sm font-bold">{criteria.number ? "check_circle" : "radio_button_unchecked"}</span>
                        <span>Ít nhất 1 số (0-9)</span>
                      </li>
                      <li className={`flex items-center gap-2 transition-all duration-300 ${criteria.special ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                        <span className="material-symbols-outlined text-sm font-bold">{criteria.special ? "check_circle" : "radio_button_unchecked"}</span>
                        <span>Ít nhất 1 ký tự đặc biệt (@, !, $, %, ...)</span>
                      </li>
                      <li className={`flex items-center gap-2 transition-all duration-300 ${criteria.match ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                        <span className="material-symbols-outlined text-sm font-bold">{criteria.match ? "check_circle" : "radio_button_unchecked"}</span>
                        <span>Mật khẩu trùng khớp hoàn toàn</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <button
                      disabled={loading || !isValid || !token}
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#0C2E5E] to-[#00C6FF] text-white font-extrabold text-lg py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,198,255,0.25)] hover:shadow-[0_15px_40px_rgba(0,198,255,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Đang lưu mật khẩu...</span>
                        </>
                      ) : (
                        "Đặt lại mật khẩu"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="text-center pt-2">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Quay lại màn hình <Link className="text-[#00C6FF] font-extrabold hover:text-[#0C2E5E] transition-colors ml-1" href="/login">Đăng nhập</Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full bg-white/20 dark:bg-black/10 border-t border-slate-200/40 dark:border-cyan-950/40 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 dark:text-slate-500 font-body text-sm font-semibold">
            © 2026 Aura Academic. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
