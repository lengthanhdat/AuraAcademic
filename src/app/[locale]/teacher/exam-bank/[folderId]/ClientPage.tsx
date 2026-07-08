"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { authFetcher } from "@/hooks/useAuthFetch";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useRouter } from "@/navigation";
import { useLocale } from "next-intl";
import { API_BASE, getAuthHeaders } from "@/lib/api";

export default function ExamBankFolderPage({ params }: { params: { locale: string; folderId: string } }) {
  const router = useRouter();
  const locale = useLocale();

  const [currentTeacherId, setCurrentTeacherId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        setCurrentTeacherId(user?.id || null);
      }
    } catch {}
  }, []);

  const { data: currentFolder } = useSWR(
    `${API_BASE}/exam-bank/folders/${params.folderId}`,
    authFetcher,
    { revalidateOnFocus: false }
  );

  const { data: items = [], isLoading, mutate } = useSWR(
    `${API_BASE}/exam-bank/folders/${params.folderId}/teacher-items`,
    authFetcher,
    { revalidateOnFocus: false }
  );

  const handleToggleStatus = async (item: any) => {
    const isPublished = item.status === "PUBLISHED";
    const nextStatus = isPublished ? "ARCHIVED" : "PUBLISHED";
    try {
      const res = await fetch(`${API_BASE}/exam-bank/items/${item.id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) mutate();
      else alert("Không thể cập nhật trạng thái bài ôn tập.");
    } catch {
      alert("Lỗi kết nối khi cập nhật trạng thái.");
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài ôn tập này?")) return;
    try {
      const res = await fetch(`${API_BASE}/exam-bank/items/${itemId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) mutate();
      else alert("Có lỗi xảy ra khi xóa.");
    } catch {
      alert("Lỗi kết nối.");
    }
  };

  return (
    <main className="p-8 space-y-8 max-w-5xl mx-auto w-full">
      <ScrollReveal variant="fade-up" duration={600}>
        <button
          onClick={() => router.push(`/${locale}/teacher/exam-bank`)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Trở về Ngân hàng
        </button>

        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white dark:bg-[#0A1F3E]/80 p-8 rounded-3xl border border-slate-200/60 dark:border-cyan-950/40 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-indigo-600 text-2xl">folder_open</span>
              </div>
              <h2 className="font-headline font-extrabold text-3xl text-on-surface dark:text-slate-200 tracking-tight">
                {currentFolder?.name || "Đang tải..."}
              </h2>
            </div>
            <p className="text-on-surface-variant dark:text-slate-400 ml-15">
              {currentFolder?.description || "Không có mô tả"}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => router.push(`/${locale}/teacher/exams/import?folderId=${params.folderId}`)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-[#00C6FF] text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">upload_file</span>
              Upload bài ôn tập
            </button>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" duration={600} delay={100}>
        <div className="bg-white dark:bg-[#0A1F3E]/80 rounded-2xl shadow-sm border border-outline-variant/10 dark:border-cyan-950/40 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-cyan-950/40 bg-slate-50 dark:bg-cyan-950/20">
            <h4 className="text-sm font-bold text-on-surface dark:text-slate-200 uppercase tracking-wider">
              Danh sách bài ôn tập ({items.length})
            </h4>
          </div>

          {isLoading ? (
            <div className="divide-y divide-slate-100 dark:divide-cyan-950/30">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-6 animate-pulse gap-4">
                  <div className="flex gap-4 min-w-0 w-full">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-cyan-950/60 shrink-0"></div>
                    <div className="min-w-0 flex-1 space-y-2 py-1">
                      <div className="h-5 bg-slate-200 dark:bg-cyan-950/60 rounded-md w-1/3"></div>
                      <div className="flex gap-3">
                        <div className="h-4 bg-slate-200 dark:bg-cyan-950/60 rounded-md w-24"></div>
                        <div className="h-4 bg-slate-200 dark:bg-cyan-950/60 rounded-md w-20"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-cyan-950/60"></div>
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-cyan-950/60"></div>
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-cyan-950/60"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant dark:text-slate-400/50">
              <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">note_stack</span>
              <p className="font-bold text-slate-500 mb-1">Chưa có bài ôn tập nào.</p>
              <p className="text-sm">Hãy thêm tài liệu để học sinh bắt đầu luyện tập.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-cyan-950/30">
              {items.map((item: any, idx: number) => {
                const questionCount = item.versions?.[0]?.questions?.length || 0;
                const isPublished = item.status === "PUBLISHED";
                return (
                  <div key={item.id} className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-cyan-950/20 transition-colors gap-4">
                    <div className="flex gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-cyan-950/40 flex items-center justify-center font-black text-slate-400 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-on-surface dark:text-slate-200 text-lg truncate">{item.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">format_list_bulleted</span>
                            {questionCount} câu hỏi
                          </span>
                          {isPublished && (
                            <span className="text-xs font-semibold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">groups</span>
                              {item.submissionCount || 0} lượt làm bài
                            </span>
                          )}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                            isPublished
                              ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                              : "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                          }`}>
                            <span className="material-symbols-outlined text-[14px]">public</span>
                            {isPublished ? "Đang công khai" : item.status === "DRAFT" ? "Bản nháp" : "Đã ẩn"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {item.teacherId === currentTeacherId && (
                        <>
                          <button
                            onClick={() => router.push(`/${locale}/teacher/exam-bank/${params.folderId}/create?editId=${item.id}`)}
                            title="Sửa bài"
                            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-cyan-950/40 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(item)}
                            title={isPublished ? "Ẩn khỏi học sinh" : "Công khai cho học sinh"}
                            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-cyan-950/40 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-lg">{isPublished ? "visibility_off" : "visibility"}</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Xóa bài"
                            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-cyan-950/40 text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollReveal>
    </main>
  );
}
