"use client";
import { useMemo, useCallback, useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { authFetcher, getStoredUser } from "@/hooks/useAuthFetch";
import { StatCardSkeleton, TableRowSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { EDUCATION_HIERARCHY } from "@/lib/education-levels";

const API_BASE = "http://localhost:8088/api";

// ─── Verification Banner ─────────────────────────────────────────────────────
const VerificationBanner = ({ onVerifyClick }: { onVerifyClick: () => void }) => {
  const { data: verData } = useSWR(
    `${API_BASE}/users/me/verification`,
    authFetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const status = verData?.verificationStatus ?? "STANDARD";
  const note = verData?.note;

  if (status === "VERIFIED") return null;

  const config: Record<string, { bg: string; border: string; icon: string; iconColor: string; title: string; desc: string; actionLabel?: string }> = {
    STANDARD: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800/50",
      icon: "verified",
      iconColor: "text-amber-600",
      title: "Tài khoản đang ở chế độ dùng thử",
      desc: "Tối đa 2 lớp học · Đã mở khóa quyền truy cập Ngân hàng đề thi chung",
      actionLabel: "Xác thực ngay →",
    },
    PENDING: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800/50",
      icon: "hourglass_empty",
      iconColor: "text-blue-600",
      title: "Yêu cầu xác thực đang được xem xét",
      desc: "Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc. Trong thời gian chờ, bạn vẫn sử dụng được các tính năng cơ bản.",
    },
    REJECTED: {
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800/50",
      icon: "cancel",
      iconColor: "text-red-600",
      title: "Yêu cầu xác thực chưa được chấp thuận",
      desc: note ? `Lý do: ${note}` : "Vui lòng cập nhật thông tin và thử lại.",
      actionLabel: "Gửi lại yêu cầu →",
    },
  };

  const c = config[status] ?? config.STANDARD;

  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border ${c.bg} ${c.border} mb-2`}>
      <span className={`material-symbols-outlined text-2xl shrink-0 ${c.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-on-surface dark:text-slate-200">{c.title}</p>
        <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">{c.desc}</p>
      </div>
      {c.actionLabel && (
        <button
          onClick={onVerifyClick}
          className="shrink-0 px-4 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-current text-on-surface dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
        >
          {c.actionLabel}
        </button>
      )}
    </div>
  );
}

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
  const [shareGrade, setShareGrade] = useState("");
  const [shareSubject, setShareSubject] = useState("");
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
    setShareGrade(exam.grade || "");
    setShareSubject(exam.subject || "");
    setIsShareModalOpen(true);
    setSelectedFolderId("");
  }, []);

  const handleShareToBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examToShare) return;

    setIsSharing(true);
    try {
      // Create a copy of the exam for the bank
      const payload = {
        ...examToShare,
        id: undefined,
        title: examToShare.title,
        status: "PUBLISHED", // or PENDING if moderation is enabled
        grade: shareGrade,
        subject: shareSubject,
        isPractice: true,
        isBankItem: true,
        bankItem: true,
        folderId: null
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
        alert("Đã đưa đề thi vào Ngân hàng thành công!");
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
      {/* Verification Banner */}
      <VerificationBanner onVerifyClick={() => router.push("/teacher/verify")} />

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

      {/* Full-width container: Quick Actions */}
      <div className="w-full space-y-5 pb-12">
        {/* Quick action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => router.push("/teacher/exams?mode=ai")}
            className="group bg-white dark:bg-[#0A1F3E]/80 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl p-5 text-left hover:border-[#00C6FF]/40 hover:shadow-[0_8px_30px_rgba(0,198,255,0.08)] transition-all duration-300 active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-blue-600 dark:text-cyan-400" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <p className="font-extrabold text-on-surface dark:text-slate-100 text-sm">AI Tạo Đề</p>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1 font-medium">Upload tài liệu, AI biên soạn câu hỏi</p>
          </button>

          <button
            onClick={() => router.push("/teacher/exams?mode=manual")}
            className="group bg-white dark:bg-[#0A1F3E]/80 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl p-5 text-left hover:border-[#00C6FF]/40 hover:shadow-[0_8px_30px_rgba(0,198,255,0.08)] transition-all duration-300 active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>edit_document</span>
            </div>
            <p className="font-extrabold text-on-surface dark:text-slate-100 text-sm">Nhập Tay</p>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1 font-medium">Tự soạn từng câu hỏi chi tiết</p>
          </button>

          <button
            onClick={() => router.push("/teacher/exams/import")}
            className="group bg-white dark:bg-[#0A1F3E]/80 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl p-5 text-left hover:border-[#00C6FF]/40 hover:shadow-[0_8px_30px_rgba(0,198,255,0.08)] transition-all duration-300 active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
            </div>
            <p className="font-extrabold text-on-surface dark:text-slate-100 text-sm">Import File</p>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1 font-medium">Tải lên file đề thi có sẵn</p>
          </button>

          <button
            onClick={() => router.push("/teacher/exam-bank")}
            className="group bg-white dark:bg-[#0A1F3E]/80 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl p-5 text-left hover:border-[#00C6FF]/40 hover:shadow-[0_8px_30px_rgba(0,198,255,0.08)] transition-all duration-300 active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400" style={{ fontVariationSettings: "'FILL' 1" }}>library_books</span>
            </div>
            <p className="font-extrabold text-on-surface dark:text-slate-100 text-sm">Ngân Hàng Đề</p>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1 font-medium">Kho đề thi của cộng đồng</p>
          </button>
        </div>

        {/* Notification placeholder */}
        <div className="bg-white/80 dark:bg-[#0A1F3E]/80 p-5 rounded-2xl flex items-center gap-3 shadow-sm border border-outline-variant/10 text-on-surface-variant dark:text-slate-400/50">
          <span className="material-symbols-outlined opacity-40">notifications_none</span>
          <span className="text-sm">{t('notifications.empty')}</span>
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

              <div className="space-y-4 bg-blue-50/50 dark:bg-cyan-950/15 p-4 rounded-2xl border border-blue-100/50 dark:border-cyan-950/40">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  Vui lòng chọn cấp bậc và môn học để phân loại đề thi trong Ngân hàng đề thi. Học sinh sẽ tìm thấy đề thi này khi lọc theo các tiêu chí dưới đây.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Cấp bậc *</label>
                    <select
                      value={shareGrade}
                      onChange={e => {
                        setShareGrade(e.target.value);
                        setShareSubject("");
                      }}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#0A1F3E] text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    >
                      <option value="">-- Chọn --</option>
                      <optgroup label="Phổ Thông (K-12)">
                        {EDUCATION_HIERARCHY.filter(l => l.type === "K12").map(l => (
                          <option key={l.id} value={l.name}>{l.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Đại Học & Cao Đẳng">
                        {EDUCATION_HIERARCHY.filter(l => l.type === "UNIVERSITY").map(l => (
                          <option key={l.id} value={l.name}>{l.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Môn học *</label>
                    <select
                      value={shareSubject}
                      onChange={e => setShareSubject(e.target.value)}
                      required
                      disabled={!shareGrade}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-cyan-950/40 bg-white dark:bg-[#0A1F3E] text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/50 outline-none disabled:opacity-50"
                    >
                      <option value="">-- Chọn --</option>
                      {EDUCATION_HIERARCHY.find(l => l.name === shareGrade)?.subjects.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
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
                  disabled={isSharing}
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
