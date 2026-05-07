"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCountMap, setActiveCountMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchExams(parsedUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchExams = async (teacherId: string) => {
    try {
      const res = await fetch(`http://localhost:8088/api/exams/teacher/${teacherId}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setExams(data);
      }
    } catch (e) {
      console.error("Failed to load exams", e);
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật realtime số học sinh đang làm bài mỗi 10 giây
  useEffect(() => {
    const liveExams = exams.filter(e => {
      if (e.status !== 'PUBLISHED' && e.status !== 'STARTED') return false;
      if (!e.startTime) return true;
      const endTime = e.startTime + (e.duration * 60 * 1000);
      return Date.now() <= endTime;
    });
    if (liveExams.length === 0) return;

    const fetchActiveCounts = async () => {
      const updates: Record<string, number> = {};
      await Promise.all(liveExams.map(async (exam) => {
        try {
          const res = await fetch(`http://localhost:8088/api/exams/${exam.accessCode}/active-count`, {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            updates[exam.accessCode] = data.activeCount;
          }
        } catch {}
      }));
      setActiveCountMap(prev => ({ ...prev, ...updates }));
    };

    fetchActiveCounts();
    const interval = setInterval(fetchActiveCounts, 10000);
    return () => clearInterval(interval);
  }, [exams]);

  const deleteExam = async (id: string) => {
    if (!confirm("Ban co chac chan muon xoa ky thi nay?")) return;
    try {
      const res = await fetch(`http://localhost:8088/api/exams/${id}`, { 
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      if (res.ok) {
        setExams(prev => prev.filter(e => e.id !== id));
      }
    } catch (e) {
      alert("Loi khi xoa ky thi");
    }
  };

  const closeExam = async (id: string) => {
    if (!confirm("Dong phong thi nay? Hoc sinh se khong vao lam bai duoc nua.")) return;
    try {
      const res = await fetch(`http://localhost:8088/api/exams/${id}/close`, { 
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      if (res.ok) {
        setExams(prev => prev.map(e => e.id === id ? { ...e, status: 'FINISHED' } : e));
      }
    } catch (e) {
      alert("Loi khi dong phong thi");
    }
  };

  const reopenExam = async (id: string) => {
    if (!confirm("Mo lai phong thi nay?")) return;
    try {
      const res = await fetch(`http://localhost:8088/api/exams/${id}/reopen`, { 
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      if (res.ok) {
        setExams(prev => prev.map(e => e.id === id ? { ...e, status: 'PUBLISHED' } : e));
      }
    } catch (e) {
      alert("Loi khi mo lai phong thi");
    }
  };

  const editExam = (exam: any) => {
    // Dùng URL query param — ExamBuilder sẽ fetch thắng từ API, không cần localStorage
    router.push(`/teacher/exams?edit=${exam.id}`);
  };

  const viewExam = (exam: any) => {
    // Mọi trạng thái đều vào exam-room để xem chi tiết
    router.push(`/teacher/exam-room/${exam.id}`);
  };

  const activeExamsCount = exams.filter(e => e.status === 'PUBLISHED' || e.status === 'STARTED').length;
  const draftExamsCount = exams.filter(e => e.status === 'DRAFT').length;

  return (
    <main className="p-8 space-y-8 flex-1">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-3xl font-extrabold text-on-surface font-headline tracking-tight">
            {(() => {
              const hour = new Date().getHours();
              if (hour < 12) return "Chào buổi sáng";
              if (hour < 18) return "Chào buổi chiều";
              return "Chào buổi tối";
            })()}, {user?.fullName || "Giáo viên"}
          </h3>
          <p className="text-on-surface-variant mt-1">Dưới đây là tổng quan các kỳ thi và lớp học của bạn hôm nay.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-surface-container-high text-on-surface font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-surface-container-highest transition-colors active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            Xem lịch giảng dạy
          </button>
        </div>
      </div>

      {/* Stats Grid - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1 */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl relative overflow-hidden group shadow-sm border border-outline-variant/10">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
          </div>
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Kỳ thi đang diễn ra</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-black text-[#00355f] font-headline">{activeExamsCount}</span>
            <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">LIVE NOW</span>
          </div>
          <div 
            onClick={() => router.push("/teacher/monitoring")}
            className="mt-6 flex items-center gap-2 text-[#00355f] text-sm font-semibold cursor-pointer hover:underline"
          >
            <span>Chi tiết giám sát</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl relative overflow-hidden group shadow-sm border border-outline-variant/10">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Bản nháp</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-black text-on-surface font-headline">{draftExamsCount}</span>
            <span className="text-on-surface-variant text-sm font-medium">Đang chỉnh sửa</span>
          </div>
          <div 
            onClick={() => router.push("/teacher/reports")}
            className="mt-6 flex items-center gap-2 text-on-surface-variant text-sm font-semibold cursor-pointer hover:underline"
          >
            <span>Xem báo cáo chi tiết</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl relative overflow-hidden group shadow-sm border border-outline-variant/10">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          </div>
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Tổng số bài thi</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-black text-on-surface font-headline">{exams.length}</span>
            <span className="text-on-surface-variant text-sm font-medium">Đã tạo</span>
          </div>
          <div className="mt-6 flex items-center gap-2 text-on-surface-variant text-sm font-semibold cursor-pointer hover:underline">
            <span>Quản lý danh sách lớp</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden flex flex-col">
        <div className="p-6 flex items-center justify-between border-b border-surface-container-high bg-white">
          <div>
            <h4 className="text-lg font-extrabold text-on-surface font-headline">Kỳ thi của tôi</h4>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">Danh sách các bài thi gần đây nhất</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">filter_list</span>
            </button>
            <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Tên bài thi</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Thời gian</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-center">Trạng thái</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-on-surface-variant/50">
                      <span className="material-symbols-outlined text-5xl mb-2">folder_open</span>
                      <p className="font-medium text-sm">Chưa có bài thi nào được tạo</p>
                    </div>
                  </td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${(exam.status === 'PUBLISHED' || exam.status === 'STARTED') ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                          {exam.title.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface text-sm">{exam.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-on-surface-variant">
                              {exam.versions?.[0]?.questions?.length || 0} câu hỏi • {exam.duration} phút 
                              {exam.versions?.length > 1 && ` • ${exam.versions.length} mã đề`}
                            </p>
                            {exam.status === 'PUBLISHED' && (
                              <>
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-black tracking-wider flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[10px]">key</span>
                                  {exam.accessCode}
                                </span>
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px] font-black tracking-wider flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[10px]">groups</span>
                                  {exam.submissionCount || 0} lượt nộp
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {exam.startTime ? (
                        <>
                          <p className="text-sm font-semibold text-on-surface">
                            {new Date(exam.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} 
                            {" - "} 
                            {new Date(exam.startTime).toLocaleDateString('vi-VN')}
                          </p>
                          <p className="text-[11px] text-on-surface-variant">Bắt đầu lúc công bố</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-on-surface">Không xác định</p>
                          <p className="text-[11px] text-on-surface-variant">Chưa thiết lập lịch</p>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {(() => {
                        if (exam.status === 'PUBLISHED' || exam.status === 'STARTED') {
                          if (exam.startTime) {
                            const endTime = exam.startTime + (exam.duration * 60 * 1000);
                            if (Date.now() > endTime) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black uppercase tracking-wider">
                                  Đã kết thúc
                                </span>
                              );
                            }
                          }
                          return (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-[10px] font-black uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Đang diễn ra
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping inline-block"></span>
                                {(activeCountMap[exam.accessCode] ?? 0)} đang làm bài
                              </span>
                            </div>
                          );
                        } else if (exam.status === 'FINISHED') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-black uppercase tracking-wider">
                              <span className="material-symbols-outlined text-[12px]">lock</span>
                              Đã đóng
                            </span>
                          );
                        } else if (exam.status === 'COMPLETED') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black uppercase tracking-wider">
                              <span className="material-symbols-outlined text-[12px]">check_circle</span>
                              Đã kết thúc
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black uppercase tracking-wider">
                              Bản nháp
                            </span>
                          );
                        }
                      })()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => viewExam(exam)}
                          className="p-2 text-on-surface-variant hover:text-[#00355f] hover:bg-blue-50 rounded-lg transition-all" 
                          title="Xem chi tiết"
                        >
                          <span className="material-symbols-outlined text-xl">visibility</span>
                        </button>
                        <button 
                          onClick={() => editExam(exam)}
                          className="p-2 text-on-surface-variant hover:text-[#00355f] hover:bg-blue-50 rounded-lg transition-all" 
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                        <button 
                          onClick={() => deleteExam(exam.id)}
                          className="p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" 
                          title="Xóa"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 pb-12">
        <div className="bg-white/80 p-6 rounded-2xl flex justify-center items-center gap-4 shadow-sm border border-outline-variant/10 text-on-surface-variant/50">
          Chưa có thông báo nào từ hệ thống.
        </div>
      </div>
    </main>
  );
}
