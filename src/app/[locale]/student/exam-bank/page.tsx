"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
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

  const [searchTerm, setSearchTerm]           = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showAllSubjects, setShowAllSubjects]  = useState(false);

  const { data: exams = [], isLoading } = useSWR<any[]>(
    `${API_BASE}/exam-bank/public/exams`, authFetcher, { revalidateOnFocus: false }
  );
  const { data: stats, isLoading: statsLoading } = useSWR<{
    bySubject: Record<string, number>;
    byGrade:   Record<string, number>;
  }>(`${API_BASE}/exam-bank/public/stats`, authFetcher, { revalidateOnFocus: false });

  // ─── Derived exam list ───────────────────────────────────────
  const filteredExams = useMemo(() =>
    exams.filter(e => {
      const matchSearch  = !searchTerm || e.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSubject = !selectedSubject || e.subject === selectedSubject;
      return matchSearch && matchSubject;
    }),
    [exams, searchTerm, selectedSubject]
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

  const clearFilters = () => { setSelectedSubject(null); setSearchTerm(""); };

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8">

      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0C2E5E] to-cyan-500 flex items-center justify-center shadow">
            <span className="material-symbols-outlined text-white text-lg">library_books</span>
          </div>
          <h1 className="font-headline font-extrabold text-3xl text-on-surface dark:text-slate-100 tracking-tight">
            Ngân Hàng Đề Thi
          </h1>
        </div>
        <p className="text-on-surface-variant dark:text-slate-400 ml-12 text-sm">
          Khám phá đề luyện tập từ Lớp 1 đến Lớp 12 — lọc nhanh theo môn học.
        </p>
      </div>

      {/* ─── Search Bar ─────────────────────────────────────── */}
      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
        <input
          type="text"
          placeholder="Tìm đề thi theo tên..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-10 py-3 bg-white dark:bg-[#0A1F3E]/70 border border-slate-200 dark:border-cyan-950/40 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#00C6FF]/30 outline-none transition-all text-sm font-medium text-on-surface dark:text-slate-200 placeholder:text-slate-400"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {/* ─── 3-Column Layout ────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* ── Left Sidebar ──────────────────────────────────── */}
        <aside className="hidden lg:block w-[220px] shrink-0 sticky top-24">
          <div className="bg-white dark:bg-[#0A1F3E]/80 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-cyan-950/40">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Môn học
              </span>
              {selectedSubject && (
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Xoá lọc
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
                      {showAllSubjects ? "Thu gọn" : `Xem thêm ${subjectRows.length - SHOW_LIMIT} môn`}
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
          <div className="flex items-center gap-3 mb-4 flex-wrap">
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
                    className="group flex gap-4 p-4 bg-white dark:bg-[#0A1F3E]/80 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  >
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
                          {exam.questionCount} câu
                        </span>
                        {exam.submissionCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">play_circle</span>
                            {exam.submissionCount.toLocaleString()} lượt
                          </span>
                        )}
                        {exam.duration > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            {exam.duration} phút
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center shrink-0 self-center opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200">
                      <span className="material-symbols-outlined text-indigo-400 text-lg">chevron_right</span>
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
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Phổ biến</span>
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
                <p className="text-xs text-slate-400 text-center py-8">Chưa có dữ liệu</p>
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
