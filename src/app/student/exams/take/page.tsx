"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useProctoring, VIOLATION_LABELS } from "@/hooks/useProctoring";


export default function TakeExam() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessCode = searchParams.get("code");
  
  const [examVersion, setExamVersion] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [isTimeUp, setIsTimeUp] = useState(false); // Hiển thị thông báo hết giờ

  // --- AI PROCTORING LOGIC ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraReady(true);
        }
      })
      .catch(err => {
        alert("Bạn phải cho phép truy cập Camera để làm bài thi!");
      });
  }, []);

  // Kích hoạt AI Monitoring, CÓ ghi lại lịch sử vi phạm (record = true)
  // Chỉ gửi cảnh báo nếu chưa nộp bài
  const { currentViolations } = useProctoring(
    videoRef, 
    accessCode || "", 
    cameraReady && !submissionResult, 
    true
  );
  // ---------------------------

  useEffect(() => {
    const storedExam = sessionStorage.getItem("currentExam");
    if (storedExam) {
      const data = JSON.parse(storedExam);
      setExamVersion(data);
      
      // LOGIC ĐỒNG BỘ PHÒNG THI: Lấy startTime từ Backend trả về
      const roomStartTime = data.startTime; 
      
      if (roomStartTime) {
        const durationInSeconds = (data.duration || 60) * 60;
        const elapsedSeconds = Math.floor((Date.now() - roomStartTime) / 1000);
        const remaining = durationInSeconds - elapsedSeconds;

        if (remaining <= 0) {
          // Thời gian đã hết trước khi học sinh mở trang — chuyển hướng về dashboard với thông báo
          sessionStorage.removeItem("currentExam");
          alert("⏰ Thời gian của bài kiểm tra này đã kết thúc. Bạn không thể tiếp tục làm bài.");
          router.push("/student/dashboard");
          return;
        } else {
          setTimeLeft(remaining);
        }
      } else {
        // Fallback nếu Backend chưa có startTime (dành cho các đề cũ)
        setTimeLeft((data.duration || 60) * 60);
      }
    } else {
      router.push("/student/dashboard");
    }
  }, []);

  // Đếm ngược thời gian và tự động nộp bài
  useEffect(() => {
    // Chưa có dữ liệu hoặc đã nộp bài rồi => không chạy đồng hồ
    if (timeLeft === null || submissionResult) return;
    // Chỉ bắt đầu nộp bài khi timeLeft về 0 SAU KHI đã được set giá trị dương
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null && prev > 0) ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Gửi heartbeat mỗi 30 giây khi đang làm bài
  useEffect(() => {
    if (!accessCode || !examVersion || submissionResult) return;
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) return;

    const sendHeartbeat = () => {
      fetch(`http://localhost:8088/api/exams/${accessCode}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id })
      }).catch(() => {}); // Bỏ qua lỗi mạng, không ảnh hưởng bài thi
    };

    sendHeartbeat(); // Gửi ngay khi vào thi
    const interval = setInterval(sendHeartbeat, 30000); // Gửi lại mỗi 30 giây
    return () => clearInterval(interval);
  }, [accessCode, examVersion, submissionResult]);

  const handleAutoSubmit = () => {
    if (isSubmitting) return;
    setIsTimeUp(true); // Hiển thị overlay thông báo hết giờ
    // Tự động nộp sau 2 giây để UX mượt hơn
    setTimeout(() => handleSubmit(), 2000);
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '...';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const renderContentWithImages = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[IMG_\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[IMG_(\d+)\]/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (examVersion.extractedImages && examVersion.extractedImages[idx]) {
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
      return (
        <ReactMarkdown 
          key={i} 
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({node, ...props}) => <div className="overflow-x-auto my-3"><table className="border-collapse w-full text-sm" {...props} /></div>,
            th: ({node, ...props}) => <th className="border border-slate-300 bg-blue-50 px-3 py-2 text-left font-bold text-slate-700" {...props} />,
            td: ({node, ...props}) => <td className="border border-slate-300 px-3 py-2 text-slate-600" {...props} />,
            p: ({node, ...props}) => <p className="my-1 leading-relaxed inline" {...props} />
          }}
        >
          {part}
        </ReactMarkdown>
      );
    });
  };

  const handleSelect = (qId: string, oId: string) => {
    setAnswers(prev => ({ ...prev, [qId]: oId }));
  };

  const handleSubmit = async () => {
    if (!examVersion) return;
    // Nếu gọi từ autoSubmit thì không confirm, nếu gọi từ nút bấm thì có confirm
    if (timeLeft > 0 && !confirm("Bạn có chắc chắn muốn nộp bài?")) return;
    
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
      const finalScore = total > 0 ? (correctCount / total) * 10 : 0;
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      // 2. GỬI KẾT QUẢ LÊN BACKEND
      const res = await fetch("http://localhost:8088/api/exams/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: accessCode, 
          studentId: user.id,
          studentName: user.fullName,
          versionCode: examVersion.versionCode,
          examTitle: examVersion.title,
          score: Math.round(finalScore * 10) / 10,
          correctAnswers: correctCount,
          totalQuestions: total,
          answers: answers
        }),
      });

      if (res.ok) {
        setSubmissionResult({
          score: Math.round(finalScore * 10) / 10,
          correctCount,
          total
        });
        localStorage.removeItem(`exam_start_${accessCode}`);
        // Không redirect nữa, giữ lại trang để xem kết quả chi tiết
      } else {
        alert("Có lỗi khi lưu kết quả thi. Vui lòng liên hệ giáo viên.");
      }
    } catch (e) {
      alert("Không thể kết nối máy chủ để nộp bài.");
    } finally {
      setIsSubmitting(false);
      setIsTimeUp(false);
    }
  };

  if (!examVersion) return <div className="p-10 text-center">Đang tải phòng thi...</div>;

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-20">
      
      {/* Cửa sổ Camera AI góc dưới */}
      {!submissionResult && (
        <div className={`fixed bottom-4 left-4 w-48 bg-white p-2 rounded-xl shadow-2xl border-2 transition-colors duration-300 z-50 overflow-hidden ${currentViolations.length > 0 ? "border-red-400 shadow-red-500/20" : "border-green-400 shadow-green-500/20"}`}>
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full aspect-[4/3] object-cover scale-x-[-1] transition-opacity ${currentViolations.length > 0 ? "opacity-70 grayscale-[30%]" : "opacity-100"}`} />
            {currentViolations.length > 0 ? (
              <div className="absolute inset-0 border-[3px] border-red-500 bg-red-500/20 pointer-events-none animate-pulse"></div>
            ) : (
              <div className="absolute inset-0 border-[3px] border-green-500/40 pointer-events-none"></div>
            )}
            
            {/* Nhãn trạng thái góc trái trên của video */}
            <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded-md text-[8px] font-bold flex items-center gap-1 backdrop-blur-sm ${currentViolations.length > 0 ? "bg-red-500 text-white" : "bg-green-500/90 text-white"}`}>
              {currentViolations.length > 0 ? (
                <><span className="material-symbols-outlined text-[10px]">gpp_bad</span> CẢNH BÁO</>
              ) : (
                <><span className="material-symbols-outlined text-[10px]">verified_user</span> TƯ THẾ CHUẨN</>
              )}
            </div>
          </div>

          {currentViolations.length > 0 ? (
            <div className="mt-2 text-[10px] font-bold text-red-600 space-y-1 leading-tight">
              {currentViolations.map((v, i) => (
                <div key={i} className="flex items-start gap-1">
                  <span className="material-symbols-outlined text-[12px] shrink-0 mt-0.5">warning</span>
                  <span>{VIOLATION_LABELS[v] || v}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-[10px] font-bold text-green-600 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              AI Đang giám sát...
            </div>
          )}
        </div>
      )}

      {/* Overlay hết giờ */}
      {isTimeUp && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-10 text-center shadow-2xl max-w-sm mx-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-600 text-3xl">timer_off</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Hết thời gian!</h2>
            <p className="text-slate-500 mb-6">Hệ thống đang tự động chấm điểm và nộp bài của bạn...</p>
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span className="text-sm font-medium">Vui lòng chờ...</span>
            </div>
          </div>
        </div>
      )}
      {/* Sticky Header with Timer */}
      <header className="sticky top-0 bg-white border-b border-slate-200 z-50 px-8 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
              <span className="material-symbols-outlined">assignment</span>
            </div>
            <div>
              <h2 className="font-bold text-slate-800">{examVersion.title} - Mã đề {examVersion.versionCode}</h2>
              <p className="text-xs text-slate-500">Mã phòng: {accessCode}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {!submissionResult && (
              <>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian còn lại</p>
                  <p className={`text-2xl font-black ${timeLeft < 300 ? 'text-red-500' : 'text-blue-900'}`}>
                    {formatTime(timeLeft)}
                  </p>
                </div>
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#00355f] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                >
                  Nộp bài thi
                </button>
              </>
            )}
            {submissionResult && (
              <button 
                onClick={() => router.push("/student/dashboard")}
                className="px-6 py-2.5 bg-blue-50 text-blue-800 border border-blue-200 font-bold rounded-xl active:scale-95 transition-all"
              >
                Về trang chủ
              </button>
            )}
          </div>
        </div>
      </header>

      {submissionResult && (
        <div className="max-w-7xl mx-auto mt-8 px-4 mb-8">
          <div className="bg-gradient-to-r from-[#00355f] to-[#0f4c81] rounded-2xl p-8 text-white shadow-lg text-center">
            <h2 className="text-3xl font-black mb-2">Đã Nộp Bài Thành Công!</h2>
            <div className="flex items-center justify-center gap-12 mt-6">
              <div>
                <p className="text-blue-200 text-sm font-bold uppercase tracking-widest mb-1">Điểm số</p>
                <p className="text-5xl font-black">{submissionResult.score}<span className="text-2xl text-blue-300">/10</span></p>
              </div>
              <div className="w-px h-16 bg-blue-700/50"></div>
              <div>
                <p className="text-blue-200 text-sm font-bold uppercase tracking-widest mb-1">Số câu đúng</p>
                <p className="text-5xl font-black">{submissionResult.correctCount}<span className="text-2xl text-blue-300">/{submissionResult.total}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto mt-8 px-4 flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 space-y-8">
          {examVersion.questions.map((q: any, idx: number) => {
            const isCorrectAnswer = q.options.find((o: any) => o.isCorrect)?.id;
            const studentAnswer = answers[q.id];
            const isStudentCorrect = studentAnswer === isCorrectAnswer;

            return (
              <div key={q.id} id={`question-${q.id}`} className={`bg-white rounded-2xl p-8 shadow-sm border space-y-6 ${submissionResult ? (isStudentCorrect ? 'border-green-200 shadow-green-100' : 'border-red-200 shadow-red-100') : 'border-slate-200'}`}>
                <div className="flex items-start gap-4">
                  <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${submissionResult ? (isStudentCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700') : 'bg-slate-100 text-slate-500'}`}>
                    {idx + 1}
                  </span>
                  <div className="text-lg font-medium text-slate-800 leading-relaxed max-w-none">
                    {renderContentWithImages(q.text)}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pl-12">
                  {q.options.map((opt: any) => {
                    let optionClass = 'border-slate-100 bg-slate-50 hover:border-slate-200';
                    let textClass = 'text-slate-600';
                    let showIcon = null;

                    if (submissionResult) {
                      // Chế độ xem kết quả
                      if (opt.isCorrect) {
                        optionClass = 'border-green-500 bg-green-50 shadow-sm';
                        textClass = 'font-bold text-green-700';
                        showIcon = <span className="material-symbols-outlined text-green-600">check_circle</span>;
                      } else if (answers[q.id] === opt.id && !opt.isCorrect) {
                        optionClass = 'border-red-500 bg-red-50 shadow-sm';
                        textClass = 'font-bold text-red-700';
                        showIcon = <span className="material-symbols-outlined text-red-600">cancel</span>;
                      } else {
                        optionClass = 'border-slate-100 bg-slate-50 opacity-60';
                      }
                    } else {
                      // Chế độ làm bài
                      if (answers[q.id] === opt.id) {
                        optionClass = 'border-[#00355f] bg-blue-50/50';
                        textClass = 'font-bold text-[#00355f]';
                      }
                    }

                    return (
                      <label 
                        key={opt.id} 
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${submissionResult ? 'cursor-default' : 'cursor-pointer'} ${optionClass}`}
                      >
                        <div className="flex items-center gap-4">
                          {!submissionResult && (
                            <input 
                              type="radio" 
                              name={q.id} 
                              checked={answers[q.id] === opt.id}
                              onChange={() => handleSelect(q.id, opt.id)}
                              className="w-5 h-5 accent-[#00355f]" 
                            />
                          )}
                          <span className={`text-base ${textClass}`}>
                            {opt.text}
                          </span>
                        </div>
                        {showIcon}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sơ đồ câu hỏi (Right Sidebar) */}
        <div className="w-full lg:w-80 shrink-0 sticky top-32 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hidden md:block">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">grid_view</span>
            Sơ đồ câu hỏi
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {examVersion.questions.map((q: any, idx: number) => {
              let btnClass = 'bg-slate-100 text-slate-500 hover:bg-slate-200';
              if (submissionResult) {
                const isCorrect = q.options.find((o: any) => o.isCorrect)?.id === answers[q.id];
                btnClass = isCorrect ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300';
              } else if (answers[q.id]) {
                btnClass = 'bg-[#00355f] text-white shadow-md';
              }

              return (
                <button 
                  key={q.id}
                  onClick={() => {
                    document.getElementById(`question-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }} 
                  className={`w-10 h-10 rounded-lg font-bold flex items-center justify-center transition-all ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          {!submissionResult && (
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-4 h-4 rounded bg-[#00355f]"></div> Đã làm
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200"></div> Chưa làm
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
