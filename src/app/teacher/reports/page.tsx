"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      fetchExams(JSON.parse(storedUser).id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchExams = async (teacherId: string) => {
    try {
      const res = await fetch(`http://localhost:8088/api/exams/teacher/${teacherId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Lọc các kỳ thi đã kết thúc (FINISHED/COMPLETED) hoặc đã có học sinh nộp bài
        const closed = data.filter((e: any) => e.status === "FINISHED" || e.status === "COMPLETED" || (e.submissionCount && e.submissionCount > 0));
        setExams(closed);
      }
    } catch (e) {
      console.error("Loi khi lay danh sach bao cao", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-8 bg-[#f8fafc]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-purple-600">assessment</span>
              Báo Cáo Phân Tích
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Xem thống kê kết quả, bảng điểm và phân tích chất lượng kỳ thi.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-slate-500 font-medium">Đang tải dữ liệu báo cáo...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-slate-400">bar_chart_off</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Chưa có báo cáo nào</h2>
            <p className="text-slate-500 max-w-sm mx-auto">Các kỳ thi đã kết thúc hoặc có dữ liệu nộp bài sẽ xuất hiện tại đây để bạn phân tích.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Tên kỳ thi</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Mã phòng</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Số lượt nộp</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-800">{exam.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(exam.startTime || Date.now()).toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold">{exam.accessCode}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-600 text-lg">groups</span>
                        <span className="font-bold text-slate-700">{exam.submissionCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full ${exam.status === 'COMPLETED' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {exam.status === 'COMPLETED' ? 'Đã kết thúc' : exam.status === 'FINISHED' ? 'Đã đóng' : 'Đang diễn ra'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => router.push(`/teacher/exams/results/${exam.accessCode}`)}
                        className="px-4 py-2 bg-purple-50 text-purple-700 font-bold text-sm rounded-lg hover:bg-purple-600 hover:text-white transition-all inline-flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">leaderboard</span>
                        Xem điểm số
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
