"use client";
import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useProctoring, VIOLATION_LABELS } from "@/hooks/useProctoring";
import { useTranslations } from "next-intl";
import { useBrowserProctoring, BROWSER_VIOLATION_LABELS } from "@/hooks/useBrowserProctoring";
import KatexStyles from "@/components/KatexStyles";
import { preprocessMarkdownTables } from "@/lib/markdownUtils";


const QuestionItem = memo(function QuestionItem({
  q,
  idx,
  studentAnswer,
  submissionResult,
  handleSelect,
  renderContentWithImages
}: any) {
  const isCorrectAnswer = q.options.find((o: any) => o.isCorrect)?.id;
  const isStudentCorrect = studentAnswer === isCorrectAnswer;

  return (
    <div id={`question-${q.id}`} className={`bg-white dark:bg-[#0b1d33] rounded-2xl p-8 shadow-sm border space-y-6 ${submissionResult ? (isStudentCorrect ? 'border-green-200 dark:border-green-500/40 shadow-green-100 dark:shadow-green-950/20' : 'border-red-200 dark:border-red-500/40 shadow-red-100 dark:shadow-red-950/20') : 'border-slate-200 dark:border-cyan-500/20'}`}>
      <div className="flex items-start gap-4">
        <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${submissionResult ? (isStudentCorrect ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-200') : 'bg-slate-100 dark:bg-[#07182b] text-slate-500 dark:text-slate-300'}`}>
          {idx + 1}
        </span>
        <div className="text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed max-w-none">
          {renderContentWithImages(q.text)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 pl-12">
        {q.options.map((opt: any) => {
          let optionClass = 'border-slate-100 bg-slate-50 dark:bg-[#07182b] dark:border-cyan-500/15 hover:border-slate-200 dark:hover:border-cyan-400/40';
          let textClass = 'text-slate-600 dark:text-slate-300';
          let showIcon = null;

          if (submissionResult) {
            if (opt.isCorrect) {
              optionClass = 'border-green-500 bg-green-50 shadow-sm';
              textClass = 'text-green-700';
              showIcon = <span className="material-symbols-outlined text-green-600">check_circle</span>;
            } else if (studentAnswer === opt.id && !opt.isCorrect) {
              optionClass = 'border-red-500 bg-red-50 shadow-sm';
              textClass = 'text-red-700';
              showIcon = <span className="material-symbols-outlined text-red-600">cancel</span>;
            } else {
              optionClass = 'border-slate-100 bg-slate-50 dark:bg-[#07182b] dark:border-cyan-500/15 opacity-60';
            }
          } else {
            if (studentAnswer === opt.id) {
              optionClass = 'border-[#00355f] bg-[#00355f]/10 dark:border-cyan-400 dark:bg-cyan-500/15 text-[#00355f] dark:text-cyan-200 shadow-sm';
              textClass = 'text-[#00355f] dark:text-cyan-100';
            }
          }

          return (
            <div
              key={opt.id} 
              role={!submissionResult ? "radio" : undefined}
              aria-checked={!submissionResult ? studentAnswer === opt.id : undefined}
              tabIndex={!submissionResult ? 0 : undefined}
              onClick={() => {
                if (!submissionResult) handleSelect(q.id, opt.id);
              }}
              onKeyDown={(e) => {
                if (!submissionResult && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleSelect(q.id, opt.id);
                }
              }}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${submissionResult ? 'cursor-default' : 'cursor-pointer'} ${optionClass}`}
            >
              <div className="flex items-center gap-4">
                {!submissionResult && (
                  <input 
                    type="radio" 
                    name={q.id} 
                    checked={studentAnswer === opt.id}
                    readOnly
                    className="w-5 h-5 accent-[#00355f] pointer-events-none" 
                  />
                )}
                 <div className={`text-base flex-1 min-w-0 ${textClass}`}>
                  <ReactMarkdown 
                     remarkPlugins={[remarkGfm, remarkMath]} 
                     rehypePlugins={[rehypeKatex]}
                     components={{ 
                       p: ({node, ...props}) => <span {...props} />,
                       table: ({node, ...props}) => <div className="overflow-x-auto my-1"><table className="border-collapse w-full text-sm text-center" {...props} /></div>,
                       th: ({node, ...props}) => <th className="border border-slate-300 dark:border-cyan-500/20 bg-blue-50 dark:bg-cyan-500/10 px-2 py-1 text-center font-bold text-slate-700 dark:text-slate-100" {...props} />,
                       td: ({node, ...props}) => <td className="border border-slate-300 dark:border-cyan-500/20 px-2 py-1 text-center text-slate-600 dark:text-slate-300" {...props} />
                     }}
                   >
                     {preprocessMarkdownTables(opt.text)}
                   </ReactMarkdown>
                 </div>
              </div>
              {showIcon}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default function TakeExam() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessCode = searchParams.get("code");
  const t = useTranslations("TakeExam");
  
  const [examVersion, setExamVersion] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false); // Hiển thị thông báo hết giờ
  const [examStarted, setExamStarted] = useState(false); // Màn hình nội quy
  const [showSubmitModal, setShowSubmitModal] = useState(false); // Modal xác nhận nộp bài
  const [classroomId, setClassroomId] = useState<string | null>(null);

  useEffect(() => {
    const redirectId = sessionStorage.getItem("exam_redirect_classroomId");
    if (redirectId) {
      setClassroomId(redirectId);
    }
  }, []);

  // --- AI PROCTORING LOGIC ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Khởi động camera CHỈ SAU KHI đã bắt đầu thi (đã vào fullscreen)
  // Tránh bị đen màn hình camera khi trình duyệt chuyển sang fullscreen mode
  useEffect(() => {
    if (!examStarted) return;
    if (examVersion?.aiProctoring === false) return; // Không bật AI Proctoring -> Không mở Cam

    const startCamera = async () => {
      try {
        // Nếu đã có stream, dừng trước để tránh leak
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 }, 
            frameRate: { ideal: 30 },
            facingMode: "user" 
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        alert(t("camera_required"));
      }
    };

    // Chờ một chút để fullscreen transition hoàn tất trước khi gắn camera
    const timer = setTimeout(startCamera, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [examStarted]);

  // Phục hồi camera nếu video element bị đen sau khi fullscreen change
  useEffect(() => {
    if (!examStarted) return;

    const reattachStream = () => {
      if (videoRef.current && streamRef.current) {
        const video = videoRef.current;
        // Kiểm tra nếu video đang paused hoặc stream bị ngắt
        if (video.paused || !video.srcObject) {
          video.srcObject = streamRef.current;
          video.play().catch(() => {});
        }
      }
    };

    document.addEventListener("fullscreenchange", reattachStream);
    document.addEventListener("visibilitychange", reattachStream);

    return () => {
      document.removeEventListener("fullscreenchange", reattachStream);
      document.removeEventListener("visibilitychange", reattachStream);
    };
  }, [examStarted]);

  // Dọn dẹp stream camera khi component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Kích hoạt AI Monitoring, CÓ ghi lại lịch sử vi phạm (record = true)
  // Chỉ gửi cảnh báo nếu chưa nộp bài
  const { currentViolations } = useProctoring(
    videoRef, 
    accessCode || "", 
    cameraReady && !submissionResult && !!examVersion?.aiProctoring, 
    true
  );
  // ---------------------------

  // --- BROWSER PROCTORING ---
  const user = JSON.parse(typeof window !== "undefined" ? localStorage.getItem("user") || "{}" : "{}");
  const {
    violationCount,
    lastViolation,
    showWarningModal,
    isFullscreen,
    requestFullscreen,
    dismissWarning,
    maxViolations,
  } = useBrowserProctoring({
    examCode: accessCode || "",
    studentId: user.id || "",
    studentName: user.fullName || user.name || "Học sinh",
    isActive: examStarted && !submissionResult && !!examVersion?.aiProctoring,
    maxViolations: 3,
    onForceSubmit: () => handleAutoSubmit(),
  });
  // --------------------------

  // Thời điểm kết thúc thi (tính từ startTime + duration) — dùng ref để tránh drift
  const examEndTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const storedExam = sessionStorage.getItem("currentExam");
    if (storedExam) {
      const data = JSON.parse(storedExam);
      setExamVersion(data);
      
      // LOGIC ĐỒNG BỘ PHÒNG THI: Lấy startTime từ Backend trả về
      const roomStartTime = data.startTime; 
      
      if (roomStartTime) {
        const durationMs = (data.duration || 60) * 60 * 1000;
        const endTime = roomStartTime + durationMs;
        examEndTimeRef.current = endTime;
        const remainingMs = endTime - Date.now();

        if (remainingMs <= 0) {
          // Thời gian đã hết trước khi học sinh mở trang — chuyển hướng về dashboard với thông báo
          sessionStorage.removeItem("currentExam");
          alert(t("time_expired_alert"));
          router.push("/student/dashboard");
          return;
        } else {
          setTimeLeft(Math.floor(remainingMs / 1000));
        }
      } else {
        // Fallback nếu Backend chưa có startTime (dành cho các đề cũ)
        const durationMs = (data.duration || 60) * 60 * 1000;
        examEndTimeRef.current = Date.now() + durationMs;
        setTimeLeft((data.duration || 60) * 60);
      }
    } else {
      router.push("/student/dashboard");
    }
  }, []);

  // Đếm ngược dựa trên timestamp thực (chống drift khi tab bị throttle/background)
  useEffect(() => {
    if (timeLeft === null || submissionResult) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      if (examEndTimeRef.current) {
        const remaining = Math.floor((examEndTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          setTimeLeft(0);
        } else {
          setTimeLeft(remaining);
        }
      }
    }, 500); // Poll 2 lần/giây để bắt chính xác giây cuối, tránh miss do tab throttle

    return () => clearInterval(timer);
  }, [timeLeft === null, (timeLeft ?? 1) <= 0, submissionResult]);

  // Gửi heartbeat mỗi 15 giây + kiểm tra trạng thái phòng thi từ Backend
  useEffect(() => {
    if (!accessCode || !examVersion || submissionResult) return;
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) return;

    const sendHeartbeat = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`http://localhost:8088/api/exams/${accessCode}/heartbeat`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ studentId: user.id, status: "EXAM" })
        });
        if (res.ok) {
          const data = await res.json();
          // CRITICAL: Nếu Backend trả về trạng thái FINISHED/COMPLETED → ép nộp bài ngay
          if (data.status === "FINISHED" || data.status === "COMPLETED") {
            console.warn("[Heartbeat] Phòng thi đã kết thúc từ server, tự động nộp bài.");
            handleAutoSubmit();
          }
        }
      } catch {
        // Bỏ qua lỗi mạng, không ảnh hưởng bài thi
      }
    };

    sendHeartbeat(); // Gửi ngay khi vào thi
    const interval = setInterval(sendHeartbeat, 15000); // Gửi lại mỗi 15 giây (giảm từ 30s xuống 15s)
    return () => clearInterval(interval);
  }, [accessCode, examVersion, submissionResult]);

  const handleAutoSubmit = () => {
    if (isSubmitting) return;
    setShowSubmitModal(false); // Tắt modal xác nhận thủ công nếu đang mở
    setIsTimeUp(true); // Hiển thị overlay thông báo hết giờ
    // Tự động nộp sau 2 giây để UX mượt hơn
    setTimeout(() => handleSubmit(true), 2000);
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '...';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const renderContentWithImages = useCallback((text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[IMG_\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[IMG_(\d+)\]/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (examVersion?.extractedImages && examVersion.extractedImages[idx]) {
          return (
            <img 
              key={i} 
              src={`data:image/jpeg;base64,${examVersion.extractedImages[idx]}`} 
              alt={`Hình ảnh ${idx}`} 
              className="max-w-full h-auto max-h-80 my-3 rounded-lg border border-slate-200 mx-auto shadow-sm object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          );
        }
        return null;
      }
      if (!part.trim()) return null;
      const preprocessedPart = preprocessMarkdownTables(part);
      return (
        <ReactMarkdown 
          key={i} 
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            table: ({node, ...props}) => <div className="overflow-x-auto my-3"><table className="border-collapse w-full text-sm text-center" {...props} /></div>,
            th: ({node, ...props}) => <th className="border border-slate-300 dark:border-cyan-500/20 bg-blue-50 dark:bg-cyan-500/10 px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-100" {...props} />,
            td: ({node, ...props}) => <td className="border border-slate-300 dark:border-cyan-500/20 px-3 py-2 text-center text-slate-600 dark:text-slate-300" {...props} />,
            p: ({node, ...props}) => <p className="my-1 leading-relaxed inline" {...props} />
          }}
        >
          {preprocessedPart}
        </ReactMarkdown>
      );
    });
  }, [examVersion]);

  const handleSelect = useCallback((qId: string, oId: string) => {
    setAnswers(prev => {
      if (prev[qId] !== oId) {
        return { ...prev, [qId]: oId };
      }

      const next = { ...prev };
      delete next[qId];
      return next;
    });
  }, []);

  // Số lượng câu đã trả lời và chưa trả lời
  const totalQuestionsCount = examVersion?.questions?.length || 0;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestionsCount - answeredCount;
  const allowReview = examVersion?.allowReview !== false;

  const handleSubmit = async (force = false) => {
    if (!examVersion) return;
    
    // Bọc xử lý xác nhận: Nếu không force (ấn thủ công) và chưa hiện modal, thì hiện modal lên rồi dừng
    if (!force && (timeLeft ?? 0) > 0) {
      setShowSubmitModal(true);
      return;
    }

    setShowSubmitModal(false);
    setIsSubmitting(true);
    try {
      // 1. TÍNH ĐIỂM
      let correctCount = 0;
      examVersion.questions.forEach((q: any) => {
        const selectedOptionId = answers[q.id];
        const correctOption = q.options.find((o: any) => o.isCorrect);
        if (selectedOptionId === correctOption?.id) {
          correctCount++;
        }
      });

      const total = examVersion.questions.length;
      const unanswered = total - Object.keys(answers).length;
      const incorrectCount = total - correctCount - unanswered;
      const finalScore = total > 0 ? (correctCount / total) * 10 : 0;
      
      const durationInSeconds = (examVersion.duration || 60) * 60;
      const timeSpent = Math.max(0, durationInSeconds - (timeLeft ?? 0));
      
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      // 2. GỬI KẾT QUẢ LÊN BACKEND
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:8088/api/exams/submit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          examId: accessCode, 
          studentId: user.id,
          studentName: user.fullName,
          versionCode: examVersion.versionCode,
          examTitle: examVersion.title,
          score: Math.round(finalScore * 10) / 10,
          correctAnswers: correctCount,
          totalQuestions: total,
          timeSpent,
          answers: answers
        }),
      });

      if (res.ok) {
        setSubmissionResult({
          score: Math.round(finalScore * 10) / 10,
          correctCount,
          total,
          incorrectCount,
          unanswered,
          timeSpent
        });
        localStorage.removeItem(`exam_start_${accessCode}`);
        // Tự động thoát chế độ toàn màn hình sau khi nộp bài
        setTimeout(() => {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
        }, 200);

        // Tự động chuyển hướng về lớp học nếu có classroomId
        const redirectClassroomId = sessionStorage.getItem("exam_redirect_classroomId");
        if (redirectClassroomId) {
          sessionStorage.removeItem("exam_redirect_classroomId");
          toast.success("Nộp bài thành công! Đang chuyển hướng bạn quay lại lớp học...");
          setTimeout(() => {
            router.push(`/student/classrooms/${redirectClassroomId}`);
          }, 3000);
        }
      } else {
        alert(t("submit_error"));
      }
    } catch (e) {
      alert(t("connect_error"));
    } finally {
      setIsSubmitting(false);
      setIsTimeUp(false);
    }
  };

  if (!examVersion) return <div className="p-10 text-center">{t('loading')}</div>;

  // Màn hình nội quy phòng thi (trước khi bắt đầu)
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#06111f] flex items-center justify-center px-4">
        <div className="bg-white dark:bg-[#0b1d33] rounded-3xl p-10 shadow-2xl border border-slate-100 dark:border-cyan-500/20 max-w-lg w-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 text-2xl">shield_lock</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">{t('rules_title')}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-300 font-medium">{examVersion.title}</p>
            </div>
          </div>

          {/* Rules */}
          {examVersion?.aiProctoring ? (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-400/30 rounded-2xl p-6 mb-8 space-y-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-300 shrink-0 mt-0.5">fullscreen</span>
                <p className="text-slate-700 dark:text-amber-50 text-sm font-medium">
                  Hệ thống sẽ ép buộc chạy ở chế độ <strong className="text-slate-900 dark:text-white">{t('rule_fullscreen_highlight')}</strong>.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-300 shrink-0 mt-0.5">block</span>
                <p className="text-slate-700 dark:text-amber-50 text-sm font-medium">
                  <strong className="text-slate-900 dark:text-white">Nghiêm cấm:</strong> Bấm ESC, mở Tab/Cửa sổ mới, F12, Copy văn bản.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-600 dark:text-red-300 shrink-0 mt-0.5">report</span>
                <p className="text-slate-700 dark:text-amber-50 text-sm font-medium">
                  Vi phạm <strong className="text-red-600 dark:text-red-300">{t('rule_violation_count')}</strong> hệ thống sẽ{" "}
                  <strong className="text-red-600 dark:text-red-300">{t('rule_auto_submit')}</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-400/30 rounded-2xl p-6 mb-8 space-y-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 dark:text-cyan-300 shrink-0 mt-0.5">info</span>
                <p className="text-slate-700 dark:text-cyan-50 text-sm font-medium">
                  Kỳ thi này không yêu cầu chế độ giám sát. Bạn không bị ép buộc toàn màn hình, tuy nhiên vui lòng tự giác làm bài trung thực để đánh giá đúng năng lực.
                </p>
              </div>
            </div>
          )}

          {/* Exam Info */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 dark:bg-[#07182b] dark:border-cyan-500/15 rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('info_duration_label')}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{examVersion.duration || 60} {t('info_duration_unit')}</p>
            </div>
            <div className="bg-slate-50 dark:bg-[#07182b] dark:border-cyan-500/15 rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('info_questions_label')}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{examVersion.questions?.length || 0} {t('info_questions_unit')}</p>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={async () => {
              if (examVersion?.aiProctoring) {
                await requestFullscreen();
              }
              setExamStarted(true);
            }}
            className="w-full py-4 bg-[#00355f] text-white font-black text-base rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-[#002848] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">play_circle</span>
            Tôi đã đọc và đồng ý, bắt đầu thi
          </button>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4 font-medium">
            Mã phòng: <strong className="text-slate-600 dark:text-slate-300">{accessCode}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#06111f] pb-20" style={{ userSelect: "none" }}>

      {/* Modal Xác Nhận Nộp Bài Mới */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-[999] flex items-center justify-center backdrop-blur-md animate-in fade-in duration-300 px-4">
          <div className="bg-white dark:bg-[#0b1d33] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-cyan-500/20 transform transition-all animate-in zoom-in-95 duration-300">
            {/* Header Modal */}
            <div className={`py-6 px-8 text-center relative ${unansweredCount > 0 ? 'bg-amber-50' : 'bg-blue-50'}`}>
              <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-sm rotate-3 ${unansweredCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {unansweredCount > 0 ? 'warning' : 'task_alt'}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                Bạn chắc chắn muốn nộp bài?
              </h3>
            </div>

            {/* Body Modal */}
            <div className="p-8">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-[#07182b] dark:border-cyan-500/15 rounded-2xl p-4 text-center border border-slate-100">
                  <p className="text-2xl font-black text-emerald-600">{answeredCount}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đã hoàn thành</p>
                </div>
                <div className={`${unansweredCount > 0 ? 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-500/30' : 'bg-slate-50 dark:bg-[#07182b] dark:border-cyan-500/15 border-slate-100'} rounded-2xl p-4 text-center border`}>
                  <p className={`text-2xl font-black ${unansweredCount > 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>{unansweredCount}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chưa trả lời</p>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-6 text-red-700 animate-pulse">
                  <span className="material-symbols-outlined mt-0.5 shrink-0">report_problem</span>
                  <p className="text-sm font-bold leading-tight">
                    Chú ý: Bạn vẫn còn {unansweredCount} câu hỏi chưa làm!
                  </p>
                </div>
              )}

              <p className="text-center text-slate-500 dark:text-slate-300 text-sm mb-8 leading-relaxed font-medium">
                Sau khi bấm &quot;Xác nhận nộp&quot;, hệ thống sẽ tự động chấm điểm và bạn sẽ không thể chỉnh sửa bài thi này được nữa.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#00355f] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:bg-[#002848] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                     <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><span className="material-symbols-outlined">check_circle</span> Xác nhận nộp bài</>
                  )}
                </button>
                
                <button
                  onClick={() => setShowSubmitModal(false)}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-white dark:bg-[#07182b] text-slate-600 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-[#102843] dark:border-cyan-500/20 transition-all border border-slate-200 text-sm"
                >
                  Quay lại làm tiếp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal cảnh báo vi phạm */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center px-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0b1d33] rounded-3xl p-8 shadow-2xl max-w-md w-full border-2 border-red-200 dark:border-red-500/40">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 animate-pulse">
                <span className="material-symbols-outlined text-red-600 text-4xl">warning</span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
                {violationCount >= maxViolations ? t("suspended") : t("warning_count", {count: violationCount, max: maxViolations})}
              </h2>
              <p className="text-slate-500 dark:text-slate-300 font-medium mb-2">
                {lastViolation && BROWSER_VIOLATION_LABELS[lastViolation]}
              </p>
              {violationCount >= maxViolations ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 w-full mt-2">
                  <p className="text-red-700 text-sm font-bold">{t('auto_submitting')}</p>
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 w-full mt-2 mb-6">
                    <p className="text-amber-700 text-sm font-medium">
                      {t('warnings_remaining', {n: maxViolations - violationCount})}
                    </p>
                  </div>
                  <button
                    onClick={dismissWarning}
                    className="w-full py-3.5 bg-[#00355f] text-white font-bold rounded-xl hover:bg-[#002848] active:scale-95 transition-all"
                  >
                    Tôi hiểu, tiếp tục làm bài
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chỉ báo số vi phạm (hiển thị khi đang thi) */}
      {examVersion?.aiProctoring && violationCount > 0 && !submissionResult && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-white dark:bg-[#0b1d33] border-2 border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-200 rounded-xl px-3 py-2 shadow-lg text-xs font-bold">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          {t('violation_badge')}: {violationCount}/{maxViolations}
        </div>
      )}
      


      {/* Overlay hết giờ */}
      {isTimeUp && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center">
          <div className="bg-white dark:bg-[#0b1d33] rounded-2xl p-10 text-center shadow-2xl max-w-sm mx-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-600 text-3xl">timer_off</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">{t('time_up_title')}</h2>
            <p className="text-slate-500 dark:text-slate-300 mb-6">{t('time_up_desc')}</p>
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span className="text-sm font-medium">{t('please_wait')}</span>
            </div>
          </div>
        </div>
      )}
      {/* Sticky Header with Timer */}
      <header className="sticky top-0 bg-white dark:bg-[#0b1d33] border-b border-slate-200 dark:border-cyan-500/20 z-50 px-8 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
              <span className="material-symbols-outlined">assignment</span>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100">{examVersion.title} - {t('version_label')} {examVersion.versionCode}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('room_label')}: {accessCode}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {!submissionResult && (
              <>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('time_remaining')}</p>
                  <p className={`text-2xl font-black ${(timeLeft ?? 0) < 300 ? 'text-red-500' : 'text-blue-900 dark:text-cyan-200'}`}>
                    {formatTime(timeLeft)}
                  </p>
                </div>
                <button 
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#00355f] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:bg-[#002848] active:scale-95 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">send</span>
                  Nộp bài thi
                </button>
              </>
            )}
            {submissionResult && showReview && allowReview && (
              <>
                <button 
                  onClick={() => setShowReview(false)}
                  className="px-6 py-2.5 bg-white dark:bg-[#07182b] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-cyan-500/20 font-bold rounded-xl active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-[#102843] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  Tổng quan
                </button>
                <button 
                  onClick={() => {
                    if (classroomId) {
                      router.push(`/student/classrooms/${classroomId}`);
                    } else {
                      router.push("/student/dashboard");
                    }
                  }}
                  className="px-6 py-2.5 bg-[#00355f] text-white shadow-lg shadow-blue-900/20 font-bold rounded-xl active:scale-95 transition-all hover:bg-[#002848] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">{classroomId ? "school" : "home"}</span>
                  {classroomId ? "Quay lại lớp học" : "Trang chủ"}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {submissionResult && (!showReview || !allowReview) ? (
        <div className="max-w-3xl mx-auto mt-12 px-4 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white dark:bg-[#0b1d33] rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-100 dark:border-cyan-500/20 text-center relative overflow-hidden">
             {/* Background shapes */}
             <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl pointer-events-none"></div>
             <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-green-50 rounded-full blur-3xl pointer-events-none"></div>
             
             {/* Icon */}
             <div className="relative mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-5xl text-green-600">check_circle</span>
             </div>

             <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-2 relative">{t('result_title')}</h2>
             <p className="text-slate-500 dark:text-slate-300 font-medium mb-10 relative">{t('result_subtitle')}</p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 relative">
               {/* Điểm số */}
               <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100/50">
                 <p className="text-blue-600 font-bold uppercase tracking-wider text-sm mb-2">{t('result_score_label')}</p>
                 <div className="flex items-end justify-center gap-1 mb-2">
                   <span className="text-6xl font-black text-blue-900">{submissionResult.score}</span>
                   <span className="text-2xl font-bold text-blue-400 mb-1">/10</span>
                 </div>
                 <p className="text-blue-800/60 text-sm font-medium">{t('result_completion', {pct: Math.round((submissionResult.correctCount/submissionResult.total)*100)})}</p>
               </div>

               {/* Thống kê chi tiết */}
               <div className="bg-slate-50 dark:bg-[#07182b] dark:border-cyan-500/15 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center">
                 <div className="flex items-center justify-between py-2 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{t('result_correct')}</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{submissionResult.correctCount}</span>
                 </div>
                 <div className="flex items-center justify-between py-2 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{t('result_wrong')}</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{submissionResult.incorrectCount}</span>
                 </div>
                 <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{t('result_unanswered')}</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{submissionResult.unanswered}</span>
                 </div>
               </div>
             </div>

             <div className="inline-flex items-center justify-center gap-2 bg-slate-100/80 dark:bg-[#07182b] px-5 py-3 rounded-full text-slate-600 dark:text-slate-300 font-medium text-sm mb-10 relative">
               <span className="material-symbols-outlined text-[20px]">timer</span>
               {t('result_time_spent')}: {formatTime(submissionResult.timeSpent)}
             </div>

             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative">
               {allowReview ? (
                 <button 
                   onClick={() => setShowReview(true)}
                   className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-[#07182b] border-2 border-slate-200 dark:border-cyan-500/20 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-[#102843] hover:border-slate-300 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                   <span className="material-symbols-outlined text-[20px]">fact_check</span>
                   Xem chi tiết đáp án
                 </button>
               ) : (
                 <div className="w-full sm:w-auto px-5 py-3 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                   <span className="material-symbols-outlined text-[20px]">lock</span>
                   Giáo viên không cho phép xem chi tiết đáp án của bài thi này.
                 </div>
               )}
               <button 
                  onClick={() => {
                    if (classroomId) {
                      router.push(`/student/classrooms/${classroomId}`);
                    } else {
                      router.push("/student/dashboard");
                    }
                  }}
                 className="w-full sm:w-auto px-8 py-3.5 bg-[#00355f] text-white font-bold rounded-xl hover:bg-[#002848] shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <span className="material-symbols-outlined text-[20px]">{classroomId ? "school" : "home"}</span>
                 {classroomId ? "Quay lại lớp học" : "Trở về trang chủ"}
               </button>
             </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto mt-8 px-4 flex flex-col lg:flex-row gap-8 items-start w-full">
          <div className="flex-1 min-w-0 space-y-8">
          {examVersion.questions.map((q: any, idx: number) => (
            <QuestionItem 
              key={q.id}
              q={q}
              idx={idx}
              studentAnswer={answers[q.id]}
              submissionResult={submissionResult}
              handleSelect={handleSelect}
              renderContentWithImages={renderContentWithImages}
            />
          ))}
        </div>

        {/* Sơ đồ câu hỏi (Right Sidebar) */}
        <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-32 space-y-6">
          
          {/* AI Proctoring Camera Block */}
          {examVersion?.aiProctoring && !submissionResult && (
            <div className={`bg-white dark:bg-[#0b1d33] rounded-2xl p-4 shadow-sm border-2 transition-all duration-300 ${currentViolations.length > 0 ? "border-red-400 shadow-red-500/10" : "border-slate-200 dark:border-cyan-500/20"}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                  <span className={`material-symbols-outlined ${currentViolations.length > 0 ? "text-red-500 animate-pulse" : "text-green-600"}`}>
                    {currentViolations.length > 0 ? "gpp_bad" : "security"}
                  </span>
                  AI Proctoring
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${currentViolations.length > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                  {currentViolations.length > 0 ? "Cảnh báo" : "Trực tiếp"}
                </span>
              </div>
              
              <div className="relative rounded-xl overflow-hidden bg-black shadow-inner border border-slate-200">
                <video ref={videoRef} autoPlay playsInline muted className={`w-full aspect-video object-cover scale-x-[-1] transition-all duration-500 ${currentViolations.length > 0 ? "opacity-70 grayscale-[30%] blur-[1px]" : "opacity-100"}`} />
                
                {/* HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none border-2 border-transparent">
                  {currentViolations.length === 0 && cameraReady && (
                    <div className="absolute inset-0 border-2 border-green-500/30 rounded-xl"></div>
                  )}
                  {currentViolations.length > 0 && (
                    <div className="absolute inset-0 border-4 border-red-500/80 rounded-xl bg-red-500/10 animate-pulse"></div>
                  )}
                </div>

                {!cameraReady && (
                  <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white animate-spin">sync</span>
                  </div>
                )}
              </div>

              {currentViolations.length > 0 ? (
                <div className="mt-3 bg-red-50 rounded-lg p-2 border border-red-100">
                  <p className="text-[10px] font-bold text-red-700 mb-1">PHÁT HIỆN VI PHẠM:</p>
                  <div className="space-y-1">
                    {currentViolations.map((v, i) => (
                      <div key={i} className="flex items-start gap-1 text-[11px] text-red-600 font-medium">
                        <span className="material-symbols-outlined text-[14px] shrink-0">warning</span>
                        <span>{VIOLATION_LABELS[v] || v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-3 bg-slate-50 dark:bg-[#07182b] dark:border-cyan-500/15 rounded-lg p-2 flex items-center justify-center gap-2 border border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-300">Hệ thống đang giám sát</span>
                </div>
              )}
            </div>
          )}

          {/* Map Block */}
          <div className="bg-white dark:bg-[#0b1d33] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-cyan-500/20 hidden md:block">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">grid_view</span>
              Sơ đồ câu hỏi
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {examVersion.questions.map((q: any, idx: number) => {
                let btnClass = 'bg-slate-100 dark:bg-[#07182b] text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#102843]';
                if (submissionResult) {
                  const isCorrect = q.options.find((o: any) => o.isCorrect)?.id === answers[q.id];
                  btnClass = isCorrect ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300';
                } else if (answers[q.id]) {
                  btnClass = 'bg-[#00355f] text-white shadow-md hover:bg-[#002848]';
                }

                return (
                  <button 
                    key={q.id}
                    onClick={() => {
                      document.getElementById(`question-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }} 
                    className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            {!submissionResult && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-cyan-500/15 space-y-3">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <div className="w-4 h-4 rounded-md bg-[#00355f] shadow-inner"></div> Đã làm
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <div className="w-4 h-4 rounded-md bg-slate-100 dark:bg-[#07182b] border border-slate-200 dark:border-cyan-500/20 shadow-inner"></div> Chưa làm
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
      <KatexStyles />
    </main>
  );
}
