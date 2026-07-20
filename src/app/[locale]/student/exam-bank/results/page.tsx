"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/navigation";
import { useLocale } from "next-intl";
import { API_BASE } from "@/lib/api";

type PracticeResult = {
  id: string;
  examId: string;
  examTitle: string;
  versionCode?: string;
  score: number;
  submittedAt?: number;
  totalQuestions?: number;
  correctAnswers?: number;
};

export default function PracticeResultsPage() {
  const locale = useLocale();
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLoading(false);
      return;
    }

    const user = JSON.parse(storedUser);
    const token = localStorage.getItem("accessToken");

    fetch(`${API_BASE}/practice/results/student/${user.id}`, {
      headers: { "Authorization": `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setResults(Array.isArray(data) ? data : []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return results
      .filter(r => {
        const title = r.examTitle || "";
        const version = r.versionCode || "";
        return title.toLowerCase().includes(search.toLowerCase()) || version.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => {
        if (sortBy === "score") return (b.score || 0) - (a.score || 0);
        return (b.submittedAt || 0) - (a.submittedAt || 0);
      });
  }, [results, search, sortBy]);

  const total = results.length;
  const avgScore = total ? results.reduce((sum, r) => sum + (r.score || 0), 0) / total : 0;
  const bestScore = total ? Math.max(...results.map(r => r.score || 0)) : 0;
  const completedQuestions = results.reduce((sum, r) => sum + (r.correctAnswers || 0), 0);

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      <section className="bg-gradient-to-br from-[#0C2E5E] via-[#14508F] to-[#00A6D6] p-6 sm:p-8 rounded-3xl shadow-lg text-white">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 mb-5">
              <span className="material-symbols-outlined text-3xl text-white">query_stats</span>
            </div>
            <h1 className="font-headline font-extrabold text-3xl sm:text-4xl text-white tracking-tight mb-3">
              Lịch sử luyện tập
            </h1>
            <p className="text-white/85 max-w-2xl leading-relaxed text-sm sm:text-base">
              Đây là kết quả làm bài trong Ngân hàng đề, tách riêng với kết quả thi chính thức.
            </p>
          </div>

          <Link
            href={`/student/exam-bank`}
            className="h-12 px-5 bg-white text-[#0C2E5E] font-extrabold rounded-xl text-sm shadow-xl transition-colors flex items-center justify-center gap-2 hover:bg-cyan-50"
          >
            <span className="material-symbols-outlined text-lg">library_books</span>
            Về Ngân hàng đề
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Lượt luyện tập", value: total.toString(), icon: "assignment", color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Điểm trung bình", value: avgScore.toFixed(2), icon: "grade", color: "text-primary", bg: "bg-primary/5" },
          { label: "Điểm cao nhất", value: bestScore.toFixed(1), icon: "workspace_premium", color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Câu đúng", value: completedQuestions.toString(), icon: "check_circle", color: "text-emerald-500", bg: "bg-emerald-50" },
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

      <section className="bg-white dark:bg-[#0A1F3E]/90 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 text-lg">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] text-sm focus:outline-none focus:border-primary transition-colors"
            placeholder="Tìm theo tên đề luyện tập..."
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as "date" | "score")}
          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#051329] dark:text-[#E2E8F0] text-xs font-bold focus:outline-none focus:border-primary transition-colors"
        >
          <option value="date">Mới nhất</option>
          <option value="score">Điểm cao nhất</option>
        </select>
      </section>

      <section className="bg-white dark:bg-[#0A1F3E]/90 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-cyan-950/50 flex items-center justify-between">
          <h2 className="font-bold text-on-surface dark:text-slate-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">format_list_bulleted</span>
            Kết quả Ngân hàng đề
          </h2>
          <span className="text-xs text-on-surface-variant dark:text-slate-400 font-medium">{filtered.length} kết quả</span>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-on-surface-variant dark:text-slate-400 text-sm">Đang tải kết quả luyện tập...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant dark:text-slate-400/30 block mb-4">assignment_turned_in</span>
            <p className="text-on-surface-variant dark:text-slate-400 font-medium">Chưa có kết quả luyện tập</p>
            <p className="text-on-surface-variant dark:text-slate-400/60 text-sm mt-1">Làm một đề trong Ngân hàng đề để xem lịch sử tại đây.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-cyan-950/40">
            {filtered.map(r => (
              <div key={r.id} className="px-6 py-5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-cyan-950/20 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-300 text-lg">quiz</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface dark:text-slate-200 truncate">{r.examTitle?.replace(/\s*\(Ngân hàng\)/gi, "") || "Đề luyện tập"}</p>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400">
                    {r.versionCode || "Phiên bản luyện tập"} · {r.submittedAt ? new Date(r.submittedAt).toLocaleString("vi-VN") : "Chưa rõ thời gian"}
                  </p>
                </div>
                <div className="hidden sm:block text-xs font-bold text-slate-500 dark:text-slate-400">
                  {r.correctAnswers ?? 0}/{r.totalQuestions ?? 0} câu đúng
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-2xl font-black text-[#0C2E5E] dark:text-[#00C6FF]">{(r.score || 0).toFixed(1)}</span>
                  <span className="text-on-surface-variant dark:text-slate-400 text-sm">/10</span>
                </div>
                <Link
                  href={`/student/exam-bank/detail/result?id=${r.examId}&resultId=${r.id}`}
                  className="h-9 px-3 rounded-xl bg-[#0C2E5E] text-white text-xs font-extrabold flex items-center gap-1.5 hover:bg-[#14508F] transition-colors"
                >
                  Xem lại
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
