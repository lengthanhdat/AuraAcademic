"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "@/navigation";
import { fetchAdminExams, deleteAdminExam } from "@/lib/adminApi";
import { toast } from "sonner";
import { useAlert } from "@/components/ui/AlertProvider";

const API_BASE = "http://localhost:8088/api";

// ─── Classroom Name Dynamic Loader & Cache ──────────────────────────────────
const classroomCache: Record<string, string> = {};
const pendingClassroomRequests: Record<string, Promise<any>> = {};

function ClassroomName({ id }: { id?: string }) {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!id || id === "null" || id === "undefined") {
      setName("Thi tự do");
      return;
    }
    if (classroomCache[id]) {
      setName(classroomCache[id]);
      return;
    }

    const fetchName = async () => {
      try {
        if (!pendingClassroomRequests[id]) {
          pendingClassroomRequests[id] = fetch(`http://localhost:8088/api/classrooms/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }).then((res) => (res.ok ? res.json() : null));
        }
        const data = await pendingClassroomRequests[id];
        if (data && data.classroom) {
          classroomCache[id] = data.classroom.name;
          setName(data.classroom.name);
        } else {
          classroomCache[id] = "N/A";
          setName("N/A");
        }
      } catch {
        setName("Lỗi tải");
      }
    };

    fetchName();
  }, [id]);

  if (!id || id === "null" || id === "undefined") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/40 px-2.5 py-1 rounded-lg">
        <span className="material-symbols-outlined text-[14px]">public</span>
        Thi tự do
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 dark:text-cyan-400 bg-indigo-50 dark:bg-[#0C2E5E]/40 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-cyan-900/30">
      <span className="material-symbols-outlined text-[14px]">school</span>
      Lớp: {name || "Đang tải..."}
    </span>
  );
}

// ─── Countdown Component ─────────────────────────────────────────────────────
function ExamCountdown({
  startTime,
  duration,
  status,
  scheduledStartTime,
}: {
  startTime?: number;
  duration: number;
  status: string;
  scheduledStartTime?: number;
}) {
  const [timeLeftStr, setTimeLeftStr] = useState("");

  useEffect(() => {
    if (status === "STARTED" && startTime) {
      const interval = setInterval(() => {
        const endTime = startTime + duration * 60 * 1000;
        const diff = endTime - Date.now();
        if (diff <= 0) {
          setTimeLeftStr("Hết giờ làm bài");
          clearInterval(interval);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeftStr(`Còn lại: ${minutes}:${seconds.toString().padStart(2, "0")}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else if (status === "PUBLISHED" && scheduledStartTime) {
      const interval = setInterval(() => {
        const diff = scheduledStartTime - Date.now();
        if (diff <= 0) {
          setTimeLeftStr("Đang bắt đầu...");
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          if (hours > 0) {
            setTimeLeftStr(`Bắt đầu sau: ${hours}h ${minutes}m`);
          } else {
            setTimeLeftStr(`Bắt đầu sau: ${minutes}m ${seconds}s`);
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeftStr("");
    }
  }, [startTime, duration, status, scheduledStartTime]);

  if (!timeLeftStr) return null;

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-[#00C6FF] text-[11px] font-extrabold border border-cyan-500/20">
      <span className="material-symbols-outlined text-[14px] animate-pulse">alarm</span>
      {timeLeftStr}
    </span>
  );
}

// ─── Main Admin Page Component ───────────────────────────────────────────────
export default function AdminExamsPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeCountMap, setActiveCountMap] = useState<Record<string, number>>({});

  const loadExams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminExams();
      setExams(data);
    } catch {
      toast.error("Không thể tải danh sách kỳ thi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  // Polling active student count for LIVE exams
  const liveExams = useMemo(() =>
    exams.filter((e: any) => e.status === "STARTED"),
    [exams]
  );

  useEffect(() => {
    if (liveExams.length === 0) return;

    const fetchCounts = async () => {
      const updates: Record<string, number> = {};
      await Promise.all(
        liveExams.map(async (exam: any) => {
          try {
            const res = await fetch(`${API_BASE}/exams/${exam.accessCode}/active-count`, {
              headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
            });
            if (res.ok) {
              const data = await res.json();
              updates[exam.accessCode] = data.activeCount;
            }
          } catch {}
        })
      );
      setActiveCountMap(updates);
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, [liveExams]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = exams.length;
    const live = exams.filter((e: any) => e.status === "STARTED").length;
    const ready = exams.filter((e: any) => e.status === "PUBLISHED" || e.status === "WAITING").length;
    const draft = exams.filter((e: any) => e.status === "DRAFT").length;
    const completed = exams.filter((e: any) => e.status === "FINISHED" || e.status === "COMPLETED").length;
    return { total, live, ready, draft, completed };
  }, [exams]);

  // Actions
  const handleStartExam = async (id: string) => {
    showAlert({
      title: "Bắt đầu kỳ thi",
      message: "Bắt đầu kỳ thi này ngay bây giờ?",
      type: "confirm",
      confirmText: "Bắt đầu",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/exams/${id}/start`, {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
          });
          if (res.ok) {
            toast.success("Kỳ thi đã được bắt đầu!");
            loadExams();
          } else {
            toast.error("Lỗi khi bắt đầu kỳ thi.");
          }
        } catch {
          toast.error("Lỗi kết nối.");
        }
      }
    });
  };

  const handleCloseExam = async (id: string) => {
    showAlert({
      title: "Đóng phòng thi",
      message: "Đóng phòng thi này?",
      type: "confirm",
      confirmText: "Đóng phòng",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/exams/${id}/close`, {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
          });
          if (res.ok) {
            toast.success("Phòng thi đã đóng.");
            loadExams();
          }
        } catch {
          toast.error("Lỗi kết nối.");
        }
      }
    });
  };

  const handleReopenExam = async (id: string) => {
    showAlert({
      title: "Mở lại phòng thi",
      message: "Mở lại phòng thi này?",
      type: "confirm",
      confirmText: "Mở lại",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/exams/${id}/reopen`, {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
          });
          if (res.ok) {
            toast.success("Phòng thi đã được mở lại.");
            loadExams();
          }
        } catch {
          toast.error("Lỗi kết nối.");
        }
      }
    });
  };

  const handleDelete = async (id: string, title: string) => {
    showAlert({
      title: "Xác nhận xóa",
      message: `Xác nhận xóa VĨNH VIỄN kỳ thi "${title}"?`,
      type: "confirm",
      confirmText: "Xóa",
      cancelText: "Hủy",
      onConfirm: async () => {
        try {
          await deleteAdminExam(id);
          toast.success("Đã xóa kỳ thi thành công.");
          setExams((p) => p.filter((e) => e.id !== id));
        } catch (e: any) {
          toast.error(e.message || "Lỗi khi xóa kỳ thi.");
        }
      }
    });
  };

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Đã sao chép mã phòng thi: " + code);
  };

  const filtered = useMemo(() => {
    return exams.filter((e) => {
      const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.accessCode?.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (statusFilter === "ALL") return true;
      if (statusFilter === "LIVE") return e.status === "STARTED";
      if (statusFilter === "READY") return e.status === "PUBLISHED" || e.status === "WAITING";
      if (statusFilter === "DRAFT") return e.status === "DRAFT";
      if (statusFilter === "COMPLETED") return e.status === "FINISHED" || e.status === "COMPLETED";
      return true;
    });
  }, [exams, search, statusFilter]);

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-screen relative max-w-6xl mx-auto w-full pb-16">
      {/* Header Banner */}
      <section className="bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] p-8 rounded-[2rem] shadow-xl relative overflow-hidden text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-4xl text-white">shield</span>
          </div>
          <h2 className="font-headline font-extrabold text-4xl tracking-tight mb-2">
            Quản trị Kỳ thi & Giám sát
          </h2>
          <p className="text-white/80 max-w-lg leading-relaxed text-sm">
            Trang điều khiển dành cho Admin để giám sát, can thiệp đóng/mở phòng thi và quản lý tất cả phiên làm bài thi trên toàn hệ thống.
          </p>
        </div>
        <button
          onClick={loadExams}
          className="px-5 py-3 bg-white text-[#0C2E5E] font-black rounded-xl text-xs shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shrink-0"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Làm mới dữ liệu
        </button>
      </section>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-white dark:bg-[#0A1F3E]/60 rounded-2xl animate-pulse border border-slate-200/60" />
          ))
        ) : (
          <>
            <div className="bg-white dark:bg-[#0A1F3E]/60 p-5 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tổng phòng thi</p>
              <p className="text-3xl font-black mt-1 text-slate-800 dark:text-slate-100 font-headline">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-[#0A1F3E]/60 p-5 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 border-l-4 border-l-emerald-500 hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Đang diễn ra (LIVE)</p>
              <p className="text-3xl font-black mt-1 text-emerald-600 dark:text-emerald-400 font-headline">{stats.live}</p>
            </div>
            <div className="bg-white dark:bg-[#0A1F3E]/60 p-5 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 border-l-4 border-l-blue-500 hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Sẵn sàng (Scheduled)</p>
              <p className="text-3xl font-black mt-1 text-blue-600 dark:text-blue-400 font-headline">{stats.ready}</p>
            </div>
            <div className="bg-white dark:bg-[#0A1F3E]/60 p-5 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 border-l-4 border-l-amber-500 hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Đang soạn (Draft)</p>
              <p className="text-3xl font-black mt-1 text-amber-600 dark:text-amber-400 font-headline">{stats.draft}</p>
            </div>
            <div className="bg-white dark:bg-[#0A1F3E]/60 p-5 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 border-l-4 border-l-slate-400 hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Đã kết thúc</p>
              <p className="text-3xl font-black mt-1 text-slate-500 dark:text-slate-300 font-headline">{stats.completed}</p>
            </div>
          </>
        )}
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white dark:bg-[#0A1F3E]/60 border border-slate-200/60 dark:border-cyan-950/40 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full md:max-w-xs shrink-0">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Tìm theo mã phòng hoặc tên bài..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-cyan-950/30 border border-slate-200/60 dark:border-cyan-950/40 rounded-xl text-xs font-semibold outline-none focus:border-[#00C6FF] dark:text-slate-200"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "LIVE", label: "Đang diễn ra" },
            { id: "READY", label: "Sẵn sàng" },
            { id: "DRAFT", label: "Bản nháp" },
            { id: "COMPLETED", label: "Đã kết thúc" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                statusFilter === tab.id
                  ? "bg-[#0C2E5E] dark:bg-cyan-950 text-white border-[#0C2E5E] shadow-md shadow-blue-500/10"
                  : "bg-white dark:bg-[#0A1F3E]/80 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-cyan-950/40 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List Grid Layout */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white dark:bg-[#0A1F3E]/60 border border-slate-200/60 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#0A1F3E]/60 border border-slate-200/50 dark:border-cyan-950/40 rounded-[2rem] py-16 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">folder_open</span>
            <h4 className="font-bold text-base text-slate-700 dark:text-slate-300">Không tìm thấy phòng thi nào</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Hệ thống không tìm thấy phòng thi nào phù hợp với bộ lọc tìm kiếm hiện tại.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((exam: any) => {
              const isLive = exam.status === "STARTED";
              const isPublished = exam.status === "PUBLISHED" || exam.status === "WAITING";
              const isDraft = exam.status === "DRAFT";
              const isFinished = exam.status === "FINISHED" || exam.status === "COMPLETED";
              const activeCount = activeCountMap[exam.accessCode] || 0;

              return (
                <div
                  key={exam.id}
                  className={`bg-white dark:bg-[#0A1F3E]/60 border rounded-[2rem] p-6 hover:shadow-[0_12px_30px_-6px_rgba(0,198,255,0.12)] hover:-translate-y-0.5 transition-all duration-300 relative flex flex-col justify-between min-h-[220px] overflow-hidden ${
                    isLive
                      ? "border-emerald-500/50 dark:border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.08)]"
                      : "border-slate-200/80 dark:border-cyan-950/40"
                  }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  
                  <div className="relative z-10 space-y-4">
                    {/* Top Row: Status Tag, Time Tracker, Access Code */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isLive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ĐANG DIỄN RA
                          </span>
                        )}
                        {isPublished && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/20">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            SẴN SÀNG
                          </span>
                        )}
                        {isDraft && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                            BẢN NHÁP
                          </span>
                        )}
                        {isFinished && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider border border-slate-500/20">
                            ĐÃ KẾT THÚC
                          </span>
                        )}

                        {exam.aiProctoring && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-black border border-cyan-500/25">
                            <span className="material-symbols-outlined text-[12px] animate-pulse">videocam</span>
                            GIÁM SÁT AI
                          </span>
                        )}
                      </div>

                      {exam.accessCode && (
                        <button
                          onClick={() => copyAccessCode(exam.accessCode)}
                          title="Click để sao chép mã"
                          className="px-3 py-1 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/30 rounded-lg text-xs font-mono font-black text-cyan-600 dark:text-[#00C6FF] flex items-center gap-1.5 tracking-widest active:scale-95 transition-transform shrink-0"
                        >
                          <span className="material-symbols-outlined text-xs">key</span>
                          {exam.accessCode}
                        </button>
                      )}
                    </div>

                    {/* Title & Subject and Classroom badges */}
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-800 dark:text-white leading-snug group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                        {exam.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <ClassroomName id={exam.classroomId} />
                        
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">•</span>
                        
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                          {exam.versions?.[0]?.questions?.length || 0} câu hỏi / {exam.duration} phút
                        </span>
                      </div>
                    </div>

                    {/* Creator info */}
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                      <span className="material-symbols-outlined text-sm">person</span>
                      <span>Người tạo: <strong className="text-slate-600 dark:text-slate-300">{exam.teacherName || "System"}</strong></span>
                    </div>

                    {/* Time Tracker / Countdown / Date Scheduled */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <ExamCountdown
                        startTime={exam.startTime}
                        duration={exam.duration}
                        status={exam.status}
                        scheduledStartTime={exam.scheduledStartTime}
                      />
                      {exam.scheduledStartTime && !isLive && !isFinished && (
                        <p className="text-xs font-bold text-blue-500 dark:text-blue-400">
                          📅 Lên lịch: {new Date(exam.scheduledStartTime).toLocaleString("vi-VN")}
                        </p>
                      )}
                      {!exam.scheduledStartTime && isPublished && (
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          Chờ bắt đầu thủ công
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Counter & Direct actions */}
                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-cyan-950/30 pt-4 mt-5 relative z-10">
                    <div>
                      {isLive ? (
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">groups</span>
                          {activeCount} học sinh đang làm bài
                        </p>
                      ) : isFinished ? (
                        <p className="text-[11px] font-bold text-[#00C6FF] flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">how_to_reg</span>
                          {exam.submissionCount ?? 0} lượt nộp bài
                        </p>
                      ) : (
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                          Tạo ngày {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </p>
                      )}
                    </div>

                    {/* Action buttons - Prominent and Direct */}
                    <div className="flex items-center gap-2">
                      {isLive && (
                        <>
                          <button
                            onClick={() => router.push(`/teacher/exam-room/${exam.id}`)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">meeting_room</span>
                            Vào giám sát
                          </button>
                          <button
                            onClick={() => handleCloseExam(exam.id)}
                            className="px-3 py-2 border border-red-500/20 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-black transition-all"
                          >
                            Đóng phòng
                          </button>
                        </>
                      )}

                      {isPublished && (
                        <>
                          <button
                            onClick={() => router.push(`/teacher/exam-room/${exam.id}`)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">meeting_room</span>
                            Vào phòng chờ
                          </button>
                          <button
                            onClick={() => handleStartExam(exam.id)}
                            className="px-3 py-2 border border-blue-500/20 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black transition-all"
                            title="Kích hoạt bắt đầu thi lập tức"
                          >
                            Bắt đầu ngay
                          </button>
                          <button
                            onClick={() => handleDelete(exam.id, exam.title)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-xl transition-all"
                            title="Xóa kỳ thi"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </>
                      )}

                      {isFinished && (
                        <>
                          <button
                            onClick={() => router.push(`/admin/my-exams/results/${exam.accessCode}`)}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                            Xem kết quả
                          </button>
                          <button
                            onClick={() => handleReopenExam(exam.id)}
                            className="px-3 py-2 border border-slate-200 dark:border-cyan-950/50 bg-slate-50 hover:bg-slate-100 dark:bg-cyan-950/30 dark:hover:bg-cyan-950/50 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black transition-all"
                          >
                            Mở lại
                          </button>
                          <button
                            onClick={() => handleDelete(exam.id, exam.title)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-xl transition-all"
                            title="Xóa kỳ thi vĩnh viễn"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </>
                      )}

                      {isDraft && (
                        <>
                          <button
                            onClick={() => handleStartExam(exam.id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md hover:scale-105 active:scale-95"
                          >
                            Bắt đầu thi
                          </button>
                          <button
                            onClick={() => handleDelete(exam.id, exam.title)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-cyan-950/40 rounded-xl transition-all"
                            title="Xóa kỳ thi"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
