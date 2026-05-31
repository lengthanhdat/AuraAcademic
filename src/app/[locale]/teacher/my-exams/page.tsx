"use client";
import { useMemo, useCallback, useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { authFetcher, getStoredUser } from "@/hooks/useAuthFetch";
import { StatCardSkeleton, TableRowSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { toast } from "sonner";
import { EDUCATION_HIERARCHY } from "@/lib/education-levels";

const API_BASE = "http://localhost:8088/api";

// ─── Exam Detail Modal ─────────────────────────────────────────────────
const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

const ExamDetailModal = ({
  isOpen,
  onClose,
  exam,
}: {
  isOpen: boolean;
  onClose: () => void;
  exam: any;
}) => {
  const questions = exam?.versions?.[0]?.questions || [];

  if (!isOpen || !exam) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#071829] border border-slate-200 dark:border-cyan-900/40 rounded-[2rem] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-7 pb-4 border-b border-slate-100 dark:border-cyan-950/40 shrink-0">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Nội dung đề thi</p>
            <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100 tracking-tight">{exam.title}</h3>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">help</span>
                {questions.length} câu hỏi
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {exam.duration} phút
              </span>
              {exam.difficulty && (
                <>
                  <span>•</span>
                  <span>{
                    exam.difficulty === "EASY" ? "🟢 Dễ" :
                    exam.difficulty === "MEDIUM" ? "🟡 Trung bình" :
                    exam.difficulty === "HARD" ? "🔴 Khó" : "🟣 Chuyên gia"
                  }</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-cyan-950/40 transition-all shrink-0 ml-4"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Question List */}
        <div className="overflow-y-auto p-7 pt-5 space-y-5">
          {questions.length === 0 ? (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">article</span>
              <p className="text-sm text-slate-400">Chưa có câu hỏi nào trong đề thi này.</p>
            </div>
          ) : (
            questions.map((q: any, idx: number) => {
              const correctIdx = q.options?.findIndex((o: any) => o.isCorrect ?? o.correct);
              return (
                <div
                  key={q.id || idx}
                  className="bg-slate-50 dark:bg-cyan-950/20 border border-slate-200/60 dark:border-cyan-950/30 rounded-2xl p-5 space-y-3"
                >
                  {/* Question header */}
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-xl bg-[#0C2E5E] dark:bg-cyan-900/60 text-white text-[11px] font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed flex-1">
                      {q.text || <em className="text-slate-400">Không có nội dung</em>}
                    </p>
                  </div>

                  {/* Options */}
                  {q.options?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-10">
                      {q.options.map((opt: any, oIdx: number) => {
                        const isCorrect = opt.isCorrect ?? opt.correct;
                        return (
                          <div
                            key={opt.id || oIdx}
                            className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                              isCorrect
                                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300"
                                : "bg-white dark:bg-cyan-950/20 border-slate-200 dark:border-cyan-950/30 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            <span className={`shrink-0 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                              isCorrect
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-200 dark:bg-cyan-950/50 text-slate-500 dark:text-slate-400"
                            }`}>
                              {OPTION_LABELS[oIdx] || oIdx + 1}
                            </span>
                            <span className="leading-relaxed">{opt.text || "(Trống)"}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-7 pt-4 border-t border-slate-100 dark:border-cyan-950/40 flex justify-between items-center shrink-0">
          <p className="text-[10px] text-slate-400 font-medium">
            ✓ Đáp án đúng được highlight màu xanh lá
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 dark:bg-cyan-950/40 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-cyan-950/60 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
const ShareToBankModal = ({
  isOpen,
  onClose,
  exam,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  exam: any;
  onSuccess: () => void;
}) => {
  const user = useMemo(() => getStoredUser(), []);
  const [grade, setGrade] = useState(exam?.grade || "");
  const [subject, setSubject] = useState(exam?.subject || "");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const { data: folders = [] } = useSWR(
    user?.id ? `${API_BASE}/exam-bank/teacher/${user.id}/folders` : null,
    authFetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (exam) {
      setGrade(exam.grade || "");
      setSubject(exam.subject || "");
    }
  }, [exam]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam || !grade || !subject) return;

    setIsSharing(true);
    try {
      const payload = {
        ...exam,
        id: undefined,
        title: exam.title,
        grade,
        subject,
        folderId: selectedFolderId || null,
        isPractice: true,
        isBankItem: true,
        teacherId: user?.id,
        teacherName: user?.fullName || "Giáo viên",
        status: "PUBLISHED",
        accessCode: null,
      };

      const res = await fetch(`${API_BASE}/exam-bank/exams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Đã đưa đề thi vào Ngân hàng thành công!");
        onSuccess();
        onClose();
      } else {
        alert("Lỗi khi đưa đề thi vào Ngân hàng.");
      }
    } catch {
      alert("Lỗi kết nối.");
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen || !exam) return null;

  const subjects = grade
    ? EDUCATION_HIERARCHY.find((l) => l.name === grade)?.subjects.map((s) => s.name) || []
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <h3 className="font-headline font-black text-xl text-on-surface dark:text-slate-200 mb-2">
          Đưa đề thi vào Ngân hàng
        </h3>
        <p className="text-xs text-on-surface-variant dark:text-slate-400 mb-6">
          Đề thi của bạn sẽ được chia sẻ vào Ngân hàng luyện tập để học sinh có thể ôn tập.
        </p>

        <form onSubmit={handleShare} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Tên đề thi
            </label>
            <input
              type="text"
              readOnly
              value={exam.title}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-cyan-950/20 border border-slate-200 dark:border-cyan-950/40 rounded-xl text-xs font-semibold text-slate-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Cấp bậc *
              </label>
              <select
                required
                value={grade}
                onChange={(e) => {
                  setGrade(e.target.value);
                  setSubject("");
                }}
                className="w-full px-3 py-2.5 bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="">Chọn cấp bậc</option>
                {EDUCATION_HIERARCHY.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Môn học *
              </label>
              <select
                required
                disabled={!grade}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none disabled:opacity-55"
              >
                <option value="">Chọn môn</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Thư mục lưu trữ (Tùy chọn)
            </label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="">Không phân thư mục</option>
              {folders.map((f: any) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-cyan-950/40 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-cyan-950/30 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSharing || !grade || !subject}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white text-xs font-black rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSharing ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Đang chia sẻ...
                </>
              ) : (
                "Chia sẻ ngay"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page Component ─────────────────────────────────────────────────────
export default function TeacherMyExamsPage() {
  const router = useRouter();
  const t = useTranslations("Dashboard");
  const user = useMemo(() => getStoredUser(), []);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [examToShare, setExamToShare] = useState<any>(null);
  const [examToView, setExamToView] = useState<any>(null);

  // Fetch teacher exams
  const { data: exams = [], isLoading, mutate } = useSWR(
    user?.id ? `${API_BASE}/exams/teacher/${user.id}` : null,
    authFetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  // Active student counts polling for LIVE exams
  const liveExams = useMemo(() =>
    exams.filter((e: any) => {
      if (e.status !== "STARTED") return false;
      if (!e.startTime) return true;
      const endTime = e.startTime + (e.duration * 60 * 1000);
      return Date.now() <= endTime;
    }),
    [exams]
  );

  const liveAccessCodes = useMemo(() => liveExams.map((e: any) => e.accessCode).join(","), [liveExams]);

  const { data: activeCountMap = {} } = useSWR(
    liveAccessCodes ? `my-exams-active-counts-${liveAccessCodes}` : null,
    async () => {
      const updates: Record<string, number> = {};
      await Promise.all(
        liveExams.map(async (exam: any) => {
          try {
            const res = await fetch(`${API_BASE}/exams/${exam.accessCode}/active-count`, {
              headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
            });
            if (res.ok) {
              const data = await res.json();
              updates[exam.accessCode] = data.activeCount;
            }
          } catch {}
        })
      );
      return updates;
    },
    { refreshInterval: 10000, revalidateOnFocus: false }
  );

  // Stat metrics
  const stats = useMemo(() => {
    const total = exams.length;
    const live = exams.filter((e: any) => e.status === "STARTED").length;
    const ready = exams.filter((e: any) => e.status === "PUBLISHED").length;
    const draft = exams.filter((e: any) => e.status === "DRAFT").length;
    const completed = exams.filter((e: any) => e.status === "FINISHED" || e.status === "COMPLETED").length;
    return { total, live, ready, draft, completed };
  }, [exams]);

  // Actions
  const deleteExam = useCallback(
    async (id: string) => {
      if (!confirm(t("actions.delete_confirm"))) return;
      try {
        const res = await fetch(`${API_BASE}/exams/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        if (res.ok) {
          mutate((prev: any[]) => prev?.filter((e) => e.id !== id), false);
          toast.success("Xóa đề thi thành công.");
        }
      } catch {
        alert(t("actions.delete_error"));
      }
    },
    [t, mutate]
  );

  const closeExam = useCallback(
    async (id: string) => {
      if (!confirm(t("actions.close_confirm"))) return;
      try {
        const res = await fetch(`${API_BASE}/exams/${id}/close`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        if (res.ok) mutate();
      } catch {
        alert(t("actions.close_error"));
      }
    },
    [t, mutate]
  );

  const reopenExam = useCallback(
    async (id: string) => {
      if (!confirm(t("actions.reopen_confirm"))) return;
      try {
        const res = await fetch(`${API_BASE}/exams/${id}/reopen`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        if (res.ok) mutate();
      } catch {
        alert(t("actions.reopen_error"));
      }
    },
    [t, mutate]
  );

  const filteredExams = useMemo(() => {
    return exams.filter((exam: any) => {
      const matchSearch = exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.accessCode?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (statusFilter === "ALL") return matchSearch;
      if (statusFilter === "LIVE") return matchSearch && exam.status === "STARTED";
      if (statusFilter === "READY") return matchSearch && exam.status === "PUBLISHED";
      if (statusFilter === "DRAFT") return matchSearch && exam.status === "DRAFT";
      if (statusFilter === "COMPLETED") return matchSearch && (exam.status === "FINISHED" || exam.status === "COMPLETED");
      return matchSearch;
    });
  }, [exams, searchTerm, statusFilter]);

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Đã sao chép mã phòng thi: " + code);
  };

  return (
    <main className="p-8 space-y-8 max-w-6xl mx-auto w-full pb-16">
      {/* Header Banner */}
      <section className="bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] p-8 rounded-[2rem] shadow-lg relative overflow-hidden text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-4xl text-white">assignment</span>
          </div>
          <h2 className="font-headline font-extrabold text-4xl tracking-tight mb-2">
            Kỳ thi của tôi
          </h2>
          <p className="text-white/80 max-w-lg leading-relaxed text-sm">
            Quản lý toàn bộ danh sách kỳ thi và đề thi do bạn biên soạn. Xem thống kê, giám sát phòng thi trực tuyến và đưa đề thi vào Ngân hàng chung.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={() => router.push("/teacher/exams?mode=ai")}
            className="px-5 py-3 bg-white text-[#0C2E5E] font-black rounded-xl text-xs shadow-xl transition-all hover:scale-105"
          >
            Tạo đề thi mới
          </button>
        </div>
      </section>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <div className="bg-white dark:bg-[#0A1F3E]/60 p-5 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tổng kỳ thi</p>
              <p className="text-3xl font-black mt-1 text-slate-800 dark:text-slate-100 font-headline">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-[#0A1F3E]/60 p-5 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 border-l-4 border-l-emerald-500 hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Đang diễn ra (LIVE)</p>
              <p className="text-3xl font-black mt-1 text-emerald-600 dark:text-emerald-400 font-headline">{stats.live}</p>
            </div>
            <div className="bg-white dark:bg-[#0A1F3E]/60 p-5 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 border-l-4 border-l-blue-500 hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Sẵn sàng (Scheduled)</p>
              <p className="text-3xl font-black mt-1 text-blue-600 dark:text-blue-400 font-headline">{stats.ready}</p>
            </div>
            <div className="bg-white dark:bg-[#0A1F3E]/60 p-5 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 border-l-4 border-l-amber-500 hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Đang soạn (Draft)</p>
              <p className="text-3xl font-black mt-1 text-amber-600 dark:text-amber-400 font-headline">{stats.draft}</p>
            </div>
            <div className="bg-white dark:bg-[#0A1F3E]/60 p-5 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 border-l-4 border-l-slate-400 hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Đã kết thúc</p>
              <p className="text-3xl font-black mt-1 text-slate-500 dark:text-slate-300 font-headline">{stats.completed}</p>
            </div>
          </>
        )}
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white dark:bg-[#0A1F3E]/60 border border-slate-200/60 dark:border-cyan-950/40 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full md:max-w-xs shrink-0">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Tìm đề thi, mã phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-cyan-950/30 border border-slate-200/60 dark:border-cyan-950/40 rounded-xl text-xs font-semibold outline-none focus:border-[#00C6FF] dark:text-slate-200"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "LIVE", label: "Đang diễn ra" },
            { id: "READY", label: "Sẵn sàng" },
            { id: "DRAFT", label: "Bản nháp" },
            { id: "COMPLETED", label: "Đã đóng" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                statusFilter === tab.id
                  ? "bg-[#0C2E5E] dark:bg-cyan-950 text-white border-[#0C2E5E] shadow-md shadow-blue-500/10"
                  : "bg-white dark:bg-[#0A1F3E]/80 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-cyan-950/40 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List Layout */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <TableRowSkeleton key={i} />)}
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="bg-white dark:bg-[#0A1F3E]/60 border border-slate-200/50 dark:border-cyan-950/40 rounded-[2rem] py-16 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">folder_open</span>
            <h4 className="font-bold text-base text-slate-700 dark:text-slate-300">Không tìm thấy kỳ thi nào</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Bạn chưa tạo đề thi nào phù hợp với bộ lọc tìm kiếm hiện tại. Hãy tạo đề thi mới ngay!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredExams.map((exam: any) => {
              const isLive = exam.status === "STARTED";
              const isPublished = exam.status === "PUBLISHED";
              const isDraft = exam.status === "DRAFT";
              const isFinished = exam.status === "FINISHED" || exam.status === "COMPLETED";
              const activeCount = activeCountMap[exam.accessCode] || 0;

              return (
                <div
                  key={exam.id}
                  className="bg-white dark:bg-[#0A1F3E]/60 border border-slate-200/80 dark:border-cyan-950/40 rounded-[2rem] p-6 hover:border-[#00C6FF]/40 hover:shadow-[0_12px_30px_-6px_rgba(0,198,255,0.12)] hover:-translate-y-1 transition-all duration-300 relative group flex flex-col justify-between min-h-[180px] overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:scale-125 pointer-events-none" />
                  
                  <div className="relative z-10">
                    {/* Top Row: Badges & Access Code */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div>
                        {isLive && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ĐANG DIỄN RA
                          </span>
                        )}
                        {isPublished && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/20">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            SẴN SÀNG
                          </span>
                        )}
                        {isDraft && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                            BẢN NHÁP
                          </span>
                        )}
                        {isFinished && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider border border-slate-500/20">
                            ĐÃ KẾT THÚC
                          </span>
                        )}
                      </div>

                      {exam.accessCode && (
                        <button
                          onClick={() => copyAccessCode(exam.accessCode)}
                          title="Click để sao chép"
                          className="px-3 py-1 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100/50 dark:border-cyan-900/30 rounded-lg text-xs font-mono font-black text-cyan-600 dark:text-[#00C6FF] flex items-center gap-1.5 tracking-widest active:scale-95 transition-transform"
                        >
                          <span className="material-symbols-outlined text-xs">key</span>
                          {exam.accessCode}
                        </button>
                      )}
                    </div>

                    {/* Title & Subject info */}
                    <h3 className="font-extrabold text-lg text-slate-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1 leading-snug">
                      {exam.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      <span>{exam.versions?.[0]?.questions?.length || 0} câu hỏi</span>
                      <span>•</span>
                      <span>{exam.duration} phút</span>
                      {(exam.grade || exam.subject) && (
                        <>
                          <span>•</span>
                          <span className="text-[#00C6FF] font-black uppercase tracking-wider bg-cyan-500/5 px-2 py-0.5 rounded">
                            {exam.grade} {exam.subject ? `- ${exam.subject}` : ""}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Active live count & Action panel */}
                  <div className="flex items-end justify-between gap-4 border-t border-slate-100 dark:border-cyan-950/30 pt-4 mt-5 relative z-10">
                    {/* Live status indicators */}
                    <div>
                      {isLive ? (
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">groups</span>
                          {activeCount} học sinh đang thi
                        </p>
                      ) : (
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                          Tạo ngày {new Date(exam.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      {isLive && (
                        <button
                          onClick={() => closeExam(exam.id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-extrabold transition-colors border border-red-200/30 dark:border-red-950/50"
                          title="Đóng phòng thi"
                        >
                          Đóng phòng
                        </button>
                      )}
                      {isFinished && (
                        <button
                          onClick={() => reopenExam(exam.id)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-extrabold transition-colors border border-blue-200/30 dark:border-blue-950/50"
                          title="Mở lại phòng thi"
                        >
                          Mở lại
                        </button>
                      )}
                      
                      {/* Share to Bank button for non-draft exams */}
                      {!isDraft && (
                        <button
                          onClick={() => {
                            setExamToShare(exam);
                            setIsShareModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-xl transition-colors"
                          title="Chia sẻ vào Ngân hàng đề"
                        >
                          <span className="material-symbols-outlined text-lg">share</span>
                        </button>
                      )}

                      {/* View detail */}
                      <button
                        onClick={() => setExamToView(exam)}
                        className="p-2 text-slate-400 hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-xl transition-colors"
                        title="Xem nội dung đề thi"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>

                      {/* Go inside exam proctoring */}
                      <button
                        onClick={() => router.push(`/teacher/exam-room/${exam.id}`)}
                        className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-xl transition-colors"
                        title="Vào phòng thi"
                      >
                        <span className="material-symbols-outlined text-lg">meeting_room</span>
                      </button>

                      {/* Edit Exam */}
                      <button
                        onClick={() => router.push(`/teacher/exams?edit=${exam.id}`)}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-xl transition-colors"
                        title="Chỉnh sửa đề thi"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deleteExam(exam.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-xl transition-colors"
                        title="Xóa đề thi vĩnh viễn"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareToBankModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setExamToShare(null);
        }}
        exam={examToShare}
        onSuccess={mutate}
      />

      {/* Exam Detail Modal */}
      <ExamDetailModal
        isOpen={!!examToView}
        onClose={() => setExamToView(null)}
        exam={examToView}
      />
    </main>
  );
}
