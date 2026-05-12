"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAlert } from "@/components/ui/AlertProvider";

export default function Register() {
  const router = useRouter();
  const t = useTranslations("Register");
  const currentLocale = useLocale();
  const { showAlert } = useAlert();
  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    classSelection: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8088/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: role
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.fieldErrors) {
          setError(Object.values(data.fieldErrors).join(", "));
        } else {
          setError(data.message || data.error || t("register_error"));
        }
      } else {
        // Đăng ký thành công, yêu cầu xác thực email
        showAlert({
          title: t("success_title"),
          message: t("success_msg"),
          type: "success",
          confirmText: t("verify_now")
        });
        router.push(`/verify-email?email=${formData.email}`);
      }
    } catch (err) {
      setError(t("server_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center w-full px-6 py-4 mx-auto bg-[#f7f9fb] dark:bg-slate-950">
        <div className="text-xl font-extrabold text-[#00355f] dark:text-blue-200 font-headline tracking-tight">
          Digital Proctor
        </div>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-[#42474f] hover:bg-slate-200/50 p-2 rounded-full transition-colors">help_outline</button>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="min-h-screen flex flex-col md:flex-row pt-16">
        {/* Left Side */}
        <section className="hidden md:flex md:w-1/2 lg:w-3/5 bg-surface-container-low items-center justify-center p-12 relative overflow-hidden">
          <div className="relative z-10 w-full max-w-2xl space-y-8">
            <div className="space-y-4">
              <h1 className="font-headline text-5xl font-extrabold text-primary tracking-tight leading-tight whitespace-pre-line">
                {t('hero_title')}
              </h1>
              <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">
                {t('hero_desc')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                <h3 className="font-headline font-bold text-on-surface">{t('ai_security')}</h3>
                <p className="text-sm text-on-surface-variant mt-2">{t('ai_desc')}</p>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 translate-y-8">
                <span className="material-symbols-outlined text-primary text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                <h3 className="font-headline font-bold text-on-surface">{t('deep_analytics')}</h3>
                <p className="text-sm text-on-surface-variant mt-2">{t('analytics_desc')}</p>
              </div>
            </div>
          </div>
          
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[5%] left-[-5%] w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl"></div>
          
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <img alt="Modern learning environment" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJ_0BAMtXGeZad89ZUTCztzl8_TWS3QXwS7vHGsA-Hf7nh6HJ5zcU7Tfg6ACBbO2qhaD6DCaj7PCeM_bcQx-pwvvJ5RUjvQGs3lGEjcyPRig288PhtDfO7QYujFESMmA90OcFLdM9ckZRTHU2lUsOIC99PLFCq92jkbTRPYVIIFuozeRoaet0VTrXR1WY1EEpuUlixZ0upCciakPCxb1YLVg9JteDBgNMWrxUi8wPkOh2PRMHK3HewzEnxnpc2gzdjZuivP72Xa78"/>
          </div>
        </section>

        {/* Right Side: Registration Form */}
        <section className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-6 md:p-12 lg:p-16 bg-surface">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-2">
              <h2 className="font-headline text-3xl font-extrabold text-on-surface">{t('title')}</h2>
              <p className="text-on-surface-variant text-sm">{t('subtitle')}</p>
            </div>

            {/* Role Switcher */}
            <div className="flex p-1 bg-surface-container-high rounded-xl">
              <button 
                onClick={() => setRole("student")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${role === 'student' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {t('student')}
              </button>
              <button 
                 onClick={() => setRole("teacher")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${role === 'teacher' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {t('teacher')}
              </button>
            </div>

            <div className="w-full flex justify-center py-2">
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
                            if (data.user?.role === "admin") {
                              router.push("/admin/dashboard");
                            } else if (data.user?.role === "teacher") {
                              router.push("/teacher/dashboard");
                            } else {
                              router.push("/student/dashboard");
                            }
                          }
                        }); 
                      }
                      else showAlert({
                        title: t("google_fail_title"),
                        message: t("google_fail_msg"),
                        type: "error"
                      });
                    } catch(e) {}
                  }}
                  onError={() => showAlert({
                    title: t("google_error_title"),
                    message: t("google_error_msg"),
                    type: "error"
                  })}
                  text="signup_with"
                  width="100%"
                />
              </GoogleOAuthProvider>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-outline-variant/20"></div>
              <span className="flex-shrink mx-4 text-xs font-bold text-on-surface-variant tracking-widest">{t('or')}</span>
              <div className="flex-grow border-t border-outline-variant/20"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">{error}</div>}
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1" htmlFor="full_name">{t('fullname')}</label>
                <input 
                  id="full_name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-surface-container-highest/50 border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40 transition-all outline-none" 
                  placeholder={t('placeholder_name')} 
                  type="text"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1" htmlFor="email">{t('email')}</label>
                <input 
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-surface-container-highest/50 border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40 transition-all outline-none" 
                  placeholder="example@domain.com" 
                  type="email"
                  required
                />
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1" htmlFor="password">{t('password')}</label>
                <input 
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-surface-container-highest/50 border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40 transition-all outline-none" 
                  placeholder="••••••••" 
                  type="password"
                  required
                />
              </div>

              <div className="pt-2">
                <button disabled={loading} className="w-full bg-gradient-to-br from-[#00355f] to-[#0f4c81] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:saturate-150 transition-all duration-200 active:scale-[0.98] disabled:opacity-50" type="submit">
                  {loading ? t('processing') : t('submit')}
                </button>
              </div>
            </form>

            <p className="text-center text-sm text-on-surface-variant">
              {t('have_account')} <Link className="text-primary font-bold hover:underline" href="/login">{t('login_now')}</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
