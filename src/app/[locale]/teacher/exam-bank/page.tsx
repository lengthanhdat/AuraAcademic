"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { authFetcher } from "@/hooks/useAuthFetch";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import PublishToBankModal from "@/components/PublishToBankModal";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { ALL_SUBJECTS } from "@/lib/curriculum";

const DIFFICULTY_CONFIG: Record<string, { label: string; cls: string }> = {
  EASY:   { label: "Dễ",     cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  MEDIUM: { label: "Vừa",    cls: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  HARD:   { label: "Khó",    cls: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  EXPERT: { label: "Chuyên", cls: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

export default function TeacherExamBankPage() {
  const router = useRouter();
  const locale = useLocale();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("Tất cả");
  const [selectedSubject, setSelectedSubject] = useState("Tất cả");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser({});
        }
      } catch {
        setUser({});
      }
      setIsUserLoaded(true);
    };

    loadUser();

    // Listen to changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        loadUser();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const isUnverified = isUserLoaded && user && user.role === "teacher" && user.verificationStatus !== "VERIFIED";

  const { data: items = [], isLoading, mutate } = useSWR(
    (!isUserLoaded || isUnverified) ? null : `${API_BASE}/exam-bank/exams`,
    authFetcher,
    { revalidateOnFocus: false }
  );

  const showLoading = !isUserLoaded || isLoading;

  const uniqueAuthors = Array.from(new Set(items.map((i: any) => i.teacherName || "Ẩn danh"))).filter(Boolean) as string[];

  const filtered = items.filter((item: any) => {
    const matchSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAuthor = selectedAuthor === "Tất cả" || (item.teacherName || "Ẩn danh") === selectedAuthor;
    const matchSubject = selectedSubject === "Tất cả" || item.subject === selectedSubject;
    return matchSearch && matchAuthor && matchSubject;
  });

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

  if (isUserLoaded && isUnverified) {
    return (
      <main className="p-8 max-w-2xl mx-auto w-full min-h-[70vh] flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <section className="bg-white dark:bg-[#0A1F3E]/90 border border-slate-200/60 dark:border-cyan-950/40 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(12,46,94,0.05)] dark:shadow-[0_20px_50px_rgba(0,198,255,0.03)] text-center relative overflow-hidden flex flex-col items-center gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Glowing Lock Badge */}
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
    <main className="p-8 space-y-8 max-w-5xl mx-auto w-full">
      {/* Header banner */}
      <ScrollReveal variant="fade-up" duration={600}>
        <section className="bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] p-8 rounded-[2rem] shadow-lg relative overflow-hidden text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-4xl text-white">account_balance</span>
            </div>
            <h2 className="font-headline font-extrabold text-4xl text-white tracking-tight mb-2">
              Ngân hàng Đề thi
            </h2>
            <p className="text-white/80 max-w-lg leading-relaxed">
              Quản lý toàn bộ danh sách đề thi luyện tập trong hệ thống. Bạn có thể Tạo mới hoặc Upload đề thi trực tiếp vào Ngân hàng.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0 relative z-10">
            <button
              onClick={() => router.push(`/${locale}/teacher/exams/import?isBank=true`)}
              className="px-5 py-2.5 bg-white text-[#0C2E5E] font-extrabold rounded-xl text-sm shadow-xl transition-all flex items-center gap-2 hover:scale-105"
            >
              <span className="material-symbols-outlined text-lg">upload_file</span>
              Upload PDF/DOCX
            </button>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 backdrop-blur-sm border border-white/10"
            >
              <span className="material-symbols-outlined text-lg">library_add</span>
              Thêm từ Kho đề
            </button>
          </div>
        </section>
      </ScrollReveal>

      <PublishToBankModal 
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSuccess={mutate}
      />

      {/* Toolbar */}
      <ScrollReveal variant="fade-up" duration={600} delay={80}>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input
              type="text"
              placeholder="Tìm đề thi trong chuyên đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-[#0A1F3E]/60 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none transition-all text-sm font-medium text-on-surface dark:text-slate-200"
            />
          </div>
          
          <div className="relative w-full sm:w-auto">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 text-lg">person</span>
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-8 py-2.5 bg-white dark:bg-[#0A1F3E]/60 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
            >
              <option value="Tất cả">Tất cả người đăng</option>
              {uniqueAuthors.map(author => (
                <option key={author as string} value={author as string}>{author}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
          </div>

          <div className="relative w-full sm:w-auto">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 text-lg">category</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-8 py-2.5 bg-white dark:bg-[#0A1F3E]/60 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
            >
              <option value="Tất cả">Tất cả môn học</option>
              {ALL_SUBJECTS.map((sub: string) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-cyan-950/20 border border-slate-200 dark:border-cyan-950/40 rounded-xl ml-auto">
            <span className="material-symbols-outlined text-slate-400 text-lg">quiz</span>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {filtered.length} đề thi
            </span>
          </div>
        </div>
      </ScrollReveal>

      {/* Exam list */}
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
            <p className="text-sm text-slate-400">
              {searchTerm
                ? "Thử thay đổi từ khoá tìm kiếm hoặc bộ lọc"
                : "Admin và Giáo viên có thể Upload hoặc Tạo đề thi ngay tại đây."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((exam: any) => {
              const diff = exam.difficulty ? DIFFICULTY_CONFIG[exam.difficulty] : null;
              const isRemoving = removingId === exam.id;
              return (
                <div
                  key={exam.id}
                  className="group flex gap-4 p-4 bg-white dark:bg-[#0A1F3E]/80 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 shadow-sm hover:shadow-md transition-all"
                >
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-indigo-500 text-2xl">quiz</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {diff && (
                        <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-md ${diff.cls}`}>
                          {diff.label}
                        </span>
                      )}
                      {exam.subject && (
                        <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-bold rounded-md">
                          {exam.subject}
                        </span>
                      )}
                      {exam.questionCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-bold rounded-md">
                          {exam.questionCount} câu
                        </span>
                      )}
                      {exam.duration > 0 && (
                        <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-bold rounded-md">
                          {exam.duration} phút
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-on-surface dark:text-slate-100 text-sm leading-snug line-clamp-1">
                      {exam.title?.replace(/\s*\(Ngân hàng\)/gi, "")}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">person</span>
                        {exam.teacherName || "Ẩn danh"}
                      </p>
                      {exam.teacherName === "System Admin" || exam.teacherName?.toLowerCase().includes("admin") ? (
                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-[9px] font-black uppercase tracking-wider rounded">
                          Admin
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[9px] font-black uppercase tracking-wider rounded">
                          Giáo viên
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() =>
                        router.push(`/${locale}/teacher/exams/${exam.id}`)
                      }
                      title="Xem chi tiết"
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    {user?.id === exam.teacherId && (
                      <button
                        onClick={() => handleRemoveExam(exam.id)}
                        disabled={isRemoving}
                        title="Gỡ khỏi ngân hàng đề thi"
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all disabled:opacity-40"
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
    </main>
  );
}
