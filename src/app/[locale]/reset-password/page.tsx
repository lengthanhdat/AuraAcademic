"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Real-time password validation state
  const [criteria, setCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false,
  });

  useEffect(() => {
    setCriteria({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@$!%*#?&._^()\-+=]/.test(password),
      match: password.length > 0 && password === confirmPassword,
    });
  }, [password, confirmPassword]);

  const isValid = Object.values(criteria).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Token đặt lại mật khẩu không hợp lệ hoặc đã thiếu.");
      return;
    }
    if (!isValid) {
      setError("Vui lòng đáp ứng tất cả các tiêu chí mật khẩu bảo mật.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("http://localhost:8088/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMessage(data.message || "Đặt lại mật khẩu thành công. Bạn đang được chuyển hướng về trang đăng nhập...");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.message || "Có lỗi xảy ra hoặc token đã hết hạn. Vui lòng thử lại.");
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center bg-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <span className="text-xl font-extrabold text-primary tracking-tight">Digital Proctor</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row min-h-screen">
        {/* Left Panel: Branding */}
        <section className="hidden md:flex md:w-1/2 signature-gradient relative items-center justify-center p-12 overflow-hidden">
          <div className="absolute inset-0 opacity-20 ai-pulse scale-150"></div>
          <div className="relative z-10 max-w-lg space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                <span className="text-primary-fixed-dim text-sm font-semibold tracking-wider uppercase">Chuẩn OWASP</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                Thiết lập mật khẩu an toàn tối đa
              </h1>
              <p className="text-primary-fixed-dim text-xl font-medium leading-relaxed opacity-90">
                AuraAcademic yêu cầu mật khẩu có độ phức tạp cao để bảo vệ tài khoản của bạn khỏi các cuộc tấn công brute force.
              </p>
            </div>
          </div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] opacity-10 rotate-12 pointer-events-none">
            <img className="w-full h-full object-contain" alt="Abstract digital network visualization" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1wQU1_5JaGL5yUrnjfLOk2yd0Ig6_YkehO-ZtSe6PYTMDWiAs48UXK6w0Z90EMnGHmVn4PqbXmiqEAuyaSjtKgGSY123DNY7NLj361uXNLbKnZ7BiO7AxOEcrvSEpHsJZZ1YYhE4USYJHst3itrbox9z9c6RUsXvWHvXxktZLTZSoAr50vNcB_mwbKugxdHXZ5TWEGNw8djuJZyoFu4j1RhO-uT8tL3zCpro9MqB0KvH7M1VxjVTORsOroiBZbGw3ZU7_Th-us90" />
          </div>
        </section>

        {/* Right Panel: Reset Password Form */}
        <section className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-surface relative z-10">
          <div className="w-full max-w-[440px] space-y-8">
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Đặt lại mật khẩu</h2>
              <p className="text-on-surface-variant font-medium">Vui lòng thiết lập mật khẩu mới có tính bảo mật cao.</p>
            </div>

            <div className="space-y-4">
              {message && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium flex items-start gap-3 animate-pulse">
                  <span className="material-symbols-outlined mt-0.5 text-lg">check_circle</span>
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-lg">error</span>
                  <span>{error}</span>
                </div>
              )}

              {!message && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant ml-1">Mật khẩu mới</label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors">lock</span>
                      <input 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container-highest/30 border-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none" 
                        placeholder="••••••••" 
                        type="password" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant ml-1">Xác nhận mật khẩu</label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors">lock_reset</span>
                      <input 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container-highest/30 border-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none" 
                        placeholder="••••••••" 
                        type="password" 
                        required 
                      />
                    </div>
                  </div>

                  {/* Password Strength Checklist */}
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 space-y-2">
                    <h4 className="text-xs font-bold text-on-surface-variant tracking-wider uppercase mb-3">Yêu cầu bảo mật:</h4>
                    <ul className="text-xs space-y-1.5 font-medium">
                      <li className={`flex items-center gap-2 transition-all duration-300 ${criteria.length ? "text-emerald-400" : "text-on-surface-variant/50"}`}>
                        <span className="material-symbols-outlined text-sm">{criteria.length ? "check_circle" : "circle"}</span>
                        <span>Tối thiểu 8 ký tự</span>
                      </li>
                      <li className={`flex items-center gap-2 transition-all duration-300 ${criteria.uppercase ? "text-emerald-400" : "text-on-surface-variant/50"}`}>
                        <span className="material-symbols-outlined text-sm">{criteria.uppercase ? "check_circle" : "circle"}</span>
                        <span>Ít nhất 1 chữ hoa (A-Z)</span>
                      </li>
                      <li className={`flex items-center gap-2 transition-all duration-300 ${criteria.lowercase ? "text-emerald-400" : "text-on-surface-variant/50"}`}>
                        <span className="material-symbols-outlined text-sm">{criteria.lowercase ? "check_circle" : "circle"}</span>
                        <span>Ít nhất 1 chữ thường (a-z)</span>
                      </li>
                      <li className={`flex items-center gap-2 transition-all duration-300 ${criteria.number ? "text-emerald-400" : "text-on-surface-variant/50"}`}>
                        <span className="material-symbols-outlined text-sm">{criteria.number ? "check_circle" : "circle"}</span>
                        <span>Ít nhất 1 số (0-9)</span>
                      </li>
                      <li className={`flex items-center gap-2 transition-all duration-300 ${criteria.special ? "text-emerald-400" : "text-on-surface-variant/50"}`}>
                        <span className="material-symbols-outlined text-sm">{criteria.special ? "check_circle" : "circle"}</span>
                        <span>Ít nhất 1 ký tự đặc biệt (@, !, $, %, ...)</span>
                      </li>
                      <li className={`flex items-center gap-2 transition-all duration-300 ${criteria.match ? "text-emerald-400" : "text-on-surface-variant/50"}`}>
                        <span className="material-symbols-outlined text-sm">{criteria.match ? "check_circle" : "circle"}</span>
                        <span>Mật khẩu trùng khớp hoàn toàn</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <button 
                      disabled={loading || !isValid || !token} 
                      type="submit" 
                      className="w-full signature-gradient text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Đang lưu mật khẩu...
                        </>
                      ) : (
                        "Đặt lại mật khẩu"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="text-center">
              <p className="text-on-surface-variant text-sm font-medium">
                Quay lại màn hình <Link className="text-primary font-bold hover:underline" href="/login">Đăng nhập</Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full bg-surface-container-low/50 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-on-surface-variant font-body text-sm opacity-80">
            © 2024 Digital Proctor Academic Systems. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
