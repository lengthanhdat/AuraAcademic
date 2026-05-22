"use client";
import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { SmartMarkdown } from "@/components/ui/SmartMarkdown";

type Option = { id: string; text: string; isCorrect: boolean };
type Question = { id: string; type: string; text: string; imageUrl?: string; options: Option[] };

type Step = "upload" | "generating" | "review" | "preview";

function ExamBuilderContent() {
  const router = useRouter();
  const t = useTranslations('TeacherExams');
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  type CreationMode = "ai" | "manual" | "import";
  const [creationMode, setCreationMode] = useState<CreationMode>("ai");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState<number | "">("");
  const [questionCount, setQuestionCount] = useState<number | "">("");
  const [shuffle, setShuffle] = useState(true);
  const [aiProctoring, setAiProctoring] = useState(false);
  const [scheduledStartTime, setScheduledStartTime] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [extractedText, setExtractedText] = useState("");
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [versionCount, setVersionCount] = useState<number | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiCommand, setAiCommand] = useState("");
  const [error, setError] = useState("");
  // --- Prompt mode states ---
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [language, setLanguage] = useState("vi");
  const [generatingMode, setGeneratingMode] = useState<"file" | "prompt">("file");
  const [aiSubMode, setAiSubMode] = useState<"file" | "prompt">("file");
  // -------------------------
  const [genLog, setGenLog] = useState(t('generating.log_start'));
  const [genProgress, setGenProgress] = useState(0);
  const [editingQIdx, setEditingQIdx] = useState<number | null>(null);
  const [editingOptIdx, setEditingOptIdx] = useState<{ q: number; o: number } | null>(null);
  const imgUploadRef = useRef<HTMLInputElement>(null);
  const [pendingImgQIdx, setPendingImgQIdx] = useState<number | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Flag để tránh autosave ghi đè trong khi đang load từ URL
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);

  // 1a. Load từ URL query param ?edit=<examId> (uu tiên cao nhất, fetch từ API)
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;
    setIsLoadingFromUrl(true);
    fetch(`http://localhost:8088/api/exams/${editId}`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
    }).then(r => r.ok ? r.json() : null).then(exam => {
      if (!exam) return;
      setTitle(exam.title || "");
      setDuration(exam.duration || 60);
      const qs = exam.versions?.[0]?.questions || [];
      setQuestions(qs);
      setQuestionCount(qs.length || 20);
      setVersionCount(exam.versions?.length || 1);
      setShuffle(exam.shuffle ?? true);
      setAiProctoring(exam.aiProctoring ?? false);
      if (exam.scheduledStartTime) {
        const d = new Date(exam.scheduledStartTime);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setScheduledStartTime(d.toISOString().slice(0, 16));
      }
      setExtractedImages(exam.extractedImages || []); // <-- Added this line to load images
      if (exam.difficulty) setDifficulty(exam.difficulty);
      setEditingId(editId);
      setStep("review");
    }).finally(() => setIsLoadingFromUrl(false));
  }, [searchParams]);

  // 1b. Xử lý chế độ truy cập từ URL (?mode=import hoặc ?mode=manual)
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "import") setCreationMode("import");
    else if (mode === "manual") setCreationMode("manual");
    else if (mode === "ai") setCreationMode("ai");
  }, [searchParams]);

  // 1c. Fallback: Khôi phục từ LocalStorage khi không có URL param
  useEffect(() => {
    if (searchParams.get("edit")) return; // ưu tiên URL param
    const savedData = localStorage.getItem("exam_builder_state");
    if (savedData) {
      try {
        const { step: savedStep, title, duration, questionCount, questions, versionCount, extractedText: savedText, editingId: savedId } = JSON.parse(savedData);
        if (savedStep && savedStep !== "generating") setStep(savedStep);
        if (title) setTitle(title);
        if (duration) setDuration(duration);
        if (questionCount) setQuestionCount(questionCount);
        if (questions) setQuestions(questions);
        if (versionCount) setVersionCount(versionCount);
        if (savedText) setExtractedText(savedText);
        if (savedId) setEditingId(savedId);
        if (savedData.includes("creationMode")) {
          const { creationMode: savedMode } = JSON.parse(savedData);
          if (savedMode) setCreationMode(savedMode);
        }
        const savedImages = sessionStorage.getItem("exam_extracted_images");
        if (savedImages) setExtractedImages(JSON.parse(savedImages));
      } catch (e) {
        console.error("Đã xảy ra lỗi khi khôi phục dữ liệu:", e);
      }
    }
  }, []);

  // 2. Tự động lưu dữ liệu (chỉ khi không đang load từ URL)
  useEffect(() => {
    if (step !== "generating" && !isLoadingFromUrl) {
      const stateToSave = { step, title, duration, questionCount, questions, versionCount, extractedText, editingId, creationMode };
      localStorage.setItem("exam_builder_state", JSON.stringify(stateToSave));
    }
  }, [step, title, duration, questionCount, questions, versionCount, extractedText, editingId, creationMode, isLoadingFromUrl]);

  const clearPersistedState = () => {
    localStorage.removeItem("exam_builder_state");
  };

  const handleGenerate = async () => {
    if (!file) return;
    if (creationMode === "import") {
      handleFileExtract();
      return;
    }
    if (!questionCount || questionCount <= 0) { toast.error(t('toast.invalid_count')); return; }

    setStep("generating");
    setGenProgress(5);
    setGenLog(t('generating.log_start'));
    setGeneratingMode("file");
    let jobId = "";
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("questionCount", String(questionCount));

      const uploadRes = await fetch("http://localhost:8088/api/ai/generate-questions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` },
        body: formData,
      });

      // Xử lý 401: Token hết hạn → redirect về login
      if (uploadRes.status === 401 || uploadRes.status === 403) {
        toast.error(t('toast.session_expired'));
        router.push("/login");
        return;
      }

      // Parse an toàn: đọc text trước, tránh crash khi body rỗng
      const rawText = await uploadRes.text();
      if (!rawText || !rawText.trim()) {
        throw new Error(t('toast.empty_response'));
      }
      const uploadData = JSON.parse(rawText);
      if (!uploadRes.ok) throw new Error(uploadData.error || t('toast.upload_error'));

      jobId = uploadData.jobId;
      setGenProgress(15);
      setGenLog(t('generating.log_uploading'));
    } catch (e: any) {
      toast.error(e.message || t('toast.connection_error'));
      setStep("upload");
      return;
    }

    let startTime = Date.now();
    let pseudoProgress = 15;

    pollingRef.current = setInterval(async () => {
      // 1. Cập nhật tiến trình giả lập để người dùng không cảm thấy treo
      pseudoProgress += Math.random() * 2;
      if (pseudoProgress > 95) pseudoProgress = 95;
      setGenProgress(Math.floor(pseudoProgress));

      // 2. Cập nhật log theo tiến trình
      if (pseudoProgress > 20 && pseudoProgress < 40) setGenLog(t('generating.log_extract'));
      if (pseudoProgress >= 40 && pseudoProgress < 65) setGenLog(t('generating.log_analyze'));
      if (pseudoProgress >= 65 && pseudoProgress < 85) setGenLog(t('generating.log_optimize'));
      if (pseudoProgress >= 85) setGenLog(t('generating.log_prepare'));

      // 3. Kiểm tra Timeout sau 5 phút
      if (Date.now() - startTime > 300000) {
        clearInterval(pollingRef.current!);
        toast.error(t('toast.timeout'));
        setStep("upload");
        return;
      }

      try {
        const pollRes = await fetch(`http://localhost:8088/api/ai/jobs/${jobId}`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
        });

        if (pollRes.status === 401 || pollRes.status === 403) {
          clearInterval(pollingRef.current!);
          toast.error(t('toast.session_expired'));
          router.push("/login");
          return;
        }

        if (!pollRes.ok) return;
        const job = await pollRes.json();

        if (job.status === "DONE") {
          clearInterval(pollingRef.current!);
          setGenProgress(100);
          setGenLog(t('generating.log_done'));
          setQuestions(job.questions || []);
          setExtractedText(job.extractedText || "");
          const imgs = job.extractedImages || [];
          setExtractedImages(imgs);
          sessionStorage.setItem("exam_extracted_images", JSON.stringify(imgs));

          setTimeout(() => {
            toast.success(t('toast.generate_success'));
            setStep("review");
          }, 500);
        } else if (job.status === "FAILED") {
          clearInterval(pollingRef.current!);
          setError(job.errorMessage || "AI gặp lỗi khi xử lý tài liệu này.");
          toast.error(t('toast.ai_failed') + + job.errorMessage);
          setStep("upload");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2500);
  };

  const handleGenerateFromPrompt = async () => {
    if (!topic.trim()) { toast.error("Vui lòng nhập chủ đề hoặc mô tả đề thi."); return; }
    if (!questionCount || questionCount <= 0) { toast.error(t('toast.invalid_count')); return; }

    setStep("generating");
    setGenProgress(5);
    setGenLog("Đang khởi động Aura AI...");
    setGeneratingMode("prompt");

    let jobId = "";
    try {
      const res = await fetch("http://localhost:8088/api/ai/generate-from-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({ topic, difficulty, language, count: questionCount })
      });
      if (res.status === 401 || res.status === 403) { toast.error(t('toast.session_expired')); router.push("/login"); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi khởi động AI.");
      jobId = data.jobId;
      setGenProgress(15);
      setGenLog("AI đang tra cứu kiến thức và biên soạn câu hỏi...");
    } catch (e: any) {
      toast.error(e.message || t('toast.connection_error'));
      setStep("upload");
      return;
    }

    let pseudoProgress = 15;
    const startTime = Date.now();
    pollingRef.current = setInterval(async () => {
      pseudoProgress += Math.random() * 3;
      if (pseudoProgress > 95) pseudoProgress = 95;
      setGenProgress(Math.floor(pseudoProgress));
      if (pseudoProgress > 25 && pseudoProgress < 55) setGenLog("AI đang suy luận và biên soạn câu hỏi...");
      if (pseudoProgress >= 55 && pseudoProgress < 80) setGenLog("Đang kiểm tra chất lượng và phân hóa độ khó...");
      if (pseudoProgress >= 80) setGenLog("Đang đóng gói bộ câu hỏi hoàn chỉnh...");

      if (Date.now() - startTime > 300000) {
        clearInterval(pollingRef.current!);
        toast.error(t('toast.timeout'));
        setStep("upload");
        return;
      }

      try {
        const poll = await fetch(`http://localhost:8088/api/ai/jobs/${jobId}`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
        });
        if (!poll.ok) return;
        const job = await poll.json();
        if (job.status === "DONE") {
          clearInterval(pollingRef.current!);
          setGenProgress(100);
          setGenLog(t('generating.log_done'));
          setQuestions(job.questions || []);
          setExtractedText(job.extractedText || "");
          setExtractedImages([]);
          setTimeout(() => { toast.success(`✨ AI đã biên soạn xong ${job.questions?.length || 0} câu hỏi!`); setStep("review"); }, 500);
        } else if (job.status === "FAILED") {
          clearInterval(pollingRef.current!);
          toast.error("AI không thể tạo câu hỏi cho chủ đề này. Vui lòng thử lại.");
          setStep("upload");
        }
      } catch { }
    }, 2500);
  };

  const handleFileExtract = async () => {
    if (!file) return;
    setIsAiLoading(true);
    setStep("generating");
    setGenProgress(20);
    setGenLog(t('generating.log_start'));

    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:8088/api/questions/extract", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      // Xử lý 401: Token hết hạn → redirect về login
      if (res.status === 401 || res.status === 403) {
        toast.error(t('toast.session_expired'));
        router.push("/login");
        return;
      }

      // Parse an toàn: đọc text trước, tránh crash khi body rỗng
      const rawText = await res.text();
      if (!rawText || !rawText.trim()) {
        toast.error(t('toast.empty_response'));
        setStep("upload");
        setIsAiLoading(false);
        return;
      }

      if (!res.ok) {
        let errMsg = "Lỗi khi trích xuất câu hỏi từ file.";
        try { errMsg = JSON.parse(rawText).error || errMsg; } catch (_) { }
        toast.error(errMsg);
        setStep("upload");
        setIsAiLoading(false);
        return;
      }

      const data = JSON.parse(rawText);
      setGenProgress(100);
      setGenLog(t('generating.log_done'));

      const qs = (data.questions || []).map((q: any, i: number) => ({
        id: q.id || String(Date.now() + i),
        type: "Trắc nghiệm",
        text: q.text || q.content || q.question || "",
        imageUrl: q.imageBase64 || null,
        options: (q.options || []).map((o: any) => ({
          id: o.id || o.label?.toLowerCase() || String(i),
          text: o.text || o.content || "",
          // Jackson serialize isCorrect() getter thành "correct" trong JSON (bỏ prefix "is")
          isCorrect: o.isCorrect ?? o.correct ?? false
        }))
      }));

      setQuestions(qs);
      setTimeout(() => {
        toast.success(t('toast.extract_success', { count: qs.length }));
        setStep("review");
        setIsAiLoading(false);
      }, 500);
    } catch (err) {
      toast.error(t('toast.connection_error'));
      setStep("upload");
      setIsAiLoading(false);
    }
  };

  const handleSave = async (status: string) => {
    if (!title.trim()) { toast.error(t('toast.invalid_title')); return; }
    if (!duration || duration <= 0) { toast.error(t('toast.invalid_duration')); return; }
    if (!versionCount || versionCount <= 0) { toast.error(t('toast.invalid_versions')); return; }
    if (questions.length === 0) { toast.error(t('toast.empty_questions')); return; }

    setIsSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const versions = [];
      const codes = ["101", "202", "303", "404"];
      for (let i = 0; i < versionCount; i++) {
        versions.push({
          versionCode: codes[i] || `MĐ${100 + i}`,
          questions: [...questions].sort(() => Math.random() - 0.5)
        });
      }

      const payload = {
        title, duration, shuffle, aiProctoring, difficulty,
        teacherId: user.id, teacherName: user.fullName,
        status: status === "WAITING" ? "PUBLISHED" : status,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime).getTime() : null,
        versions, extractedImages
      };

      const url = editingId
        ? `http://localhost:8088/api/exams/${editingId}`
        : "http://localhost:8088/api/exams";

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedExam = await res.json();
        clearPersistedState();
        if (status === "WAITING") {
          // Công bố đề → vào thẳng trang phòng thi để chia sẻ mã và bắt đầu
          router.push(`/teacher/exam-room/${savedExam.id}`);
          toast.success(t('toast.publish_success'));
        } else {
          router.push("/teacher/dashboard");
          toast.success(t('toast.draft_success'));
        }
      }
    } catch { toast.error("Không thể kết nối máy chủ."); }
    finally { setIsSaving(false); }
  };

  const deleteQuestion = useCallback((idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const updateQuestionText = useCallback((idx: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, text } : q));
  }, []);

  const updateOptionText = useCallback((qIdx: number, oIdx: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => i === qIdx
      ? { ...q, options: q.options.map((o, j) => j === oIdx ? { ...o, text } : o) }
      : q
    ));
  }, []);

  const setCorrectOption = useCallback((qIdx: number, oIdx: number) => {
    setQuestions(prev => prev.map((q, i) => i === qIdx
      ? { ...q, options: q.options.map((o, j) => ({ ...o, isCorrect: j === oIdx })) }
      : q
    ));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || pendingImgQIdx === null) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      const newIdx = extractedImages.length;
      setExtractedImages(prev => {
        const updated = [...prev, base64];
        sessionStorage.setItem("exam_extracted_images", JSON.stringify(updated));
        return updated;
      });
      updateQuestionText(pendingImgQIdx, questions[pendingImgQIdx].text + ` [IMG_${newIdx}]`);
      setPendingImgQIdx(null);
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  // Render nội dung câu hỏi: chuyển [IMG_N] → <img>, còn lại → SmartMarkdown (memoized)
  const renderContent = useCallback((text: string | null | undefined) => {
    const safeText = text || "";
    if (!safeText.trim()) {
      return <span className="text-slate-400 italic text-sm">{t('list.no_content')}</span>;
    }
    const parts = safeText.split(/(\[IMG_\d+\])/g);
    return (
      <>
        {parts.map((part, i) => {
          const match = part.match(/\[IMG_(\d+)\]/);
          if (match) {
            const imgIdx = parseInt(match[1]);
            const src = extractedImages[imgIdx];
            return src
              ? <img key={i} src={`data:image/jpeg;base64,${src}`} alt={`Hình ${imgIdx}`} className="max-w-[450px] max-h-[300px] object-contain rounded-lg my-3 border border-slate-200 dark:border-cyan-950/40 shadow-sm" />
              : <span key={i} className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-mono">[IMG_{imgIdx} — chưa có ảnh]</span>;
          }
          return part ? <SmartMarkdown key={i} content={part} /> : null;
        })}
      </>
    );
  }, [extractedImages, t]);

  const addManualQuestion = () => {
    const newQ: Question = {
      id: Date.now().toString(),
      type: "Trắc nghiệm",
      text: "Nhập nội dung câu hỏi mới...",
      options: [
        { id: "a", text: "Đáp án A", isCorrect: true },
        { id: "b", text: "Đáp án B", isCorrect: false },
        { id: "c", text: "Đáp án C", isCorrect: false },
        { id: "d", text: "Đáp án D", isCorrect: false },
      ]
    };
    setQuestions(prev => {
      setEditingQIdx(prev.length);
      return [...prev, newQ];
    });
  };

  if (step === "generating") return (
    <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden bg-[#F8FAFC] dark:bg-[#051329]">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-[#0A1F3E] rounded-[40px] p-12 shadow-[0_32px_64px_-16px_rgba(0,53,95,0.1)] border border-slate-100 dark:border-cyan-950/30 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 dark:bg-cyan-900/20 rounded-full blur-3xl opacity-60" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative w-40 h-40 mb-10">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" className="stroke-slate-100 dark:stroke-cyan-950/40 fill-none" strokeWidth="6" />
                <circle cx="50" cy="50" r="46" className="stroke-[#00355f] dark:stroke-[#00C6FF] fill-none transition-all duration-700 ease-out"
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 46}`}
                  strokeDashoffset={`${2 * Math.PI * 46 * (1 - genProgress / 100)}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="bg-[#00355f]/5 dark:bg-[#00C6FF]/10 p-3 rounded-2xl mb-1">
                  <span className="material-symbols-outlined text-[#00355f] dark:text-[#00C6FF] text-2xl animate-pulse">auto_awesome</span>
                </div>
                <div className="text-2xl font-black text-[#00355f] dark:text-slate-200 tabular-nums">{genProgress}%</div>
              </div>
            </div>
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-black text-[#00355f] dark:text-slate-200 tracking-tight">{t('generating.title')}</h2>
              <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-medium h-6">
                {[0, 0.2, 0.4].map((d, i) => <span key={i} className="inline-block w-1.5 h-1.5 bg-blue-500 dark:bg-[#00C6FF] rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />)}
                <p className="text-sm ml-1 italic">{genLog}</p>
              </div>
            </div>

            {/* Topic preview (only if prompt mode and topic is present) */}
            {generatingMode === "prompt" && topic && (
              <div className="w-full text-left bg-blue-50/50 dark:bg-cyan-950/20 border border-blue-100 dark:border-cyan-950/40 rounded-2xl p-4 mt-6">
                <p className="text-[10px] font-bold text-blue-600 dark:text-[#00C6FF] uppercase tracking-widest mb-1">Chủ đề đề thi</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">{topic}</p>
              </div>
            )}

            <div className="w-full mt-10 space-y-2">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-cyan-950/50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00355f] to-[#0f4c81] dark:from-[#00C6FF] dark:to-blue-600 transition-all duration-700 ease-out rounded-full" style={{ width: `${genProgress}%` }} />
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('generating.progress_label')}</span>
                <span className="text-[10px] font-bold text-blue-600 dark:text-[#00C6FF] uppercase tracking-widest animate-pulse">{t('generating.progress_value')}</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3">
          <span className="w-8 h-px bg-slate-200 dark:bg-slate-700" />
          Vui lòng không đóng trình duyệt
          <span className="w-8 h-px bg-slate-200 dark:bg-slate-700" />
        </p>
      </div>
    </main>
  );

  return (
    <main className="flex-1 flex overflow-hidden bg-[#F8FAFC] dark:bg-[#051329]">
      {/* LEFT COLUMN: Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Breadcrumbs & Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              <span>{t('header.breadcrumb_parent')}</span>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="text-blue-600">{t('header.breadcrumb_current')}</span>
            </div>
            <h1 className="text-3xl font-black text-[#00355f] tracking-tight">{t('header.title')}</h1>

            <div className="flex gap-2 mt-4 bg-slate-100 dark:bg-cyan-950/50 dark:text-slate-300 p-1 rounded-xl w-fit">
              <button
                onClick={() => { setCreationMode("ai"); setStep("upload"); setFile(null); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${creationMode === "ai" ? "bg-white dark:bg-[#0A1F3E] text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-300"}`}
              >
                <span className="material-symbols-outlined text-[16px] inline-block align-text-bottom mr-1">auto_awesome</span>
                Tạo bằng AI
              </button>
              <button
                onClick={() => {
                  setCreationMode("import");
                  setStep("upload");
                  setFile(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${creationMode === "import" ? "bg-white dark:bg-[#0A1F3E] text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-300"}`}
              >
                <span className="material-symbols-outlined text-[16px] inline-block align-text-bottom mr-1">file_open</span>
                Nhập từ file
              </button>
              <button
                onClick={() => {
                  setCreationMode("manual");
                  if (questions.length > 0 && step === "upload") setStep("review");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${creationMode === "manual" ? "bg-white dark:bg-[#0A1F3E] text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-300"}`}
              >
                <span className="material-symbols-outlined text-[16px] inline-block align-text-bottom mr-1">edit_square</span>
                Tạo thủ công
              </button>
            </div>

          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#4c2b00] text-[#FFD700] rounded-full text-xs font-bold shadow-sm border border-[#FFD700]/20">
              <span className="material-symbols-outlined text-[16px] animate-pulse">auto_awesome</span>
              AI đang hoạt động
            </div>
          </div>
        </div>

        {/* Unified AI Area */}
        {creationMode === "ai" && step === "upload" && (
          <div className="bg-white dark:bg-[#0A1F3E] rounded-3xl border border-slate-100 dark:border-cyan-950/30 shadow-sm overflow-hidden">
            {/* Sub-mode toggle */}
            <div className="flex border-b border-slate-100 dark:border-cyan-950/30">
              <button
                onClick={() => { setAiSubMode("prompt"); setFile(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${aiSubMode === "prompt" ? "bg-violet-50 text-violet-700 border-b-2 border-violet-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40"
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">psychology</span>
                Tạo từ chủ đề
              </button>
              <button
                onClick={() => { setAiSubMode("file"); setTopic(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${aiSubMode === "file" ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40"
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                Tạo từ tài liệu
              </button>
            </div>

            {/* ── Sub-mode: FROM FILE ── */}
            {aiSubMode === "file" && (
              <div
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed m-6 rounded-2xl p-10 text-center transition-all cursor-pointer group ${file ? "border-blue-400 bg-blue-50/30" : "border-slate-200 dark:border-cyan-950/40 hover:border-blue-400 hover:bg-blue-50/10"
                  }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-cyan-950/50 dark:text-slate-300 text-slate-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                </div>
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                  {file ? file.name : t('upload.title_ai')}
                </h3>
                <p className="text-sm text-slate-400 mt-1">{t('upload.hint')}</p>
                <button className="mt-3 text-blue-600 font-bold text-sm hover:underline">{t('upload.btn_choose')}</button>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />

                {file && !questions.length && (
                  <div className="mt-5 flex flex-col items-center gap-3">
                    <div className="w-56">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('upload.label_count')}</label>
                      <input
                        type="number"
                        value={questionCount}
                        onChange={e => setQuestionCount(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder={t('upload.placeholder_count')}
                        className="w-full px-4 py-2 bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 rounded-xl text-center font-bold text-blue-900 dark:text-[#00C6FF] outline-none"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleGenerate(); }}
                      className="px-8 py-3 bg-blue-900 text-white rounded-xl font-bold text-sm shadow-xl hover:bg-blue-800 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      {t('upload.btn_generate')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Sub-mode: FROM TOPIC ── */}
            {aiSubMode === "prompt" && (
              <div className="p-6 space-y-5">
                {/* Chips */}
                <div className="flex flex-wrap gap-2">
                  {[
                    "Toán 12 — Tích phân",
                    "Vật lý 11 — Điện từ học",
                    "Tiếng Anh IELTS 6.0",
                    "Lập trình Java cơ bản",
                    "Lịch sử Việt Nam — 1945",
                    "Hóa học hữu cơ lớp 11"
                  ].map(chip => (
                    <button key={chip} onClick={() => setTopic(chip)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${topic === chip ? "bg-violet-600 text-white border-violet-600" : "bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-cyan-950/40 hover:border-violet-300 hover:text-violet-600"
                        }`}>
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Mô tả yêu cầu đề thi</label>
                  <textarea
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    rows={3}
                    placeholder="Ví dụ: Tạo 15 câu trắc nghiệm môn Toán lớp 12 chương tích phân bất định, tập trung vào kỹ thuật đổi biến..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:border-cyan-950/40 rounded-2xl outline-none focus:border-violet-400 focus:bg-white dark:bg-[#0A1F3E] transition-all text-sm text-slate-700 dark:text-slate-300 resize-none leading-relaxed"
                  />
                </div>

                {/* Settings Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Độ khó</label>
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40 border border-slate-200 dark:border-cyan-950/40 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-violet-400">
                      <option value="EASY">🟢 Dễ</option>
                      <option value="MEDIUM">🟡 Trung bình</option>
                      <option value="HARD">🔴 Khó</option>
                      <option value="EXPERT">🟣 Chuyên gia</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ngôn ngữ</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40 border border-slate-200 dark:border-cyan-950/40 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-violet-400">
                      <option value="vi">🆻🇳 Tiếng Việt</option>
                      <option value="en">🇺🇸 English</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Số câu</label>
                    <input type="number" value={questionCount}
                      onChange={e => setQuestionCount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40 border border-slate-200 dark:border-cyan-950/40 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 text-center outline-none focus:border-violet-400"
                      placeholder="10" min={1} max={100} />
                  </div>
                </div>

                <button
                  onClick={handleGenerateFromPrompt}
                  disabled={!topic.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-violet-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  Aura AI — Biên soạn đề thi ngay
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Chế độ Nhập từ file truyền thống ── */}
        {creationMode === "import" && step === "upload" && (
          <div className="bg-white dark:bg-[#0A1F3E] rounded-3xl border border-slate-100 dark:border-cyan-950/30 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined">upload_file</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-[#E2E8F0] text-base">Tải lên tài liệu đề thi</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hệ thống tự động tách câu hỏi và đáp án trực tiếp từ tệp</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed m-8 rounded-2xl p-12 text-center transition-all cursor-pointer group ${file ? "border-blue-400 bg-blue-50/30" : "border-slate-200 dark:border-cyan-950/40 hover:border-blue-400 hover:bg-blue-50/10"
                }`}
            >
              <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-cyan-950/50 dark:text-slate-300 text-slate-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-sm">
                <span className="material-symbols-outlined text-4xl">cloud_upload</span>
              </div>
              <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">
                {file ? file.name : t('upload.title')}
              </h3>
              <p className="text-sm text-slate-400 mt-2 font-medium max-w-md mx-auto">{t('upload.hint')}</p>
              
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span> PDF
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> DOCX
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#0A1F3E] border border-slate-200 dark:border-cyan-950/40 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span> TXT
                </div>
              </div>

              <button className="mt-6 px-6 py-2.5 bg-white dark:bg-[#0A1F3E] text-blue-700 border border-blue-200 shadow-sm font-bold text-sm rounded-xl hover:bg-blue-50 transition-all">
                {t('upload.btn_choose')}
              </button>
              
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />

              {file && !questions.length && (
                <div className="mt-8 pt-8 border-t border-blue-100/50 animate-in fade-in slide-in-from-bottom-2">
                  <button
                    onClick={e => { e.stopPropagation(); handleGenerate(); }}
                    className="px-10 py-4 bg-[#00355f] text-white rounded-xl font-black text-base shadow-xl hover:bg-[#002848] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mx-auto"
                  >
                    <span className="material-symbols-outlined text-xl">arrow_circle_right</span>
                    Tiến hành trích xuất đề thi
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State cho chế độ Thủ công */}
        {creationMode === "manual" && questions.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 dark:border-cyan-950/40 rounded-3xl p-16 text-center bg-white dark:bg-[#0A1F3E] flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl">post_add</span>
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">{t('empty.title')}</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">{t('empty.desc')}</p>
            <button
              onClick={() => {
                addManualQuestion();
                setStep("review");
              }}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Thêm câu hỏi đầu tiên
            </button>
          </div>
        )}

        {/* Question List Header */}
        {questions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-cyan-950/40 pb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">list_alt</span>
                <h2 className="text-xl font-black text-slate-800 dark:text-[#E2E8F0]">{t('list.title')}</h2>
              </div>
              <button
                onClick={addManualQuestion}
                className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                Thêm câu hỏi mới
              </button>
            </div>

            {/* Hidden image upload input */}
            <input ref={imgUploadRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white dark:bg-[#0A1F3E] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-cyan-950/30 hover:shadow-md transition-shadow group relative">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                      {t('list.q_prefix')} {String(idx + 1).padStart(2, '0')} - {q.type.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        title={t('list.tooltip_add_img')}
                        onClick={() => { setPendingImgQIdx(idx); imgUploadRef.current?.click(); }}
                        className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                      </button>
                      <button
                        title={editingQIdx === idx ? t('list.tooltip_done') : t('list.tooltip_edit')}
                        onClick={() => setEditingQIdx(editingQIdx === idx ? null : idx)}
                        className={`p-2 transition-colors ${editingQIdx === idx ? "text-blue-600" : "text-slate-300 hover:text-blue-500"}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{editingQIdx === idx ? "check_circle" : "edit"}</span>
                      </button>
                      <button onClick={() => deleteQuestion(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Text — editable or rendered */}
                  {editingQIdx === idx ? (
                    <textarea
                      className="w-full text-base font-semibold text-slate-800 dark:text-[#E2E8F0] mb-4 leading-relaxed bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40 border border-blue-200 rounded-xl p-3 outline-none resize-y min-h-[80px]"
                      value={q.text || ""}
                      onChange={e => updateQuestionText(idx, e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <div className="text-base font-semibold text-slate-800 dark:text-[#E2E8F0] mb-5 leading-relaxed prose prose-sm max-w-none">
                      {renderContent(q.text)}
                    </div>
                  )}

                  {/* Hình ảnh đính kèm câu hỏi (từ import file DOCX) */}
                  {q.imageUrl && (
                    <div className="mb-4">
                      <img
                        src={q.imageUrl.startsWith("data:") ? q.imageUrl : `data:image/jpeg;base64,${q.imageUrl}`}
                        alt="Hình ảnh câu hỏi"
                        className="max-w-[450px] max-h-[300px] rounded-lg border border-slate-200 dark:border-cyan-950/40 shadow-sm object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${opt.isCorrect ? "bg-blue-50 border-blue-400" : "bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40 border-transparent hover:border-slate-200 dark:border-cyan-950/40"
                          }`}
                      >
                        {/* Radio — click to set correct */}
                        <button
                          onClick={() => setCorrectOption(idx, oIdx)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${opt.isCorrect ? "bg-blue-900 border-blue-900" : "bg-white dark:bg-[#0A1F3E] border-slate-300 hover:border-blue-400"
                            }`}
                        >
                          {opt.isCorrect && <div className="w-2 h-2 rounded-full bg-white dark:bg-[#0A1F3E]" />}
                        </button>

                        {/* Option text — editable inline */}
                        {editingQIdx === idx ? (
                          <input
                            className="flex-1 text-sm bg-transparent border-b border-blue-200 outline-none py-0.5 font-medium text-slate-700 dark:text-slate-300"
                            value={opt.text}
                            onChange={e => updateOptionText(idx, oIdx, e.target.value)}
                          />
                        ) : (
                          <div className={`text-sm font-medium flex-1 ${opt.isCorrect ? "text-blue-900 dark:text-[#00C6FF]" : "text-slate-600"}`}>
                            <SmartMarkdown content={opt.text} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Sidebar */}
      <div className="w-80 bg-white dark:bg-[#0A1F3E] border-l border-slate-200 dark:border-cyan-950/40 dark:border-cyan-950/40 p-8 overflow-y-auto space-y-8 shrink-0 shadow-2xl shadow-slate-200/50">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-[#E2E8F0] mb-6">{t('sidebar.title')}</h2>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('sidebar.label_title')}</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t('sidebar.placeholder_title')}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white dark:bg-[#0A1F3E] focus:border-blue-200 outline-none transition-all font-semibold text-slate-700 dark:text-slate-300"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('sidebar.label_duration')}</label>
              <div className="relative">
                <input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder={t('sidebar.placeholder_duration')}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white dark:bg-[#0A1F3E] focus:border-blue-200 outline-none transition-all font-bold text-slate-700 dark:text-slate-300"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">MINS</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('sidebar.label_versions')}</label>
              <input
                type="number"
                value={versionCount}
                onChange={e => setVersionCount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={t('sidebar.placeholder_versions')}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white dark:bg-[#0A1F3E] focus:border-blue-200 outline-none transition-all font-bold text-slate-700 dark:text-slate-300"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Bắt đầu tự động (Tùy chọn)</label>
              <input
                type="datetime-local"
                value={scheduledStartTime}
                onChange={e => setScheduledStartTime(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white dark:bg-[#0A1F3E] focus:border-blue-200 outline-none transition-all font-bold text-slate-700 dark:text-slate-300"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Độ khó tổng thể</label>
              <select 
                value={difficulty} 
                onChange={e => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white dark:bg-[#0A1F3E] focus:border-blue-200 outline-none transition-all font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
              >
                <option value="EASY">🟢 Dễ</option>
                <option value="MEDIUM">🟡 Trung bình</option>
                <option value="HARD">🔴 Khó</option>
                <option value="EXPERT">🟣 Chuyên gia</option>
              </select>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40 rounded-2xl border border-transparent hover:border-slate-100 dark:border-cyan-950/30 transition-all">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-[20px]">shuffle</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('sidebar.shuffle')}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input checked={shuffle} onChange={e => setShuffle(e.target.checked)} className="sr-only peer" type="checkbox" />
                  <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-[#0A1F3E] after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40 rounded-2xl border border-transparent hover:border-slate-100 dark:border-cyan-950/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-[20px]">visibility</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">AI Proctoring</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input checked={aiProctoring} onChange={e => setAiProctoring(e.target.checked)} className="sr-only peer" type="checkbox" />
                    <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-[#0A1F3E] after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{t('sidebar.ai_proctoring_desc')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-cyan-950/30">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{t('sidebar.summary')}</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium">{t('sidebar.total_questions')}</span>
              <span className="font-bold text-blue-900 dark:text-[#00C6FF]">{questions.length} câu</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium">{t('sidebar.difficulty')}</span>
              <span className="font-bold text-blue-900 dark:text-[#00C6FF]">
                {difficulty === "EASY" ? "Dễ" : 
                 difficulty === "MEDIUM" ? "Trung bình" : 
                 difficulty === "HARD" ? "Khó" : "Chuyên gia"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <button
            onClick={() => handleSave("WAITING")}
            disabled={isSaving || !questions.length}
            className="w-full py-4 bg-blue-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-900/20 hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? t('sidebar.btn_processing') : t('sidebar.btn_publish')}
          </button>
          <button
            onClick={() => handleSave("DRAFT")}
            disabled={isSaving || !questions.length}
            className="w-full py-4 bg-white dark:bg-[#0A1F3E] border-2 border-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40 transition-all disabled:opacity-50"
          >
            Lưu bản nháp
          </button>
        </div>
      </div>

      {/* Floating AI Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => { }}
          className="w-14 h-14 bg-blue-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-3xl">auto_awesome</span>
        </button>
      </div>
    </main>
  );
}

export default function ExamBuilder() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00355f]" />
      </div>
    }>
      <ExamBuilderContent />
    </Suspense>
  );
}
