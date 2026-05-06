"use client";

import { useEffect, useState } from "react";

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [accessCode, setAccessCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchResults(parsedUser.id);
    }
  }, []);

  const fetchResults = async (studentId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:8088/api/exams/results/student/${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (e) {
      console.error("Lỗi khi tải kết quả", e);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleJoin = async () => {
    if (!accessCode.trim()) return;
    
    // Check if student has already completed this exam
    if (results.some(r => r.examId === accessCode.toUpperCase())) {
      setError("Bạn đã hoàn thành kỳ thi này rồi. Xem kết quả ở bảng bên dưới.");
      return;
    }

    setIsJoining(true);
    setError("");
    const cleanCode = accessCode.trim().toUpperCase();
    
    try {
      // Kiểm tra phòng tồn tại và đủ điều kiện qua lobby endpoint
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:8088/api/exams/lobby/${cleanCode}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        // Phòng hợp lệ → đưa vào phòng chờ
        window.location.href = `/student/lobby?code=${cleanCode}`;
      } else if (res.status === 401 || res.status === 403) {
        setError("Phiên làm việc đã hết hạn. Vui lòng đăng xuất và đăng nhập lại.");
      } else {
        const msg = await res.text();
        setError(msg || "Mã phòng thi không chính xác hoặc đã kết thúc.");
      }
    } catch (e) {
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main className="p-8 space-y-12 max-w-7xl mx-auto w-full">
      {/* Welcome Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7">
          <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight mb-4">Xin chào, {user?.fullName || "Sinh viên"}.</h2>
          <p className="text-on-surface-variant text-lg max-w-xl">
            Chào mừng bạn quay trở lại. Hãy nhập mã phòng thi để bắt đầu bài kiểm tra của mình.
          </p>
        </div>
        <div className="lg:col-span-5 flex justify-end">
          <div className="bg-secondary-container rounded-xl p-4 flex items-center gap-4 border-none shadow-sm">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-secondary-container uppercase tracking-wide">Gợi ý AI</p>
              <p className="text-sm font-medium text-on-secondary-container">Đừng quên kiểm tra lại đường truyền internet trước khi vào thi nhé!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enter Exam Room Card */}
      <section className="flex justify-center">
        <div className="w-full max-w-3xl bg-white/80 backdrop-blur-[20px] rounded-xl p-10 shadow-sm relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-center space-y-8">
            <div className="space-y-2">
              <h3 className="font-headline font-bold text-2xl text-on-surface">Vào Phòng Thi</h3>
              <p className="text-on-surface-variant">Vui lòng nhập mã phòng thi được cung cấp bởi giám thị của bạn.</p>
            </div>
            
            <div className="max-w-md mx-auto flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100">
                  {error}
                </div>
              )}
              <div className="relative">
                <input 
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="w-full px-6 py-4 bg-surface-container-highest text-on-surface font-headline font-bold text-center tracking-widest text-xl rounded-xl border-none focus:ring-2 focus:ring-primary/40 placeholder:text-outline-variant/60 placeholder:font-normal placeholder:text-base placeholder:tracking-normal transition-all outline-none" 
                  placeholder="Mã Ca Thi / Mã Phòng" 
                  type="text"
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">key</span>
              </div>
              <button 
                onClick={handleJoin}
                disabled={isJoining || !accessCode}
                className="bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-transform active:scale-98 shadow-md hover:opacity-90 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">{isJoining ? "sync" : "login"}</span>
                {isJoining ? "Đang kiểm tra..." : "Vào phòng"}
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                Môi trường an toàn
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">videocam</span>
                Giám sát mở
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exam History Table Section */}
      <section className="space-y-6">
        <div className="flex items-end justify-between px-2">
          <div className="space-y-1">
            <h3 className="font-headline font-bold text-xl text-on-surface">Kết quả các bài thi trước</h3>
            <p className="text-sm text-on-surface-variant">Tổng quan về hiệu suất và điểm số thi gần đây của bạn.</p>
          </div>
          <button className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
            Xem tất cả
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
        
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border-none overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest min-w-[250px]">Tên bài thi</th>
                <th className="px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Thời gian</th>
                <th className="px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Trạng thái</th>
                <th className="px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-right">Điểm số</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {loadingResults ? (
                <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400">Đang tải kết quả...</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400">Bạn chưa tham gia kỳ thi nào.</td></tr>
              ) : (
                results.map((res) => (
                  <tr key={res.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined">assignment</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{res.examTitle || `Phòng: ${res.examId}`}</p>
                          <p className="text-xs text-on-surface-variant">Mã đề: {res.versionCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-on-surface-variant whitespace-nowrap">
                      {new Date(res.submittedAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase whitespace-nowrap">Hoàn thành</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-headline font-extrabold text-lg text-primary">{res.score}/10</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Dashboard Grid (Bento Style) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
        <div className="bg-surface-container-low p-6 rounded-xl space-y-4">
          <span className="material-symbols-outlined text-primary text-3xl">workspace_premium</span>
          <h4 className="font-bold text-lg">Top Xuất Sắc</h4>
          <p className="text-sm text-on-surface-variant">Bạn đang thuộc top 5% những sinh viên có điểm số xuất sắc nhất của tháng này.</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl space-y-4">
          <span className="material-symbols-outlined text-primary text-3xl">lightbulb</span>
          <h4 className="font-bold text-lg">Phong Độ Học Tập</h4>
          <p className="text-sm text-on-surface-variant">Thành tích của bạn cực kỳ cao trong các môn tư duy logic và suy luận.</p>
        </div>
        <div className="bg-primary text-white p-6 rounded-xl space-y-4 shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-primary-fixed text-3xl">trending_up</span>
          <h4 className="font-bold text-lg">Biểu Đồ Tăng Trưởng</h4>
          <p className="text-sm text-primary-fixed/80">GPA trung bình đã tăng trưởng 0.4 điểm so với học kỳ trước.</p>
        </div>
      </section>
    </main>
  );
}
