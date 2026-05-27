"use client";
import { useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import useSWR from "swr";
import { authFetcher } from "@/hooks/useAuthFetch";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SmartMarkdown } from "@/components/ui/SmartMarkdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { API_BASE, getAuthHeaders } from "@/lib/api";

/** Resolves [IMG_n] tags in question text to base64 <img> elements */
function renderWithImages(text: string, extractedImages?: string[]) {
  if (!text) return null;
  const parts = text.split(/(\[IMG_\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/\[IMG_(\d+)\]/);
    if (match) {
      const idx = parseInt(match[1], 10);
      if (extractedImages?.[idx]) {
        return (
          <img
            key={i}
            src={`data:image/jpeg;base64,${extractedImages[idx]}`}
            alt={`Hình ảnh ${idx + 1}`}
            className="max-w-full h-auto max-h-72 my-3 rounded-xl border border-slate-200 dark:border-cyan-950/40 mx-auto shadow-sm object-contain block"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        );
      }
      return <span key={i} className="text-xs text-slate-400 italic">[Hình ảnh {idx + 1}]</span>;
    }
    if (!part.trim()) return null;
    return (
      <ReactMarkdown
        key={i}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{ p: ({ node, ...props }) => <span {...props} /> }}
      >
        {part}
      </ReactMarkdown>
    );
  });
}

export default function PracticeResultPage({ params }: { params: { locale: string; id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const resultId = searchParams.get("resultId");

  const { data: exam, isLoading: examLoading } = useSWR(
    resultId ? ["practice-result-exam", resultId, params.id] : null,
    async () => {
      try {
        return await authFetcher(`${API_BASE}/practice/results/${resultId}/exam`);
      } catch {
        return authFetcher(`${API_BASE}/exams/${params.id}`);
      }
    },
    { revalidateOnFocus: false }
  );

  // Fetch the student's submitted result
  const { data: result, isLoading: resultLoading } = useSWR(
    resultId ? `${API_BASE}/practice/results/${resultId}` : null,
    authFetcher,
    { revalidateOnFocus: false }
  );

  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  const questions = useMemo(() => {
    if (!exam?.versions?.length) return [];
    return exam.versions[0].questions || [];
  }, [exam]);

  // Grade locally using the full exam (which has isCorrect flags)
  const gradedQuestions = useMemo(() => {
    return questions.map((q: any) => {
      const studentAnsId = result?.answers?.[q.id];
      const correctOpt = q.options?.find((o: any) => o.isCorrect);
      const studentOpt = q.options?.find((o: any) => o.id === studentAnsId);
      const isCorrect = !!(correctOpt && correctOpt.id === studentAnsId);
      return { ...q, studentAnsId, correctOpt, studentOpt, isCorrect };
    });
  }, [questions, result]);

  const correctCount = gradedQuestions.filter((q: any) => q.isCorrect).length;
  const wrongCount = gradedQuestions.filter((q: any) => !q.isCorrect && q.studentAnsId).length;
  const unansweredCount = gradedQuestions.filter((q: any) => !q.studentAnsId).length;
  const scoreOutOf10 = questions.length
    ? Math.round((correctCount / questions.length) * 100) / 10
    : 0;

  const scrollToQuestion = (qId: string) => {
    questionRefs.current[qId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleExplain = async (qId: string, qText: string, selectedText: string, correctText: string) => {
    if (explanations[qId] || explainingId) return;
    setExplainingId(qId);
    try {
      const res = await fetch(`${API_BASE}/ai/explain`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ question: qText, selected: selectedText, correct: correctText }),
      });
      if (res.ok) {
        const data = await res.json();
        setExplanations((prev) => ({ ...prev, [qId]: data.explanation }));
      } else {
        alert("AI không phản hồi. Vui lòng thử lại.");
      }
    } catch {
      alert("Lỗi kết nối AI.");
    } finally {
      setExplainingId(null);
    }
  };

  const isLoading = examLoading || resultLoading;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="animate-spin w-12 h-12 border-4 border-[#00C6FF] border-t-transparent rounded-full"></div>
      <p className="text-sm text-slate-400 font-medium">Đang tải kết quả...</p>
    </div>
  );

  if (!exam || !result) return (
    <div className="p-20 text-center">
      <span className="material-symbols-outlined text-4xl text-red-400 block mb-3">error</span>
      <p className="text-red-500 font-medium">Không tìm thấy kết quả. Vui lòng thử lại.</p>
      <button
        onClick={() => router.push(`/${locale}/student/exam-bank`)}
        className="mt-4 px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold"
      >
        Về Ngân hàng đề
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface dark:bg-[#030B14]">
      <div className="max-w-6xl mx-auto p-6 pb-20">
        {/* Score Banner — full width */}
        <ScrollReveal variant="fade-up" duration={600}>
          <div className="bg-white dark:bg-[#0A1F3E] rounded-[2rem] p-8 shadow-sm border border-slate-200/50 dark:border-cyan-950/40 text-center relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#00C6FF]/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6 ${
                scoreOutOf10 >= 8 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : scoreOutOf10 >= 5 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                <span className="material-symbols-outlined text-base">
                  {scoreOutOf10 >= 8 ? "emoji_events" : scoreOutOf10 >= 5 ? "thumb_up" : "sentiment_neutral"}
                </span>
                {scoreOutOf10 >= 8 ? "Xuất sắc!" : scoreOutOf10 >= 5 ? "Khá tốt!" : "Cần ôn thêm!"}
              </div>

              <h1 className="text-3xl font-extrabold text-on-surface dark:text-slate-200 mb-1">Hoàn thành luyện tập!</h1>
              <p className="text-on-surface-variant dark:text-slate-400 mb-8">{exam.title?.replace(/\s*\(Ngân hàng\)/gi, "")}</p>

              <div className="flex justify-center items-center gap-10 md:gap-16">
                <div>
                  <p className="text-5xl font-black text-[#00C6FF]">
                    {correctCount}
                    <span className="text-xl text-slate-400 font-semibold"> / {questions.length}</span>
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Câu đúng</p>
                </div>
                <div className="h-14 w-px bg-slate-200 dark:bg-cyan-950/60"></div>
                <div>
                  <p className="text-5xl font-black text-emerald-500">
                    {scoreOutOf10}
                    <span className="text-xl text-slate-400 font-semibold"> / 10</span>
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Điểm số</p>
                </div>
              </div>

              <div className="mt-8 flex justify-center gap-3">
                <button
                  onClick={() => router.push(`/${locale}/student/exam-bank/${params.id}`)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-cyan-950/40 text-on-surface dark:text-slate-200 font-bold rounded-xl text-sm hover:bg-slate-200 dark:hover:bg-cyan-950/60 transition-all"
                >
                  Làm lại
                </button>
                <button
                  onClick={() => router.push(`/${locale}/student/exam-bank`)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#0C2E5E] to-[#00C6FF] text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all"
                >
                  Về Ngân hàng đề
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* 2-column layout: question list + sticky map */}
        <div className="flex gap-6 mt-8">

          {/* ── Left: Detailed review ── */}
          <div className="flex-1 min-w-0 self-start">
            <h3 className="text-xl font-bold text-on-surface dark:text-slate-200 mb-4">
              Xem lại đáp án
            </h3>

            <div className="space-y-5">
            {gradedQuestions.map((q: any, idx: number) => (
              <ScrollReveal key={q.id} variant="fade-up" duration={500} delay={Math.min(idx * 40, 400)}>
                <div
                  ref={(el) => { questionRefs.current[q.id] = el; }}
                  id={`result-q-${q.id}`}
                  className={`bg-white dark:bg-[#0A1F3E]/60 rounded-2xl p-6 shadow-sm border relative ${
                    q.isCorrect
                      ? "border-emerald-200 dark:border-emerald-900/50"
                      : q.studentAnsId
                      ? "border-red-200 dark:border-red-900/50"
                      : "border-slate-200 dark:border-cyan-950/40"
                  }`}
                >
                  {/* Question number */}
                  <div
                    className={`absolute -left-3 top-5 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-md text-white ${
                      q.isCorrect ? "bg-emerald-500" : q.studentAnsId ? "bg-red-500" : "bg-slate-400"
                    }`}
                  >
                    {idx + 1}
                  </div>

                  <div className="ml-6">
                    <div className="prose dark:prose-invert max-w-none mb-4 text-sm leading-relaxed">
                      {renderWithImages(q.text, exam.extractedImages)}
                    </div>

                    {/* Options */}
                    <div className="space-y-2 mb-5">
                      {q.options?.map((opt: any) => {
                        const isCorrectOpt = opt.isCorrect;
                        const isStudentChoice = opt.id === q.studentAnsId;

                        let cls = "bg-slate-50 dark:bg-cyan-950/20 border-slate-200 dark:border-cyan-950/40 text-slate-500 dark:text-slate-400";
                        if (isCorrectOpt) {
                          cls = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-semibold";
                        } else if (isStudentChoice && !isCorrectOpt) {
                          cls = "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 line-through";
                        }

                        return (
                          <div key={opt.id} className={`p-3 rounded-xl border flex gap-3 items-center ${cls}`}>
                            <div className="flex-1 text-sm">
                              <SmartMarkdown content={opt.text} />
                            </div>
                            {isCorrectOpt && (
                              <span className="material-symbols-outlined text-emerald-500 flex-shrink-0">check_circle</span>
                            )}
                            {isStudentChoice && !isCorrectOpt && (
                              <span className="material-symbols-outlined text-red-400 flex-shrink-0">cancel</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* AI Explain — only for wrong answers */}
                    {!q.isCorrect && q.studentOpt && (
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                        {explanations[q.id] ? (
                          <div className="flex gap-3">
                            <span className="material-symbols-outlined text-[#00C6FF] text-xl flex-shrink-0">auto_awesome</span>
                            <div className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
                              <SmartMarkdown content={explanations[q.id]} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              Không hiểu vì sao sai?
                            </p>
                            <button
                              onClick={() =>
                                handleExplain(q.id, q.text, q.studentOpt?.text || "", q.correctOpt?.text || "")
                              }
                              disabled={explainingId !== null}
                              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#0A1F3E] text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-100 dark:border-indigo-900/50 hover:shadow-sm transition-all disabled:opacity-50 flex-shrink-0"
                            >
                              <span className="material-symbols-outlined text-sm">auto_awesome</span>
                              {explainingId === q.id ? "Đang phân tích..." : "Nhờ AI giải thích"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Unanswered notice */}
                    {!q.studentAnsId && (
                      <div className="text-xs font-bold text-slate-400 italic">
                        — Chưa trả lời câu này —
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}
            </div>
          </div>

          {/* ── Right: Sticky Question Map ── */}
          <aside className="w-52 flex-shrink-0 hidden lg:block">
            <div className="sticky top-6">
              <div className="bg-white dark:bg-[#0A1F3E]/80 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-cyan-950/40 bg-slate-50 dark:bg-cyan-950/20">
                  <p className="text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">Sơ đồ kết quả</p>
                </div>

                {/* Stats summary */}
                <div className="px-4 pt-3 pb-2 grid grid-cols-3 gap-1.5">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-1.5 text-center border border-emerald-100 dark:border-emerald-900/40">
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{correctCount}</p>
                    <p className="text-[8px] font-bold text-emerald-500/70 uppercase tracking-wide">Đúng</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-1.5 text-center border border-red-100 dark:border-red-900/40">
                    <p className="text-base font-black text-red-600 dark:text-red-400">{wrongCount}</p>
                    <p className="text-[8px] font-bold text-red-500/70 uppercase tracking-wide">Sai</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-cyan-950/30 rounded-lg p-1.5 text-center border border-slate-100 dark:border-cyan-950/40">
                    <p className="text-base font-black text-slate-400">{unansweredCount}</p>
                    <p className="text-[8px] font-bold text-slate-400/70 uppercase tracking-wide">Bỏ</p>
                  </div>
                </div>

                {/* Score bar */}
                <div className="px-4 pb-3">
                  <div className="h-1.5 bg-slate-100 dark:bg-cyan-950/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${questions.length ? (correctCount / questions.length) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium text-right mt-1">
                    {Math.round((correctCount / (questions.length || 1)) * 100)}% chính xác
                  </p>
                </div>

                {/* Question grid */}
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-5 gap-1.5">
                    {gradedQuestions.map((q: any, idx: number) => {
                      const status = q.isCorrect ? "correct" : q.studentAnsId ? "wrong" : "unanswered";
                      return (
                        <button
                          key={q.id}
                          onClick={() => scrollToQuestion(q.id)}
                          title={`Câu ${idx + 1}: ${status === "correct" ? "Đúng ✓" : status === "wrong" ? "Sai ✗" : "Bỏ qua"}`}
                          className={`w-full aspect-square rounded-lg text-[11px] font-bold transition-all duration-150 hover:scale-110 focus:outline-none ${
                            status === "correct"
                              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                              : status === "wrong"
                              ? "bg-red-400 text-white shadow-sm shadow-red-400/30"
                              : "bg-slate-100 dark:bg-cyan-950/40 text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="px-4 pb-3 space-y-1.5 border-t border-slate-100 dark:border-cyan-950/40 pt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500 flex-shrink-0"></div>
                    <span className="text-[10px] text-slate-400 font-medium">Trả lời đúng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-400 flex-shrink-0"></div>
                    <span className="text-[10px] text-slate-400 font-medium">Trả lời sai</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-200 dark:bg-cyan-950/50 flex-shrink-0"></div>
                    <span className="text-[10px] text-slate-400 font-medium">Bỏ qua</span>
                  </div>
                </div>

                {/* Back buttons */}
                <div className="px-3 pb-3 space-y-2">
                  <button
                    onClick={() => router.push(`/${locale}/student/exam-bank/${params.id}`)}
                    className="w-full py-2 bg-slate-100 dark:bg-cyan-950/40 text-on-surface dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-cyan-950/60 transition-all"
                  >
                    Làm lại
                  </button>
                  <button
                    onClick={() => router.push(`/${locale}/student/exam-bank`)}
                    className="w-full py-2 bg-gradient-to-r from-[#0C2E5E] to-[#00C6FF] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all"
                  >
                    Ngân hàng đề
                  </button>
                </div>
              </div>
            </div>
          </aside>

        </div>{/* end 2-column */}
      </div>
    </div>
  );
}
