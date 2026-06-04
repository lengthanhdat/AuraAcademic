"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAlert } from "@/components/ui/AlertProvider";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "850775217149-9jm0o8ioj9nbe7v0sfbc7ph9jvda9rga.apps.googleusercontent.com";

export default function LoginPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const t = useTranslations('Login');
  const currentLocale = useLocale();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8088/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          twoFactorCode: twoFactorRequired ? twoFactorCode.trim() : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 428 || data.error === "2FA_REQUIRED") {
          setTwoFactorRequired(true);
          setError(data.message || "Mã OTP 2FA đã được gửi tới email. Vui lòng nhập mã để đăng nhập.");
        } else {
          const errMsg = data.message || data.error || "Email hoặc mật khẩu không đúng";
          setError(errMsg);
        }
      } else {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        if (data.user?.role === "admin") {
          router.push("/admin/dashboard");
        } else if (data.user?.role === "teacher") {
          router.push("/teacher/dashboard");
        } else {
          router.push("/student/dashboard");
        }
      }
    } catch (err) {
      setError(t('server_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_80%_20%,rgba(0,198,255,0.12),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(220,168,55,0.05),transparent_45%),linear-gradient(135deg,#f1f5f9_0%,#ffffff_100%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(0,198,255,0.15),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(220,168,55,0.1),transparent_45%),linear-gradient(135deg,#051630_0%,#020b18_100%)] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Abstract 3D Background Blobs matching brand theme */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00C6FF]/20 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#DCA837]/15 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/2 w-[30rem] h-[30rem] bg-[#0C2E5E]/15 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob animation-delay-4000"></div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotateX(20deg) rotateY(20deg); }
          50% { transform: translateY(-20px) rotateX(25deg) rotateY(15deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0) rotateX(-20deg) rotateY(-20deg); }
          50% { transform: translateY(20px) rotateX(-15deg) rotateY(-25deg); }
        }
        .animate-blob { animation: blob 10s infinite alternate; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-[1300px] bg-white/60 dark:bg-[#071829]/60 backdrop-blur-2xl rounded-[3rem] border border-white/80 dark:border-cyan-900/40 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] dark:shadow-black/50 flex flex-col lg:flex-row overflow-hidden relative z-10 min-h-[750px]">

        {/* Left Panel: 3D Visuals & Branding */}
        <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-[#0C2E5E] via-[#0E3E7A] to-[#051630] p-16 flex-col justify-between relative overflow-hidden">
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]"></div>

          {/* Radiant Glow inside */}
          <div className="absolute right-0 top-1/4 w-72 h-72 bg-[#00C6FF]/15 rounded-full blur-[80px]" />

          {/* 3D Floating Elements */}
          <div className="absolute inset-0 pointer-events-none" style={{ perspective: '1200px' }}>
            <div className="absolute top-[15%] left-[60%] w-32 h-32 bg-white/5 backdrop-blur-md rounded-3xl border border-[#00C6FF]/20 shadow-2xl" style={{ animation: 'float 6s ease-in-out infinite' }}></div>
            <div className="absolute bottom-[20%] right-[10%] w-48 h-48 bg-blue-500/10 backdrop-blur-xl rounded-full border border-[#DCA837]/20 shadow-2xl" style={{ animation: 'float-reverse 8s ease-in-out infinite' }}></div>
            <div className="absolute top-[40%] left-[10%] w-24 h-24 bg-[#00C6FF]/10 backdrop-blur-md rounded-full border border-white/5 shadow-xl" style={{ animation: 'float 7s ease-in-out infinite' }}></div>
          </div>

          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 text-white mb-12 hover:opacity-90 transition-all hover:scale-[1.02]">
              <img src="/logoweb-dark.png" alt="AuraAcademic" className="h-11 object-contain brightness-125" />
            </Link>
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 mb-8 shadow-lg">
              <span className="material-symbols-outlined text-[#00C6FF]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <span className="text-blue-100 text-xs font-bold tracking-widest uppercase">{t('hero_badge')}</span>
            </div>
            <h1 className="text-5xl font-extrabold text-white leading-[1.15] mb-6 tracking-tight">
              {t('hero_title')}
            </h1>
            <p className="text-blue-100/80 text-lg leading-relaxed max-w-md font-medium">
              {t('hero_subtitle')}
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-6 mt-12">
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 hover:bg-white/10 hover:border-[#00C6FF]/30 hover:-translate-y-1 transition-all duration-300 shadow-xl">
              <div className="w-12 h-12 bg-[#00C6FF]/20 rounded-2xl flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[#00C6FF] text-2xl">psychology</span>
              </div>
              <h3 className="text-white font-extrabold mb-2 text-lg">{t('feature_ai_title')}</h3>
              <p className="text-blue-100/70 text-sm leading-relaxed font-medium">{t('feature_ai_desc')}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 hover:bg-white/10 hover:border-[#DCA837]/30 hover:-translate-y-1 transition-all duration-300 shadow-xl">
              <div className="w-12 h-12 bg-[#DCA837]/20 rounded-2xl flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[#DCA837] text-2xl">shield</span>
              </div>
              <h3 className="text-white font-extrabold mb-2 text-lg">{t('feature_sec_title')}</h3>
              <p className="text-blue-100/70 text-sm leading-relaxed font-medium">{t('feature_sec_desc')}</p>
            </div>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="w-full lg:w-[55%] p-8 sm:p-12 md:p-16 lg:p-20 flex flex-col justify-center relative bg-white/40 dark:bg-[#020b18]/40">
          <div className="absolute top-8 right-8 z-20">
            <LanguageSwitcher />
          </div>

          <div className="max-w-md w-full mx-auto">
            <div className="text-center sm:text-left mb-10">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">{t('welcome')}</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">{t('subtitle')}</p>
            </div>

            <div className="w-full mb-8 flex justify-center items-center hover:scale-[1.01] transition-transform duration-200">
              <GoogleOAuthProvider clientId={googleClientId} locale={currentLocale}>
                <GoogleLogin
                  onSuccess={async (creds) => {
                    try {
                      const r = await fetch("http://localhost:8088/api/auth/google", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ idToken: creds.credential })
                      });
                      if (r.ok) {
                        const data = await r.json();
                        localStorage.setItem("user", JSON.stringify(data.user));
                        localStorage.setItem("accessToken", data.accessToken);
                        localStorage.setItem("refreshToken", data.refreshToken);
                        showAlert({
                          title: t("google_success_title"),
                          message: t("google_success_msg"),
                          type: "success",
                          onConfirm: () => {
                            if (data.user?.role === "admin") router.push("/admin/dashboard");
                            else if (data.user?.role === "teacher") router.push("/teacher/dashboard");
                            else router.push("/student/dashboard");
                          }
                        });
                      } else showAlert({ title: t("google_fail_title"), message: t("google_fail_msg"), type: "error" });
                    } catch (e) { }
                  }}
                  onError={() => showAlert({ title: t("google_error_title"), message: t("google_error_msg"), type: "error" })}
                  text="signin_with"
                  width="380"
                  shape="pill"
                  size="large"
                  theme="outline"
                />
              </GoogleOAuthProvider>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex-grow h-[1px] bg-slate-200 dark:bg-cyan-900/40"></div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">{t('or')}</span>
              <div className="flex-grow h-[1px] bg-slate-200 dark:bg-cyan-900/40"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-semibold shadow-sm flex items-center gap-3"><span className="material-symbols-outlined text-red-500">error</span>{error}</div>}

              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{t('email_label')}</label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 dark:text-slate-500 group-focus-within:text-[#0C2E5E] dark:group-focus-within:text-[#00C6FF] transition-colors">person</span>
                  <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white/70 dark:bg-cyan-950/30 border border-slate-200/80 dark:border-cyan-900/50 focus:ring-4 focus:ring-[#00C6FF]/10 focus:border-[#00C6FF] focus:bg-white dark:focus:bg-[#071829] transition-all outline-none font-bold text-[#0C2E5E] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm" placeholder="example@domain.com" type="email" required />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('password_label')}</label>
                  <Link className="text-sm font-bold text-[#00C6FF] hover:text-[#0C2E5E] dark:hover:text-blue-300 transition-colors" href="/forgot-password">{t('forgot_password')}</Link>
                </div>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 dark:text-slate-500 group-focus-within:text-[#0C2E5E] dark:group-focus-within:text-[#00C6FF] transition-colors">lock</span>
                  <input value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full pl-14 pr-14 py-4 rounded-2xl bg-white/70 dark:bg-cyan-950/30 border border-slate-200/80 dark:border-cyan-900/50 focus:ring-4 focus:ring-[#00C6FF]/10 focus:border-[#00C6FF] focus:bg-white dark:focus:bg-[#071829] transition-all outline-none font-bold text-[#0C2E5E] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm" placeholder="••••••••" type={showPassword ? "text" : "password"} required />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#0C2E5E] dark:text-slate-500 dark:hover:bg-cyan-950/60 dark:hover:text-[#00C6FF]"
                  >
                    <span className="material-symbols-outlined text-[21px]">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>

              {twoFactorRequired && (
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Mã OTP 2FA</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 dark:text-slate-500 group-focus-within:text-[#0C2E5E] dark:group-focus-within:text-[#00C6FF] transition-colors">pin</span>
                    <input
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white/70 dark:bg-cyan-950/30 border border-slate-200/80 dark:border-cyan-900/50 focus:ring-4 focus:ring-[#00C6FF]/10 focus:border-[#00C6FF] focus:bg-white dark:focus:bg-[#071829] transition-all outline-none font-black tracking-[0.25em] text-center text-[#0C2E5E] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                      placeholder="------"
                      inputMode="numeric"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-[#0C2E5E] to-[#00C6FF] text-white font-extrabold text-lg py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,198,255,0.25)] hover:shadow-[0_15px_40px_rgba(0,198,255,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t('btn_loading')}</span>
                    </div>
                  ) : t('btn_submit')}
                </button>
              </div>
            </form>

            <div className="mt-10 text-center">
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {t('no_account')} <Link className="text-[#00C6FF] font-extrabold hover:text-[#0C2E5E] dark:hover:text-blue-300 transition-colors ml-1" href="/register">{t('register')}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
