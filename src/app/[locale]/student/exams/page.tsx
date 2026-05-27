"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function StudentExams() {
  const router = useRouter();
  const t = useTranslations('StudentExams');
  const [user, setUser] = useState<any>(null);
  const [accessCode, setAccessCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const locale = useLocale();
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      fetchRecentResults(u.id);
    }
  }, []);

  const fetchRecentResults = async (studentId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:8088/api/exams/results/student/${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentExams(Array.isArray(data) ? data.slice(0, 3) : []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!accessCode.trim()) return;
    setIsJoining(true);
    setError("");
    const code = accessCode.trim().toUpperCase();
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:8088/api/exams/lobby/${code}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        window.location.href = `/${locale}/student/lobby?code=${code}`;
      } else if (res.status === 401) {
        setError(t('session_expired'));
      } else {
        const msg = await res.text();
        setError(msg || t('invalid_code'));
      }
    } catch {
      setError(t('server_error'));
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-extrabold text-on-surface dark:text-slate-200 tracking-tight mb-1">{t('title')}</h1>
        <p className="text-on-surface-variant dark:text-slate-400">{t('subtitle')}</p>
      </section>

      {/* Join Card */}
      <section className="bg-surface-container-low dark:bg-cyan-950/30 dark:text-slate-300est rounded-2xl p-10 shadow-sm relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto text-center space-y-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white text-4xl">quiz</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-on-surface dark:text-slate-200 mb-2">{t('join_title')}</h2>
            <p className="text-on-surface-variant dark:text-slate-400 text-sm">{t('join_subtitle')}</p>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 text-xl">key</span>
              <input
                value={accessCode}
                onChange={e => { setAccessCode(e.target.value.toUpperCase()); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                className="w-full pl-12 pr-6 py-4 bg-surface-container-high dark:bg-cyan-950/50 dark:text-slate-200est text-on-surface dark:text-slate-200 font-bold text-center tracking-[0.3em] text-xl rounded-xl border-2 border-transparent focus:border-primary/40 focus:ring-0 placeholder:text-outline-variant/50 placeholder:font-normal placeholder:text-sm placeholder:tracking-normal transition-all outline-none"
                placeholder={t('placeholder')}
                type="text"
                maxLength={20}
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={isJoining || !accessCode.trim()}
              className="w-full bg-gradient-to-br from-primary to-primary-container text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-98 shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined ${isJoining ? "animate-spin" : ""}`}>
                {isJoining ? "sync" : "login"}
              </span>
              {isJoining ? t('btn_joining') : t('btn_join')}
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 pt-2">
            {[
              { icon: "verified_user", label: t("badge_safe") },
              { icon: "videocam", label: t("badge_ai") },
              { icon: "lock", label: t("badge_enc") },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-on-surface-variant dark:text-slate-400">
                <span className="material-symbols-outlined text-sm text-primary">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            step: "1",
            icon: "key",
            title: t('steps.0.title'),
            desc: t('steps.0.desc'),
            color: "from-blue-500 to-indigo-600",
          },
          {
            step: "2",
            icon: "videocam",
            title: t('steps.1.title'),
            desc: t('steps.1.desc'),
            color: "from-violet-500 to-purple-600",
          },
          {
            step: "3",
            icon: "assignment_turned_in",
            title: t('steps.2.title'),
            desc: t('steps.2.desc'),
            color: "from-emerald-500 to-teal-600",
          },
        ].map(({ step, icon, title, desc, color }) => (
          <div key={step} className="bg-surface-container-low dark:bg-cyan-950/30 dark:text-slate-300est rounded-2xl p-6 shadow-sm flex gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <span className="material-symbols-outlined text-white text-lg">{icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-on-surface-variant dark:text-slate-400 uppercase tracking-widest mb-1">{t('step_label')} {step}</p>
              <h3 className="font-bold text-on-surface dark:text-slate-200 mb-1">{title}</h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Recent exams */}
      {recentExams.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-on-surface dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            Bài thi gần đây
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentExams.map((r, i) => (
              <div key={i} className="bg-surface-container-low dark:bg-cyan-950/30 dark:text-slate-300est rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary">assignment</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-on-surface dark:text-slate-200 text-sm truncate">{r.examTitle || `${t('room_prefix')} ${r.examId}`}</p>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400">{new Date(r.submittedAt).toLocaleDateString("vi-VN")}</p>
                </div>
                <div className="ml-auto text-right flex-shrink-0">
                  <span className="text-lg font-black text-primary">{r.score}</span>
                  <span className="text-xs text-on-surface-variant dark:text-slate-400">/10</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
