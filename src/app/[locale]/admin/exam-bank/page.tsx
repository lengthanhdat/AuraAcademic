"use client";
import { useState } from "react";
import useSWR from "swr";
import { authFetcher } from "@/hooks/useAuthFetch";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import PublishToBankModal from "@/components/PublishToBankModal";
import { useRouter } from "@/navigation";
import { useLocale } from "next-intl";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { ALL_SUBJECTS } from "@/lib/curriculum";

const DIFFICULTY_CONFIG: Record<string, { label: string; cls: string }> = {
  EASY:   { label: "Dễ",     cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  MEDIUM: { label: "Vừa",    cls: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  HARD:   { label: "Khó",    cls: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  EXPERT: { label: "Chuyên", cls: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
};

export default function AdminExamBankPage() {
  const router = useRouter();
  const locale = useLocale();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("Tất cả");
  const [selectedSubject, setSelectedSubject] = useState("Tất cả");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const { data: items = [], isLoading, mutate } = useSWR(
    `${API_BASE}/exam-bank/exams`,
    authFetcher,
    { revalidateOnFocus: false }
  );

  const uniqueAuthors = Array.from(new Set(items.map((i: any) => i.teacherName || "Ẩn danh"))).filter(Boolean) as string[];
  const uniqueSubjects = Array.from(new Set(items.map((i: any) => i.subject).filter(Boolean))) as string[];

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

  const featureCards = [
    {
      icon: "upload_file",
      title: "Upload nhanh",
      description: "Nhập PDF/DOCX và lưu thẳng vào ngân hàng đề.",
      cls: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300",
    },
    {
      icon: "library_add",
      title: "Đồng bộ Kho đề",
      description: "Chọn đề mẫu sẵn có để công khai cho luyện tập.",
      cls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
    },
    {
      icon: "tune",
      title: "Lọc chính xác",
      description: "Tìm theo tên đề, người đăng và từng môn học.",
      cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    },
  ];

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header banner */}
      <ScrollReveal variant="fade-up" duration={600}>
        <section className="bg-gradient-to-br from-[#0C2E5E] via-[#14508F] to-[#00A6D6] p-6 sm:p-8 rounded-3xl shadow-lg text-white">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-end">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 mb-5">
                <span className="material-symbols-outlined text-3xl text-white">account_balance</span>
              </div>
              <h1 className="font-headline font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight mb-3">
                Ngân hàng Đề thi
              </h1>
              <p className="text-white/85 max-w-2xl leading-relaxed text-sm sm:text-base">
                Quản lý toàn bộ đề luyện tập trong hệ thống, nhập đề mới, đồng bộ từ Kho đề và kiểm soát nội dung công khai cho học sinh ôn tập.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push(`/admin/my-exams/import/?isBank=true`)}
                  className="h-12 px-5 bg-white text-[#0C2E5E] font-extrabold rounded-xl text-sm shadow-xl transition-colors flex items-center justify-center gap-2 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-white/70 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">upload_file</span>
                  Upload PDF/DOCX
                </button>
                <button
                  onClick={() => setIsPublishModalOpen(true)}
                  className="h-12 px-5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/70 cursor-pointer"
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
                <p className="text-2xl font-black leading-none">{uniqueSubjects.length}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">Môn học</p>
              </div>
              <div className="rounded-xl bg-white/95 p-4 text-[#0C2E5E]">
                <p className="text-2xl font-black leading-none">{uniqueAuthors.length}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">Người đăng</p>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" duration={600} delay={60}>
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
      </ScrollReveal>

      <PublishToBankModal 
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSuccess={mutate}
      />

      {/* Toolbar */}
      <ScrollReveal variant="fade-up" duration={600} delay={80}>
        <section className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-cyan-950/40 dark:bg-[#0A1F3E]/70">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_220px_auto] lg:items-center">
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
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#0C2E5E] dark:text-cyan-300 text-lg">person</span>
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="h-12 w-full pl-10 pr-9 bg-slate-50 dark:bg-[#071A33]/70 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
            >
              <option value="Tất cả">Tất cả người đăng</option>
              {uniqueAuthors.map(author => (
                <option key={author as string} value={author as string}>{author}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
          </div>

          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#0C2E5E] dark:text-cyan-300 text-lg">category</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="h-12 w-full pl-10 pr-9 bg-slate-50 dark:bg-[#071A33]/70 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
            >
              <option value="Tất cả">Tất cả môn học</option>
              {ALL_SUBJECTS.map((sub: string) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
          </div>

          <div className="flex h-12 items-center justify-center gap-2 px-4 bg-[#0C2E5E] text-white rounded-xl lg:min-w-[124px]">
            <span className="material-symbols-outlined text-white/80 text-lg">quiz</span>
            <span className="text-sm font-extrabold">
              {filtered.length} đề thi
            </span>
          </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Exam list */}
      <ScrollReveal variant="fade-up" duration={600} delay={150}>
        {isLoading ? (
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
                      {exam.title}
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
                        router.push(`/admin/exams/${exam.id}`)
                      }
                      title="Xem chi tiết"
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
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
