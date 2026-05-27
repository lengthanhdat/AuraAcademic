"use client";
import { useState, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import useSWR from "swr";
import { authFetcher, getStoredUser } from "@/hooks/useAuthFetch";
import { TableRowSkeleton } from "@/components/ui/Skeleton";

const API_BASE = "http://localhost:8088/api";

export default function StudentDashboard() {
  const t = useTranslations('StudentDashboard');
  const locale = useLocale();
  const user = useMemo(() => getStoredUser(), []);

  const [accessCode, setAccessCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  // SWR: auto-cache exam results
  const { data: results = [], isLoading: loadingResults } = useSWR(
    user?.id ? `${API_BASE}/exams/results/student/${user.id}` : null,
    authFetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  const handleJoin = useCallback(async () => {
    if (!accessCode.trim()) return;
    
    if (results.some((r: any) => r.examId === accessCode.toUpperCase())) {
      setError(t('already_completed'));
      return;
    }

    setIsJoining(true);
    setError("");
    const cleanCode = accessCode.trim().toUpperCase();
    
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE}/exams/lobby/${cleanCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        window.location.href = `/${locale}/student/lobby?code=${cleanCode}`;
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
  }, [accessCode, results, locale, t]);

  return (
    <main className="p-8 space-y-12 max-w-7xl mx-auto w-full">
      {/* Welcome Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7">
          <h2 className="font-headline font-extrabold text-4xl text-on-surface dark:text-slate-200 tracking-tight mb-4">{t('greeting', {name: user?.fullName || t('default_name')})}</h2>
          <p className="text-on-surface-variant dark:text-slate-400 text-lg max-w-xl">
            {t('welcome_back')}
          </p>
        </div>
        <div className="lg:col-span-5 flex justify-end">
          <div className="bg-secondary-container rounded-xl p-4 flex items-center gap-4 border-none shadow-sm">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-secondary-container uppercase tracking-wide">{t('ai_tip_label')}</p>
              <p className="text-sm font-medium text-on-secondary-container">{t('ai_tip_text')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enter Exam Room Card */}
      <section className="flex justify-center py-2">
        <div className="w-full max-w-3xl bg-white dark:bg-[#0A1F3E] backdrop-blur-[20px] rounded-[2rem] border border-slate-200/50 p-10 shadow-[0_10px_40px_-15px_rgba(12,46,94,0.05)] relative overflow-hidden group hover:shadow-[0_20px_50px_-12px_rgba(0,198,255,0.12)] hover:border-[#00C6FF]/20 transition-all duration-500">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00C6FF]/5 rounded-full blur-3xl group-hover:bg-[#00C6FF]/10 transition-colors duration-500"></div>
          
          <div className="relative z-10 text-center space-y-8">
            <div className="space-y-2">
              <h3 className="font-headline font-bold text-2xl text-on-surface dark:text-slate-200">{t('enter_room_title')}</h3>
              <p className="text-on-surface-variant dark:text-slate-400">{t('enter_room_subtitle')}</p>
            </div>
            
            <div className="max-w-md mx-auto flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1 duration-200">
                  {error}
                </div>
              )}
              <div className="relative">
                <input 
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  className="w-full px-6 py-4 bg-surface-container-high dark:bg-cyan-950/50 text-on-surface dark:text-slate-200 font-headline font-bold text-center tracking-widest text-xl rounded-xl border-none focus:ring-2 focus:ring-primary/40 placeholder:text-outline-variant/60 placeholder:font-normal placeholder:text-base placeholder:tracking-normal transition-all duration-200 outline-none" 
                  placeholder={t('placeholder')} 
                  type="text"
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400">key</span>
              </div>
              <button 
                onClick={handleJoin}
                disabled={isJoining || !accessCode}
                className="bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] shadow-md hover:opacity-90 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">{isJoining ? "sync" : "login"}</span>
                {isJoining ? t('btn_joining') : t('btn_join')}
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-slate-400">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                {t('safe_env')}
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-slate-400">
                <span className="material-symbols-outlined text-sm">videocam</span>
                {t('open_monitor')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exam History Table Section */}
      <section className="space-y-6">
        <div className="flex items-end justify-between px-2">
          <div className="space-y-1">
            <h3 className="font-headline font-bold text-xl text-on-surface dark:text-slate-200">{t('history_title')}</h3>
            <p className="text-sm text-on-surface-variant dark:text-slate-400">{t('history_subtitle')}</p>
          </div>
          <button className="text-sm font-bold text-primary flex items-center gap-1 hover:underline transition-colors duration-200">
            {t('view_all')}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
        
        <div className="bg-surface-container-low dark:bg-cyan-950/30 rounded-xl shadow-sm border-none overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface-container-low dark:bg-cyan-950/30">
                <th className="px-8 py-5 text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest min-w-[250px]">{t('col_exam')}</th>
                <th className="px-8 py-5 text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">{t('col_time')}</th>
                <th className="px-8 py-5 text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest">{t('col_status')}</th>
                <th className="px-8 py-5 text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest text-right">{t('col_score')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container dark:divide-cyan-950/40">
              {loadingResults ? (
                <>
                  <TableRowSkeleton cols={4} />
                  <TableRowSkeleton cols={4} />
                  <TableRowSkeleton cols={4} />
                </>
              ) : results.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400">{t('no_results')}</td></tr>
              ) : (
                results.map((res: any) => (
                  <tr key={res.id} className="hover:bg-surface-container-low dark:hover:bg-cyan-950/20 transition-colors duration-200 group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined">assignment</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface dark:text-slate-200">{res.examTitle || `${t('room_prefix')} ${res.examId}`}</p>
                          <p className="text-xs text-on-surface-variant dark:text-slate-400">{t('version_code')} {res.versionCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-on-surface-variant dark:text-slate-400 whitespace-nowrap">
                      {new Date(res.submittedAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase whitespace-nowrap">{t('status_completed')}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-headline font-extrabold text-lg text-primary">{res.score}/10</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Dashboard Grid (Bento Style) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
        <div className="bg-surface-container-low dark:bg-cyan-950/30 p-6 rounded-xl space-y-4 hover:shadow-md transition-shadow duration-300">
          <span className="material-symbols-outlined text-primary text-3xl">workspace_premium</span>
          <h4 className="font-bold text-lg">{t('bento_top_title')}</h4>
          <p className="text-sm text-on-surface-variant dark:text-slate-400">{t('bento_top_desc')}</p>
        </div>
        <div className="bg-surface-container-low dark:bg-cyan-950/30 p-6 rounded-xl space-y-4 hover:shadow-md transition-shadow duration-300">
          <span className="material-symbols-outlined text-primary text-3xl">lightbulb</span>
          <h4 className="font-bold text-lg">{t('bento_study_title')}</h4>
          <p className="text-sm text-on-surface-variant dark:text-slate-400">{t('bento_study_desc')}</p>
        </div>
        <div className="bg-primary text-white p-6 rounded-xl space-y-4 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow duration-300">
          <span className="material-symbols-outlined text-primary-fixed text-3xl">trending_up</span>
          <h4 className="font-bold text-lg">{t('bento_growth_title')}</h4>
          <p className="text-sm text-primary-fixed/80">{t('bento_growth_desc')}</p>
        </div>
      </section>
    </main>
  );
}
