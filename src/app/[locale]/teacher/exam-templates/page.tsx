"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { authFetcher } from "@/hooks/useAuthFetch";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useRouter } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import ExamConfigDrawer from "@/components/ExamConfigDrawer";
import { useAlert } from "@/components/ui/AlertProvider";

const DIFFICULTY_CONFIG: Record<string, { label: string; cls: string }> = {
  EASY:   { label: "Dễ", cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  MEDIUM: { label: "Vừa", cls: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  HARD:   { label: "Khó", cls: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  EXPERT: { label: "Chuyên", cls: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

export default function TeacherExamTemplatesPage() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("TeacherExamTemplates");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("Tất cả");
  const [selectedSubject, setSelectedSubject] = useState("Tất cả");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "table">("list");
  const [selectedExamForConfig, setSelectedExamForConfig] = useState<any>(null);

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

  const [isUserLoaded, setIsUserLoaded] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("user") !== null;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setUser(JSON.parse(stored));
          setIsUserLoaded(true);
        }
      } catch {}
    }
  }, []);

  const teacherId = user?.id || "";

  const { data: items = [], isLoading, mutate } = useSWR(
    (!isUserLoaded || !teacherId) ? null : `${API_BASE}/exams/teacher/${teacherId}/templates`,
    authFetcher,
    { revalidateOnFocus: false }
  );

  const filtered = items.filter((item: any) => {
    const matchSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGrade = selectedGrade === "Tất cả" || item.grade === selectedGrade;
    const matchSubject = selectedSubject === "Tất cả" || item.subject === selectedSubject;
    return matchSearch && matchGrade && matchSubject;
  });

  const uniqueGrades = Array.from(new Set(items.map((item: any) => item.grade).filter(Boolean))) as string[];
  const uniqueSubjects = Array.from(new Set(items.map((item: any) => item.subject).filter(Boolean))) as string[];

  const handleDeleteExam = async (examId: string) => {
    showAlert({
      title: t("delete_confirm_title"),
      message: t("delete_confirm_msg"),
      type: "confirm",
      onConfirm: async () => {
        setDeletingId(examId);
        try {
          const res = await fetch(`${API_BASE}/exams/${examId}`, {
            method: "DELETE",
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
          });
          if (res.ok) {
            mutate();
            showAlert({
              title: t("success"),
              message: t("delete_success"),
              type: "success"
            });
          } else {
            showAlert({
              title: t("fail"),
              message: t("delete_fail"),
              type: "error"
            });
          }
        } catch {
          showAlert({
            title: t("error_conn_title"),
            message: t("error_conn_msg"),
            type: "error"
          });
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const handlePublishToBank = async (examId: string) => {
    showAlert({
      title: t("publish_confirm_title"),
      message: t("publish_confirm_msg"),
      type: "confirm",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/exams/${examId}/publish-to-bank`, {
            method: "POST",
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
          });
          if (res.ok) {
            showAlert({
              title: t("success"),
              message: t("publish_success"),
              type: "success"
            });
          } else {
            showAlert({
              title: t("fail"),
              message: t("publish_fail"),
              type: "error"
            });
          }
        } catch {
          showAlert({
            title: t("error_conn_title"),
            message: t("error_conn_msg"),
            type: "error"
          });
        }
      }
    });
  };

  return (
    <main className="p-8 space-y-8 max-w-5xl mx-auto w-full">
      {/* Header Banner */}
      <ScrollReveal variant="fade-up" duration={600}>
        <section className="bg-gradient-to-br from-[#0C2E5E] to-[#0D4B91] p-8 rounded-[2rem] shadow-lg relative overflow-hidden text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-4xl text-white">folder_special</span>
            </div>
            <h2 className="font-headline font-extrabold text-4xl text-white tracking-tight mb-2">
              {t("title")}
            </h2>
            <p className="text-white/80 max-w-lg leading-relaxed">
              {t("description")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0 relative z-10">
            <button
              onClick={() => router.push(`/teacher/exams`)}
              className="px-5 py-2.5 bg-white text-[#0C2E5E] font-extrabold rounded-xl text-sm shadow-xl transition-all flex items-center gap-2 hover:scale-105"
            >
              <span className="material-symbols-outlined text-lg">magic_button</span>
              {t("design_exam")}
            </button>
          </div>
        </section>
      </ScrollReveal>

      {/* Toolbar */}
      <ScrollReveal variant="fade-up" duration={600} delay={80}>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-[#0A1F3E]/60 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none transition-all text-sm font-medium text-on-surface dark:text-slate-200"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {uniqueGrades.length > 0 && (
              <div className="relative w-full sm:w-auto">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-lg">school</span>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full sm:w-auto pl-10 pr-8 py-2.5 bg-white dark:bg-[#0A1F3E]/60 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
                >
                  <option value="Tất cả">{t("all_grades")}</option>
                  {uniqueGrades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
              </div>
            )}

            {uniqueSubjects.length > 0 && (
              <div className="relative w-full sm:w-auto">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 text-lg">category</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full sm:w-auto pl-10 pr-8 py-2.5 bg-white dark:bg-[#0A1F3E]/60 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
                >
                  <option value="Tất cả">{t("all_subjects")}</option>
                  {uniqueSubjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center bg-slate-100 dark:bg-cyan-950/40 p-1 rounded-xl border border-slate-200/50 dark:border-cyan-950/30">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${viewMode === "list" ? "bg-white dark:bg-[#0A1F3E] text-indigo-600 dark:text-cyan-400 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                title={t("list_view")}
              >
                <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${viewMode === "table" ? "bg-white dark:bg-[#0A1F3E] text-indigo-600 dark:text-cyan-400 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                title={t("table_view")}
              >
                <span className="material-symbols-outlined text-lg">table_chart</span>
              </button>
            </div>

            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-cyan-950/20 border border-slate-200 dark:border-cyan-950/40 rounded-xl">
              <span className="material-symbols-outlined text-slate-400 text-lg">quiz</span>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {t("template_count", { count: filtered.length })}
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Templates List */}
      <ScrollReveal variant="fade-up" duration={600} delay={150}>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 bg-white dark:bg-[#0A1F3E]/80 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 animate-pulse">
                <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-cyan-950/60 shrink-0" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="h-5 bg-slate-200 dark:bg-cyan-950/60 rounded-lg w-3/4" />
                  <div className="flex gap-2">
                    <div className="h-4 w-16 bg-slate-200 dark:bg-cyan-950/60 rounded-full" />
                    <div className="h-4 w-20 bg-slate-200 dark:bg-cyan-950/60 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-[#0A1F3E]/40 border border-dashed border-slate-200 dark:border-cyan-950/60 rounded-3xl">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-4 block">
              {searchTerm ? "search_off" : "folder_zip"}
            </span>
            <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">
              {searchTerm ? t("no_search_results") : t("empty")}
            </p>
            <p className="text-sm text-slate-400">
              {t("empty_desc")}
            </p>
          </div>
        ) : viewMode === "table" ? (
          <div className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200/60 dark:border-cyan-950/40 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-cyan-950/40 bg-slate-50/50 dark:bg-cyan-950/20">
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("col_name")}</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("col_subject")}</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("col_stats")}</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("col_difficulty")}</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">{t("col_actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-cyan-950/30">
                  {filtered.map((exam: any) => {
                    const diff = exam.difficulty ? DIFFICULTY_CONFIG[exam.difficulty] : null;
                    const isDeleting = deletingId === exam.id;
                    const questionCount = exam.versions?.[0]?.questions?.length || 0;
                    return (
                      <tr
                        key={exam.id}
                        className="group hover:bg-slate-50/50 dark:hover:bg-[#0E2D56]/30 transition-colors"
                      >
                        <td className="py-4 px-6 min-w-[250px]">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-indigo-500 text-lg">folder_open</span>
                            </div>
                            <span className="font-bold text-on-surface dark:text-slate-100 text-sm line-clamp-1">
                              {exam.title}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-lg border border-slate-100 dark:border-cyan-950/20">
                            {exam.subject || t("unknown_subject")}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-0.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">format_list_numbered</span>
                              {t("questions", { count: questionCount })}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {t("minutes", { count: exam.duration })}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {diff ? (
                            <span className={`px-2 py-0.5 text-[10px] font-black rounded-md inline-block uppercase tracking-wider ${diff.cls}`}>
                              {t(`difficulty.${exam.difficulty}` as any)}
                            </span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5 transition-opacity">
                            <button
                              onClick={() => setSelectedExamForConfig(exam)}
                              title={t("actions.use")}
                              className="px-3 py-1.5 bg-[#0C2E5E] text-white hover:bg-[#0E3E7A] text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">send</span>
                              {t("actions.use")}
                            </button>
                            <button
                              onClick={() => router.push(`/teacher/exams/?edit=${exam.id}`)}
                              title={t("actions.edit")}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 transition-all"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              onClick={() => handlePublishToBank(exam.id)}
                              title={t("actions.publish")}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-600 transition-all"
                            >
                              <span className="material-symbols-outlined text-lg">publish</span>
                            </button>
                            <button
                              onClick={() => handleDeleteExam(exam.id)}
                              disabled={isDeleting}
                              title={t("actions.delete")}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all disabled:opacity-40"
                            >
                              <span className={`material-symbols-outlined text-lg ${isDeleting ? "animate-spin" : ""}`}>
                                {isDeleting ? "refresh" : "delete"}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((exam: any) => {
              const diff = exam.difficulty ? DIFFICULTY_CONFIG[exam.difficulty] : null;
              const isDeleting = deletingId === exam.id;
              const questionCount = exam.versions?.[0]?.questions?.length || 0;
              return (
                <div
                  key={exam.id}
                  className="group flex gap-4 p-4 bg-white dark:bg-[#0A1F3E]/80 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-indigo-500 text-2xl">folder_special</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {diff && (
                        <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-md ${diff.cls}`}>
                          {t(`difficulty.${exam.difficulty}` as any)}
                        </span>
                      )}
                      {exam.subject && (
                        <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-bold rounded-md">
                          {exam.subject}
                        </span>
                      )}
                      {questionCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-bold rounded-md">
                          {t("questions", { count: questionCount })}
                        </span>
                      )}
                      {exam.duration > 0 && (
                        <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-bold rounded-md">
                          {t("minutes", { count: exam.duration })}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-on-surface dark:text-slate-100 text-sm leading-snug line-clamp-1">
                      {exam.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 transition-opacity">
                    <button
                      onClick={() => setSelectedExamForConfig(exam)}
                      className="px-3 py-1.5 bg-[#0C2E5E] text-white hover:bg-[#0E3E7A] text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">send</span>
                      {t("actions.use")}
                    </button>
                    <button
                      onClick={() => router.push(`/teacher/exams/?edit=${exam.id}`)}
                      title={t("actions.edit")}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => handlePublishToBank(exam.id)}
                      title={t("actions.publish")}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-600 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">publish</span>
                    </button>
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      disabled={isDeleting}
                      title={t("actions.delete")}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all disabled:opacity-40"
                    >
                      <span className={`material-symbols-outlined text-lg ${isDeleting ? "animate-spin" : ""}`}>
                        {isDeleting ? "refresh" : "delete"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollReveal>

      <ExamConfigDrawer
        isOpen={!!selectedExamForConfig}
        onClose={() => setSelectedExamForConfig(null)}
        exam={selectedExamForConfig}
        onSuccess={mutate}
      />
    </main>
  );
}
