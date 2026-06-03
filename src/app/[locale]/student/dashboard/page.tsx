"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";
import { authFetcher, getStoredUser } from "@/hooks/useAuthFetch";
import { API_BASE } from "@/lib/api";
import { TableRowSkeleton } from "@/components/ui/Skeleton";

type ExamResult = {
  id?: number | string;
  examId?: number | string;
  examTitle?: string;
  versionCode?: string;
  score?: number | string;
  submittedAt?: string;
};

type PracticeResult = {
  id?: number | string;
  folderId?: number | string;
  folderName?: string;
  title?: string;
  score?: number | string;
  correctCount?: number;
  totalQuestions?: number;
  submittedAt?: string;
  createdAt?: string;
};

type Classroom = {
  id?: number | string;
  classroomId?: number | string;
  name?: string;
  className?: string;
  subject?: string;
  teacherName?: string;
  teacherEmail?: string;
  memberCount?: number;
  examCount?: number;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const scoreText = (score: unknown) => {
  const value = toNumber(score);
  return value === null ? "--" : `${value.toFixed(value % 1 === 0 ? 0 : 1)}/10`;
};

const dateValue = (value?: string) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

export default function StudentDashboard() {
  const t = useTranslations("StudentDashboard");
  const locale = useLocale();
  const user = useMemo(() => getStoredUser(), []);
  const dateLocale = locale === "vi" ? "vi-VN" : "en-US";

  const [accessCode, setAccessCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const { data: results = [], isLoading: loadingResults } = useSWR<ExamResult[]>(
    user?.id ? `${API_BASE}/exams/results/student/${user.id}` : null,
    authFetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  const { data: practiceResults = [], isLoading: loadingPractice } = useSWR<PracticeResult[]>(
    user?.id ? `${API_BASE}/practice/results/student/${user.id}` : null,
    authFetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  const { data: classrooms = [], isLoading: loadingClassrooms } = useSWR<Classroom[]>(
    user?.id ? `${API_BASE}/classrooms/student` : null,
    authFetcher,
    { revalidateOnFocus: true, refreshInterval: 5000, dedupingInterval: 3000 }
  );

  const dashboard = useMemo(() => {
    const examScores = results.map((item) => toNumber(item.score)).filter((score): score is number => score !== null);
    const practiceScores = practiceResults.map((item) => toNumber(item.score)).filter((score): score is number => score !== null);
    const allScores = [...examScores, ...practiceScores];
    const averageScore = allScores.length ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : null;
    const bestScore = allScores.length ? Math.max(...allScores) : null;
    const passedCount = examScores.filter((score) => score >= 5).length;

    const recentResults = [...results]
      .sort((a, b) => dateValue(b.submittedAt) - dateValue(a.submittedAt))
      .slice(0, 5);

    const recentPractice = [...practiceResults]
      .sort((a, b) => dateValue(b.submittedAt || b.createdAt) - dateValue(a.submittedAt || a.createdAt))
      .slice(0, 4);

    return {
      averageScore,
      bestScore,
      passedCount,
      passRate: examScores.length ? Math.round((passedCount / examScores.length) * 100) : null,
      recentResults,
      recentPractice,
      visibleClassrooms: classrooms.slice(0, 4),
      completedExamIds: new Set(results.map((item) => String(item.examId || "").toUpperCase()).filter(Boolean)),
    };
  }, [classrooms, practiceResults, results]);

  const handleJoin = useCallback(async () => {
    if (!accessCode.trim()) return;

    const cleanCode = accessCode.trim().toUpperCase();
    if (dashboard.completedExamIds.has(cleanCode)) {
      setError(t("already_completed"));
      return;
    }

    setIsJoining(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE}/exams/lobby/${cleanCode}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        window.location.href = `/${locale}/student/lobby?code=${cleanCode}`;
      } else if (res.status === 401) {
        setError(t("session_expired"));
      } else {
        const msg = await res.text();
        setError(msg || t("invalid_code"));
      }
    } catch {
      setError(t("server_error"));
    } finally {
      setIsJoining(false);
    }
  }, [accessCode, dashboard.completedExamIds, locale, t]);

  const stats = [
    {
      label: "Điểm trung bình",
      value: dashboard.averageScore === null ? "--" : dashboard.averageScore.toFixed(1),
      sub: dashboard.bestScore === null ? "Chưa có điểm" : `Cao nhất ${scoreText(dashboard.bestScore)}`,
      icon: "monitoring",
      tone: "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-900/50",
    },
    {
      label: "Bài thi đã nộp",
      value: results.length,
      sub: dashboard.passRate === null ? "Chưa có bài thi" : `${dashboard.passRate}% đạt từ 5 điểm`,
      icon: "assignment_turned_in",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/50",
    },
    {
      label: "Lớp đang học",
      value: loadingClassrooms ? "--" : classrooms.length,
      sub: classrooms.length ? "Cập nhật theo lớp thật" : "Chưa tham gia lớp nào",
      icon: "school",
      tone: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/50",
    },
    {
      label: "Lượt luyện tập",
      value: practiceResults.length,
      sub: practiceResults.length ? "Từ ngân hàng đề" : "Chưa luyện tập",
      icon: "psychology",
      tone: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900/50",
    },
  ];

  return (
    <main className="w-full max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-stretch">
        <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">Bảng điều khiển học sinh</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-normal text-slate-950 dark:text-white">
                {t("greeting", { name: user?.fullName || t("default_name") })}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Theo dõi lớp học, kết quả bài thi, luyện tập và vào phòng thi từ một màn hình duy nhất.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm">
              <p className="font-semibold text-slate-900 dark:text-white">{user?.email || "Chưa có email"}</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">Tài khoản học sinh</p>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[390px] rounded-2xl border border-cyan-100 dark:border-cyan-900/60 bg-cyan-50/70 dark:bg-cyan-950/30 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-600 text-white">
              <span className="material-symbols-outlined">key</span>
            </div>
            <div>
              <h2 className="font-bold text-slate-950 dark:text-white">Vào bài thi</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Nhập mã truy cập do giáo viên cung cấp.</p>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <input
              value={accessCode}
              onChange={(event) => {
                setAccessCode(event.target.value.toUpperCase());
                if (error) setError("");
              }}
              onKeyDown={(event) => event.key === "Enter" && handleJoin()}
              placeholder="VD: AURA25"
              className="min-w-0 flex-1 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm font-bold uppercase tracking-[0.12em] text-slate-900 dark:text-white outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            />
            <button
              onClick={handleJoin}
              disabled={isJoining || !accessCode.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[20px]">{isJoining ? "progress_activity" : "login"}</span>
              Vào
            </button>
          </div>
          {error && <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-300">{error}</p>}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className={`rounded-2xl border p-5 shadow-sm ${item.tone}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">{item.label}</p>
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-normal">{item.value}</p>
            <p className="mt-1 text-sm opacity-80">{item.sub}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Kết quả bài thi gần đây</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Các bài thi chính thức đã nộp.</p>
              </div>
              <Link href={`/${locale}/student/results`} className="inline-flex items-center gap-1 text-sm font-bold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300">
                Xem tất cả
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-y border-slate-100 dark:border-slate-800 text-xs uppercase text-slate-400 dark:text-slate-500">
                    <th className="px-4 py-3 font-bold">{t("col_exam")}</th>
                    <th className="px-4 py-3 font-bold">{t("col_time")}</th>
                    <th className="px-4 py-3 font-bold">{t("col_status")}</th>
                    <th className="px-4 py-3 text-right font-bold">{t("col_score")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loadingResults ? (
                    <>
                      <TableRowSkeleton cols={4} />
                      <TableRowSkeleton cols={4} />
                      <TableRowSkeleton cols={4} />
                    </>
                  ) : dashboard.recentResults.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        {t("no_results")}
                      </td>
                    </tr>
                  ) : (
                    dashboard.recentResults.map((item, index) => (
                      <tr key={item.id || `${item.examId}-${index}`} className="text-sm">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">
                              <span className="material-symbols-outlined text-[20px]">assignment</span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-950 dark:text-white">{item.examTitle || `${t("room_prefix")} ${item.examId || "--"}`}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{t("version_code")} {item.versionCode || "--"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString(dateLocale) : "--"}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {t("status_completed")}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-extrabold text-slate-950 dark:text-white">{scoreText(item.score)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Lớp học của tôi</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Danh sách lớp đang tham gia.</p>
              </div>
              <Link href={`/${locale}/student/classrooms`} className="inline-flex items-center gap-1 text-sm font-bold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300">
                Mở lớp học
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>

            {loadingClassrooms ? (
              <div className="grid gap-3 md:grid-cols-2">
                {[0, 1].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />
                ))}
              </div>
            ) : dashboard.visibleClassrooms.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Bạn chưa tham gia lớp học nào.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {dashboard.visibleClassrooms.map((room, index) => {
                  const roomId = room.id || room.classroomId;
                  return (
                    <Link
                      key={roomId || index}
                      href={roomId ? `/${locale}/student/classrooms/${roomId}` : `/${locale}/student/classrooms`}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/50 dark:hover:border-cyan-800 dark:hover:bg-cyan-950/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-extrabold text-slate-950 dark:text-white">{room.name || room.className || "Lớp học"}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{room.subject || "Chưa có môn học"}</p>
                        </div>
                        <span className="material-symbols-outlined text-cyan-700 dark:text-cyan-300">chevron_right</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span className="rounded-full bg-white dark:bg-slate-950 px-3 py-1">{room.teacherName || room.teacherEmail || "Giáo viên"}</span>
                        {typeof room.examCount === "number" && <span className="rounded-full bg-white dark:bg-slate-950 px-3 py-1">{room.examCount} bài thi</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Tổng quan học tập</h2>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm font-bold text-slate-700 dark:text-slate-200">
                  <span>Tỉ lệ đạt bài thi</span>
                  <span>{dashboard.passRate === null ? "--" : `${dashboard.passRate}%`}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${dashboard.passRate || 0}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-4">
                  <p className="text-xs font-bold uppercase text-slate-400">Đã đạt</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">{dashboard.passedCount}</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-4">
                  <p className="text-xs font-bold uppercase text-slate-400">Tổng điểm</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">{dashboard.bestScore === null ? "--" : scoreText(dashboard.bestScore)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Luyện tập gần đây</h2>
              <Link href={`/${locale}/student/exam-bank/results`} className="text-sm font-bold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300">
                Xem
              </Link>
            </div>

            {loadingPractice ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />
                ))}
              </div>
            ) : dashboard.recentPractice.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Chưa có kết quả luyện tập.
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.recentPractice.map((item, index) => (
                  <div key={item.id || index} className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-950 dark:text-white">{item.folderName || item.title || "Bài luyện tập"}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {(item.submittedAt || item.createdAt) ? new Date(item.submittedAt || item.createdAt || "").toLocaleDateString(dateLocale) : "Chưa có ngày"}
                        </p>
                      </div>
                      <span className="rounded-full bg-white dark:bg-slate-950 px-3 py-1 text-xs font-extrabold text-cyan-700 dark:text-cyan-300">
                        {scoreText(item.score)}
                      </span>
                    </div>
                    {typeof item.correctCount === "number" && typeof item.totalQuestions === "number" && (
                      <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Đúng {item.correctCount}/{item.totalQuestions} câu
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
