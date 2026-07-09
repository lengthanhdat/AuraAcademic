"use client";
import { useSearchParams, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { authFetcher } from "@/hooks/useAuthFetch";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useRouter } from "@/navigation";
import { useLocale } from "next-intl";
import { API_BASE } from "@/lib/api";
export default function StudentExamBankFolderPage({ params }: { params: { locale: string; folderId: string } }) {
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folderId");

  const router = useRouter();
  const locale = useLocale();
  const { data: user, mutate: mutateUser } = useSWR(`${API_BASE}/auth/me`, authFetcher, { revalidateOnFocus: false });
  const { data: practiceResults = [] } = useSWR(
    user?.id ? `${API_BASE}/practice/results/student/${user.id}` : null,
    authFetcher,
    { revalidateOnFocus: false }
  );

  const { data: currentFolder } = useSWR(
    `${API_BASE}/exam-bank/folders/${folderId}`,
    authFetcher,
    { revalidateOnFocus: false }
  );
  // Fetch items in this folder
  const { data: items = [], isLoading } = useSWR(
    `${API_BASE}/exam-bank/folders/${folderId}/items`,
    authFetcher,
    { revalidateOnFocus: false }
  );
  return (
    <main className="p-8 space-y-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <ScrollReveal variant="fade-up" duration={600}>
        <button 
          onClick={() => router.push(`/${locale}/student/exam-bank`)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Trở về trang chính
        </button>
        <section className="bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] p-8 md:p-12 rounded-[2rem] shadow-lg relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-4xl text-white/90">folder_special</span>
            </div>
            {!currentFolder ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-white/20 rounded-xl w-1/2"></div>
                <div className="h-6 bg-white/20 rounded-lg w-3/4"></div>
              </div>
            ) : (
              <>
                <h1 className="font-headline font-extrabold text-4xl tracking-tight mb-3">
                  {currentFolder.name}
                </h1>
                <p className="text-white/80 max-w-2xl text-lg">
                  {currentFolder.description || "Danh sách các bộ đề ôn tập thuộc chuyên đề này. Hãy bắt đầu luyện tập ngay!"}
                </p>
              </>
            )}
          </div>
        </section>
      </ScrollReveal>
      {/* Items Grid */}
      <ScrollReveal variant="fade-up" duration={600} delay={100}>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col md:flex-row items-center justify-between p-6 bg-white dark:bg-[#0A1F3E]/80 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 relative overflow-hidden animate-pulse">
                <div className="flex items-center gap-5 w-full">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-cyan-950/60 shrink-0"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-slate-200 dark:bg-cyan-950/60 rounded-md w-3/4"></div>
                    <div className="flex gap-2">
                      <div className="h-6 w-20 bg-slate-200 dark:bg-cyan-950/60 rounded-md"></div>
                      <div className="h-6 w-24 bg-slate-200 dark:bg-cyan-950/60 rounded-md"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 md:ml-4 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-cyan-950/60"></div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant dark:text-slate-400/50 bg-white dark:bg-[#0A1F3E]/80 rounded-3xl border border-slate-200/60 dark:border-cyan-950/40">
            <span className="material-symbols-outlined text-5xl block mb-3 text-slate-300">note_stack</span>
            <p className="font-bold text-slate-500 text-lg mb-1">Chưa có bài ôn tập nào.</p>
            <p className="text-sm">Giáo viên chưa tải lên tài liệu cho chuyên đề này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item: any, idx: number) => {
              const questionCount = item.versions?.[0]?.questions?.length || 0;
              const isFavorite = user?.favoritePracticeIds?.includes(item.id);
              
              // Find best score for this item
              const itemResults = practiceResults.filter((r: any) => r.examId === item.id);
              const bestScore = itemResults.length > 0 
                ? Math.max(...itemResults.map((r: any) => r.score || 0))
                : null;

              const handleToggleFavorite = async (e: any) => {
                e.stopPropagation();
                if (!user?.id) return;
                try {
                  const res = await fetch(`${API_BASE}/users/me/favorite-practice/${item.id}`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                  });
                  if (res.ok) {
                    const data = await res.json();
                    mutateUser(); // Refresh user to get updated favorites
                    
                    // Sync to localStorage so other pages update immediately
                    const storedUser = localStorage.getItem("user");
                    if (storedUser) {
                      const parsed = JSON.parse(storedUser);
                      const currentFavs = parsed.favoritePracticeIds || [];
                      parsed.favoritePracticeIds = data.isFavorite 
                        ? [...currentFavs, item.id]
                        : currentFavs.filter((id: string) => id !== item.id);
                      localStorage.setItem("user", JSON.stringify(parsed));
                      window.dispatchEvent(new Event("user-updated"));
                    }
                  }
                } catch (error) {
                  console.error("Lỗi cập nhật yêu thích", error);
                }
              };

              return (
                <div 
                  key={item.id} 
                  onClick={() => router.push(`/${locale}/student/exam-bank/detail?id=${item.id}`)}
                  className="group flex flex-col md:flex-row items-center justify-between p-6 bg-white dark:bg-[#0A1F3E]/80 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
                  
                  {bestScore !== null && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">trophy</span>
                      Kỷ lục: {bestScore}
                    </div>
                  )}

                  <div className="flex items-center gap-5 w-full">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">quiz</span>
                    </div>
                    <div className="flex-1 mt-2 md:mt-0">
                      <h4 className="font-bold text-on-surface dark:text-slate-200 text-lg line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-[#00C6FF] transition-colors pr-8">{item.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-cyan-950/40 px-2 py-1 rounded-md">
                          <span className="material-symbols-outlined text-[14px]">format_list_bulleted</span>
                          {questionCount} câu
                        </span>
                        <span className="text-xs font-semibold text-purple-600 bg-purple-50 dark:bg-purple-900/20 flex items-center gap-1 px-2 py-1 rounded-md">
                          <span className="material-symbols-outlined text-[14px]">groups</span>
                          {item.submissionCount || 0} lượt làm
                        </span>
                        {item.difficulty && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
                            item.difficulty === 'EASY' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' :
                            item.difficulty === 'HARD' ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' :
                            'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                          }`}>
                            <span className="material-symbols-outlined text-[14px]">signal_cellular_alt</span>
                            {item.difficulty === 'EASY' ? 'Cơ bản' : item.difficulty === 'HARD' ? 'Nâng cao' : 'Trung bình'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-4 shrink-0 flex items-center gap-3">
                    <button 
                      onClick={handleToggleFavorite}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                        isFavorite 
                          ? "border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-rose-900/20" 
                          : "border-slate-200 dark:border-cyan-950/60 bg-white dark:bg-transparent text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      }`}
                      title={isFavorite ? "Bỏ yêu thích" : "Lưu vào yêu thích"}
                    >
                      <span className={`material-symbols-outlined text-lg ${isFavorite ? "font-variation-fill" : ""}`}>favorite</span>
                    </button>
                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-cyan-950/50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      <span className="material-symbols-outlined text-lg group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
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
