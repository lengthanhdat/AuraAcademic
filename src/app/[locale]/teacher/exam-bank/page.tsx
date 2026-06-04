"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { authFetcher } from "@/hooks/useAuthFetch";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import PublishToBankModal from "@/components/PublishToBankModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { EDUCATION_HIERARCHY } from "@/lib/education-levels";

const DIFFICULTY_CONFIG: Record<string, { label: string; cls: string }> = {
  EASY:   { label: "Dễ",     cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  MEDIUM: { label: "Vừa",    cls: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  HARD:   { label: "Khó",    cls: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  EXPERT: { label: "Chuyên", cls: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

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

        <div className="overflow-y-auto p-7 pt-5 space-y-5">
          {questions.length === 0 ? (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">article</span>
              <p className="text-sm text-slate-400">Chưa có câu hỏi nào trong đề thi này.</p>
            </div>
          ) : (
            questions.map((q: any, idx: number) => {
              return (
                <div
                  key={q.id || idx}
                  className="bg-slate-50 dark:bg-cyan-950/20 border border-slate-200/60 dark:border-cyan-950/30 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-xl bg-[#0C2E5E] dark:bg-cyan-900/60 text-white text-[11px] font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed flex-1">
                      {q.text || <em className="text-slate-400">Không có nội dung</em>}
                    </p>
                  </div>

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

export default function TeacherExamBankPage() {
  const router = useRouter();
  const locale = useLocale();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("Tất cả");
  const [selectedSubject, setSelectedSubject] = useState("Tất cả");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Tất cả");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "table">("list");
  const [examToView, setExamToView] = useState<any>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

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

  const [isVerifyingServerStatus, setIsVerifyingServerStatus] = useState(false);

  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setIsUserLoaded(true);

          if (parsed.role === "teacher" && parsed.verificationStatus !== "VERIFIED") {
            const token = localStorage.getItem("accessToken");
            if (token) {
              setIsVerifyingServerStatus(true);
              fetch(`${API_BASE}/users/me/verification`, {
                headers: { "Authorization": `Bearer ${token}` }
              })
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                  if (data && data.verificationStatus) {
                    if (data.verificationStatus !== parsed.verificationStatus) {
                      const updated = { ...parsed, verificationStatus: data.verificationStatus };
                      localStorage.setItem("user", JSON.stringify(updated));
                      setUser(updated);
                      window.dispatchEvent(new Event("user-updated"));
                    }
                  }
                })
                .catch(err => console.error("Error updating user verification:", err))
                .finally(() => {
                  setIsVerifyingServerStatus(false);
                });
            }
          }
        } else {
          setUser({});
          setIsUserLoaded(true);
        }
      } catch {
        setUser({});
        setIsUserLoaded(true);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        loadUser();
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

    loadUser();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-updated", handleUserUpdated);
    };
  }, []);

  const isUnverified = false;

  const { data: items = [], isLoading, mutate } = useSWR(
    (!isUserLoaded || isUnverified || isVerifyingServerStatus) ? null : `${API_BASE}/exam-bank/exams`,
    authFetcher,
    { revalidateOnFocus: false }
  );

  const showLockScreen = isUserLoaded && isUnverified && !isVerifyingServerStatus;
  const showLoading = !isUserLoaded || isLoading || isVerifyingServerStatus;

  const filtered = items.filter((item: any) => {
    const matchSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGrade = selectedGrade === "Tất cả" || item.grade === selectedGrade;
    const matchSubject = selectedSubject === "Tất cả" || item.subject === selectedSubject;
    const matchDifficulty = selectedDifficulty === "Tất cả" || item.difficulty === selectedDifficulty;
    return matchSearch && matchGrade && matchSubject && matchDifficulty;
  });

  const availableSubjects = selectedGrade === "Tất cả" 
    ? Array.from(new Set(EDUCATION_HIERARCHY.flatMap(l => l.subjects.map(s => s.name))))
    : EDUCATION_HIERARCHY.find(l => l.name === selectedGrade)?.subjects.map(s => s.name) || [];

  const handleRemoveExam = async (examId: string) => {
    if (!confirm("Xác nhận gỡ đề thi này khỏi ngân hàng? (Chỉ gỡ nhãn luyện tập)")) return;
    setRemovingId(examId);
    try {
      const res = await fetch(`${API_BASE}/exams/${examId}/remove-from-bank`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
      });
      if (res.ok) mutate();
      else alert("Lỗi khi gỡ đề thi.");
    } catch {
      alert("Lỗi kết nối.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleViewExam = async (exam: any) => {
    if (!exam?.id || viewingId) return;
    setViewingId(exam.id);
    try {
      const res = await fetch(`${API_BASE}/exams/${exam.id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Không thể tải nội dung đề thi.");

      const detail = await res.json();
      setExamToView({ ...exam, ...detail });
    } catch (err: any) {
      toast.error(err?.message || "Không thể tải nội dung đề thi.");
    } finally {
      setViewingId(null);
    }
  };

  if (showLockScreen) {
    return (
      <main className="p-8 max-w-2xl mx-auto w-full min-h-[70vh] flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <section className="bg-white dark:bg-[#0A1F3E]/90 border border-slate-200/60 dark:border-cyan-950/40 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(12,46,94,0.05)] dark:shadow-[0_20px_50px_rgba(0,198,255,0.03)] text-center relative overflow-hidden flex flex-col items-center gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative">
            <div className="w-20 h-20 rounded-[2rem] bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner-sm animate-pulse">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-1 border-4 border-white dark:border-[#0A1F3E]">
              <span className="material-symbols-outlined text-xs font-black">gavel</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <h2 className="font-headline font-black text-2xl text-on-surface dark:text-slate-100 tracking-tight">
              Tính năng bảo mật giới hạn
            </h2>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-4 py-1.5 rounded-full border border-amber-200/50 dark:border-amber-900/40">
              Yêu cầu tài khoản giáo viên đã xác thực
            </p>
          </div>

          <p className="text-xs text-on-surface-variant dark:text-slate-400 max-w-md leading-relaxed">
            Ngân hàng đề thi chung chứa đề luyện tập, chuyên đề học tập chính thức và đáp án chi tiết. Tính năng này được giới hạn nghiêm ngặt nhằm bảo mật tuyệt đối đề thi, tránh tình trạng học sinh giả mạo giáo viên để xem đáp án trước khi thi.
          </p>

          <div className="w-full border-t border-slate-100 dark:border-cyan-950/40 pt-6 mt-2 flex flex-col gap-3">
            <button
              onClick={() => router.push(`/${locale}/teacher/verify`)}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:opacity-95 text-white font-black text-sm rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">verified</span>
              Xác thực tài khoản ngay
            </button>
            <button
              onClick={() => router.push(`/${locale}/teacher/dashboard`)}
              className="w-full py-3.5 bg-slate-100 dark:bg-cyan-950/30 dark:text-slate-300 text-slate-600 font-bold text-sm rounded-2xl hover:bg-slate-200 transition-colors"
            >
              Quay về Bảng điều khiển
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <ScrollReveal variant="fade-up" duration={600}>
        <section className="bg-gradient-to-br from-[#0C2E5E] via-[#14508F] to-[#00A6D6] p-6 sm:p-8 rounded-3xl shadow-lg text-white">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 mb-5">
                <span className="material-symbols-outlined text-3xl text-white">account_balance</span>
              </div>
              <h1 className="font-headline font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight mb-3">
                Ngân hàng Đề thi
              </h1>
              <p className="text-white/85 max-w-2xl leading-relaxed text-sm sm:text-base">
                Quản lý đề luyện tập được chia sẻ trong hệ thống, lọc nhanh theo cấp bậc và môn học.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsPublishModalOpen(true)}
                  className="h-12 px-5 bg-white text-[#0C2E5E] font-extrabold rounded-xl text-sm shadow-xl transition-colors flex items-center justify-center gap-2 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-white/70 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">library_add</span>
                  Thêm từ Kho đề
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur-sm">
              <div className="rounded-xl bg-white/95 p-4 text-[#0C2E5E]">
                <p className="text-2xl font-black leading-none">{items.length}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">Tổng đề</p>
              </div>
              <div className="rounded-xl bg-white/95 p-4 text-[#0C2E5E]">
                <p className="text-2xl font-black leading-none">{filtered.length}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">Đang lọc</p>
              </div>
              <div className="rounded-xl bg-white/95 p-4 text-[#0C2E5E]">
                <p className="text-2xl font-black leading-none">{availableSubjects.length}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">Môn học</p>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <PublishToBankModal 
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSuccess={mutate}
      />

      {/* ─── Statistics & Analysis ─────────────────────────── */}
      {!showLoading && items.length > 0 && (
        <ScrollReveal variant="fade-up" duration={600} delay={40}>
          <section className="grid md:grid-cols-2 gap-4">
            {/* Phân bố độ khó */}
            <div className="bg-white dark:bg-[#0A1F3E]/70 border border-slate-200/70 dark:border-cyan-950/40 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-[18px]">bar_chart</span>
                Phân tích Độ khó Đề thi
              </h2>
              <div className="space-y-3">
                {[
                  { key: 'EASY', label: 'Dễ', color: 'bg-emerald-500' },
                  { key: 'MEDIUM', label: 'Trung bình', color: 'bg-amber-500' },
                  { key: 'HARD', label: 'Khó', color: 'bg-red-500' },
                  { key: 'EXPERT', label: 'Chuyên gia', color: 'bg-purple-500' }
                ].map((diff) => {
                  const count = items.filter((e: any) => e.difficulty === diff.key).length;
                  const percent = Math.round((count / Math.max(items.length, 1)) * 100);
                  return (
                    <div key={diff.key} className="flex items-center gap-3">
                      <span className="text-xs font-bold w-20 text-slate-500">{diff.label}</span>
                      <div className="flex-1 h-2.5 bg-slate-100 dark:bg-cyan-950/40 rounded-full overflow-hidden flex">
                        <div className={`h-full ${diff.color} rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-12 text-right">{count} đề</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top môn học */}
            <div className="bg-white dark:bg-[#0A1F3E]/70 border border-slate-200/70 dark:border-cyan-950/40 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-500 text-[18px]">pie_chart</span>
                Top 4 Môn học phổ biến nhất
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const subCount: Record<string, number> = {};
                  items.forEach((e: any) => { if (e.subject) subCount[e.subject] = (subCount[e.subject] || 0) + 1; });
                  const top = Object.entries(subCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
                  return top.length > 0 ? top.map(([sub, count]) => (
                    <div key={sub} className="bg-slate-50 dark:bg-cyan-950/20 rounded-xl p-3 border border-slate-100 dark:border-cyan-950/30 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 line-clamp-1">{sub}</span>
                      <span className="text-[10px] font-black text-sky-600 bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 rounded-md">{count} đề</span>
                    </div>
                  )) : (
                    <div className="col-span-2 text-xs text-slate-400 text-center py-4">Chưa có dữ liệu phân loại môn học</div>
                  );
                })()}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      <ScrollReveal variant="fade-up" duration={600} delay={80}>
        <section className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-cyan-950/40 dark:bg-[#0A1F3E]/70">
          <div className="grid gap-3 xl:grid-cols-[minmax(200px,1fr)_180px_180px_180px_auto_auto] xl:items-center">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input
              type="text"
              placeholder="Tìm theo tên đề thi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 w-full pl-12 pr-4 bg-slate-50 dark:bg-[#071A33]/70 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none transition-all text-sm font-medium text-on-surface dark:text-slate-200"
            />
          </div>

            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 text-lg">school</span>
              <select
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setSelectedSubject("Tất cả");
                }}
                className="h-12 w-full pl-10 pr-9 bg-slate-50 dark:bg-[#071A33]/70 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
              >
                <option value="Tất cả">Tất cả cấp bậc</option>
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
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
            </div>

            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 text-lg">category</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="h-12 w-full pl-10 pr-9 bg-slate-50 dark:bg-[#071A33]/70 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
              >
                <option value="Tất cả">Tất cả môn học</option>
                {availableSubjects.map((sub: string) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
            </div>

            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 text-lg">bar_chart</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="h-12 w-full pl-10 pr-9 bg-slate-50 dark:bg-[#071A33]/70 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
              >
                <option value="Tất cả">Tất cả độ khó</option>
                <option value="EASY">Dễ</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HARD">Khó</option>
                <option value="EXPERT">Chuyên gia</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
            </div>

            <div className="flex h-12 items-center justify-center bg-slate-100 dark:bg-cyan-950/40 p-1 rounded-xl border border-slate-200/50 dark:border-cyan-950/30">
              <button
                onClick={() => setViewMode("list")}
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${viewMode === "list" ? "bg-white dark:bg-[#0A1F3E] text-indigo-600 dark:text-cyan-400 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                title="Dạng danh sách"
              >
                <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${viewMode === "table" ? "bg-white dark:bg-[#0A1F3E] text-indigo-600 dark:text-cyan-400 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                title="Dạng bảng"
              >
                <span className="material-symbols-outlined text-lg">table_chart</span>
              </button>
            </div>

            <div className="flex h-12 items-center justify-center gap-2 px-4 bg-[#0C2E5E] text-white rounded-xl xl:min-w-[124px]">
              <span className="material-symbols-outlined text-white/80 text-lg">quiz</span>
              <span className="text-sm font-extrabold">
                {filtered.length} đề thi
              </span>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" duration={600} delay={150}>
        {showLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
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
              {searchTerm ? "search_off" : "quiz"}
            </span>
            <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">
              {searchTerm ? "Không tìm thấy đề phù hợp" : "Ngân hàng chưa có đề thi nào"}
            </p>
          </div>
        ) : viewMode === "table" ? (
          <div className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200/60 dark:border-cyan-950/40 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-cyan-950/40 bg-slate-50/50 dark:bg-cyan-950/20">
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Đề thi</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Môn học</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Thông số</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Độ khó</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-cyan-950/30">
                  {filtered.map((exam: any) => {
                    const diff = exam.difficulty ? DIFFICULTY_CONFIG[exam.difficulty] : null;
                    const isRemoving = removingId === exam.id;
                    return (
                      <tr
                        key={exam.id}
                        className="group hover:bg-slate-50/50 dark:hover:bg-[#0E2D56]/30 transition-colors"
                      >
                        <td className="py-4 px-6 min-w-[250px]">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-indigo-500 text-lg">quiz</span>
                            </div>
                            <span className="font-bold text-on-surface dark:text-slate-100 text-sm line-clamp-1">
                              {exam.title?.replace(/\s*\(Ngân hàng\)/gi, "")}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-lg border border-slate-100 dark:border-cyan-950/20">
                            {exam.subject || "Chưa rõ"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-0.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">format_list_numbered</span>
                              {exam.questionCount > 0 ? `${exam.questionCount} câu` : "--"}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {exam.duration > 0 ? `${exam.duration} phút` : "--"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {diff ? (
                            <span className={`px-2 py-0.5 text-[10px] font-black rounded-md inline-block uppercase tracking-wider ${diff.cls}`}>
                              {diff.label}
                            </span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleViewExam(exam)}
                              disabled={viewingId === exam.id}
                              title="Xem chi tiết"
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <span className={`material-symbols-outlined text-lg ${viewingId === exam.id ? "animate-spin" : ""}`}>
                                {viewingId === exam.id ? "progress_activity" : "visibility"}
                              </span>
                            </button>
                            {user?.id === exam.teacherId && (
                              <button
                                onClick={() => handleRemoveExam(exam.id)}
                                disabled={isRemoving}
                                title="Gỡ khỏi ngân hàng"
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-900/30 text-slate-400 hover:text-orange-500 transition-all disabled:opacity-40"
                              >
                                <span className={`material-symbols-outlined text-lg ${isRemoving ? "animate-spin" : ""}`}>
                                  {isRemoving ? "refresh" : "link_off"}
                                </span>
                              </button>
                            )}
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
          <div className="space-y-3">
            {filtered.map((exam: any) => {
              const diff = exam.difficulty ? DIFFICULTY_CONFIG[exam.difficulty] : null;
              const isRemoving = removingId === exam.id;
              return (
                <div
                  key={exam.id}
                  className="group flex gap-4 p-5 bg-white dark:bg-[#0A1F3E]/60 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl shadow-sm hover:shadow-md hover:border-[#00C6FF]/40 transition-all items-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-white text-xl">quiz</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      {diff && (
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${diff.cls}`}>
                          {diff.label}
                        </span>
                      )}
                      {exam.subject && (
                        <span className="px-2 py-0.5 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-[#00C6FF] text-[9px] font-black uppercase tracking-wider rounded border border-cyan-100/30 dark:border-cyan-950/50">
                          {exam.subject}
                        </span>
                      )}
                      {exam.questionCount > 0 && (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[9px] font-bold rounded">
                          {exam.questionCount} câu hỏi
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base leading-snug line-clamp-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {exam.title?.replace(/\s*\(Ngân hàng\)/gi, "")}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleViewExam(exam)}
                      disabled={viewingId === exam.id}
                      title="Xem chi tiết"
                      className="p-2 text-slate-400 hover:text-[#0C2E5E] dark:hover:text-[#00C6FF] hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined text-lg ${viewingId === exam.id ? "animate-spin" : ""}`}>
                        {viewingId === exam.id ? "progress_activity" : "visibility"}
                      </span>
                    </button>
                    {user?.id === exam.teacherId && (
                      <button
                        onClick={() => handleRemoveExam(exam.id)}
                        disabled={isRemoving}
                        title="Gỡ khỏi ngân hàng đề thi"
                        className="p-2 text-slate-400 hover:text-orange-500 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-xl transition-all disabled:opacity-40"
                      >
                        <span className={`material-symbols-outlined text-lg ${isRemoving ? "animate-spin" : ""}`}>
                          {isRemoving ? "refresh" : "link_off"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollReveal>

      {/* Exam Detail Modal */}
      <ExamDetailModal
        isOpen={!!examToView}
        onClose={() => setExamToView(null)}
        exam={examToView}
      />
    </main>
  );
}
