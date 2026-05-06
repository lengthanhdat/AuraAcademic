"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

export default function TeacherExamRoom() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.id as string;

  const [exam, setExam] = useState<any>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const VIOLATION_LABELS: Record<string, string> = {

    no_face: "Không nhận diện được khuôn mặt",
    multiple_faces: "Nhiều người trong khung hình",
    cell_phone: "Sử dụng điện thoại",
    looking_left: "Quay mặt sang trái",
    looking_right: "Quay mặt sang phải",
    looking_down: "Cúi nhìn tài liệu",
    head_down_deep: "Gập đầu hoặc quay lưng"
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

  // Kết nối SSE khi biết accessCode của phòng
  useEffect(() => {
    if (!exam?.accessCode) return;
    const code = exam.accessCode;

    const es = new EventSource(`http://localhost:8088/api/exams/${code}/stream`);

    es.addEventListener("count", (e) => {
      const data = JSON.parse(e.data);
      setActiveCount(data.activeCount ?? 0);
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

    // Lấy dữ liệu ban đầu ngay khi kết nối
    fetchActiveCount(code);
    fetchResults(code);
    fetchViolations(code);

    return () => es.close();
  }, [exam?.accessCode]);

  const fetchActiveCount = async (code: string) => {
    try {
      const res = await fetch(`http://localhost:8088/api/exams/${code}/active-count`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      if (res.ok) { const d = await res.json(); setActiveCount(d.activeCount || 0); }
    } catch {}
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
        setMsg({ type: "success", text: "Bài thi đã bắt đầu! Học sinh sẽ tự động được chuyển vào phòng thi." });
        fetchExam();
      } else {
        setMsg({ type: "error", text: "Không thể bắt đầu bài thi." });
      }
    } catch {
      setMsg({ type: "error", text: "Không thể kết nối server." });
    } finally {
      setIsStarting(false);
    }
  };

  const handleClose = async () => {
    if (!confirm("Bạn có chắc chắn muốn đóng phòng thi không?")) return;
    setIsClosing(true);
    try {
      const res = await fetch(`http://localhost:8088/api/exams/${examId}/close`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      if (res.ok) {
        setMsg({ type: "success", text: "Phòng thi đã được đóng." });
        fetchExam();
      }
    } catch {
      setMsg({ type: "error", text: "Không thể đóng phòng thi." });
    } finally {
      setIsClosing(false);
    }
  };

  const copyCode = () => {
    if (exam?.accessCode) {
      navigator.clipboard.writeText(exam.accessCode);
      setMsg({ type: "success", text: "Đã sao chép mã phòng!" });
      setTimeout(() => setMsg({ type: "", text: "" }), 2000);
    }
  };

  const getStatusBadge = () => {
    if (!exam) return null;
    const s = exam.status;
    
    if ((s === "STARTED" || s === "PUBLISHED") && timeLeft === 0) {
      return <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-black uppercase rounded-full">⏳ Hết thời gian làm bài</span>;
    }

    if (s === "WAITING") return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-black uppercase rounded-full">⏳ Đang chờ học sinh</span>;
    if (s === "STARTED" || s === "PUBLISHED") return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black uppercase rounded-full animate-pulse">🟢 Đang diễn ra</span>;
    if (s === "FINISHED") return <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-black uppercase rounded-full">⬛ Đã kết thúc</span>;
    if (s === "DRAFT") return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-black uppercase rounded-full">📝 Bản nháp</span>;
    return null;
  };

  const isActive = exam?.status === "STARTED" || exam?.status === "PUBLISHED";
  const isWaiting = exam?.status === "WAITING";
  const isFinished = exam?.status === "FINISHED";


  // Khởi tạo thời gian còn lại khi load exam
  useEffect(() => {
    if (exam?.status === "STARTED" || exam?.status === "PUBLISHED") {
      if (exam.startTime && exam.duration) {
        const endTime = exam.startTime + exam.duration * 60 * 1000;
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setTimeLeft(remaining);
      }
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

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
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
            <p className="text-xs text-on-surface-variant uppercase tracking-widest">Quản lý phòng thi</p>
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
            <p className="text-on-primary-container text-xs font-bold uppercase tracking-widest mb-2">Mã phòng thi</p>
            <h2 className="text-5xl font-black tracking-widest mb-4">{exam.accessCode}</h2>
            <p className="text-on-primary-container/80 text-xs">Chia sẻ mã này cho học sinh để vào phòng chờ</p>
          </div>
          <button
            onClick={copyCode}
            className="mt-4 flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl font-bold text-sm transition-all"
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
            Sao chép mã
          </button>
        </div>

        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between shadow-sm">
            <span className="material-symbols-outlined text-primary text-3xl mb-2">group</span>
            <div>
              <p className="text-3xl font-black text-primary">{activeCount}</p>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">Đang trong phòng chờ</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between shadow-sm">
            <span className="material-symbols-outlined text-green-600 text-3xl mb-2">assignment_turned_in</span>
            <div>
              <p className="text-3xl font-black text-green-600">{results.length}</p>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">Đã nộp bài</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between shadow-sm">
            <span className="material-symbols-outlined text-amber-600 text-3xl mb-2">timer</span>
            <div>
              <p className={`text-3xl font-black ${timeLeft !== null && timeLeft < 300 ? "text-red-500 animate-pulse" : "text-amber-600"}`}>
                {isActive ? formatTime(timeLeft) : `${exam.duration}:00`}
              </p>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">
                {isActive ? "Thời gian còn lại" : "Thời gian làm bài"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!isFinished && (
        <div className="flex gap-4 mb-8">
          {isWaiting && (
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="flex-1 py-4 bg-gradient-to-br from-green-600 to-green-700 text-white font-extrabold rounded-xl text-lg shadow-lg shadow-green-700/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings:"'FILL' 1"}}>
                {isStarting ? "sync" : "play_circle"}
              </span>
              {isStarting ? "Đang bắt đầu..." : "▶ Bắt đầu thi ngay"}
            </button>
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
            onClick={handleClose}
            disabled={isClosing}
            className="px-8 py-4 bg-error-container text-on-error-container font-bold rounded-xl hover:bg-error/20 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <span className="material-symbols-outlined">stop_circle</span>
            {isClosing ? "Đang đóng..." : "Đóng phòng thi"}
          </button>
        </div>
      )}

      {isFinished && (
        <div className="p-6 bg-slate-100 rounded-xl mb-8 text-center">
          <p className="text-slate-600 font-bold">Phòng thi đã kết thúc. Xem kết quả bên dưới.</p>
        </div>
      )}

      {/* Results Table */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-container flex items-center justify-between">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-fixed-dim">leaderboard</span>
            Kết quả nộp bài ({results.length})
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
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Học sinh</th>
                  <th className="px-6 py-4">Mã đề</th>
                  <th className="px-6 py-4">Điểm số</th>
                  <th className="px-6 py-4">Đúng/Tổng</th>
                  <th className="px-6 py-4">Thời gian nộp</th>
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
            {isActive ? "Đang chờ học sinh nộp bài..." : "Chưa có kết quả nào."}
          </div>
        )}
      </section>

      {/* Violations Section */}
      <section className="bg-error-container/20 rounded-xl shadow-sm border border-error/20 overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-error/20 flex items-center justify-between">
          <h3 className="text-lg font-bold text-error flex items-center gap-2">
            <span className="material-symbols-outlined text-error">gpp_bad</span>
            Báo cáo vi phạm từ AI ({violations.length})
          </h3>
        </div>
        {violations.length > 0 ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {violations.map((v) => (
              <div key={v.id} className="bg-surface-container-lowest rounded-xl shadow-sm border-l-4 border-error overflow-hidden flex flex-col">
                {v.videoUrl && (
                  <div className="relative aspect-video bg-black/10">
                    <video 
                      src={v.videoUrl} 
                      controls 
                      className="w-full h-full object-cover"
                      poster="/placeholder-video.jpg"
                    />
                    <div className="absolute top-2 left-2 bg-error/90 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                      <span className="material-symbols-outlined text-[10px]">videocam</span> 5s Buffer
                    </div>
                  </div>
                )}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-on-surface truncate pr-2">{v.studentName || "Không rõ tên"}</p>
                      <p className="text-[10px] text-on-surface-variant/70 uppercase tracking-wider">ID: {v.studentId}</p>
                    </div>
                    <span className="text-xs text-on-surface-variant font-mono bg-surface-container px-2 py-1 rounded-md shrink-0">{new Date(v.timestamp).toLocaleTimeString("vi-VN")}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-error/10 text-error px-2.5 py-1.5 rounded-lg text-sm font-bold mt-auto w-fit">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    {VIOLATION_LABELS[v.type] || v.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-green-700 font-medium flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl">verified_user</span>
            Chưa phát hiện vi phạm nào. Phòng thi an toàn.
          </div>
        )}
      </section>
    </div>
  );
}
