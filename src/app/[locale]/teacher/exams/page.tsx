"use client";
import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { SmartMarkdown } from "@/components/ui/SmartMarkdown";
import { EDUCATION_HIERARCHY } from "@/lib/education-levels";

type Option = { id: string; text: string; isCorrect: boolean };
type Question = { id: string; type: string; text: string; imageUrl?: string; options: Option[] };

type Step = "upload" | "generating" | "review" | "preview";

function ExamBuilderContent() {
  const router = useRouter();
  const t = useTranslations('TeacherExams');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const fileRefImport = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  type CreationMode = "ai" | "manual" | "import";
  const [creationMode, setCreationMode] = useState<CreationMode>("ai");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState<number | "">("");
  const [questionCount, setQuestionCount] = useState<number | "">("");
  const [shuffle, setShuffle] = useState(true);
  const [aiProctoring, setAiProctoring] = useState(false);
  const [allowReview, setAllowReview] = useState(true);
  const [scheduledStartTime, setScheduledStartTime] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [extractedText, setExtractedText] = useState("");
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [versionCount, setVersionCount] = useState<number | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiCommand, setAiCommand] = useState("");
  const [error, setError] = useState("");
  // --- Prompt mode states ---
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [language, setLanguage] = useState("vi");
  const [generatingMode, setGeneratingMode] = useState<"file" | "prompt">("file");
  const [aiSubMode, setAiSubMode] = useState<"file" | "prompt">("prompt");
  // -------------------------
  const [genLog, setGenLog] = useState("Đang khởi tạo tiến trình...");
  const [genProgress, setGenProgress] = useState(0);
  const [editingQIdx, setEditingQIdx] = useState<number | null>(null);
  const [editingOptIdx, setEditingOptIdx] = useState<{ q: number; o: number } | null>(null);
  const imgUploadRef = useRef<HTMLInputElement>(null);
  const [pendingImgQIdx, setPendingImgQIdx] = useState<number | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Flag Ä‘á»ƒ trÃ¡nh autosave ghi Ä‘Ã¨ trong khi Ä‘ang load tá»« URL
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // 1a. Load tá»« URL query param ?edit=<examId> (uu tiÃªn cao nháº¥t, fetch tá»« API)
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;
    setIsLoadingFromUrl(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/exams/${editId}`, {
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
      setAllowReview(exam.allowReview ?? true);
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

  // 1b. Xá»­ lÃ½ cháº¿ Ä‘á»™ truy cáº­p tá»« URL (?mode=import hoáº·c ?mode=manual)
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "import") setCreationMode("import");
    else if (mode === "manual") setCreationMode("manual");
    else if (mode === "ai") setCreationMode("ai");
  }, [searchParams]);

  // classroomId tá»« URL â€” náº¿u cÃ³ thÃ¬ sau lÆ°u quáº¥y láº¡i lá»›p há»c
  const classroomId = searchParams.get("classroomId");

  // 1c. Fallback: KhÃ´i phá»¥c tá»« LocalStorage khi khÃ´ng cÃ³ URL param
  useEffect(() => {
    if (searchParams.get("edit")) return; // Æ°u tiÃªn URL param
    const savedData = localStorage.getItem("exam_builder_state");
    if (savedData) {
      try {
        const { step: savedStep, title, duration, questionCount, questions, versionCount, extractedText: savedText, editingId: savedId, allowReview: savedAllowReview } = JSON.parse(savedData);
        if (savedStep && savedStep !== "generating") setStep(savedStep);
        if (title) setTitle(title);
        if (duration) setDuration(duration);
        if (questionCount) setQuestionCount(questionCount);
        if (questions) setQuestions(questions);
        if (versionCount) setVersionCount(versionCount);
        if (savedText) setExtractedText(savedText);
        if (savedId) setEditingId(savedId);
        if (typeof savedAllowReview === "boolean") setAllowReview(savedAllowReview);
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

  // 2. Tá»± Ä‘á»™ng lÆ°u dá»¯ liá»‡u (chá»‰ khi khÃ´ng Ä‘ang load tá»« URL)
  useEffect(() => {
    if (step !== "generating" && !isLoadingFromUrl) {
      const stateToSave = { step, title, duration, questionCount, questions, versionCount, extractedText, editingId, creationMode, allowReview };
      localStorage.setItem("exam_builder_state", JSON.stringify(stateToSave));
    }
  }, [step, title, duration, questionCount, questions, versionCount, extractedText, editingId, creationMode, allowReview, isLoadingFromUrl]);

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
    setGenLog("Đang khởi tạo tiến trình...");
    setGeneratingMode("file");
    let jobId = "";
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("questionCount", String(questionCount));

      const uploadRes = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api/ai/generate-questions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` },
        body: formData,
      });

      // Xá»­ lÃ½ 401: Token háº¿t háº¡n â†’ redirect vá» login
      if (uploadRes.status === 401 || uploadRes.status === 403) {
        toast.error(t('toast.session_expired'));
        router.push("/login");
        return;
      }

      // Parse an toÃ n: Ä‘á»c text trÆ°á»›c, trÃ¡nh crash khi body rá»—ng
      const rawText = await uploadRes.text();
      if (!rawText || !rawText.trim()) {
        throw new Error(t('toast.empty_response'));
      }
      const uploadData = JSON.parse(rawText);
      if (!uploadRes.ok) throw new Error(uploadData.error || t('toast.upload_error'));

      jobId = uploadData.jobId;
      setGenProgress(15);
      setGenLog("Đang tải lên và xử lý...");
    } catch (e: any) {
      toast.error(e.message || t('toast.connection_error'));
      setStep("upload");
      return;
    }

    let startTime = Date.now();
    let pseudoProgress = 15;

    pollingRef.current = setInterval(async () => {
      // 1. Cáº­p nháº­t tiáº¿n trÃ¬nh giáº£ láº­p Ä‘á»ƒ ngÆ°á»i dÃ¹ng khÃ´ng cáº£m tháº¥y treo
      pseudoProgress += Math.random() * 2;
      if (pseudoProgress > 95) pseudoProgress = 95;
      setGenProgress(Math.floor(pseudoProgress));

      // 2. Cáº­p nháº­t log theo tiáº¿n trÃ¬nh
      if (pseudoProgress > 20 && pseudoProgress < 40) setGenLog("AI đang trích xuất nội dung văn bản...");
      if (pseudoProgress >= 40 && pseudoProgress < 65) setGenLog("Đang phân tích cấu trúc và nhận diện câu hỏi...");
      if (pseudoProgress >= 65 && pseudoProgress < 85) setGenLog("Đang chuẩn hóa định dạng và trích xuất hình ảnh...");
      if (pseudoProgress >= 85) setGenLog("Đang đóng gói dữ liệu và hoàn thiện...");

      // 3. Kiá»ƒm tra Timeout sau 5 phÃºt
      if (Date.now() - startTime > 300000) {
        clearInterval(pollingRef.current!);
        toast.error(t('toast.timeout'));
        setStep("upload");
        return;
      }

      try {
        const pollRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/ai/jobs/${jobId}`, {
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
          setGenLog("Hoàn tất! Đang chuyển sang màn hình kiểm tra...");
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
          toast.error(t('toast.ai_failed') + (job.errorMessage || "AI gặp lỗi khi xử lý tài liệu này."));
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
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api/ai/generate-from-prompt", {
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
        const poll = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/ai/jobs/${jobId}`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
        });
        if (!poll.ok) return;
        const job = await poll.json();
        if (job.status === "DONE") {
          clearInterval(pollingRef.current!);
          setGenProgress(100);
          setGenLog("Hoàn tất! Đang chuyển sang màn hình kiểm tra...");
          setQuestions(job.questions || []);
          setExtractedText(job.extractedText || "");
          setExtractedImages([]);
          setTimeout(() => { toast.success(`AI đã biên soạn xong ${job.questions?.length || 0} câu hỏi!`); setStep("review"); }, 500);
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
    setGenLog("Đang khởi tạo tiến trình...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("accessToken");
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api/questions/extract", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      // Xá»­ lÃ½ 401: Token háº¿t háº¡n â†’ redirect vá» login
      if (res.status === 401 || res.status === 403) {
        toast.error(t('toast.session_expired'));
        router.push("/login");
        return;
      }

      // Parse an toÃ n: Ä‘á»c text trÆ°á»›c, trÃ¡nh crash khi body rá»—ng
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
      setGenLog("Hoàn tất! Đang chuyển sang màn hình kiểm tra...");

      const qs = (data.questions || []).map((q: any, i: number) => ({
        id: q.id || String(Date.now() + i),
        type: "Trắc nghiệm",
        text: q.text || q.content || q.question || "",
        imageUrl: q.imageBase64 || null,
        options: (q.options || []).map((o: any) => ({
          id: o.id || o.label?.toLowerCase() || String(i),
          text: o.text || o.content || "",
          isCorrect: false
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

  const handleSaveTemplate = async () => {
    setIsSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const versions = [{
        versionCode: "101",
        questions: [...questions]
      }];

      const payload = {
        title,
        duration: 0,
        shuffle: false,
        aiProctoring: false,
        allowReview,
        difficulty,
        grade: grade || null,
        subject: subject || null,
        teacherId: user.id,
        teacherName: user.fullName,
        status: "DRAFT",
        isTemplate: true,
        isPractice: false,
        isBankItem: false,
        versions,
        extractedImages
      };

      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/exams/${editingId}`
        : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api/exams";

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
        clearPersistedState();
        toast.success("Lưu đề thi vào Kho đề thành công!");
        router.push(`/${locale}/teacher/exam-templates`);
      } else {
        toast.error("Lỗi khi lưu đề thi.");
      }
    } catch (e) {
      toast.error("Lỗi kết nối.");
    } finally {
      setIsSaving(false);
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
        title, duration, shuffle, aiProctoring, allowReview, difficulty,
        grade: grade || null,
        subject: subject || null,
        teacherId: user.id, teacherName: user.fullName,
        status: status === "WAITING" ? "PUBLISHED" : status,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime).getTime() : null,
        classroomId: classroomId || null,
        isPractice: false,
        isBankItem: false,
        versions, extractedImages
      };

      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/exams/${editingId}`
        : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api/exams";

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
          // CÃ´ng bá»‘ Ä‘á» â†’ vÃ o tháº³ng trang phÃ²ng thi Ä‘á»ƒ chia sáº» mÃ£ vÃ  báº¯t Ä‘áº§u
          router.push(`/teacher/exam-room/detail?id=${savedExam.id}`);
          toast.success(t('toast.publish_success'));
        } else if (classroomId) {
          // LÆ°u báº£n nhÃ¡p tá»« lá»›p há»c â†’ quay láº¡i lá»›p há»c
          router.push(`/teacher/classrooms/detail?id=${classroomId}?tab=exams`);
          toast.success("Bài thi đã được tạo và gắn vào lớp!");
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

  // Render ná»™i dung cÃ¢u há»i: chuyá»ƒn [IMG_N] â†’ <img>, cÃ²n láº¡i â†’ SmartMarkdown (memoized)
  const renderContent = useCallback((text: string | null | undefined) => {
    const safeText = text || "";
    if (!safeText.trim()) {
      return <span className="text-slate-400 italic text-sm">Chưa có nội dung</span>;
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
              ? <Image key={i} src={`data:image/jpeg;base64,${src}`} alt={`Hình ${imgIdx}`} width={450} height={300} unoptimized className="max-w-[450px] h-auto max-h-[300px] object-contain rounded-lg my-3 border border-slate-200 dark:border-cyan-950/40 shadow-sm" />
              : <span key={i} className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-mono">[IMG_{imgIdx} - chưa có ảnh]</span>;
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
              <h2 className="text-2xl font-black text-[#00355f] dark:text-slate-200 tracking-tight">Đang phân tích tài liệu...</h2>
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
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiến trình</span>
                <span className="text-[10px] font-bold text-blue-600 dark:text-[#00C6FF] uppercase tracking-widest animate-pulse">Đang xử lý...</span>
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
    <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[radial-gradient(circle_at_top_left,#102a4a_0%,#061326_36%,#020817_100%)] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumbs & Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2">
              <span>Kho đề</span>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="text-blue-600 dark:text-cyan-300">Biên soạn</span>
            </div>
            <h1 className="text-3xl font-black text-[#00355f] dark:text-white dark:drop-shadow-[0_2px_18px_rgba(34,211,238,0.28)] tracking-tight">Biên soạn đề thi</h1>

            <div className="flex gap-2 mt-4 bg-slate-100 dark:bg-[#071A33] dark:text-slate-300 p-1 rounded-xl w-fit border border-transparent dark:border-cyan-900/50">
              <button
                onClick={() => { setCreationMode("ai"); setStep("upload"); setFile(null); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${creationMode === "ai" ? "bg-white dark:bg-cyan-400 text-blue-700 dark:text-[#061326] shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-cyan-950/40"}`}
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
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${creationMode === "import" ? "bg-white dark:bg-cyan-400 text-blue-700 dark:text-[#061326] shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-cyan-950/40"}`}
              >
                <span className="material-symbols-outlined text-[16px] inline-block align-text-bottom mr-1">file_open</span>
                Nhập từ file
              </button>
              <button
                onClick={() => {
                  setCreationMode("manual");
                  if (questions.length > 0 && step === "upload") setStep("review");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${creationMode === "manual" ? "bg-white dark:bg-cyan-400 text-blue-700 dark:text-[#061326] shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-cyan-950/40"}`}
              >
                <span className="material-symbols-outlined text-[16px] inline-block align-text-bottom mr-1">edit_square</span>
                Tạo thủ công
              </button>
            </div>

          </div>
          <div className="flex items-center gap-3 shrink-0">
            {creationMode === "ai" && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#4c2b00] text-[#FFD700] rounded-full text-xs font-bold shadow-sm border border-[#FFD700]/20">
                <span className="material-symbols-outlined text-[16px] animate-pulse">auto_awesome</span>
                AI đang hoạt động
              </div>
            )}
          </div>
        </div>

        {/* Warning / Guide Banner */}
        {creationMode === "ai" && (
          <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-900/30 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] animate-pulse">warning</span>
            </div>
            <div className="flex-1 py-0.5">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">Lưu ý quan trọng</h4>
              <p className="text-xs text-amber-800/90 dark:text-amber-400/90 mt-0.5 leading-relaxed font-semibold">
                Công cụ này sử dụng AI để phân tích tài liệu. Xin vui lòng kiểm tra lại chất lượng câu hỏi trước khi xuất bản.
              </p>
            </div>
          </div>
        )}

        {creationMode === "import" && (
          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/60 dark:border-blue-900/30 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] animate-pulse">info</span>
            </div>
            <div className="flex-1 py-0.5">
              <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">Hướng dẫn nhập câu hỏi từ file</h4>
              <p className="text-xs text-blue-800/90 dark:text-blue-400/90 mt-0.5 leading-relaxed font-semibold">
                Hệ thống tự động tách câu hỏi dựa trên cấu trúc văn bản (ví dụ: &quot;Câu 1:&quot;, &quot;A. B. C. D.&quot;). Vui lòng kiểm tra lại nội dung câu hỏi sau khi trích xuất và tự chọn đáp án đúng cho từng câu hỏi trước khi lưu đề thi.
              </p>
            </div>
          </div>
        )}

        {creationMode === "manual" && (
          <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/60 dark:border-green-900/30 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] animate-pulse">edit_note</span>
            </div>
            <div className="flex-1 py-0.5">
              <h4 className="text-sm font-bold text-green-900 dark:text-green-300">Chế độ biên soạn thủ công</h4>
              <p className="text-xs text-green-800/90 dark:text-green-400/90 mt-0.5 leading-relaxed font-semibold">
                Bạn đang tự tay soạn thảo đề thi. Hãy nhập nội dung câu hỏi, điền các phương án lựa chọn và đánh dấu đáp án đúng cho từng câu hỏi để hoàn tất.
              </p>
            </div>
          </div>
        )}

        {/* Unified AI Area */}
        {creationMode === "ai" && step === "upload" && (
          <div className="bg-white dark:bg-[#0B1D36] rounded-3xl border border-slate-100 dark:border-cyan-800/50 shadow-sm dark:shadow-[0_24px_80px_-40px_rgba(34,211,238,0.45)] overflow-hidden">
            {/* Sub-mode toggle */}
            <div className="flex border-b border-slate-100 dark:border-cyan-800/50 bg-white dark:bg-[#071A33]">
              <button
                onClick={() => { setAiSubMode("prompt"); setFile(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${aiSubMode === "prompt" ? "bg-violet-50 text-violet-700 border-b-2 border-violet-600 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-400" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-cyan-950/40"
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">psychology</span>
                Tạo từ chủ đề
              </button>
              <button
                onClick={() => { setAiSubMode("file"); setTopic(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${aiSubMode === "file" ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-400" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-cyan-950/40"
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                Tạo từ tài liệu
              </button>
            </div>

            {/* â”€â”€ Sub-mode: FROM FILE â”€â”€ */}
            {aiSubMode === "file" && (
              <div className="p-6 space-y-5">
                {/* HÆ°á»›ng dáº«n sá»­ dá»¥ng */}
                <div className="bg-blue-50/50 dark:bg-[#09284A] border border-blue-200/60 dark:border-sky-700/60 rounded-2xl p-5 mb-2">
                  <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-[20px]">lightbulb</span>
                    Hướng dẫn chi tiết tạo đề từ tài liệu
                  </h4>
                  <div className="text-xs text-blue-900/80 dark:text-blue-300/80 space-y-3 font-medium leading-relaxed">
                    <p>AI có khả năng đọc và hiểu nội dung từ tài liệu bạn tải lên để tự động biên soạn câu hỏi trắc nghiệm tương ứng. Để đạt hiệu quả tốt nhất, Thầy/Cô vui lòng lưu ý:</p>
                    
                    <div className="bg-white/60 dark:bg-[#061326] rounded-xl p-4 border border-blue-100/50 dark:border-sky-800/60 shadow-sm">
                      <p className="font-bold text-blue-800 dark:text-blue-400 mb-1">Các định dạng tệp được hỗ trợ:</p>
                      <p className="text-blue-700 dark:text-blue-300 mb-3 bg-blue-100/50 dark:bg-blue-900/40 py-1.5 px-3 rounded-lg font-mono text-[10px]">PDF, Word (.docx), văn bản thuần túy (.txt) - dung lượng tối đa 25MB</p>
                      
                      <p className="font-bold text-blue-800 dark:text-blue-400 mb-1">Quy trình thực hiện:</p>
                      <ol className="list-decimal list-outside ml-4 space-y-1.5 text-blue-800/90 dark:text-blue-300/90">
                        <li>Thầy/Cô kéo thả hoặc nhấp chọn tài liệu bài học, đề cương, sách giáo khoa hoặc tệp tài nguyên từ máy tính.</li>
                        <li>Sau khi tệp được tải lên thành công, nhập số lượng câu hỏi mong muốn AI biên soạn dựa trên nội dung tài liệu.</li>
                        <li>Nhấn nút <b>Aura AI - Bắt đầu tạo câu hỏi từ tài liệu</b> để hệ thống tiến hành phân tích và trích xuất.</li>
                      </ol>
                    </div>
                    
                    <ul className="list-disc list-outside ml-4 space-y-1.5 pt-1">
                      <li>Nội dung tài liệu tải lên cần rõ ràng, không bị lỗi font hoặc chứa quá nhiều ký tự đặc biệt không đọc được.</li>
                      <li>Sau khi AI hoàn tất tạo câu hỏi, vui lòng kiểm tra và rà soát kỹ lại nội dung cũng như đáp án trước khi lưu bài.</li>
                    </ul>
                  </div>
                </div>

                <div
                  onClick={() => fileRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer group ${file ? "border-blue-400 bg-blue-50/30 dark:bg-sky-500/10 dark:border-sky-500" : "border-slate-200 dark:border-cyan-800/60 hover:border-blue-400 hover:bg-blue-50/10 dark:hover:bg-sky-500/10"
                    }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-cyan-950/50 dark:text-slate-300 text-slate-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                    {file ? file.name : "Tải tài liệu để AI tự động tạo câu hỏi"}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Hỗ trợ định dạng PDF, Word, TXT - tối đa 25MB</p>
                  <button className="mt-3 text-blue-600 font-bold text-sm hover:underline">Chọn tệp từ máy tính</button>
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />

                  {file && !questions.length && (
                    <div className="mt-5 flex flex-col items-center gap-3">
                      <div className="w-56">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Số lượng câu hỏi muốn tạo</label>
                        <input
                          type="number"
                          value={questionCount}
                          onChange={e => setQuestionCount(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="VD: 20"
                          className="w-full px-4 py-2 bg-white dark:bg-[#061326] border border-slate-200 dark:border-cyan-800/60 rounded-xl text-center font-bold text-blue-900 dark:text-cyan-200 outline-none"
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleGenerate(); }}
                        className="px-8 py-3 bg-blue-900 text-white rounded-xl font-bold text-sm shadow-xl hover:bg-blue-800 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        Bắt đầu tạo câu hỏi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* â”€â”€ Sub-mode: FROM TOPIC â”€â”€ */}
            {aiSubMode === "prompt" && (
              <div className="p-6 space-y-5">
                {/* HÆ°á»›ng dáº«n sá»­ dá»¥ng */}
                <div className="bg-blue-50/50 dark:bg-[#09284A] border border-blue-200/60 dark:border-sky-700/60 rounded-2xl p-5 mb-2">
                  <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-[20px]">lightbulb</span>
                    Hướng dẫn chi tiết tạo đề bằng AI
                  </h4>
                  <div className="text-xs text-blue-900/80 dark:text-blue-300/80 space-y-3 font-medium leading-relaxed">
                    <p>Để AI hiểu rõ và tạo ra bộ câu hỏi chính xác nhất, Thầy/Cô vui lòng mô tả yêu cầu theo cấu trúc sau:</p>
                    
                    <div className="bg-white/60 dark:bg-[#061326] rounded-xl p-4 border border-blue-100/50 dark:border-sky-800/60 shadow-sm">
                      <p className="font-bold text-blue-800 dark:text-blue-400 mb-1">Công thức viết yêu cầu chuẩn:</p>
                      <p className="italic text-blue-700 dark:text-blue-300 mb-3 bg-blue-100/50 dark:bg-blue-900/40 py-1.5 px-3 rounded-lg">[Môn học] + [Lớp/Khối] + [Tên bài học/Chương cụ thể] + [Yêu cầu thêm nếu có]</p>
                      
                      <p className="font-bold text-blue-800 dark:text-blue-400 mb-1">Ví dụ minh họa dễ hiểu:</p>
                      <ul className="list-disc list-outside ml-4 space-y-1.5 text-blue-800/90 dark:text-blue-300/90">
                        <li><span className="font-semibold text-blue-600 dark:text-blue-400">Môn Lịch sử lớp 9</span>, <span className="font-semibold text-emerald-600 dark:text-emerald-400">bài Chiến tranh thế giới thứ 2</span>, <span className="font-semibold text-amber-600 dark:text-amber-400">tập trung vào nguyên nhân và kết quả.</span></li>
                        <li><span className="font-semibold text-blue-600 dark:text-blue-400">Môn Toán lớp 12</span>, <span className="font-semibold text-emerald-600 dark:text-emerald-400">chương Tích phân bất định</span>, <span className="font-semibold text-amber-600 dark:text-amber-400">chỉ gồm các bài toán ở mức độ vận dụng.</span></li>
                        <li><span className="font-semibold text-blue-600 dark:text-blue-400">Tiếng Anh lớp 6</span>, <span className="font-semibold text-emerald-600 dark:text-emerald-400">Unit 4: My Neighbourhood</span>, <span className="font-semibold text-amber-600 dark:text-amber-400">kiểm tra chủ yếu về từ vựng.</span></li>
                      </ul>
                    </div>
                    
                    <ul className="list-disc list-outside ml-4 space-y-1.5 pt-1">
                      <li>Sau khi nhập mô tả, Thầy/Cô chọn <b>Độ khó</b>, <b>Ngôn ngữ</b> và nhập <b>Số câu</b> muốn tạo ở các ô phía dưới.</li>
                      <li>Cuối cùng nhấn nút <b>Aura AI - Biên soạn đề thi ngay</b> và chờ hệ thống tạo đề.</li>
                    </ul>
                  </div>
                </div>

                {/* Chips */}
                <div className="flex flex-wrap gap-2">
                  {[
                    "Toán 12 - Tích phân",
                    "Vật lý 11 - Điện từ học",
                    "Tiếng Anh IELTS 6.0",
                    "Lập trình Java cơ bản",
                    "Lịch sử Việt Nam - 1945",
                    "Hóa học hữu cơ lớp 11"
                  ].map(chip => (
                    <button key={chip} onClick={() => setTopic(chip)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${topic === chip ? "bg-violet-600 text-white border-violet-600 dark:bg-violet-400 dark:text-[#160a2e] dark:border-violet-300" : "bg-slate-50 dark:bg-[#071A33] text-slate-500 dark:text-slate-300 border-slate-200 dark:border-cyan-800/60 hover:border-violet-300 hover:text-violet-600 dark:hover:text-violet-200 dark:hover:border-violet-500"
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
                    placeholder="Ví dụ: Đề thi môn Toán lớp 12 chương tích phân bất định, tập trung vào kỹ thuật đổi biến..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:border-cyan-800/60 rounded-2xl outline-none focus:border-violet-400 focus:bg-white dark:focus:bg-[#0B1D36] dark:bg-[#061326] transition-all text-sm text-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none leading-relaxed"
                  />
                </div>

                {/* Settings Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Độ khó</label>
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#061326] border border-slate-200 dark:border-cyan-800/60 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-100 outline-none focus:border-violet-400">
                      <option value="EASY">Dễ</option>
                      <option value="MEDIUM">Trung bình</option>
                      <option value="HARD">Khó</option>
                      <option value="EXPERT">Chuyên gia</option>
                    </select>
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ngôn ngữ</label>
                    <button
                      type="button"
                      onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#061326] border border-slate-200 dark:border-cyan-800/60 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-100 outline-none focus:border-violet-400 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        {language === "vi" ? (
                          <>
                            <svg viewBox="0 0 30 20" className="w-5 h-3.5 rounded-sm object-cover shrink-0">
                              <rect width="30" height="20" fill="#da251d"/>
                              <polygon points="15,4 16.18,7.63 20,7.63 16.91,9.88 18.09,13.51 15,11.25 11.91,13.51 13.09,9.88 10,7.63 13.82,7.63" fill="#ffff00"/>
                            </svg>
                            Tiếng Việt
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 30 20" className="w-5 h-3.5 rounded-sm object-cover shrink-0">
                              <rect width="30" height="20" fill="#00247d"/>
                              <path d="M0,0 L30,20 M30,0 L0,20" stroke="#ffffff" strokeWidth="4"/>
                              <path d="M0,0 L30,20 M30,0 L0,20" stroke="#cf142b" strokeWidth="1.5"/>
                              <path d="M15,0 V20 M0,10 H30" stroke="#ffffff" strokeWidth="6"/>
                              <path d="M15,0 V20 M0,10 H30" stroke="#cf142b" strokeWidth="3.6"/>
                            </svg>
                            English
                          </>
                        )}
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
                    </button>

                    {isLangDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsLangDropdownOpen(false)} />
                        <div className="absolute right-0 left-0 mt-1 bg-white dark:bg-[#061326] border border-slate-200 dark:border-cyan-800/60 rounded-xl shadow-xl z-40 overflow-hidden py-1">
                          <button
                            type="button"
                            onClick={() => { setLanguage("vi"); setIsLangDropdownOpen(false); }}
                            className={`w-full px-3 py-2 text-left text-sm font-bold flex items-center gap-1.5 transition-colors ${language === "vi" ? "bg-slate-100 dark:bg-cyan-950/40 text-blue-700 dark:text-[#00C6FF]" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyan-950/20"}`}
                          >
                            <svg viewBox="0 0 30 20" className="w-5 h-3.5 rounded-sm object-cover shrink-0">
                              <rect width="30" height="20" fill="#da251d"/>
                              <polygon points="15,4 16.18,7.63 20,7.63 16.91,9.88 18.09,13.51 15,11.25 11.91,13.51 13.09,9.88 10,7.63 13.82,7.63" fill="#ffff00"/>
                            </svg>
                            Tiếng Việt
                          </button>
                          <button
                            type="button"
                            onClick={() => { setLanguage("en"); setIsLangDropdownOpen(false); }}
                            className={`w-full px-3 py-2 text-left text-sm font-bold flex items-center gap-1.5 transition-colors ${language === "en" ? "bg-slate-100 dark:bg-cyan-950/40 text-blue-700 dark:text-[#00C6FF]" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyan-950/20"}`}
                          >
                            <svg viewBox="0 0 30 20" className="w-5 h-3.5 rounded-sm object-cover shrink-0">
                              <rect width="30" height="20" fill="#00247d"/>
                              <path d="M0,0 L30,20 M30,0 L0,20" stroke="#ffffff" strokeWidth="4"/>
                              <path d="M0,0 L30,20 M30,0 L0,20" stroke="#cf142b" strokeWidth="1.5"/>
                              <path d="M15,0 V20 M0,10 H30" stroke="#ffffff" strokeWidth="6"/>
                              <path d="M15,0 V20 M0,10 H30" stroke="#cf142b" strokeWidth="3.6"/>
                            </svg>
                            English
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Số câu</label>
                    <input type="number" value={questionCount}
                      onChange={e => setQuestionCount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#061326] border border-slate-200 dark:border-cyan-800/60 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-100 text-center outline-none focus:border-violet-400"
                      placeholder="10" min={1} max={100} />
                  </div>
                </div>

                <style>{`
                  .aura-ai-compose-button {
                    --black-700: hsla(0 0% 12% / 1);
                    --border_radius: 9999px;
                    --transition: 0.3s ease-in-out;
                    --offset: 2px;
                    cursor: pointer;
                    position: relative;
                    display: flex;
                    width: 100%;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transform-origin: center;
                    padding: 0.9rem 2rem;
                    background-color: transparent;
                    border: none;
                    border-radius: var(--border_radius);
                    transform: scale(1);
                    transition: transform var(--transition), opacity var(--transition);
                  }

                  .aura-ai-compose-button::before {
                    content: "";
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 100%;
                    height: 100%;
                    background-color: var(--black-700);
                    border-radius: var(--border_radius);
                    box-shadow:
                      inset 0 0.5px hsl(0, 0%, 100%),
                      inset 0 -1px 2px 0 hsl(0, 0%, 0%),
                      0px 4px 10px -4px hsla(0 0% 0% / calc(1 - var(--active, 0))),
                      0 0 0 calc(var(--active, 0) * 0.15rem) hsl(260 97% 50% / 0.45);
                    transition: all var(--transition);
                    z-index: 0;
                  }

                  .aura-ai-compose-button::after {
                    content: "";
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 100%;
                    height: 100%;
                    background-color: hsla(260 97% 61% / 0.75);
                    background-image:
                      radial-gradient(at 51% 89%, hsla(266, 45%, 74%, 1) 0px, transparent 50%),
                      radial-gradient(at 100% 100%, hsla(266, 36%, 60%, 1) 0px, transparent 50%),
                      radial-gradient(at 22% 91%, hsla(266, 36%, 60%, 1) 0px, transparent 50%);
                    background-position: top;
                    opacity: var(--active, 0);
                    border-radius: var(--border_radius);
                    transition: opacity var(--transition);
                    z-index: 2;
                  }

                  .aura-ai-compose-button:is(:hover, :focus-visible) {
                    --active: 1;
                  }

                  .aura-ai-compose-button:active {
                    transform: scale(1);
                  }

                  .aura-ai-compose-button:disabled {
                    cursor: not-allowed;
                    opacity: 0.45;
                    --active: 0;
                  }

                  .aura-ai-compose-button .dots_border {
                    --size_border: calc(100% + 2px);
                    overflow: hidden;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: var(--size_border);
                    height: var(--size_border);
                    background-color: transparent;
                    border-radius: var(--border_radius);
                    z-index: -10;
                  }

                  .aura-ai-compose-button .dots_border::before {
                    content: "";
                    position: absolute;
                    top: 30%;
                    left: 50%;
                    transform-origin: left;
                    transform: rotate(0deg);
                    width: 100%;
                    height: 2rem;
                    background-color: white;
                    mask: linear-gradient(transparent 0%, white 120%);
                    animation: aura-ai-compose-rotate 2s linear infinite;
                  }

                  @keyframes aura-ai-compose-rotate {
                    to { transform: rotate(360deg); }
                  }

                  .aura-ai-compose-button .sparkle {
                    position: relative;
                    z-index: 10;
                    width: 1.35rem;
                  }

                  .aura-ai-compose-button .sparkle .path {
                    fill: currentColor;
                    stroke: currentColor;
                    transform-origin: center;
                    color: hsl(0, 0%, 100%);
                  }

                  .aura-ai-compose-button:is(:hover, :focus-visible) .sparkle .path {
                    animation: aura-ai-compose-path 1.5s linear 0.5s infinite;
                  }

                  .aura-ai-compose-button .sparkle .path:nth-child(1) { --scale_path_1: 1.2; }
                  .aura-ai-compose-button .sparkle .path:nth-child(2) { --scale_path_2: 1.2; }
                  .aura-ai-compose-button .sparkle .path:nth-child(3) { --scale_path_3: 1.2; }

                  @keyframes aura-ai-compose-path {
                    0%, 34%, 71%, 100% { transform: scale(1); }
                    17% { transform: scale(var(--scale_path_1, 1)); }
                    49% { transform: scale(var(--scale_path_2, 1)); }
                    83% { transform: scale(var(--scale_path_3, 1)); }
                  }

                  .aura-ai-compose-button .text_button {
                    position: relative;
                    z-index: 10;
                    background-image: linear-gradient(90deg, hsla(0 0% 100% / 1) 0%, hsla(0 0% 100% / var(--active, 0)) 120%);
                    background-clip: text;
                    font-size: 0.95rem;
                    font-weight: 900;
                    color: transparent;
                  }
                `}</style>
                <button
                  onClick={handleGenerateFromPrompt}
                  disabled={!topic.trim()}
                  className="aura-ai-compose-button"
                >
                  <span className="dots_border" />
                  <svg className="sparkle" viewBox="0 0 24 24" aria-hidden="true">
                    <path className="path" d="M12 2l1.45 4.4L18 8l-4.55 1.6L12 14l-1.45-4.4L6 8l4.55-1.6L12 2z" />
                    <path className="path" d="M19 13l.85 2.15L22 16l-2.15.85L19 19l-.85-2.15L16 16l2.15-.85L19 13z" />
                    <path className="path" d="M5 14l.75 1.75L7.5 16.5l-1.75.75L5 19l-.75-1.75-1.75-.75 1.75-.75L5 14z" />
                  </svg>
                  <span className="text_button">Aura AI - Biên soạn đề thi ngay</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* â”€â”€ Cháº¿ Ä‘á»™ Nháº­p tá»« file truyá»n thá»‘ng â”€â”€ */}
        {creationMode === "import" && step === "upload" && (
          <div className="bg-white dark:bg-[#0B1D36] rounded-3xl border border-slate-100 dark:border-cyan-800/50 shadow-sm dark:shadow-[0_24px_80px_-40px_rgba(34,211,238,0.45)] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-[#071A33] dark:border-cyan-800/50">
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
              onClick={() => fileRefImport.current?.click()}
              className={`relative border-2 border-dashed m-8 rounded-2xl p-12 text-center transition-all cursor-pointer group ${file ? "border-blue-400 bg-blue-50/30 dark:border-sky-500 dark:bg-sky-500/10" : "border-slate-200 dark:border-cyan-800/60 hover:border-blue-400 hover:bg-blue-50/10 dark:hover:bg-sky-500/10"
                }`}
            >
              <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-cyan-950/50 dark:text-slate-300 text-slate-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-sm">
                <span className="material-symbols-outlined text-4xl">cloud_upload</span>
              </div>
              <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">
                {file ? file.name : "Tải file DOCX/PDF để trích xuất câu hỏi"}
              </h3>
              <p className="text-sm text-slate-400 mt-2 font-medium max-w-md mx-auto">Hỗ trợ định dạng PDF, Word, TXT - tối đa 25MB</p>

              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#061326] border border-slate-200 dark:border-cyan-800/60 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span> PDF
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#061326] border border-slate-200 dark:border-cyan-800/60 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> DOCX
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#061326] border border-slate-200 dark:border-cyan-800/60 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span> TXT
                </div>
              </div>

              <button className="mt-6 px-6 py-2.5 bg-white dark:bg-[#061326] text-blue-700 dark:text-cyan-200 border border-blue-200 dark:border-cyan-800/60 shadow-sm font-bold text-sm rounded-xl hover:bg-blue-50 dark:hover:bg-cyan-950/40 transition-all">
                Chọn tệp từ máy tính
              </button>

              <input ref={fileRefImport} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />

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

        {/* Empty State cho cháº¿ Ä‘á»™ Thá»§ cÃ´ng */}
        {creationMode === "manual" && questions.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 dark:border-cyan-800/60 rounded-3xl p-16 text-center bg-white dark:bg-[#0B1D36] flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl">post_add</span>
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Chưa có câu hỏi nào</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">Bạn đang ở chế độ tạo đề thi thủ công. Hãy bắt đầu bằng việc thêm câu hỏi đầu tiên cho đề thi của bạn.</p>
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
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-cyan-800/60 pb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">list_alt</span>
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Danh sách câu hỏi</h2>
              </div>
              <button
                onClick={addManualQuestion}
                className="flex items-center gap-2 text-blue-600 dark:text-cyan-300 font-bold text-sm hover:bg-blue-50 dark:hover:bg-cyan-950/40 px-4 py-2 rounded-xl transition-all"
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
                <div key={q.id} className="bg-white dark:bg-[#0B1D36] rounded-2xl p-6 shadow-sm dark:shadow-[0_20px_60px_-38px_rgba(34,211,238,0.45)] border border-slate-100 dark:border-cyan-800/50 hover:shadow-md dark:hover:border-cyan-600/70 transition-all group relative">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-cyan-950/60 text-blue-700 dark:text-cyan-200 text-[10px] font-bold uppercase tracking-wider border border-transparent dark:border-cyan-800/60">
                      Câu {String(idx + 1).padStart(2, '0')} - {q.type.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        title="Thêm hình ảnh"
                        onClick={() => { setPendingImgQIdx(idx); imgUploadRef.current?.click(); }}
                        className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                      </button>
                      <button
                        title={editingQIdx === idx ? "Xong chỉnh sửa" : "Chỉnh sửa câu hỏi"}
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

                  {/* Question Text â€” editable or rendered */}
                  {editingQIdx === idx ? (
                    <textarea
                      className="w-full text-base font-semibold text-slate-800 dark:text-white mb-4 leading-relaxed bg-slate-50 dark:bg-[#061326] dark:border-cyan-800/60 border border-blue-200 rounded-xl p-3 outline-none resize-y min-h-[80px]"
                      value={q.text || ""}
                      onChange={e => updateQuestionText(idx, e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <div className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-5 leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                      {renderContent(q.text)}
                    </div>
                  )}

                  {/* HÃ¬nh áº£nh Ä‘Ã­nh kÃ¨m cÃ¢u há»i (tá»« import file DOCX) */}
                  {q.imageUrl && (
                    <div className="mb-4">
                      <Image
                        src={q.imageUrl.startsWith("data:") ? q.imageUrl : `data:image/jpeg;base64,${q.imageUrl}`}
                        alt="Hình ảnh câu hỏi"
                        width={450} height={300} unoptimized
                        className="max-w-[450px] max-h-[300px] w-auto rounded-lg border border-slate-200 dark:border-cyan-800/60 shadow-sm object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={opt.id}
                        onClick={() => editingQIdx !== idx && setCorrectOption(idx, oIdx)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${editingQIdx === idx ? "" : "cursor-pointer"} ${opt.isCorrect ? "bg-blue-50 border-blue-400 dark:bg-cyan-500/15 dark:border-cyan-400" : "bg-slate-50 dark:bg-[#061326] dark:border-cyan-800/50 border-transparent hover:border-slate-200 dark:hover:border-cyan-600"
                          }`}
                      >
                        {/* Radio â€” click to set correct */}
                        <button
                          type="button"
                          onClick={() => setCorrectOption(idx, oIdx)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${opt.isCorrect ? "bg-blue-900 border-blue-900 dark:bg-cyan-400 dark:border-cyan-400" : "bg-white dark:bg-[#0B1D36] border-slate-300 dark:border-cyan-800 hover:border-blue-400 dark:hover:border-cyan-500"
                            }`}
                        >
                          {opt.isCorrect && <div className="w-2 h-2 rounded-full bg-white dark:bg-[#061326]" />}
                        </button>

                        {/* Option text â€” editable inline */}
                        {editingQIdx === idx ? (
                          <input
                            onClick={e => e.stopPropagation()}
                            className="flex-1 text-sm bg-transparent border-b border-blue-200 dark:border-cyan-700 outline-none py-0.5 font-medium text-slate-700 dark:text-slate-100"
                            value={opt.text}
                            onChange={e => updateOptionText(idx, oIdx, e.target.value)}
                          />
                        ) : (
                          <div className={`text-sm font-medium flex-1 ${opt.isCorrect ? "text-blue-900 dark:text-cyan-100" : "text-slate-600 dark:text-slate-300"}`}>
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

      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1D36] border border-slate-200 dark:border-cyan-800/60 rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="font-headline font-black text-xl text-slate-800 dark:text-slate-200 mb-2">
              Lưu đề thi vào Kho đề
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-medium">
              Thiết lập các thông tin cơ bản cho đề thi mẫu trước khi lưu vào Kho đề cá nhân.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Tên đề thi *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tên đề thi..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#061326] border border-slate-200 dark:border-cyan-800/60 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Cấp bậc
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => {
                      setGrade(e.target.value);
                      setSubject("");
                    }}
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#061326] border border-slate-200 dark:border-cyan-800/60 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-100 outline-none focus:border-sky-400"
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
                    Môn học
                  </label>
                  <select
                    disabled={!grade}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#061326] border border-slate-200 dark:border-cyan-800/60 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-100 outline-none disabled:opacity-55 focus:border-sky-400"
                  >
                    <option value="">Chọn môn</option>
                    {(grade ? EDUCATION_HIERARCHY.find((l) => l.name === grade)?.subjects.map((s) => s.name) || [] : []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-cyan-800/60 mt-6">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-[#061326] text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-cyan-950/40 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    if (!title.trim()) {
                      toast.error("Vui lòng nhập tên đề thi.");
                      return;
                    }
                    setIsSaveModalOpen(false);
                    await handleSaveTemplate();
                  }}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white text-xs font-black rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? "Đang lưu..." : "Lưu đề thi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div className="fixed right-8 top-1/2 z-50 -translate-y-1/2">
          <button
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-cyan-200/70 bg-white/85 px-5 py-4 text-left shadow-[0_18px_48px_-18px_rgba(14,165,233,0.65)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-cyan-300 hover:shadow-[0_24px_58px_-20px_rgba(14,165,233,0.85)] active:translate-y-0 dark:border-cyan-500/20 dark:bg-[#06172a]/85"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/12 via-blue-500/10 to-violet-500/12 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-700 to-cyan-400 text-white shadow-lg shadow-cyan-500/30 transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[24px]">inventory_2</span>
            </span>
            <span className="relative">
              <span className="block text-sm font-black text-slate-900 dark:text-white">Lưu vào Kho đề</span>
              <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">Lưu bộ câu hỏi hiện tại</span>
            </span>
          </button>
        </div>
      )}
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
