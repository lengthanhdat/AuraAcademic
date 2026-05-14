"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Result = {
  id: string;
  examId: string;
  examTitle: string;
  versionCode: string;
  score: number;
  submittedAt: number;
  totalQuestions?: number;
  correctAnswers?: number;
};

export default function StudentResults() {
  const t = useTranslations('StudentResults');
  const [user, setUser] = useState<any>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [filter, setFilter] = useState<"all" | "pass" | "fail">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      fetchResults(u.id);
    }
  }, []);

  const fetchResults = async (studentId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:8088/api/exams/results/student/${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const getRank = (score: number) => {
    if (score >= 9.0) return { label: t("rank_excellent"), cls: "bg-amber-100 text-amber-800" };
    if (score >= 8.0) return { label: t("rank_good"), cls: "bg-blue-100 text-blue-800" };
    if (score >= 6.5) return { label: t("rank_fair"), cls: "bg-green-100 text-green-800" };
    if (score >= 5.0) return { label: t("rank_average"), cls: "bg-slate-100 text-slate-700" };
    return { label: t("rank_fail"), cls: "bg-red-100 text-red-700" };
  };

  const filtered = results
    .filter(r => {
      const matchSearch = r.examTitle?.toLowerCase().includes(search.toLowerCase()) || r.versionCode?.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || (filter === "pass" && r.score >= 5) || (filter === "fail" && r.score < 5);
      return matchSearch && matchFilter;
    })
    .sort((a, b) => sortBy === "date" ? (b.submittedAt - a.submittedAt) : (b.score - a.score));

  const totalExams = results.length;
  const avgScore = totalExams > 0 ? (results.reduce((s, r) => s + r.score, 0) / totalExams) : 0;
  const passRate = totalExams > 0 ? Math.round((results.filter(r => r.score >= 5).length / totalExams) * 100) : 0;
  const bestScore = totalExams > 0 ? Math.max(...results.map(r => r.score)) : 0;

  return (
    <main className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-extrabold text-on-surface dark:text-slate-200 tracking-tight mb-1">{t('title')}</h1>
        <p className="text-on-surface-variant dark:text-slate-400">{t('subtitle')}</p>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t("stat_total"), value: totalExams.toString(), icon: "assignment", color: "text-blue-500", bg: "bg-blue-50" },
          { label: t("stat_avg"), value: avgScore.toFixed(2), icon: "grade", color: "text-primary", bg: "bg-primary/5" },
          { label: t("stat_pass"), value: `${passRate}%`, icon: "check_circle", color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: t("stat_best"), value: bestScore.toFixed(1), icon: "workspace_premium", color: "text-amber-500", bg: "bg-amber-50" },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-[#0A1F3E]/90 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <span className={`material-symbols-outlined ${color}`}>{icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">{label}</p>
              <p className="text-xl font-black text-on-surface dark:text-[#00C6FF]">{loading ? "..." : value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Filters & Search */}
      <section className="bg-white dark:bg-[#0A1F3E]/90 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 text-lg">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] text-sm focus:outline-none focus:border-primary transition-colors"
            placeholder={t('search_placeholder')}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "pass", "fail"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                filter === f
                  ? "bg-[#0C2E5E] dark:bg-[#00C6FF] text-white dark:text-[#051329] border-[#0C2E5E] dark:border-[#00C6FF] shadow-sm"
                  : "bg-slate-100 dark:bg-[#0A1F3E] text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-cyan-950/50 hover:bg-slate-200 dark:hover:bg-cyan-950/50"
              }`}
            >
              {f === "all" ? t("filter_all") : f === "pass" ? t("filter_pass") : t("filter_fail")}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as "date" | "score")}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] text-xs font-bold focus:outline-none focus:border-primary transition-colors"
          >
            <option value="date">{t('sort_date')}</option>
            <option value="score">{t('sort_score')}</option>
          </select>
        </div>
      </section>

      {/* Results Table */}
      <section className="bg-white dark:bg-[#0A1F3E]/90 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-cyan-950/50 flex items-center justify-between">
          <h2 className="font-bold text-on-surface dark:text-slate-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">format_list_bulleted</span>
            Danh sách kết quả
          </h2>
          <span className="text-xs text-on-surface-variant dark:text-slate-400 font-medium">{filtered.length} {t('results_count')}</span>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-on-surface-variant dark:text-slate-400 text-sm">{t('loading')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant dark:text-slate-400/30 block mb-4">assignment_turned_in</span>
            <p className="text-on-surface-variant dark:text-slate-400 font-medium">{t('empty_title')}</p>
            <p className="text-on-surface-variant dark:text-slate-400/60 text-sm mt-1">{t('empty_hint')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-cyan-950/40">
            {filtered.map(r => {
              const rank = getRank(r.score);
              const isExpanded = expandedId === r.id;
              return (
                <div key={r.id} className="hover:bg-slate-50 dark:hover:bg-cyan-950/20 transition-colors">
                  <button
                    className="w-full px-6 py-5 flex items-center gap-4 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg">assignment</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-on-surface dark:text-slate-200 truncate">{r.examTitle || `${t('room_prefix')} ${r.examId}`}</p>
                      <p className="text-xs text-on-surface-variant dark:text-slate-400">
                        {t('version_prefix')} {r.versionCode} &nbsp;·&nbsp; {new Date(r.submittedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase hidden sm:block ${rank.cls}`}>{rank.label}</span>
                    <div className="text-right flex-shrink-0">
                      <span className="text-2xl font-black text-[#0C2E5E] dark:text-[#00C6FF]">{r.score.toFixed(1)}</span>
                      <span className="text-on-surface-variant dark:text-slate-400 text-sm">/10</span>
                    </div>
                    <span className={`material-symbols-outlined text-on-surface-variant dark:text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>expand_more</span>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="bg-slate-50 dark:bg-[#051329] p-4 rounded-xl border border-slate-200/50 dark:border-cyan-950/40">
                        <p className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-1">{t('detail_score')}</p>
                        <p className="text-xl font-black text-[#0C2E5E] dark:text-[#00C6FF]">{r.score.toFixed(1)} / 10</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#051329] p-4 rounded-xl border border-slate-200/50 dark:border-cyan-950/40">
                        <p className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-1">{t('detail_rank')}</p>
                        <span className={`px-2 py-1 rounded-lg text-xs font-black ${rank.cls}`}>{rank.label}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#051329] p-4 rounded-xl border border-slate-200/50 dark:border-cyan-950/40">
                        <p className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-1">{t('detail_time')}</p>
                        <p className="text-sm font-bold text-on-surface dark:text-slate-200">{new Date(r.submittedAt).toLocaleString("vi-VN")}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
