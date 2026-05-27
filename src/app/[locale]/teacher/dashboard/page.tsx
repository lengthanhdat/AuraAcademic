"use client";
import { useMemo, useCallback, useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { authFetcher, getStoredUser } from "@/hooks/useAuthFetch";
import { StatCardSkeleton, TableRowSkeleton } from "@/components/ui/Skeleton";

const API_BASE = "http://localhost:8088/api";

export default function TeacherDashboard() {
  const router = useRouter();
  const t = useTranslations('Dashboard');
  const user = useMemo(() => getStoredUser(), []);

  // SWR: auto-cache + background revalidate + no duplicate requests
  const { data: exams = [], isLoading, mutate } = useSWR(
    user?.id ? `${API_BASE}/exams/teacher/${user.id}` : null,
    authFetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  const { data: folders = [] } = useSWR(
    user?.id ? `${API_BASE}/exam-bank/teacher/${user.id}/folders` : null,
    authFetcher,
    { revalidateOnFocus: false }
  );

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [examToShare, setExamToShare] = useState<any>(null);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  // Live exams for active count polling
  const liveExams = useMemo(() =>
    exams.filter((e: any) => {
      if (e.status !== 'PUBLISHED' && e.status !== 'STARTED') return false;
      if (!e.startTime) return true;
      const endTime = e.startTime + (e.duration * 60 * 1000);
      return Date.now() <= endTime;
    }),
    [exams]
  );

  const liveAccessCodes = useMemo(() => liveExams.map((e: any) => e.accessCode).join(","), [liveExams]);

  // SWR for active counts — only polls when there are live exams
  const { data: activeCountMap = {} } = useSWR(
    liveAccessCodes ? `active-counts-${liveAccessCodes}` : null,
    async () => {
      const updates: Record<string, number> = {};
      await Promise.all(liveExams.map(async (exam: any) => {
        try {
          const res = await fetch(`${API_BASE}/exams/${exam.accessCode}/active-count`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
          });
          if (res.ok) {
            const data = await res.json();
            updates[exam.accessCode] = data.activeCount;
          }
        } catch { }
      }));
      return updates;
    },
    { refreshInterval: 10000, revalidateOnFocus: false }
  );

  const deleteExam = useCallback(async (id: string) => {
    if (!confirm(t('actions.delete_confirm'))) return;
    try {
      const res = await fetch(`${API_BASE}/exams/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      });
      if (res.ok) mutate((prev: any[]) => prev?.filter(e => e.id !== id), false);
    } catch {
      alert(t('actions.delete_error'));
    }
  }, [t, mutate]);

  const closeExam = useCallback(async (id: string) => {
    if (!confirm(t('actions.close_confirm'))) return;
    try {
      const res = await fetch(`${API_BASE}/exams/${id}/close`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      });
      if (res.ok) mutate((prev: any[]) => prev?.map(e => e.id === id ? { ...e, status: 'FINISHED' } : e), false);
    } catch {
      alert(t('actions.close_error'));
    }
  }, [t, mutate]);

  const reopenExam = useCallback(async (id: string) => {
    if (!confirm(t('actions.reopen_confirm'))) return;
    try {
      const res = await fetch(`${API_BASE}/exams/${id}/reopen`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      });
      if (res.ok) mutate((prev: any[]) => prev?.map(e => e.id === id ? { ...e, status: 'PUBLISHED' } : e), false);
    } catch {
      alert(t('actions.reopen_error'));
    }
  }, [t, mutate]);

  const editExam = useCallback((exam: any) => {
    router.push(`/teacher/exams?edit=${exam.id}`);
  }, [router]);

  const viewExam = useCallback((exam: any) => {
    router.push(`/teacher/exam-room/${exam.id}`);
  }, [router]);

  const openShareModal = useCallback((exam: any) => {
    setExamToShare(exam);
    setIsShareModalOpen(true);
    setSelectedFolderId("");
  }, []);

  const handleShareToBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examToShare || !selectedFolderId) return;

    setIsSharing(true);
    try {
      // Create a copy of the exam for the bank
      const payload = {
        ...examToShare,
        id: undefined,
        title: `${examToShare.title} (Ngân hàng)`,
        status: "PUBLISHED", // or PENDING if moderation is enabled
        isPractice: true,
        isBankItem: true,
        bankItem: true,
        folderId: selectedFolderId
      };

      const res = await fetch(`${API_BASE}/exams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsShareModalOpen(false);
        alert("Đã thêm thành công vào chuyên đề!");
        mutate();
      } else {
        alert("Lỗi khi thêm vào ngân hàng.");
      }
    } catch {
      alert("Lỗi kết nối.");
    } finally {
      setIsSharing(false);
    }
  };

  // Memoized stats
  const activeExamsCount = useMemo(() => exams.filter((e: any) => e.status === 'PUBLISHED' || e.status === 'STARTED').length, [exams]);
  const draftExamsCount = useMemo(() => exams.filter((e: any) => e.status === 'DRAFT').length, [exams]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 18) return t('greeting.afternoon');
    return t('greeting.evening');
  }, [t]);

  return (
    <main className="p-8 space-y-8 flex-1">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-3xl font-extrabold text-on-surface dark:text-slate-200 font-headline tracking-tight">
            {greeting}, {user?.fullName || "Teacher"}
          </h3>
          <p className="text-on-surface-variant dark:text-slate-400 mt-1">{t('overview')}</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-surface-container-high dark:bg-cyan-950/50 dark:text-slate-200 text-on-surface font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-surface-container-highest transition-all duration-200 active:scale-95">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            {t('calendar_btn')}
          </button>
        </div>
      </div>

      {/* Stats Grid - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Stat Card 1 */}
            <div className="bg-white dark:bg-[#0A1F3E] backdrop-blur-md p-7 rounded-2xl relative overflow-hidden group shadow-sm border border-slate-200/50 hover:shadow-[0_20px_50px_-12px_rgba(0,198,255,0.1)] hover:border-[#00C6FF]/20 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              </div>
              <p className="text-sm font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest">{t('stats.live_exams')}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-black text-[#0C2E5E] dark:text-[#E2E8F0] font-headline tracking-tight">{activeExamsCount}</span>
                <span className="text-xs font-extrabold px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">{t('stats.live_now')}</span>
              </div>
              <div
                onClick={() => router.push("/teacher/monitoring")}
                className="mt-6 flex items-center gap-2 text-[#0C2E5E] dark:text-[#E2E8F0] hover:text-[#00C6FF] text-sm font-bold cursor-pointer hover:underline transition-colors duration-200"
              >
                <span>{t('stats.details')}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white dark:bg-[#0A1F3E] backdrop-blur-md p-7 rounded-2xl relative overflow-hidden group shadow-sm border border-slate-200/50 hover:shadow-[0_20px_50px_-12px_rgba(0,198,255,0.1)] hover:border-[#00C6FF]/20 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <p className="text-sm font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest">{t('stats.drafts')}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-black text-on-surface dark:text-slate-200 font-headline">{draftExamsCount}</span>
                <span className="text-on-surface-variant dark:text-slate-400 text-sm font-medium">{t('stats.editing')}</span>
              </div>
              <div
                onClick={() => router.push("/teacher/reports")}
                className="mt-6 flex items-center gap-2 text-on-surface-variant dark:text-slate-400 text-sm font-semibold cursor-pointer hover:underline transition-colors duration-200"
              >
                <span>{t('stats.view_reports')}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-white dark:bg-[#0A1F3E] backdrop-blur-md p-7 rounded-2xl relative overflow-hidden group shadow-sm border border-slate-200/50 hover:shadow-[0_20px_50px_-12px_rgba(0,198,255,0.1)] hover:border-[#00C6FF]/20 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              </div>
              <p className="text-sm font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest">{t('stats.total_exams')}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-black text-on-surface dark:text-slate-200 font-headline">{exams.length}</span>
                <span className="text-on-surface-variant dark:text-slate-400 text-sm font-medium">{t('stats.created')}</span>
              </div>
              <div className="mt-6 flex items-center gap-2 text-on-surface-variant dark:text-slate-400 text-sm font-semibold cursor-pointer hover:underline transition-colors duration-200">
                <span>{t('stats.manage_classes')}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Table Section */}
      <section className="bg-white dark:bg-[#0A1F3E]/80 rounded-2xl shadow-sm border border-outline-variant/10 dark:border-cyan-950/40 overflow-hidden flex flex-col">
        <div className="p-6 flex items-center justify-between border-b border-surface-container-high bg-white dark:bg-[#0A1F3E]">
          <div>
            <h4 className="text-lg font-extrabold text-on-surface dark:text-slate-200 font-headline">{t('table.title')}</h4>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 font-medium mt-0.5">{t('table.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-surface-container-low dark:hover:bg-cyan-950/30 rounded-lg transition-colors duration-200">
              <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400">filter_list</span>
            </button>
            <button className="p-2 hover:bg-surface-container-low dark:hover:bg-cyan-950/30 rounded-lg transition-colors duration-200">
              <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400">more_vert</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low dark:bg-cyan-950/30">
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest">{t('table.col_name')}</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest">{t('table.col_time')}</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest text-center">{t('table.col_status')}</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest text-right">{t('table.col_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container dark:divide-cyan-950/40">
              {isLoading ? (
                <>
                  <TableRowSkeleton cols={4} />
                  <TableRowSkeleton cols={4} />
                  <TableRowSkeleton cols={4} />
                  <TableRowSkeleton cols={4} />
                </>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-on-surface-variant dark:text-slate-400/50">
                      <span className="material-symbols-outlined text-5xl mb-2">folder_open</span>
                      <p className="font-medium text-sm">{t('table.empty')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                exams.map((exam: any) => (
                  <tr key={exam.id} className="hover:bg-surface-container-low dark:hover:bg-cyan-950/20 transition-colors duration-200 group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors duration-200 ${(exam.status === 'PUBLISHED' || exam.status === 'STARTED') ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                          {exam.title.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface dark:text-slate-200 text-sm">{exam.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                              {exam.versions?.[0]?.questions?.length || 0} {t('table.questions')} • {exam.duration} {t('table.minutes')}
                              {exam.versions?.length > 1 && ` • ${exam.versions.length} ${t('table.versions')}`}
                            </p>
                            {exam.status === 'PUBLISHED' && (
                              <>
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-black tracking-wider flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[10px]">key</span>
                                  {exam.accessCode}
                                </span>
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px] font-black tracking-wider flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[10px]">groups</span>
                                  {exam.submissionCount || 0} {t('table.submissions')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {exam.startTime ? (
                        <>
                          <p className="text-sm font-semibold text-on-surface dark:text-slate-200">
                            {new Date(exam.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            {" - "}
                            {new Date(exam.startTime).toLocaleDateString(undefined)}
                          </p>
                          <p className="text-[11px] text-on-surface-variant dark:text-slate-400">{t('table.start_at_publish')}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-on-surface dark:text-slate-200">{t('table.time_unknown')}</p>
                          <p className="text-[11px] text-on-surface-variant dark:text-slate-400">{t('table.time_not_set')}</p>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {(() => {
                        if (exam.status === 'PUBLISHED' || exam.status === 'STARTED') {
                          if (exam.startTime) {
                            const endTime = exam.startTime + (exam.duration * 60 * 1000);
                            if (Date.now() > endTime) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black uppercase tracking-wider">
                                  {t('status.finished')}
                                </span>
                              );
                            }
                          }
                          
                          if (exam.status === 'PUBLISHED') {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                {t('status.published')}
                              </span>
                            );
                          }

                          return (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-[10px] font-black uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                {t('status.live')}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping inline-block"></span>
                                {(activeCountMap[exam.accessCode] ?? 0)} {t('status.active_students')}
                              </span>
                            </div>
                          );
                        } else if (exam.status === 'FINISHED') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-black uppercase tracking-wider">
                              <span className="material-symbols-outlined text-[12px]">lock</span>
                              {t('status.closed')}
                            </span>
                          );
                        } else if (exam.status === 'COMPLETED') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black uppercase tracking-wider">
                              <span className="material-symbols-outlined text-[12px]">check_circle</span>
                              {t('status.finished')}
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black uppercase tracking-wider">
                              {t('status.draft')}
                            </span>
                          );
                        }
                      })()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => viewExam(exam)}
                          className="p-2 text-slate-500 hover:text-[#0C2E5E] hover:bg-[#0C2E5E]/5 rounded-xl transition-all duration-200"
                          title={t('actions.view')}
                        >
                          <span className="material-symbols-outlined text-xl">visibility</span>
                        </button>
                        <button
                          onClick={() => editExam(exam)}
                          disabled={exam.status !== 'DRAFT'}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            exam.status === 'DRAFT' 
                              ? "text-on-surface-variant dark:text-slate-400 hover:text-[#00355f] hover:bg-blue-50" 
                              : "text-slate-200 cursor-not-allowed opacity-50"
                          }`}
                          title={exam.status === 'DRAFT' ? t('actions.edit') : "Chỉ có thể chỉnh sửa bản nháp"}
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                        <button
                          onClick={() => deleteExam(exam.id)}
                          className="p-2 text-on-surface-variant dark:text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title={t('actions.delete')}
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                        <button
                          onClick={() => openShareModal(exam)}
                          className="p-2 text-on-surface-variant dark:text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                          title="Đưa vào Ngân hàng đề"
                        >
                          <span className="material-symbols-outlined text-xl">publish</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 pb-12">
        <div className="bg-white/80 dark:bg-[#0A1F3E]/80 p-6 rounded-2xl flex justify-center items-center gap-4 shadow-sm border border-outline-variant/10 text-on-surface-variant dark:text-slate-400/50">
          {t('notifications.empty')}
        </div>
      </div>

      {/* Share to Bank Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => !isSharing && setIsShareModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#0A1F3E] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-cyan-950/40">
              <h3 className="text-xl font-bold text-on-surface dark:text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">publish</span>
                Đưa đề thi vào Ngân hàng
              </h3>
            </div>
            
            <form onSubmit={handleShareToBank} className="p-6 space-y-5">
              <div className="bg-slate-50 dark:bg-cyan-950/20 p-4 rounded-xl border border-slate-100 dark:border-cyan-950/40">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Đề thi đang chọn:</p>
                <p className="font-bold text-on-surface dark:text-slate-200 mt-1 line-clamp-1">{examToShare?.title}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                  Chọn Chuyên Đề <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-cyan-950/20 border border-slate-200 dark:border-cyan-950/60 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/40 outline-none text-on-surface dark:text-slate-200 font-medium"
                >
                  <option value="" disabled>-- Chọn chuyên đề do Admin tạo --</option>
                  {folders.map((folder: any) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  disabled={isSharing}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedFolderId || isSharing}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSharing ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">refresh</span>
                      Đang xử lý...
                    </>
                  ) : (
                    "Xác nhận đưa vào"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
