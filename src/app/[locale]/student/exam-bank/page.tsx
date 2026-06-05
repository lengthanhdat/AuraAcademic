"use client";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";
import { authFetcher } from "@/hooks/useAuthFetch";
import { API_BASE } from "@/lib/api";
import { ALL_SUBJECTS } from "@/lib/curriculum";

// ─── Subject colour palette ──────────────────────────────────────
const SUBJECT_GRADIENT: Record<string, string> = {
  "Toán học":                      "from-blue-500 to-cyan-400",
  "Ngữ văn":                       "from-amber-500 to-orange-400",
  "Tiếng Việt":                    "from-amber-500 to-orange-400",
  "Tiếng Anh":                     "from-emerald-500 to-teal-400",
  "Vật lí":                        "from-sky-500 to-indigo-400",
  "Hóa học":                       "from-green-500 to-emerald-500",
  "Sinh học":                      "from-lime-500 to-green-400",
  "Khoa học tự nhiên":             "from-violet-500 to-fuchsia-400",
  "Khoa học":                      "from-violet-500 to-fuchsia-400",
  "Lịch sử":                       "from-rose-500 to-pink-400",
  "Địa lí":                        "from-orange-400 to-amber-400",
  "Lịch sử và Địa lí":             "from-rose-400 to-orange-400",
  "GDCD":                          "from-yellow-500 to-orange-400",
  "Giáo dục Kinh tế và Pháp luật": "from-yellow-400 to-amber-400",
  "Tin học":                       "from-cyan-500 to-blue-500",
  "Công nghệ":                     "from-slate-500 to-zinc-500",
  "Âm nhạc":                       "from-pink-500 to-rose-400",
  "Mĩ thuật":                      "from-fuchsia-500 to-pink-400",
  "Giáo dục thể chất":             "from-red-500 to-orange-400",
  "Đạo đức":                       "from-indigo-400 to-blue-400",
  "Tự nhiên và Xã hội":            "from-teal-500 to-cyan-400",
  "Hoạt động trải nghiệm":         "from-purple-400 to-violet-400",
  "Quốc phòng và An ninh":         "from-gray-600 to-slate-500",
};
const defaultGradient = "from-slate-400 to-slate-600";

const DIFFICULTY_CONFIG: Record<string, { label: string; cls: string }> = {
  EASY:   { label: "Dễ",     cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  MEDIUM: { label: "Vừa",    cls: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  HARD:   { label: "Khó",    cls: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  EXPERT: { label: "Chuyên", cls: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

// ─── Subject icon map ────────────────────────────────────────────
const SUBJECT_ICON: Record<string, string> = {
  "Toán học": "calculate", "Ngữ văn": "menu_book", "Tiếng Việt": "menu_book",
  "Tiếng Anh": "language", "Vật lí": "science", "Hóa học": "biotech",
  "Sinh học": "eco", "Khoa học tự nhiên": "experiment", "Khoa học": "experiment",
  "Lịch sử": "history_edu", "Địa lí": "public", "Lịch sử và Địa lí": "explore",
  "GDCD": "gavel", "Giáo dục Kinh tế và Pháp luật": "balance",
  "Tin học": "computer", "Công nghệ": "engineering",
  "Âm nhạc": "music_note", "Mĩ thuật": "palette",
  "Giáo dục thể chất": "sports_soccer", "Đạo đức": "psychology",
  "Tự nhiên và Xã hội": "nature_people", "Hoạt động trải nghiệm": "groups",
  "Quốc phòng và An ninh": "shield",
};

export default function ExamBankPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("StudentExamBank");

  const [searchTerm, setSearchTerm]           = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showAllSubjects, setShowAllSubjects]  = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [user, setUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        try {
          const stored = localStorage.getItem("user");
          setUser(stored ? JSON.parse(stored) : null);
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const handleUserUpdated = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {}
    };
    window.addEventListener("user-updated", handleUserUpdated);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-updated", handleUserUpdated);
    }
  }, []);

  const { data: exams = [], isLoading } = useSWR<any[]>(
    `${API_BASE}/exam-bank/public/exams`, authFetcher, { revalidateOnFocus: false }
  );
  const { data: stats, isLoading: statsLoading } = useSWR<{
    bySubject: Record<string, number>;
    byGrade:   Record<string, number>;
  }>(`${API_BASE}/exam-bank/public/stats`, authFetcher, { revalidateOnFocus: false });
  const { data: folders = [], isLoading: foldersLoading } = useSWR<any[]>(
    `${API_BASE}/exam-bank/public/folders`, authFetcher, { revalidateOnFocus: false }
  );

  // ─── Derived exam list ───────────────────────────────────────
  const filteredExams = useMemo(() =>
    exams.filter(e => {
      const matchSearch  = !searchTerm || e.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSubject = !selectedSubject || e.subject === selectedSubject;
      const matchFav = !showFavoritesOnly || user?.favoritePracticeIds?.includes(e.id);
      return matchSearch && matchSubject && matchFav;
    }),
    [exams, searchTerm, selectedSubject, showFavoritesOnly, user]
  );

  const trendingExams = useMemo(() =>
    [...exams].sort((a, b) => (b.submissionCount ?? 0) - (a.submissionCount ?? 0)).slice(0, 6),
    [exams]
  );

  // ─── Sidebar subject list ────────────────────────────────────
  // Show only subjects with count > 0; if stats empty → show all from curriculum without counts
  const statsEmpty  = !stats || Object.keys(stats.bySubject ?? {}).length === 0;
  const subjectRows = useMemo(() => {
    if (statsEmpty) {
      // No data yet — show full curriculum list without count badge
      return ALL_SUBJECTS.map(s => ({ name: s, count: 0 }));
    }
    return ALL_SUBJECTS
      .filter(s => (stats!.bySubject[s] ?? 0) > 0)
      .map(s => ({ name: s, count: stats!.bySubject[s] }))
      .sort((a, b) => b.count - a.count);
  }, [stats, statsEmpty]);

  const SHOW_LIMIT   = 8;
  const visibleRows  = showAllSubjects ? subjectRows : subjectRows.slice(0, SHOW_LIMIT);
  const hasMore      = subjectRows.length > SHOW_LIMIT;
  const hasFilter    = !!(selectedSubject || searchTerm);
  const activeSubjectCount = statsEmpty ? subjectRows.length : subjectRows.filter(s => s.count > 0).length;
  const featureCards = [
    {
      icon: "search",
      title: t('feature1_title'),
      description: t('feature1_desc'),
      cls: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300",
    },
    {
      icon: "folder_open",
      title: t('feature2_title'),
      description: t('feature2_desc'),
      cls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
    },
    {
      icon: "trending_up",
      title: t('feature3_title'),
      description: t('feature3_desc'),
      cls: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
    },
  ];

  const clearFilters = () => { setSelectedSubject(null); setSearchTerm(""); setShowFavoritesOnly(false); };

  const handleToggleFavorite = async (e: React.MouseEvent, examId: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/users/me/favorite-practice/${examId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const data = await res.json();
        const currentFavs = user.favoritePracticeIds || [];
        const newFavs = data.isFavorite 
          ? [...currentFavs, examId]
          : currentFavs.filter((id: string) => id !== examId);
        
        const updatedUser = { ...user, favoritePracticeIds: newFavs };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event("user-updated"));
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật yêu thích:", err);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8 space-y-6">

      {/* ─── Header ─────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#0C2E5E] via-[#14508F] to-[#00A6D6] p-6 sm:p-8 rounded-3xl shadow-lg text-white">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <span className="material-symbols-outlined text-3xl text-white">library_books</span>
              </div>
              <Link
                href={`/${locale}/student/exam-bank/results`}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl text-white font-bold backdrop-blur-sm ring-1 ring-white/30 w-fit"
              >
                <span className="material-symbols-outlined text-[20px]">query_stats</span>
                {t('history_btn')}
              </Link>
            </div>
            <h1 className="font-headline font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight mb-3">
              {t('title')}
            </h1>
            <p className="text-white/85 max-w-2xl leading-relaxed text-sm sm:text-base">
              {t('subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur-sm">
            <div className="rounded-xl bg-white/95 p-4 text-[#0C2E5E]">
              <p className="text-2xl font-black leading-none">{exams.length}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{t('stat_total')}</p>
            </div>
            <div className="rounded-xl bg-white/95 p-4 text-[#0C2E5E]">
              <p className="text-2xl font-black leading-none">{activeSubjectCount}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{t('stat_subjects')}</p>
            </div>
            <div className="rounded-xl bg-white/95 p-4 text-[#0C2E5E]">
              <p className="text-2xl font-black leading-none">{folders.length}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{t('stat_folders')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {featureCards.map((feature) => (
          <div
            key={feature.title}
            className="flex gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-cyan-950/40 dark:bg-[#0A1F3E]/70"
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${feature.cls}`}>
              <span className="material-symbols-outlined text-2xl">{feature.icon}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{feature.title}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{feature.description}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ─── Search Bar ─────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-cyan-950/40 dark:bg-[#0A1F3E]/70">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_auto_auto] lg:items-center">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-12 w-full pl-12 pr-10 bg-slate-50 dark:bg-[#071A33]/70 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none transition-all text-sm font-medium text-on-surface dark:text-slate-200 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors cursor-pointer"
                title={t('clear_search')}
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex h-12 items-center justify-center gap-2 px-4 rounded-xl lg:min-w-[140px] font-bold transition-all border ${showFavoritesOnly ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-[#071A33] dark:text-slate-400 dark:border-cyan-950/40"}`}
          >
             <span className={`material-symbols-outlined text-lg ${showFavoritesOnly ? "font-variation-fill text-rose-500" : ""}`}>favorite</span>
             {showFavoritesOnly ? t('filter_fav_active') : t('filter_fav_idle')}
          </button>
          <div className="flex h-12 items-center justify-center gap-2 px-4 bg-[#0C2E5E] text-white rounded-xl lg:min-w-[124px]">
            <span className="material-symbols-outlined text-white/80 text-lg">quiz</span>
            <span className="text-sm font-extrabold">
              {t('exams_count', { count: filteredExams.length })}
            </span>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          <button
            onClick={() => setSelectedSubject(null)}
            className={`h-9 shrink-0 px-3 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${!selectedSubject ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-cyan-950/40 dark:text-slate-300"}`}
          >
            Tất cả môn
          </button>
          {visibleRows.map(({ name, count }) => (
            <button
              key={name}
              onClick={() => setSelectedSubject(selectedSubject === name ? null : name)}
              className={`h-9 shrink-0 px-3 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${selectedSubject === name ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-cyan-950/40 dark:text-slate-300"}`}
            >
              {name}{!statsEmpty && count > 0 ? ` (${count})` : ""}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Folder Categories Grid ─────────────────────────── */}
      {!foldersLoading && folders.length > 0 && (
        <section>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-indigo-500">folder_open</span>
            Thư mục Chuyên đề Ôn tập
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {folders.map((folder: any) => {
              const grad = SUBJECT_GRADIENT[folder.subject] || defaultGradient;
              return (
                <div
                  key={folder.id}
                  onClick={() => router.push(`/${locale}/student/exam-bank/folder/${folder.id}`)}
                  className="group relative overflow-hidden bg-white dark:bg-[#0A1F3E]/80 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[110px]"
                >
                  <div className="flex justify-between items-start">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                      <span className="material-symbols-outlined text-white text-base">
                        {SUBJECT_ICON[folder.subject] || "folder"}
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                      {folder.grade || "Chung"}
                    </span>
                  </div>
                  <div className="mt-3">
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs line-clamp-1 leading-tight group-hover:text-indigo-600 dark:group-hover:text-[#00C6FF] transition-colors">
                      {folder.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[12px]">quiz</span>
                      Ôn tập chuyên đề
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── 3-Column Layout ────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* ── Left Sidebar ──────────────────────────────────── */}
        <aside className="hidden lg:block w-[220px] shrink-0 sticky top-24">
          <div className="bg-white dark:bg-[#0A1F3E]/80 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-cyan-950/40">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('subject_title')}
              </span>
              {selectedSubject && (
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {t('clear_filter')}
                </button>
              )}
            </div>

            {/* Active chip */}
            {selectedSubject && (
              <div className="px-3 pt-2">
                <span className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-indigo-500 text-white text-[11px] font-bold rounded-full w-full justify-between">
                  <span className="truncate">{selectedSubject}</span>
                  <button
                    onClick={() => setSelectedSubject(null)}
                    className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center shrink-0 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[11px]">close</span>
                  </button>
                </span>
              </div>
            )}

            {/* Subject list */}
            <div className="px-2 py-2">
              {statsLoading ? (
                // Skeleton
                <div className="space-y-1 px-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-7 rounded-lg bg-slate-100 dark:bg-cyan-950/40 animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <ul className="space-y-0.5">
                    {visibleRows.map(({ name, count }) => {
                      const isActive = selectedSubject === name;
                      const icon = SUBJECT_ICON[name] ?? "folder";
                      return (
                        <li key={name}>
                          <button
                            onClick={() => setSelectedSubject(isActive ? null : name)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-150 text-left
                              ${isActive
                                ? "bg-indigo-500 text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyan-950/30"
                              }`}
                          >
                            <span className={`material-symbols-outlined text-[14px] shrink-0 ${isActive ? "text-white" : "text-slate-400"}`}>
                              {icon}
                            </span>
                            <span className="truncate flex-1">{name}</span>
                            {!statsEmpty && count > 0 && (
                              <span className={`shrink-0 min-w-[18px] text-center px-1 rounded-full text-[10px] font-black
                                ${isActive ? "bg-white/25 text-white" : "bg-slate-100 dark:bg-cyan-950/60 text-slate-500 dark:text-slate-400"}`}>
                                {count}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Show more / less */}
                  {hasMore && (
                    <button
                      onClick={() => setShowAllSubjects(v => !v)}
                      className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {showAllSubjects ? "expand_less" : "expand_more"}
                      </span>
                      {showAllSubjects ? t('collapse') : t('show_more', { count: subjectRows.length - SHOW_LIMIT })}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main list ─────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {/* Result bar */}
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {isLoading ? "Đang tải..." : (
                <><span className="text-on-surface dark:text-slate-200 font-bold">{filteredExams.length}</span> đề thi</>
              )}
              {selectedSubject && <span className="text-indigo-600 dark:text-indigo-400"> · {selectedSubject}</span>}
            </p>
            {hasFilter && !isLoading && (
              <button onClick={clearFilters} className="text-[11px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-0.5 transition-colors">
                <span className="material-symbols-outlined text-[13px]">close</span> Xoá lọc
              </button>
            )}
          </div>

          {/* Skeleton rows */}
          {isLoading && (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex gap-4 p-4 bg-white dark:bg-[#0A1F3E]/80 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 animate-pulse">
                  <div className="w-[68px] h-[68px] rounded-xl bg-slate-200 dark:bg-cyan-950/60 shrink-0" />
                  <div className="flex-1 space-y-2.5 py-1">
                    <div className="flex gap-2">
                      <div className="h-4 w-14 bg-slate-200 dark:bg-cyan-950/60 rounded-full" />
                      <div className="h-4 w-20 bg-slate-200 dark:bg-cyan-950/60 rounded-full" />
                    </div>
                    <div className="h-5 w-3/4 bg-slate-200 dark:bg-cyan-950/60 rounded-lg" />
                    <div className="h-3 w-1/3 bg-slate-200 dark:bg-cyan-950/60 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filteredExams.length === 0 && (
            <div className="py-20 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-cyan-950/30 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-slate-300">search_off</span>
              </div>
              <p className="font-bold text-slate-500 dark:text-slate-400 mb-1 text-sm">Không tìm thấy đề phù hợp</p>
              <p className="text-xs text-slate-400 mb-5">
                {selectedSubject
                  ? `Chưa có đề thi cho môn "${selectedSubject}"`
                  : "Thử thay đổi từ khoá tìm kiếm"}
              </p>
              {hasFilter && (
                <button onClick={clearFilters} className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-colors">
                  Xoá bộ lọc
                </button>
              )}
            </div>
          )}

          {/* Exam rows */}
          {!isLoading && filteredExams.length > 0 && (
            <div className="space-y-2.5">
              {filteredExams.map((exam: any) => {
                const grad = SUBJECT_GRADIENT[exam.subject] ?? defaultGradient;
                const diff = exam.difficulty ? DIFFICULTY_CONFIG[exam.difficulty] : null;
                return (
                  <div
                    key={exam.id}
                    onClick={() => router.push(`/${locale}/student/exam-bank/${exam.id}`)}
                    className="group relative flex gap-4 p-4 bg-white dark:bg-[#0A1F3E]/80 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer pr-12"
                  >
                    <button
                      onClick={(e) => handleToggleFavorite(e, exam.id)}
                      className={`absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 
                        ${user?.favoritePracticeIds?.includes(exam.id) 
                          ? "bg-rose-50 text-rose-500 dark:bg-rose-900/30" 
                          : "text-slate-300 hover:bg-slate-100 hover:text-rose-400 dark:text-slate-600 dark:hover:bg-cyan-950/40"}`}
                      title={user?.favoritePracticeIds?.includes(exam.id) ? t('btn_unfavorite') : t('btn_favorite')}
                    >
                      <span className={`material-symbols-outlined text-xl ${user?.favoritePracticeIds?.includes(exam.id) ? "font-variation-fill" : ""}`}>favorite</span>
                    </button>
                    {/* Gradient thumbnail */}
                    <div className={`w-[68px] h-[68px] rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shrink-0 shadow group-hover:scale-105 transition-transform duration-200`}>
                      <span className="material-symbols-outlined text-white text-2xl">
                        {SUBJECT_ICON[exam.subject] ?? "quiz"}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      {/* Badge row */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {exam.grade && (
                          <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-md uppercase tracking-wide">
                            {exam.grade}
                          </span>
                        )}
                        {exam.subject && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-md">
                            {exam.subject}
                          </span>
                        )}
                        {diff && (
                          <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-md ${diff.cls}`}>
                            {diff.label}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-on-surface dark:text-slate-100 text-sm leading-snug line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-[#00C6FF] transition-colors">
                        {exam.title?.replace(/\s*\(Ngân hàng\)/gi, "")}
                      </h3>

                      {/* Meta */}
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 dark:text-slate-500 flex-wrap">
                        {exam.teacherName && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">person</span>
                            {exam.teacherName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">format_list_bulleted</span>
                          {t('meta_questions', { count: exam.questionCount })}
                        </span>
                        {exam.submissionCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">play_circle</span>
                            {t('meta_submissions', { count: exam.submissionCount.toLocaleString() })}
                          </span>
                        )}
                        {exam.duration > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            {t('meta_duration', { count: exam.duration })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center shrink-0 self-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${locale}/student/exam-bank/${exam.id}`);
                        }}
                        className="h-10 px-3 rounded-xl bg-[#0C2E5E] text-white text-xs font-extrabold flex items-center gap-1.5 hover:bg-[#14508F] transition-colors cursor-pointer"
                      >
                        {t('btn_start')}
                        <span className="material-symbols-outlined text-base">chevron_right</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ── Right Sidebar: Trending ────────────────────────── */}
        <aside className="hidden xl:block w-[240px] shrink-0 sticky top-24">
          <div className="bg-white dark:bg-[#0A1F3E]/80 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-cyan-950/40 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500 text-base">local_fire_department</span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('trending_title')}</span>
            </div>

            <div className="p-3">
              {isLoading ? (
                <div className="space-y-2">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="flex gap-2 items-center animate-pulse">
                      <div className="w-5 h-3 rounded bg-slate-200 dark:bg-cyan-950/60 shrink-0" />
                      <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-cyan-950/60 shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 bg-slate-200 dark:bg-cyan-950/60 rounded w-full" />
                        <div className="h-2 bg-slate-200 dark:bg-cyan-950/60 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : trendingExams.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">{t('empty_trending')}</p>
              ) : (
                <ol className="space-y-1">
                  {trendingExams.map((exam: any, idx: number) => {
                    const grad = SUBJECT_GRADIENT[exam.subject] ?? defaultGradient;
                    const rankColor = ["text-amber-500", "text-slate-400", "text-orange-400"][idx] ?? "text-slate-400";
                    return (
                      <li key={exam.id}>
                        <button
                          onClick={() => router.push(`/${locale}/student/exam-bank/${exam.id}`)}
                          className="w-full flex items-center gap-2 text-left p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-cyan-950/20 transition-colors group"
                        >
                          <span className={`text-xs font-black w-4 text-center shrink-0 ${rankColor}`}>{idx + 1}</span>
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shrink-0`}>
                            <span className="material-symbols-outlined text-white text-sm">quiz</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-on-surface dark:text-slate-200 line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-[#00C6FF] transition-colors">
                              {exam.title?.replace(/\s*\(Ngân hàng\)/gi, "")}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px]">play_circle</span>
                              {(exam.submissionCount ?? 0).toLocaleString()}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
