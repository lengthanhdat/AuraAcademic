"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { API_BASE, getAuthHeaders } from "@/lib/api";

type ParsedOption = {
  id: string;
  label?: string;
  text: string;
  content?: string;
  isCorrect?: boolean;
  correct?: boolean;
};

type ParsedQuestion = {
  id: string;
  text: string;
  content?: string;
  question?: string;
  imageBase64?: string | null;
  options: ParsedOption[];
  answer?: string;
  correctAnswer?: string;
  correctOption?: string;
  correctOptionId?: string;
};

type BankQuestion = {
  id: string;
  type: string;
  text: string;
  imageUrl: string | null;
  options: Array<{
    id: string;
    label: string;
    text: string;
    isCorrect: boolean;
  }>;
};

type Step = "upload" | "review" | "saving";

const MAX_FILE_SIZE_MB = 20;

function makeOptionLabel(index: number) {
  return String.fromCharCode(65 + index);
}

function normalizeAnswerKey(value?: string) {
  if (!value) return "";
  return value.trim().replace(/^[Đđ]áp án\s*[:.-]?\s*/i, "").replace(/^[Cc]âu\s*\d+\s*[:.-]?\s*/i, "").trim();
}

function stripMarkdownJsonFence(value: string) {
  return value.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
}

function findCorrectIndexFromAnswerKey(question: ParsedQuestion, options: ParsedOption[]) {
  const answerKey = normalizeAnswerKey(
    question.correctOptionId || question.correctOption || question.correctAnswer || question.answer
  );
  if (!answerKey) return -1;

  const answerUpper = answerKey.toUpperCase();
  const labelIndex = options.findIndex((option, index) => {
    const label = (option.label || makeOptionLabel(index)).toUpperCase();
    return answerUpper === label || answerUpper.startsWith(`${label}.`) || answerUpper.startsWith(`${label})`);
  });
  if (labelIndex >= 0) return labelIndex;

  return options.findIndex((option) => {
    const text = (option.text || option.content || "").trim().toLowerCase();
    return !!text && text === answerKey.toLowerCase();
  });
}

function findMarkedCorrectIndex(options: ParsedOption[]) {
  const explicitIndex = options.findIndex((option) => option.isCorrect === true || option.correct === true);
  if (explicitIndex >= 0) return explicitIndex;

  return options.findIndex((option) => {
    const text = (option.text || option.content || "").trim();
    return text.startsWith("*") || /^[(\[]?[x✓✔]\s*[\])\-.]/i.test(text);
  });
}

function normalizeQuestions(rawQuestions: ParsedQuestion[]): BankQuestion[] {
  return rawQuestions.map((q, questionIndex) => {
    const rawOptions = q.options || [];
    const correctIndexFromAnswerKey = findCorrectIndexFromAnswerKey(q, rawOptions);
    const correctIndex = correctIndexFromAnswerKey >= 0 ? correctIndexFromAnswerKey : findMarkedCorrectIndex(rawOptions);

    return {
      id: q.id || String(Date.now() + questionIndex),
      type: "Trắc nghiệm",
      text: q.text || q.content || q.question || "",
      imageUrl: q.imageBase64 || null,
      options: rawOptions.map((option, optionIndex) => {
      const label = option.label || makeOptionLabel(optionIndex);
      return {
        id: option.id || label.toLowerCase(),
        label,
        text: (option.text || option.content || "").replace(/^\*\s*/, "").replace(/^[(\[]?[x✓✔]\s*[\])\-.]\s*/i, ""),
        isCorrect: false,
      };
      }),
    };
  });
}

function normalizeExamQuestions(exam: any): BankQuestion[] {
  const rawQuestions = exam?.versions?.[0]?.questions || [];
  return rawQuestions.map((q: any, questionIndex: number) => ({
    id: q.id || String(questionIndex + 1),
    type: q.type || "Trắc nghiệm",
    text: q.text || "",
    imageUrl: q.imageUrl || null,
    options: (q.options || []).map((option: any, optionIndex: number) => ({
      id: option.id || makeOptionLabel(optionIndex).toLowerCase(),
      label: makeOptionLabel(optionIndex),
      text: option.text || "",
      isCorrect: option.isCorrect === true || option.correct === true,
    })),
  }));
}

export default function CreateBankItemPage({ params }: { params: { locale: string; folderId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editId = searchParams.get("editId");

  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState("Teacher");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [statusText, setStatusText] = useState("");
  const [existingStatus, setExistingStatus] = useState("PUBLISHED");
  const [aiPickingId, setAiPickingId] = useState<string | null>(null);
  const [aiAnswerEnabled] = useState<boolean | null>(true);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setTeacherId(user?.id || null);
      setTeacherName(user?.fullName || "Teacher");
    } catch {
      setTeacherId(null);
    }
  }, []);

  useEffect(() => {
    if (!editId) return;

    let ignore = false;
    const loadExam = async () => {
      setStatusText("Đang tải bài ôn tập...");
      setError("");
      try {
        const res = await fetch(`${API_BASE}/exams/${editId}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Không thể tải bài ôn tập.");
        const exam = await res.json();
        if (ignore) return;

        const normalized = normalizeExamQuestions(exam);
        setTitle(exam.title || "");
        setExistingStatus(exam.status || "PUBLISHED");
        setQuestions(normalized);
        setSelected(new Set(normalized.map((q) => q.id)));
        setStep("review");
      } catch (err: any) {
        if (!ignore) setError(err?.message || "Không thể tải bài ôn tập.");
      } finally {
        if (!ignore) setStatusText("");
      }
    };

    loadExam();
    return () => {
      ignore = true;
    };
  }, [editId]);

  const selectedQuestions = useMemo(
    () => questions.filter((question) => selected.has(question.id)),
    [questions, selected]
  );

  const canSave = selectedQuestions.length > 0 && selectedQuestions.every((q) => q.options.some((o) => o.isCorrect));

  const setPickedFile = (pickedFile: File) => {
    const lowerName = pickedFile.name.toLowerCase();
    if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".docx")) {
      setError("Chỉ hỗ trợ file PDF hoặc DOCX.");
      return;
    }
    if (pickedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File tối đa ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setError("");
    setFile(pickedFile);
    if (!title.trim()) setTitle(pickedFile.name.replace(/\.[^/.]+$/, ""));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pickedFile = e.target.files?.[0];
    if (pickedFile) setPickedFile(pickedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) setPickedFile(droppedFile);
  };

  const handleExtract = async () => {
    if (!file || !title.trim()) return;

    setError("");
    setStatusText("Đang phân tích tài liệu...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/questions/extract`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể bóc tách câu hỏi từ tài liệu.");
        return;
      }

      const normalized = normalizeQuestions(data.questions || []);
      if (normalized.length === 0) {
        setError("Không tìm thấy câu hỏi nào trong tài liệu. Vui lòng kiểm tra định dạng file.");
        return;
      }

      setQuestions(normalized);
      setSelected(new Set(normalized.map((q) => q.id)));
      setStep("review");
      setStatusText("");
    } catch {
      setError("Lỗi kết nối khi phân tích tài liệu.");
    }
  };

  const toggleSelect = (questionId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
      return next;
    });
  };

  const updateQuestionText = (questionId: string, text: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, text } : q)));
  };

  const updateOptionText = (questionId: string, optionId: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((o) => (o.id === optionId ? { ...o, text } : o)) }
          : q
      )
    );
  };

  const setCorrectAnswer = (questionId: string, optionId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((o) => ({ ...o, isCorrect: o.id === optionId })) }
          : q
      )
    );
  };

  const applyCorrectAnswer = (questionId: string, optionId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((o) => ({ ...o, isCorrect: o.id === optionId })) }
          : q
      )
    );
  };

  const inferCorrectOptionId = (question: BankQuestion) => {
    const inlineAnswer = normalizeAnswerKey(
      question.text.match(/(?:đáp án|answer|correct answer)\s*[:：]\s*([A-D]|.+)$/im)?.[1]
    );
    if (inlineAnswer) {
      const byLabel = question.options.find((option) => option.label.toUpperCase() === inlineAnswer.toUpperCase());
      if (byLabel) return byLabel.id;

      const byText = question.options.find((option) => option.text.trim().toLowerCase() === inlineAnswer.toLowerCase());
      if (byText) return byText.id;
    }

    const markedOption = question.options.find((option) => {
      const text = option.text.trim();
      return text.startsWith("*") || /^[(\[]?[x✓✔]\s*[\])\-.]/i.test(text);
    });
    if (markedOption) return markedOption.id;

    const allOfAboveOption = question.options.find((option) =>
      /^(cả|tat ca|tất cả|all)\s*(\d+|các|cac|of)?\s*(đáp án|dap an|phương án|phuong an|ý|y)?.*(trên|tren|above)$/i.test(
        option.text.trim()
      )
    );
    if (allOfAboveOption && /(gồm|gom|bao gồm|bao gom|chọn|chon|đúng|dung)/i.test(question.text)) {
      return allOfAboveOption.id;
    }

    return null;
  };

  const resolveOptionId = (question: BankQuestion, value?: string | null) => {
    const normalized = normalizeAnswerKey(value || "");
    if (!normalized) return null;

    const compact = normalized.toUpperCase().replace(/[^A-Z]/g, "");
    const byLabel = question.options.find((option) => option.label.toUpperCase() === compact);
    if (byLabel) return byLabel.id;

    const lowerValue = normalized.toLowerCase();
    const byExactText = question.options.find((option) => option.text.trim().toLowerCase() === lowerValue);
    if (byExactText) return byExactText.id;

    const byIncludedText = question.options.find((option) => {
      const optionText = option.text.trim().toLowerCase();
      return optionText.length > 3 && (lowerValue.includes(optionText) || optionText.includes(lowerValue));
    });
    return byIncludedText?.id || null;
  };

  const resolveOptionFromAiPayload = (question: BankQuestion, payload: any): string | null => {
    if (!payload) return null;

    const candidates = [
      payload.correctOptionId,
      payload.optionId,
      payload.id,
      payload.correctLabel,
      payload.label,
      payload.answer,
      payload.correctAnswer,
      payload.correctOption,
    ];

    for (const candidate of candidates) {
      const optionId = resolveOptionId(question, String(candidate || ""));
      if (optionId) return optionId;
    }

    const generatedQuestion = payload.questions?.[0] || payload.question || payload;
    const generatedCorrectOption = generatedQuestion?.options?.find((option: any) => option.isCorrect === true || option.correct === true);
    if (generatedCorrectOption) {
      return (
        resolveOptionId(question, generatedCorrectOption.id) ||
        resolveOptionId(question, generatedCorrectOption.label) ||
        resolveOptionId(question, generatedCorrectOption.text || generatedCorrectOption.content)
      );
    }

    const rawText = typeof payload === "string" ? payload : payload.explanation || payload.result || payload.content || payload.text;
    if (typeof rawText === "string") {
      const cleaned = stripMarkdownJsonFence(rawText);
      try {
        const parsed = JSON.parse(cleaned);
        const parsedOptionId: string | null = resolveOptionFromAiPayload(question, parsed);
        if (parsedOptionId) return parsedOptionId;
      } catch {
        // Continue with text pattern matching.
      }

      const answerMatch = cleaned.match(/(?:correctOptionId|correctLabel|answer|đáp án|dap an)\s*[:：]\s*["']?([A-D])\b/i);
      if (answerMatch) return resolveOptionId(question, answerMatch[1]);

      const naturalAnswerMatch = cleaned.match(/(?:chọn|chon|là|la|đúng là|dung la|answer is|correct is)\s+["']?([A-D])\b/i);
      if (naturalAnswerMatch) return resolveOptionId(question, naturalAnswerMatch[1]);

      const optionPhraseMatch = cleaned.match(/\b([A-D])[\).:-]\s*([^\n]+)/i);
      if (optionPhraseMatch) {
        return resolveOptionId(question, optionPhraseMatch[1]) || resolveOptionId(question, optionPhraseMatch[2]);
      }

      const byOptionText = question.options.find((option) => {
        const optionText = option.text.trim().toLowerCase();
        return optionText.length > 2 && cleaned.toLowerCase().includes(optionText);
      });
      if (byOptionText) return byOptionText.id;

      const standaloneLabel = cleaned.match(/\b([A-D])\b/);
      if (standaloneLabel) return resolveOptionId(question, standaloneLabel[1]);
    }

    return null;
  };

  const askAiForCorrectOption = async (question: BankQuestion) => {
    const payload = {
      question: question.text,
      options: question.options.map((option) => ({
        id: option.id,
        label: option.label,
        text: option.text,
      })),
      instruction: "Choose exactly one correct option. Return JSON with correctOptionId or correctLabel only.",
    };

    let lastAiError = "";
    const res = await fetch(`${API_BASE}/ai/choose-correct-answer`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      const optionId = resolveOptionFromAiPayload(question, data);
      if (optionId) return optionId;
      lastAiError = "AI tra ve ket qua nhung khong khop voi A/B/C/D cua cau hoi.";
    } else if (res.status === 404) {
      lastAiError = "Backend chua co endpoint /api/ai/choose-correct-answer.";
    } else {
      const data = await res.json().catch(() => ({}));
      lastAiError = data.error || "AI chua the chon dap an cho cau nay.";
    }

    const localRes = await fetch("/api/ai/choose-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (localRes.ok) {
      const data = await localRes.json();
      const optionId = resolveOptionFromAiPayload(question, data);
      if (optionId) return optionId;
    } else {
      const data = await localRes.json().catch(() => ({}));
      if (data.error) lastAiError = data.error;
      console.warn("Local AI answer picker failed:", data);
    }

    throw new Error(lastAiError || "AI không trả về đáp án hợp lệ.");
  };

  const pickCorrectAnswer = async (question: BankQuestion, options?: { allowAi?: boolean }) => {
    const allowAi = options?.allowAi ?? true;
    setAiPickingId(question.id);
    setError("");
    try {
      let aiError = "";
      const aiOptionId =
        allowAi && aiAnswerEnabled !== false
          ? await askAiForCorrectOption(question).catch((err) => {
              console.error("AI answer picking failed:", err);
              aiError = err?.message || "";
              return null;
            })
          : null;

      if (!aiOptionId) {
        setError(aiError || "AI chưa chọn được đáp án chắc chắn cho câu này. Câu này vẫn giữ nguyên để giáo viôn kiểm tra.");
        return false;
      }

      applyCorrectAnswer(question.id, aiOptionId);
      return true;
    } finally {
      setAiPickingId(null);
    }
  };

  const pickMissingCorrectAnswers = async () => {
    const targets = questions.filter((question) => selected.has(question.id) && !question.options.some((option) => option.isCorrect));
    if (targets.length === 0) return;

    let pickedCount = 0;
    const allowAi = aiAnswerEnabled !== false;
    for (const question of targets) {
      const picked = await pickCorrectAnswer(question, { allowAi });
      if (picked) pickedCount += 1;
    }

    if (pickedCount < targets.length) {
      setError(
        aiAnswerEnabled === false
          ? `AI chưa được cấu hình nên chưa thể chọn đáp án. Không tự chọn thay AI.`
          : `AI đã chọn được ${pickedCount}/${targets.length} câu chưa có đáp án. Các câu còn lại cần chọn thủ công.`
      );
    }
  };

  const pickSelectedCorrectAnswers = async () => {
    const targets = questions.filter((question) => selected.has(question.id));
    if (targets.length === 0) return;

    let pickedCount = 0;
    const allowAi = aiAnswerEnabled !== false;
    for (const question of targets) {
      const picked = await pickCorrectAnswer(question, { allowAi });
      if (picked) pickedCount += 1;
    }

    if (pickedCount < targets.length) {
      setError(
        aiAnswerEnabled === false
          ? `AI chưa được cấu hình nên chưa thể chọn đáp án. Không tự chọn thay AI.`
          : `AI đã chọn lại được ${pickedCount}/${targets.length} câu. Các câu còn lại cần chọn thủ công.`
      );
    }
  };

  const saveBankItem = async () => {
    if (!teacherId || !canSave) return;

    setStep("saving");
    setStatusText("Đang lưu vào ngân hàng đề...");
    setError("");

    const examPayload = {
      title: title.trim(),
      duration: 0,
      shuffle: false,
      aiProctoring: false,
      teacherId,
      teacherName,
      status: existingStatus || "PUBLISHED",
      difficulty: "MEDIUM",
      practice: true,
      bankItem: true,
      folderId: params.folderId,
      extractedImages: [],
      versions: [
        {
          versionCode: "GOC",
          questions: selectedQuestions.map((q, index) => ({
            id: String(index + 1),
            type: q.type,
            text: q.text,
            imageUrl: q.imageUrl,
            options: q.options.map(({ label, ...option }) => option),
          })),
        },
      ],
    };

    try {
      const res = await fetch(editId ? `${API_BASE}/exams/${editId}` : `${API_BASE}/exams`, {
        method: editId ? "PUT" : "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(examPayload),
      });

      if (res.ok) {
        router.push(`/${locale}/teacher/exam-bank/${params.folderId}`);
        return;
      }

      const data = await res.json().catch(() => ({}));
      setError(data.message || "Lỗi khi lưu bộ đề vào ngân hàng.");
      setStep("review");
    } catch {
      setError("Lỗi kết nối khi lưu bộ đề.");
      setStep("review");
    } finally {
      setStatusText("");
    }
  };

  return (
    <main className="p-8 max-w-6xl mx-auto w-full min-h-screen">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 mb-8 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Trở về
      </button>

      <div className="bg-white dark:bg-[#0A1F3E]/80 rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-200/60 dark:border-cyan-950/40">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-[#00C6FF] flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
              <span className="material-symbols-outlined text-white text-3xl">auto_awesome</span>
            </div>
            <h1 className="text-3xl font-black text-on-surface dark:text-slate-200">Tạo bài ôn tập bằng AI</h1>
            <p className="text-on-surface-variant dark:text-slate-400 mt-2 max-w-2xl">
              Tải PDF/DOCX, kiểm tra lại câu hỏi AI bóc tách, chọn đáp án đúng rồi lưu vào ngân hàng đề.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className={`px-3 py-1.5 rounded-full ${step === "upload" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-cyan-950/40"}`}>1. Tải file</span>
            <span className={`px-3 py-1.5 rounded-full ${step === "review" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-cyan-950/40"}`}>2. Xem & sửa</span>
            <span className={`px-3 py-1.5 rounded-full ${step === "saving" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-cyan-950/40"}`}>3. Lưu</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-sm font-bold text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        {step === "upload" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <label className="block text-sm font-bold text-on-surface dark:text-slate-300 mb-2">Tên bài ôn tập</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Ôn tập Chương 1 - Sinh học 12"
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-cyan-950/20 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-medium text-on-surface dark:text-slate-200"
              />
            </div>

            <div
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${file ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10" : "border-slate-300 dark:border-cyan-950/60 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-cyan-950/30"}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-indigo-600">description</span>
                  <div>
                    <p className="font-bold text-indigo-700 dark:text-indigo-400">{file.name}</p>
                    <p className="text-xs text-indigo-500/70 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-xs font-bold text-red-500 hover:text-red-600"
                  >
                    Xóa file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">cloud_upload</span>
                  <p className="font-bold text-on-surface dark:text-slate-300">Kéo thả file vào đây hoặc nhấp để chọn</p>
                  <p className="text-xs text-slate-500">Hỗ trợ PDF, DOCX, tối đa {MAX_FILE_SIZE_MB}MB</p>
                </div>
              )}
            </div>

            <button
              onClick={handleExtract}
              disabled={!file || !title.trim() || !!statusText}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-[#00C6FF] text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              {statusText ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined">psychology</span>
              )}
              {statusText || "Bắt đầu bóc tách"}
            </button>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-5">
            <div className="sticky top-20 z-20 bg-white/95 dark:bg-[#0A1F3E]/95 backdrop-blur rounded-2xl border border-slate-200/70 dark:border-cyan-950/40 p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="font-black text-on-surface dark:text-slate-200">
                  Đã chọn {selectedQuestions.length}/{questions.length} câu hỏi
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Các câu chưa có đáp án đúng cần được sửa trước khi lưu.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelected(new Set(questions.map((q) => q.id)))}
                  className="px-4 py-2 bg-slate-100 dark:bg-cyan-950/40 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Chọn tất cả
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="px-4 py-2 bg-slate-100 dark:bg-cyan-950/40 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Bỏ chọn
                </button>
                <button
                  onClick={pickMissingCorrectAnswers}
                  disabled={aiPickingId !== null || selectedQuestions.every((q) => q.options.some((o) => o.isCorrect))}
                  title={aiAnswerEnabled === false ? "AI chưa được cấu hình nên không chọn thay giáo viên." : undefined}
                  className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-bold rounded-xl hover:bg-indigo-100 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {aiPickingId ? (
                    <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  )}
                  AI chọn đáp án thiếu
                </button>
                <button
                  onClick={pickSelectedCorrectAnswers}
                  disabled={aiPickingId !== null || selectedQuestions.length === 0}
                  title={aiAnswerEnabled === false ? "AI chưa được cấu hình nên không chọn thay giáo viên." : undefined}
                  className="px-4 py-2 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 text-sm font-bold rounded-xl hover:bg-cyan-100 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">published_with_changes</span>
                  AI chọn lại tất cả
                </button>
                <button
                  onClick={saveBankItem}
                  disabled={!canSave}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-[#00C6FF] text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  Lưu vào ngân hàng
                </button>
              </div>
            </div>

            {questions.map((question, index) => {
              const isSelected = selected.has(question.id);
              const isEditing = editingId === question.id;
              const hasCorrectAnswer = question.options.some((option) => option.isCorrect);

              return (
                <div
                  key={question.id}
                  className={`rounded-2xl border-2 bg-white dark:bg-[#0A1F3E]/60 shadow-sm transition-all ${isSelected ? "border-indigo-300 dark:border-indigo-700" : "border-slate-200 dark:border-cyan-950/40 opacity-60"}`}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(question.id)}
                        className="mt-1 w-5 h-5 accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Câu {index + 1}</span>
                          {!hasCorrectAnswer && (
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                              Chưa có đáp án đúng
                            </span>
                          )}
                          <button
                            onClick={() => setEditingId(isEditing ? null : question.id)}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">{isEditing ? "visibility" : "edit"}</span>
                            {isEditing ? "Xem trước" : "Sửa"}
                          </button>
                          <button
                            onClick={() => pickCorrectAnswer(question)}
                            disabled={aiPickingId !== null}
                            title={aiAnswerEnabled === false ? "AI chưa được cấu hình nên không chọn thay giáo viên." : undefined}
                            className="text-xs text-cyan-700 dark:text-cyan-300 hover:underline font-bold flex items-center gap-1 disabled:opacity-50"
                          >
                            {aiPickingId === question.id ? (
                              <span className="w-3 h-3 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-sm">auto_awesome</span>
                            )}
                            AI chọn đáp án
                          </button>
                        </div>

                        {isEditing ? (
                          <textarea
                            value={question.text}
                            onChange={(e) => updateQuestionText(question.id, e.target.value)}
                            className="w-full min-h-[96px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-cyan-950/20 border border-slate-200 dark:border-cyan-950/40 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
                          />
                        ) : (
                          <div className="prose dark:prose-invert max-w-none text-sm font-semibold">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {question.text || "*Câu hỏi trống*"}
                            </ReactMarkdown>
                          </div>
                        )}

                        {question.imageUrl && (
                          <div className="relative inline-block">
                            {/* Image preview */}
                            <img
                              src={question.imageUrl}
                              alt={`Hình ảnh câu ${index + 1}`}
                              className="max-h-56 rounded-xl border border-slate-200 dark:border-cyan-950/40 object-contain mt-3"
                            />
                            {/* Inline replace button */}
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = async (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const base64 = reader.result as string;
                                    // Update the question's imageUrl with the new base64 data
                                    setQuestions((prev) =>
                                      prev.map((q) => (q.id === question.id ? { ...q, imageUrl: base64 } : q)),
                                    );
                                  };
                                  reader.readAsDataURL(file);
                                };
                                input.click();
                              }}
                              className="absolute top-2 right-10 bg-white/80 dark:bg-gray-800/80 rounded-full p-1 shadow-sm hover:bg-white dark:hover:bg-gray-700 transition"
                              aria-label="Thay ảnh câu hỏi"
                            >
                              <span className="material-symbols-outlined text-sm text-indigo-600 dark:text-indigo-300">edit</span>
                            </button>
                            {/* Delete image button */}
                            <button
                              type="button"
                              onClick={() => {
                                // Remove imageUrl from the question
                                setQuestions((prev) =>
                                  prev.map((q) => (q.id === question.id ? { ...q, imageUrl: null } : q)),
                                );
                              }}
                              className="absolute top-2 right-2 bg-red-600/80 dark:bg-red-800/80 rounded-full p-1 shadow-sm hover:bg-red-600 dark:hover:bg-red-700 transition"
                              aria-label="Xóa ảnh câu hỏi"
                            >
                              <span className="material-symbols-outlined text-sm text-white">delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                      {question.options.map((option) => (
                        <div
                          key={option.id}
                          onClick={() => setCorrectAnswer(question.id, option.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${option.isCorrect ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-slate-200 dark:border-cyan-950/40 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-cyan-950/30"}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${option.isCorrect ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-cyan-950/50 text-slate-500"}`}>
                            {option.label}
                          </div>
                          {isEditing ? (
                            <input
                              value={option.text}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateOptionText(question.id, option.id, e.target.value)}
                              className="flex-1 min-w-0 bg-transparent text-sm outline-none text-on-surface dark:text-slate-200"
                              placeholder={`Đáp án ${option.label}`}
                            />
                          ) : (
                            <div className={`flex-1 min-w-0 text-sm ${option.isCorrect ? "text-emerald-700 dark:text-emerald-300 font-bold" : "text-on-surface dark:text-slate-300"}`}>
                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={{ p: ({ node, ...props }) => <span {...props} /> }}>
                                {option.text || "*Trống*"}
                              </ReactMarkdown>
                            </div>
                          )}
                          {option.isCorrect && <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {step === "saving" && (
          <div className="py-20 flex flex-col items-center text-center gap-4">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
            <p className="font-bold text-on-surface dark:text-slate-200">{statusText || "Đang lưu..."}</p>
          </div>
        )}
      </div>
    </main>
  );
}
