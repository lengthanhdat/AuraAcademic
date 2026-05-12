"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAlert } from "@/components/ui/AlertProvider";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const t = useTranslations('Login');
  const currentLocale = useLocale();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
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
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data.message || data.error || "Email hoặc mật khẩu không đúng"; if(errMsg.includes("chưa được xác thực")) { router.push(`/verify-email?email=${formData.email}`); } else { setError(errMsg); }
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,#f1f5f9,transparent_70%),linear-gradient(135deg,#e2e8f0_0%,#f8fafc_100%)] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Abstract 3D Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/2 w-[30rem] h-[30rem] bg-emerald-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob animation-delay-4000"></div>
      
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
      <div className="w-full max-w-[1300px] bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-white/80 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] flex flex-col lg:flex-row overflow-hidden relative z-10 min-h-[750px]">
        
        {/* Left Panel: 3D Visuals & Branding */}
        <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-[#00355f] to-[#0a192f] p-16 flex-col justify-between relative overflow-hidden">
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
          
          {/* 3D Floating Elements */}
          <div className="absolute inset-0 pointer-events-none" style={{ perspective: '1200px' }}>
            <div className="absolute top-[15%] left-[60%] w-32 h-32 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl" style={{ animation: 'float 6s ease-in-out infinite' }}></div>
            <div className="absolute bottom-[20%] right-[10%] w-48 h-48 bg-blue-500/20 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl" style={{ animation: 'float-reverse 8s ease-in-out infinite' }}></div>
            <div className="absolute top-[40%] left-[10%] w-24 h-24 bg-purple-500/20 backdrop-blur-md rounded-full border border-white/10 shadow-xl" style={{ animation: 'float 7s ease-in-out infinite' }}></div>
          </div>
          
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 text-white mb-12 hover:opacity-80 transition-opacity">
               <span className="text-2xl font-extrabold tracking-tight">AuraAcademic</span>
            </Link>
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 mb-8 shadow-lg">
              <span className="material-symbols-outlined text-blue-300" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
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
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 hover:bg-white/20 hover:-translate-y-1 transition-all duration-300 shadow-xl">
              <div className="w-12 h-12 bg-blue-500/30 rounded-2xl flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-blue-200 text-2xl">psychology</span>
              </div>
              <h3 className="text-white font-bold mb-2 text-lg">{t('feature_ai_title')}</h3>
              <p className="text-blue-100/70 text-sm leading-relaxed">{t('feature_ai_desc')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 hover:bg-white/20 hover:-translate-y-1 transition-all duration-300 shadow-xl">
              <div className="w-12 h-12 bg-purple-500/30 rounded-2xl flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-purple-200 text-2xl">shield</span>
              </div>
              <h3 className="text-white font-bold mb-2 text-lg">{t('feature_sec_title')}</h3>
              <p className="text-blue-100/70 text-sm leading-relaxed">{t('feature_sec_desc')}</p>
            </div>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="w-full lg:w-[55%] p-8 sm:p-12 md:p-16 lg:p-20 flex flex-col justify-center relative bg-white/40">
          <div className="absolute top-8 right-8 z-20">
             <LanguageSwitcher />
          </div>
          
          <div className="max-w-md w-full mx-auto">
            <div className="text-center sm:text-left mb-10">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">{t('welcome')}</h2>
              <p className="text-slate-500 font-medium text-lg">{t('subtitle')}</p>
            </div>

            <div className="w-full mb-8 rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 bg-white hover:shadow-md transition-shadow">
              <GoogleOAuthProvider clientId="800081855688-vvu143d2r2hgoo24h6adsm6j7vaj95mn.apps.googleusercontent.com" locale={currentLocale}>
                <GoogleLogin 
                  onSuccess={async (creds) => {
                    try {
                      const r = await fetch("http://localhost:8088/api/auth/google", {
                        method: "POST", headers: {"Content-Type":"application/json"},
                        body: JSON.stringify({idToken: creds.credential})
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
                    } catch(e) {}
                  }}
                  onError={() => showAlert({ title: t("google_error_title"), message: t("google_error_msg"), type: "error" })}
                  text="signin_with"
                  width="100%"
                  shape="rectangular"
                  size="large"
                />
              </GoogleOAuthProvider>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex-grow h-[1px] bg-slate-200"></div>
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">{t('or')}</span>
              <div className="flex-grow h-[1px] bg-slate-200"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-semibold shadow-sm flex items-center gap-3"><span className="material-symbols-outlined text-red-500">error</span>{error}</div>}
            
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700 ml-1">{t('email_label')}</label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-blue-600 transition-colors">person</span>
                  <input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white/70 border border-slate-200/80 focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400 shadow-sm" placeholder="example@domain.com" type="email" required />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-bold text-slate-700">{t('password_label')}</label>
                  <Link className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors" href="/forgot-password">{t('forgot_password')}</Link>
                </div>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-blue-600 transition-colors">lock</span>
                  <input value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white/70 border border-slate-200/80 focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400 shadow-sm" placeholder="••••••••" type="password" required />
                </div>
              </div>

              <div className="pt-4">
                <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white font-bold text-lg py-4 rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0">
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
              <p className="text-slate-500 font-medium">
                {t('no_account')} <Link className="text-blue-600 font-bold hover:text-blue-800 transition-colors ml-1" href="/register">{t('register')}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
