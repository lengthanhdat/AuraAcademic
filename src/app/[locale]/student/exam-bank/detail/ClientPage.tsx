"use client";
import { useSearchParams, useParams } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "@/navigation";
import { useLocale } from "next-intl";
import useSWR from "swr";
import { authFetcher, getStoredUser } from "@/hooks/useAuthFetch";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SmartMarkdown } from "@/components/ui/SmartMarkdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import Image from "next/image";

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
          <Image
            key={i}
            src={`data:image/jpeg;base64,${extractedImages[idx]}`}
            alt={`Hình ảnh ${idx + 1}`}
            width={600}
            height={320}
            unoptimized
            className="max-w-full h-auto max-h-80 my-3 rounded-xl border border-slate-200 dark:border-cyan-950/40 mx-auto shadow-sm object-contain block"
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
        components={{
          p: ({ node, ...props }) => <span {...props} />,
        }}
      >
        {part}
      </ReactMarkdown>
    );
  });
}

// ── Custom confirm modal ──────────────────────────────────────────────────────
function ConfirmModal({
  open,
  answeredCount,
  totalCount,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  open: boolean;
  answeredCount: number;
  totalCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  if (!open) return null;
  const unanswered = totalCount - answeredCount;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-[#0A1F3E] rounded-2xl shadow-2xl border border-slate-200/50 dark:border-cyan-950/40 p-8 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="material-symbols-outlined text-white text-3xl">assignment_turned_in</span>
          </div>
          <h3 className="text-xl font-extrabold text-on-surface dark:text-slate-200 mb-1">Nộp bài?</h3>
          <p className="text-sm text-on-surface-variant dark:text-slate-400">Bạn sẽ không thể thay đổi câu trả lời sau khi nộp.</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center border border-emerald-100 dark:border-emerald-900/40">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{answeredCount}</p>
            <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500 uppercase tracking-wider">Đã trả lời</p>
          </div>
          <div className={`rounded-xl p-3 text-center border ${unanswered > 0 ? "bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/40" : "bg-slate-50 dark:bg-cyan-950/30 border-slate-100 dark:border-cyan-950/40"}`}>
            <p className={`text-2xl font-black ${unanswered > 0 ? "text-orange-600 dark:text-orange-400" : "text-slate-400"}`}>{unanswered}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${unanswered > 0 ? "text-orange-600/70 dark:text-orange-500" : "text-slate-400"}`}>Chưa trả lời</p>
          </div>
        </div>

        {unanswered > 0 && (
          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium text-center mb-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
            ⚠ Còn {unanswered} câu chưa trả lời — các câu này sẽ được tính sai.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-cyan-950/40 text-on-surface dark:text-slate-200 font-bold text-sm hover:bg-slate-200 dark:hover:bg-cyan-950/60 transition-all"
          >
            Quay lại
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#0C2E5E] to-[#00C6FF] text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Đang nộp..." : "Nộp bài"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TakePracticeExamPage({ params }: { params: { locale: string; id: string } }) {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const router = useRouter();
  const locale = useLocale();
  const user = useMemo(() => getStoredUser(), []);

  const { data: exam, isLoading } = useSWR(
    `${API_BASE}/practice/exams/${id}`,
    authFetcher,
    { revalidateOnFocus: false }
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (exam && startTime === 0) setStartTime(Date.now());
  }, [exam, startTime]);

  useEffect(() => {
    if (startTime === 0) return;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const questions = useMemo(() => {
    if (!exam?.versions?.length) return [];
    return exam.versions[0].questions || [];
  }, [exam]);

  const answeredCount = Object.keys(answers).length;

  const handleSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  // Scroll to a specific question
  const scrollToQuestion = (qId: string) => {
    questionRefs.current[qId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const doSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        examId: exam.id,
        studentId: user?.id,
        studentName: user?.fullName,
        versionCode: exam.versions?.[0]?.versionCode,
        examTitle: exam.title,
        answers,
      };
      const res = await fetch(`${API_BASE}/practice/submit`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const result = await res.json();
        router.replace(`/${locale}/student/exam-bank/detail?id=${id}/result?resultId=${result.id}`);
      } else {
        setShowConfirm(false);
        alert("Có lỗi xảy ra khi nộp bài.");
      }
    } catch {
      setShowConfirm(false);
      alert("Lỗi kết nối máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="animate-spin w-12 h-12 border-4 border-[#00C6FF] border-t-transparent rounded-full"></div>
      <p className="text-sm text-slate-400 font-medium">Đang tải đề thi...</p>
    </div>
  );
  if (!exam) return (
    <div className="p-20 text-center">
      <span className="material-symbols-outlined text-4xl text-red-400 block mb-3">error</span>
      <p className="text-red-500 font-medium">Không tìm thấy đề thi hoặc đề chưa được chia sẻ.</p>
    </div>
  );

  return (
    <>
      {/* Confirm Modal */}
      <ConfirmModal
        open={showConfirm}
        answeredCount={answeredCount}
        totalCount={questions.length}
        onConfirm={doSubmit}
        onCancel={() => setShowConfirm(false)}
        isSubmitting={isSubmitting}
      />

      <div className="min-h-screen bg-slate-50 dark:bg-[#030B14] flex flex-col">
        {/* ── Sticky Header ── */}
        <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0A1F3E]/95 backdrop-blur-xl border-b border-slate-200/60 dark:border-cyan-950/40 px-6 py-3 shadow-sm">
          <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
            <div className="min-w-0">
              <h1 className="font-bold text-on-surface dark:text-slate-200 text-sm truncate">{exam.title?.replace(/\s*\(Ngân hàng\)/gi, "")}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <div className="w-28 h-1.5 bg-slate-200 dark:bg-cyan-950/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00C6FF] rounded-full transition-all duration-500"
                    style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-on-surface-variant dark:text-slate-400 font-medium">
                  {answeredCount}/{questions.length} câu
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="font-mono text-xl font-black text-[#00C6FF]">{formatTime(elapsed)}</div>
              <button
                onClick={() => setShowConfirm(true)}
                className="px-5 py-2 bg-gradient-to-r from-[#0C2E5E] to-[#00C6FF] text-white text-sm font-bold rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95"
              >
                Nộp bài
              </button>
            </div>
          </div>
        </header>

        {/* ── Body: 2-column layout ── */}
        <div className="flex-1 max-w-6xl mx-auto w-full flex gap-6 px-4 py-6">

          {/* ── Question content (left) ── */}
          <main className="flex-1 min-w-0 space-y-5 self-start">
            {questions.map((q: any, idx: number) => (
              <ScrollReveal key={q.id} variant="fade-up" duration={450} delay={Math.min(idx * 40, 350)}>
                <div
                  ref={(el) => { questionRefs.current[q.id] = el; }}
                  id={`q-${q.id}`}
                  className={`bg-white dark:bg-[#0A1F3E]/70 rounded-2xl p-6 shadow-sm border-2 transition-all duration-200 ${
                    answers[q.id]
                      ? "border-[#00C6FF]/30 dark:border-[#00C6FF]/20"
                      : "border-slate-200/60 dark:border-cyan-950/40"
                  }`}
                >
                  {/* Number badge */}
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 transition-colors ${
                      answers[q.id]
                        ? "bg-[#00C6FF] text-white"
                        : "bg-slate-100 dark:bg-cyan-950/50 text-slate-500 dark:text-slate-400"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="prose dark:prose-invert max-w-none mb-4 text-sm leading-relaxed">
                        {renderWithImages(q.text, exam.extractedImages)}
                      </div>

                      {q.imageUrl && (
                        <Image src={q.imageUrl} alt="Hình ảnh câu hỏi"
                          width={600} height={400} unoptimized
                          className="max-w-full h-auto rounded-xl mb-4 border border-slate-200 dark:border-cyan-950/40" />
                      )}

                      <div className="space-y-2.5">
                        {q.options?.map((opt: any, optIdx: number) => {
                          const isSelected = answers[q.id] === opt.id;
                          const letter = String.fromCharCode(65 + optIdx);
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleSelect(q.id, opt.id)}
                              className={`w-full p-3.5 rounded-xl border-2 text-left transition-all duration-150 flex gap-3 items-center focus:outline-none ${
                                isSelected
                                  ? "border-[#00C6FF] bg-[#00C6FF]/5 dark:bg-[#00C6FF]/10 shadow-sm"
                                  : "border-slate-200 dark:border-cyan-950/40 hover:border-[#00C6FF]/40 hover:bg-slate-50 dark:hover:bg-cyan-950/30"
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-xs transition-all ${
                                isSelected
                                  ? "bg-[#00C6FF] text-white"
                                  : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400"
                              }`}>
                                {letter}
                              </span>
                              <span className="flex-1 text-sm font-medium text-on-surface dark:text-slate-300 leading-snug">
                                <SmartMarkdown content={opt.text} />
                              </span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[#00C6FF] text-base flex-shrink-0">check_circle</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}

            {/* Bottom submit */}
            {questions.length > 0 && (
              <div className="py-6 flex justify-center">
                <button
                  onClick={() => setShowConfirm(true)}
                  className="px-12 py-3.5 bg-gradient-to-r from-[#0C2E5E] to-[#00C6FF] text-white font-bold rounded-2xl shadow-xl hover:opacity-90 transition-all active:scale-95 text-sm"
                >
                  Nộp bài ({answeredCount}/{questions.length} câu đã trả lời)
                </button>
              </div>
            )}
          </main>

          {/* ── Question Map (right sticky panel) ── */}
          <aside className="w-52 flex-shrink-0 hidden lg:block">
            <div className="sticky top-[72px]">
              <div className="bg-white dark:bg-[#0A1F3E]/80 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 shadow-sm overflow-hidden">
                {/* Panel header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-cyan-950/40 bg-slate-50 dark:bg-cyan-950/20">
                  <p className="text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">Sơ đồ câu hỏi</p>
                </div>

                {/* Progress bar */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400">{answeredCount} đã trả lời</span>
                    <span>{questions.length - answeredCount} còn lại</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-cyan-950/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0C2E5E] to-[#00C6FF] rounded-full transition-all duration-500"
                      style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Question grid */}
                <div className="p-3">
                  <div className="grid grid-cols-5 gap-1.5">
                    {questions.map((q: any, idx: number) => {
                      const isAnswered = !!answers[q.id];
                      return (
                        <button
                          key={q.id}
                          onClick={() => scrollToQuestion(q.id)}
                          title={`Câu ${idx + 1}${isAnswered ? " (đã trả lời)" : ""}`}
                          className={`w-full aspect-square rounded-lg text-[11px] font-bold transition-all duration-150 hover:scale-110 focus:outline-none ${
                            isAnswered
                              ? "bg-[#00C6FF] text-white shadow-sm shadow-[#00C6FF]/30"
                              : "bg-slate-100 dark:bg-cyan-950/40 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-cyan-950/60"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="px-4 pb-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[#00C6FF] flex-shrink-0"></div>
                    <span className="text-[10px] text-slate-400 font-medium">Đã trả lời</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-200 dark:bg-cyan-950/50 flex-shrink-0"></div>
                    <span className="text-[10px] text-slate-400 font-medium">Chưa trả lời</span>
                  </div>
                </div>

                {/* Submit button */}
                <div className="px-3 pb-3">
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="w-full py-2.5 bg-gradient-to-r from-[#0C2E5E] to-[#00C6FF] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all"
                  >
                    Nộp bài
                  </button>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}
