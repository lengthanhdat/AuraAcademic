"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function TeacherExamRoom() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.id as string;
  const t = useTranslations('TeacherExamRoom');

  const [exam, setExam] = useState<any>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [lobbyCount, setLobbyCount] = useState(0);
  const [examCount, setExamCount] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startCountDown, setStartCountDown] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Helper: lấy src video từ Base64 (mới) hoặc URL (legacy)
  const getVideoSrc = (v: any): string | null => {
    if (v?.videoBase64) return `data:video/webm;base64,${v.videoBase64}`;
    if (v?.videoUrl) return v.videoUrl;
    return null;
  };

  const VIOLATION_LABELS: Record<string, string> = {

        no_face: t('violations.no_face'),
    multiple_faces: t('violations.multiple_faces'),
    cell_phone: t('violations.cell_phone'),
    looking_left: t('violations.looking_left'),
    looking_right: t('violations.looking_right'),
    looking_down: t('violations.looking_down'),
    head_down_deep: t('violations.head_down_deep')
  };

  const getToken = () => localStorage.getItem("accessToken") || "";

  const fetchExam = async () => {
    const res = await fetch(`http://localhost:8088/api/exams/${examId}`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    });
    if (res.ok) setExam(await res.json());
  };

  useEffect(() => {
    if (!examId) return;
    fetchExam();
  }, [examId]);

  // Nếu exam load xong mà không có accessCode → tự động tạo mã mới
  useEffect(() => {
    if (!exam) return;
    if (!exam.accessCode) {
      fetch(`http://localhost:8088/api/exams/${examId}/generate-code`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}` }
      }).then(r => { if (r.ok) fetchExam(); });
    }
  }, [exam?.id]);

  // Kết nối SSE khi biết accessCode của phòng
  useEffect(() => {
    if (!exam?.accessCode) return;
    const code = exam.accessCode;

    const es = new EventSource(`http://localhost:8088/api/exams/${code}/stream?token=${getToken()}`);

    es.addEventListener("count", (e) => {
      const data = JSON.parse(e.data);
      setActiveCount(data.activeCount ?? 0);
      setLobbyCount(data.lobbyCount ?? 0);
      setExamCount(data.examCount ?? 0);
    });

    es.addEventListener("result", (e) => {
      const newResult = JSON.parse(e.data);
      setResults(prev => {
        // Tránh trùng lặp nếu học sinh nộp nhiều lần
        const exists = prev.some(r => r.id === newResult.id);
        return exists ? prev : [newResult, ...prev];
      });
    });

    es.addEventListener("status", (e) => {
      const data = JSON.parse(e.data);
      setExam((prev: any) => ({ ...prev, status: data.status, startTime: data.startTime }));
    });

    es.addEventListener("violation", (e) => {

      const newViolation = JSON.parse(e.data);
      setViolations(prev => [newViolation, ...prev]);
    });

    // Lấy dữ liệu ban đầu
    fetchActiveCount(code);
    fetchResults(code);
    fetchViolations(code);

    // Polling dự phòng mỗi 10s (đặc biệt hữu ích cho số lượng người)
    const pollId = setInterval(() => fetchActiveCount(code), 3000);

    return () => {
      es.close();
      clearInterval(pollId);
    };
  }, [exam?.accessCode]);

  const fetchActiveCount = async (code: string) => {
    try {
      const res = await fetch(`http://localhost:8088/api/exams/${code}/active-count`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCount(data.activeCount ?? 0);
        setLobbyCount(data.lobbyCount ?? 0);
        setExamCount(data.examCount ?? 0);
      }
    } catch (e) {
      console.error("Error fetching active count:", e);
    }
  };

  const fetchResults = async (code: string) => {
    try {
      const res = await fetch(`http://localhost:8088/api/exams/${code}/results`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      if (res.ok) setResults(await res.json());
    } catch {}
  };

  const fetchViolations = async (code: string) => {
    try {
      const res = await fetch(`http://localhost:8088/api/exams/${code}/violations`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      if (res.ok) setViolations(await res.json());
    } catch {}
  };


  const handleStart = async () => {
    setIsStarting(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch(`http://localhost:8088/api/exams/${examId}/start`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      if (res.ok) {
        setMsg({ type: "success", text: t('msg.start_success') });
        fetchExam();
      } else {
        setMsg({ type: "error", text: t('msg.start_error') });
      }
    } catch {
      setMsg({ type: "error", text: t('msg.server_error') });
    } finally {
      setIsStarting(false);
    }
  };

  const handleClose = async (auto = false) => {
    if (!auto && !confirm(t('msg.close_confirm'))) return;
    setIsClosing(true);
    try {
      const res = await fetch(`http://localhost:8088/api/exams/${examId}/close`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      if (res.ok) {
        setMsg({ type: "success", text: auto ? t('msg.auto_close') : t('msg.close_success') });
        fetchExam();
      }
    } catch {
      setMsg({ type: "error", text: t('msg.close_error') });
    } finally {
      setIsClosing(false);
    }
  };

  const handleFinish = async () => {
    setIsClosing(true);
    try {
      const res = await fetch(`http://localhost:8088/api/exams/${examId}/finish`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      if (res.ok) {
        setMsg({ type: "success", text: t('msg.auto_finish') });
        fetchExam();
      }
    } catch {
      setMsg({ type: "error", text: t('msg.finish_error') });
    } finally {
      setIsClosing(false);
    }
  };

  const copyCode = () => {
    if (exam?.accessCode) {
      navigator.clipboard.writeText(exam.accessCode);
      setMsg({ type: "success", text: t('msg.copy_success') });
      setTimeout(() => setMsg({ type: "", text: "" }), 2000);
    }
  };

  const getStatusBadge = () => {
    if (!exam) return null;
    const s = exam.status;
    
    if (s === "STARTED" && timeLeft === 0) {
      return <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-black uppercase rounded-full">{t('badge.time_up')}</span>;
    }

    if (s === "PUBLISHED") return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-black uppercase rounded-full animate-pulse">{t('badge.published')}</span>;
    if (s === "WAITING")   return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-black uppercase rounded-full">{t('badge.waiting')}</span>;
    if (s === "STARTED")   return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black uppercase rounded-full animate-pulse">{t('badge.started')}</span>;
    if (s === "FINISHED")  return <span className="px-3 py-1 bg-error-container text-on-error-container text-xs font-black uppercase rounded-full">{t('badge.finished')}</span>;
    if (s === "COMPLETED") return <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-black uppercase rounded-full">{t('badge.completed')}</span>;
    if (s === "DRAFT")     return <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-black uppercase rounded-full">{t('badge.draft')}</span>;
    return null;
  };

  const isActive   = exam?.status === "STARTED"; // chỉ STARTED mới là đang diễn ra
  const isWaiting  = exam?.status === "WAITING" || exam?.status === "PUBLISHED"; // PUBLISHED = đã công bố, chờ GV bắt đầu
  const isFinished = exam?.status === "FINISHED" || exam?.status === "COMPLETED";


  // Khởi tạo thời gian còn lại — chỉ khi STARTED (có startTime thực tế)
  useEffect(() => {
    if (exam?.status === "STARTED" && exam.startTime && exam.duration) {
      const endTime = exam.startTime + exam.duration * 60 * 1000;
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    }
  }, [exam?.status, exam?.startTime, exam?.duration]);

  // Bộ đếm ngược chạy mỗi giây
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Khởi tạo thời gian đếm ngược bắt đầu tự động
  useEffect(() => {
    if (exam?.status === "PUBLISHED" && exam.scheduledStartTime) {
      const remaining = Math.max(0, Math.floor((exam.scheduledStartTime - Date.now()) / 1000));
      setStartCountDown(remaining);
    } else {
      setStartCountDown(null);
    }
  }, [exam?.status, exam?.scheduledStartTime]);

  // Bộ đếm ngược bắt đầu tự động — dùng timestamp để tránh drift
  useEffect(() => {
    if (startCountDown === null || startCountDown <= 0) return;
    const target = Date.now() + startCountDown * 1000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setStartCountDown(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 200); // poll nhanh hơn để bắt đúng giây cuối
    return () => clearInterval(timer);
  }, [startCountDown === null || startCountDown <= 0 ? startCountDown : 'running']);

  // Tự động load lại exam nếu đếm ngược tự động về 0 (để cập nhật sang STARTED)
  useEffect(() => {
    if (exam?.status === "PUBLISHED" && startCountDown === 0) {
      fetchExam();
    }
  }, [startCountDown, exam?.status]);

  // Tự động đóng phòng thi khi hết giờ (delay 3 giây để nhận nốt các bài nộp cuối)
  useEffect(() => {
    if (isActive && timeLeft === 0 && !isClosing) {
      const timeout = setTimeout(() => {
        handleFinish(); // Gọi hàm finish thay vì close
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [timeLeft, isActive]);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const updateScheduledTime = async (val: string) => {
    const newTime = val ? new Date(val).getTime() : null;
    try {
      await fetch(`http://localhost:8088/api/exams/${examId}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...exam, scheduledStartTime: newTime })
      });
      fetchExam();
    } catch {}
  };

  if (!exam) return (
    <div className="flex-1 flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="flex-1 p-8 max-w-[1200px] mx-auto w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-surface-container rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </button>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest">{t('header.breadcrumb')}</p>
            <h1 className="text-2xl font-extrabold text-primary">{exam.title}</h1>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${msg.type === "error" ? "bg-error-container text-on-error-container" : "bg-green-100 text-green-800"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Access Code Card */}
        <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-6 text-white col-span-1 flex flex-col justify-between relative overflow-hidden">
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-white/10 text-[120px]">key</span>
          <div>
            <p className="text-on-primary-container text-xs font-bold uppercase tracking-widest mb-2">{t('code_card.title')}</p>
            {exam.accessCode ? (
              <h2 className="text-5xl font-black tracking-widest mb-4">{exam.accessCode}</h2>
            ) : (
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined animate-spin text-2xl">sync</span>
                <span className="text-lg font-bold opacity-80">{t('code_card.generating')}</span>
              </div>
            )}
            <p className="text-on-primary-container/80 text-xs">{t('code_card.hint')}</p>
          </div>
          <button
            onClick={copyCode}
            disabled={!exam.accessCode}
            className="mt-4 flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 px-4 py-2 rounded-xl font-bold text-sm transition-all"
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
            Sao chép mã
          </button>
        </div>

        {/* Stats Cards - Grid 2x2 for balance */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Phòng chờ */}
          <div className="bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between shadow-sm border border-outline-variant/10">
            <span className="material-symbols-outlined text-amber-500 text-3xl mb-2">hourglass_top</span>
            <div>
              <p className="text-3xl font-black text-amber-500">{lobbyCount}</p>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">{t('stats.waiting')}</p>
            </div>
          </div>
          {/* Đang làm bài */}
          <div className="bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between shadow-sm border border-outline-variant/10">
            <span className="material-symbols-outlined text-blue-600 text-3xl mb-2">edit_document</span>
            <div>
              <p className="text-3xl font-black text-blue-600">{examCount}</p>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">{t('stats.taking')}</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 flex flex-col justify-between shadow-sm border border-outline-variant/10">
            <span className="material-symbols-outlined text-green-600 text-2xl mb-2">assignment_turned_in</span>
            <div>
              <p className="text-2xl font-black text-green-600">{results.length}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">{t('stats.submitted')}</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 flex flex-col justify-between shadow-sm border border-outline-variant/10">
            <span className="material-symbols-outlined text-amber-600 text-2xl mb-2">timer</span>
            <div>
              <p className={`text-2xl font-black ${timeLeft !== null && timeLeft < 300 ? "text-red-500 animate-pulse" : "text-amber-600"}`}>
                {isActive ? formatTime(timeLeft) : `${exam.duration}:00`}
              </p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
                {isActive ? t('stats.remaining') : t('stats.duration')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!isFinished && (
        <div className="flex gap-4 mb-8 items-start">
          {isWaiting && (
            <div className="flex-1 flex flex-col gap-3">
              <button
                onClick={handleStart}
                disabled={isStarting}
                className="w-full py-4 bg-gradient-to-br from-green-600 to-green-700 text-white font-extrabold rounded-xl text-lg shadow-lg shadow-green-700/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings:"'FILL' 1"}}>
                  {isStarting ? "sync" : "play_circle"}
                </span>
                {isStarting ? t('actions.btn_starting') : t('actions.btn_start')}
                {startCountDown !== null && startCountDown > 0 && ` (Tự động bắt đầu sau ${formatTime(startCountDown)})`}
              </button>
              
              <div className="flex items-center gap-2 justify-center text-sm text-slate-500 bg-white p-2 rounded-xl border border-slate-200">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>Hẹn giờ tự động:</span>
                <input 
                  type="datetime-local" 
                  className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer"
                  value={exam.scheduledStartTime ? new Date(exam.scheduledStartTime - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                  onChange={(e) => updateScheduledTime(e.target.value)}
                />
              </div>
            </div>
          )}
          {isActive && (
            timeLeft === 0 ? (
              <div className="flex-1 py-4 bg-orange-50 border-2 border-orange-300 text-orange-700 font-extrabold rounded-xl text-lg flex items-center justify-center gap-3">
                <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                Đã hết thời gian · Đang chờ hệ thống thu bài...
              </div>
            ) : (
              <div className="flex-1 py-4 bg-green-50 border-2 border-green-300 text-green-700 font-extrabold rounded-xl text-lg flex items-center justify-center gap-3">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                Bài thi đang diễn ra · Học sinh đang làm bài
              </div>
            )
          )}
          <button
            onClick={() => handleClose()}
            disabled={isClosing}
            className="px-8 py-4 bg-error-container text-on-error-container font-bold rounded-xl hover:bg-error/20 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <span className="material-symbols-outlined">stop_circle</span>
            {isClosing ? t('actions.btn_closing') : t('actions.btn_close')}
          </button>
        </div>
      )}

      {isFinished && (
        <div className="p-6 bg-slate-100 rounded-xl mb-8 text-center border border-slate-200">
          <p className="text-slate-600 font-bold">
            {exam.status === "COMPLETED" ? t('finished_msg.completed') : t('finished_msg.closed')}
          </p>
        </div>
      )}

      {/* Results Table */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-container flex items-center justify-between">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-fixed-dim">leaderboard</span>
            {t('results.title')} ({results.length})
          </h3>
          {results.length > 0 && (
            <span className="text-xs text-on-surface-variant">
              TB: <strong className="text-primary">
                {(results.reduce((a, r) => a + r.score, 0) / results.length).toFixed(1)}/10
              </strong>
            </span>
          )}
        </div>
        {results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50 text-[10px] font-bold uppercase text-on-surface-variant">
                  <th className="px-6 py-4">{t('results.col_rank')}</th>
                  <th className="px-6 py-4">{t('results.col_student')}</th>
                  <th className="px-6 py-4">{t('results.col_version')}</th>
                  <th className="px-6 py-4">{t('results.col_score')}</th>
                  <th className="px-6 py-4">{t('results.col_correct')}</th>
                  <th className="px-6 py-4">{t('results.col_time')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {[...results].sort((a, b) => b.score - a.score).map((r, idx) => (
                  <tr key={r.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-6 py-4 text-on-surface-variant font-bold">#{idx + 1}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-on-surface">{r.studentName}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{r.versionCode}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xl font-black ${r.score >= 5 ? "text-green-600" : "text-red-500"}`}>
                        {r.score?.toFixed(1)}
                      </span>
                      <span className="text-on-surface-variant text-sm">/10</span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {r.correctAnswers}/{r.totalQuestions}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant text-sm">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleTimeString("vi-VN") : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-on-surface-variant italic">
            {isActive ? t('results.empty_waiting') : t('results.empty_none')}
          </div>
        )}
      </section>

      {/* Violations Section - Grouped by student */}
      {(() => {
        // Nhóm vi phạm theo studentId
        const grouped = violations.reduce((acc: Record<string, any>, v: any) => {
          const key = v.studentId || "unknown";
          if (!acc[key]) acc[key] = { studentId: key, studentName: v.studentName || "Không rõ tên", violations: [] };
          acc[key].violations.push(v);
          return acc;
        }, {});
        const groups = Object.values(grouped) as any[];

        // Modal chi tiết vi phạm
        const modalStudent = selectedStudent ? grouped[selectedStudent] : null;

        return (
          <>
            {/* Modal */}
            {modalStudent && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={() => setSelectedStudent(null)}
              >
                <div
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{modalStudent.studentName}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">ID: {modalStudent.studentId} · {modalStudent.violations.length}  {t('violation_modal.violations_count')}</p>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>

                  {/* Modal Body - Timeline */}
                  <div className="overflow-y-auto flex-1 p-6 space-y-4">
                    {[...modalStudent.violations].sort((a: any, b: any) => b.timestamp - a.timestamp).map((v: any, idx: number) => (
                      <div key={v.id || idx} className="flex gap-4 items-start">
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-500 text-[16px]">warning</span>
                          </div>
                          {idx < modalStudent.violations.length - 1 && (
                            <div className="w-px h-full bg-slate-200 mt-1 flex-1" style={{minHeight: '24px'}}></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                          {/* Video bằng chứng */}
                          {(() => {
                            const src = getVideoSrc(v);
                            return src ? (
                              <div className="relative aspect-video bg-black">
                                <video src={src} controls className="w-full h-full object-cover" />
                                <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[10px]">videocam</span> 5s Buffer
                                </div>
                              </div>
                            ) : null;
                          })()}
                          <div className="p-3 flex items-center justify-between">
                            <span className="text-sm font-bold text-red-600 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px]">report</span>
                              {VIOLATION_LABELS[v.type] || v.type}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">{new Date(v.timestamp).toLocaleTimeString("vi-VN")}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Violations Summary Section */}
            <section className="bg-red-50 rounded-xl shadow-sm border border-red-200 overflow-hidden mt-8">
              <div className="px-6 py-5 border-b border-red-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">gpp_bad</span>
                  {t('violation_summary.title')}
                  {violations.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-red-600 text-white text-xs font-black rounded-full">{violations.length}</span>
                  )}
                </h3>
                {groups.length > 0 && (
                  <span className="text-xs text-slate-500">{groups.length}  {t('violation_summary.students_count')}</span>
                )}
              </div>

              {groups.length > 0 ? (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groups
                    .sort((a: any, b: any) => b.violations.length - a.violations.length)
                    .map((group: any) => {
                      const latest = group.violations[0];
                      const count = group.violations.length;
                      const severity = count >= 4 ? "high" : count >= 2 ? "med" : "low";
                      const severityStyle = {
                        high: { card: "border-red-500 bg-white",  badge: "bg-red-600 text-white",   icon: "text-red-600" },
                        med:  { card: "border-amber-400 bg-white", badge: "bg-amber-500 text-white", icon: "text-amber-500" },
                        low:  { card: "border-slate-300 bg-white", badge: "bg-slate-500 text-white", icon: "text-slate-500" },
                      }[severity];

                      return (
                        <button
                          key={group.studentId}
                          onClick={() => setSelectedStudent(group.studentId)}
                          className={`text-left rounded-xl border-2 ${severityStyle.card} overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group`}
                        >
                          {/* Preview ảnh thumbnail hoặc video preview */}
                          {(() => {
                            const src = getVideoSrc(latest);
                            return src ? (
                              <div className="relative aspect-video bg-black/5 overflow-hidden">
                                <video
                                  src={src}
                                  className="w-full h-full object-cover pointer-events-none"
                                  muted
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow">
                                    <span className="material-symbols-outlined text-slate-700">play_circle</span>
                                  </div>
                                </div>
                                <div className="absolute top-2 right-2">
                                  <span className={`px-2 py-1 rounded-full text-[11px] font-black ${severityStyle.badge} shadow`}>
                                    {count} {t('violation_summary.errors')}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-video bg-slate-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-slate-300">videocam_off</span>
                              </div>
                            );
                          })()}

                          {/* Student info */}
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="font-bold text-slate-800 text-sm truncate pr-2">{group.studentName}</p>
                              <span className={`material-symbols-outlined text-lg ${severityStyle.icon}`}>
                                {severity === "high" ? "crisis_alert" : severity === "med" ? "warning" : "info"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mb-2 truncate">
                              {t('violation_summary.latest')} {VIOLATION_LABELS[latest?.type] || latest?.type}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {latest?.timestamp ? new Date(latest.timestamp).toLocaleTimeString("vi-VN") : ""}
                              </span>
                              <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 group-hover:underline">
                                {t('violation_summary.view_details')}
                                <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              ) : (
                <div className="py-10 text-center text-green-700 font-medium flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-4xl">verified_user</span>
                  Chưa phát hiện vi phạm nào. Phòng thi an toàn.
                </div>
              )}
            </section>
          </>
        );
      })()}
    </div>
  );
}
