"use client";
import { useMemo, useCallback, useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { authFetcher, getStoredUser } from "@/hooks/useAuthFetch";
import { StatCardSkeleton, TableRowSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { EDUCATION_HIERARCHY } from "@/lib/education-levels";


const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api";

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

  const { data: classrooms = [], isLoading: isClassroomsLoading } = useSWR(
    user?.id ? `${API_BASE}/classrooms/teacher` : null,
    authFetcher,
    { revalidateOnFocus: false }
  );

  const { data: templates = [], isLoading: isTemplatesLoading } = useSWR(
    user?.id ? `${API_BASE}/exams/teacher/${user.id}/templates` : null,
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

  const upcomingExams = useMemo(() => {
    return [...exams]
      .filter(e => (e.status === 'PUBLISHED' || e.status === 'STARTED') && e.startTime)
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, 3);
  }, [exams]);

  const recentActivities = useMemo(() => {
    return [...exams]
      .sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime())
      .slice(0, 3);
  }, [exams]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 18) return t('greeting.afternoon');
    return t('greeting.evening');
  }, [t]);

  return (
    <main className="p-6 md:p-8 lg:p-10 space-y-8 min-h-screen bg-[#F4F7FB] dark:bg-[#0A0F1C] text-slate-800 dark:text-slate-100 font-sans">
      {/* Verification Banner */}
      <VerificationBanner onVerifyClick={() => router.push("/teacher/verify")} />

      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden bg-white dark:bg-[#111A2C] rounded-3xl p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800/60">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-cyan-300/20 dark:from-blue-600/10 dark:to-cyan-400/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">{user?.fullName || "Teacher"}</span> 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl leading-relaxed">
              Chào mừng bạn quay trở lại nền tảng. Dưới đây là tổng quan về các hoạt động giảng dạy và đánh giá học sinh của bạn trong hôm nay.
            </p>
            
            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <span className="material-symbols-outlined text-[20px]">task</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{exams.length}</p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">Tổng Đề Thi</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <span className="material-symbols-outlined text-[20px]">groups</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{classrooms.length}</p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">Lớp Học</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <button onClick={() => router.push("/teacher/exams?mode=ai")} className="group relative flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(14,165,233,0.25)] transition-all hover:scale-[1.02] active:scale-95 overflow-hidden">
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              <span className="text-[15px]">Tạo Đề Thi Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. QUICK ACTIONS */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-500 text-[20px]">bolt</span>
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={() => router.push("/teacher/exams?mode=ai")} className="flex flex-col items-start p-5 bg-white dark:bg-[#111A2C] border border-slate-200/60 dark:border-slate-800/60 rounded-2xl hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all group text-left">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Tạo Đề Bằng AI</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tự động hóa từ tài liệu</p>
          </button>
          
          <button onClick={() => router.push("/teacher/materials")} className="flex flex-col items-start p-5 bg-white dark:bg-[#111A2C] border border-slate-200/60 dark:border-slate-800/60 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all group text-left">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">library_books</span>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Tài liệu giảng dạy</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Quản lý bài giảng & tài liệu</p>
          </button>
          
          <button onClick={() => router.push("/teacher/reports")} className="flex flex-col items-start p-5 bg-white dark:bg-[#111A2C] border border-slate-200/60 dark:border-slate-800/60 rounded-2xl hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all group text-left">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Báo cáo phân tích</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Đánh giá quá trình học tập</p>
          </button>

          <button onClick={() => router.push("/teacher/exam-bank")} className="flex flex-col items-start p-5 bg-white dark:bg-[#111A2C] border border-slate-200/60 dark:border-slate-800/60 rounded-2xl hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all group text-left">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">local_library</span>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Ngân Hàng Đề</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Khám phá kho dữ liệu chung</p>
          </button>
        </div>
      </div>

      {/* 3. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: EXAM BANK PREVIEW */}
        <div className="xl:col-span-8">
          <div className="bg-white dark:bg-[#111A2C] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-blue-500">folder_open</span>
                Kho đề của tôi
              </h2>
              <button onClick={() => router.push('/teacher/exam-templates')} className="text-sm font-semibold text-blue-600 dark:text-cyan-400 hover:underline">
                Xem tất cả
              </button>
            </div>
            
            <div className="p-2">
              {isTemplatesLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-1/3"></div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : templates.length > 0 ? (
                <div className="flex flex-col">
                  {[...templates].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3).map((exam: any, idx: number, arr: any[]) => (
                    <div key={exam.id} className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-[#162137] rounded-2xl transition-colors ${idx !== arr.length - 1 ? 'border-b border-slate-50 dark:border-slate-800/30' : ''}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <span className="material-symbols-outlined">folder</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1" title={exam.title}>{exam.title}</h3>
                          <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">school</span> {exam.subject || "Chung"} - Khối {exam.grade || "Chung"}</span>
                            {exam.versions?.[0]?.questions?.length > 0 && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">format_list_numbered</span> {exam.versions[0].questions.length} câu</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 sm:mt-0 ml-16 sm:ml-0 flex items-center justify-between sm:justify-end gap-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700">
                          {exam.difficulty === 'EASY' ? '🟢 Dễ' : exam.difficulty === 'MEDIUM' ? '🟡 Vừa' : exam.difficulty === 'HARD' ? '🔴 Khó' : exam.difficulty === 'EXPERT' ? '🟣 Chuyên' : 'Chưa phân loại'}
                        </span>
                        
                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => router.push('/teacher/exam-templates')} className="px-3 py-1.5 flex items-center gap-1 rounded-lg bg-[#0C2E5E] text-white hover:bg-blue-700 font-semibold text-xs transition-colors">
                            <span className="material-symbols-outlined text-[14px]">send</span> Sử dụng
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">inbox</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-semibold mb-1">Kho đề của bạn đang trống</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Hãy thiết kế đề thi mới hoặc lưu từ ngân hàng chung.</p>
                  <button onClick={() => router.push("/teacher/exams?mode=manual")} className="px-5 py-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400 font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors text-sm">
                    Thiết kế Đề thi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CLASSROOMS & STATS */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* Classrooms Card */}
          <div className="bg-white dark:bg-[#111A2C] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-slate-400">school</span>
                Lớp học của tôi
              </h2>
              <button onClick={() => router.push('/teacher/classrooms')} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {isClassroomsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse h-20 bg-slate-50 dark:bg-[#162137] rounded-2xl"></div>
                  ))}
                </div>
              ) : classrooms.length > 0 ? (
                classrooms.slice(0, 4).map((cls: any) => (
                  <div key={cls.id} onClick={() => router.push(`/teacher/classrooms/${cls.id}`)} className="group p-4 bg-slate-50 dark:bg-[#162137] rounded-2xl border border-slate-100 dark:border-slate-800/50 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-white dark:hover:bg-[#1A263D] transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">{cls.name}</h3>
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1 text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md font-mono">{cls.code}</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">group</span> {cls.studentIds?.length || 0} học sinh</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-[#0A0F1C] border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 dark:group-hover:text-cyan-400 dark:group-hover:border-cyan-800 transition-all shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-6 bg-slate-50 dark:bg-[#162137] rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Bạn chưa quản lý lớp nào</p>
                  <button onClick={() => router.push("/teacher/classrooms")} className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline">Tạo lớp học mới &rarr;</button>
                </div>
              )}
            </div>
            {classrooms.length > 4 && (
              <div className="px-4 pb-4">
                <button onClick={() => router.push('/teacher/classrooms')} className="w-full py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#162137] rounded-xl transition-colors">
                  Xem tất cả {classrooms.length} lớp
                </button>
              </div>
            )}
        </div>
      </div>
      </div>

      {/* Share to Bank Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => !isSharing && setIsShareModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#111A2C] w-full max-w-md rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200/50 dark:border-slate-800/60">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">publish</span>
                Đưa vào Ngân Hàng
              </h3>
              <button onClick={() => !isSharing && setIsShareModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleShareToBank} className="p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-[#162137] p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Đề thi đang chọn</p>
                <p className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{examToShare?.title}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">Cấp bậc <span className="text-red-500">*</span></label>
                  <select
                    value={shareGrade}
                    onChange={e => {
                      setShareGrade(e.target.value);
                      setShareSubject("");
                    }}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0A0F1C] text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm"
                  >
                    <option value="">-- Chọn Cấp Bậc --</option>
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
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">Môn học <span className="text-red-500">*</span></label>
                  <select
                    value={shareSubject}
                    onChange={e => setShareSubject(e.target.value)}
                    required
                    disabled={!shareGrade}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0A0F1C] text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-[#162137]"
                  >
                    <option value="">-- Chọn Môn Học --</option>
                    {EDUCATION_HIERARCHY.find(l => l.name === shareGrade)?.subjects.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  disabled={isSharing}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSharing}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-blue-700 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSharing ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Đang xử lý
                    </>
                  ) : (
                    "Xác nhận"
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
