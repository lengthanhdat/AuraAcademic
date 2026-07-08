"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ExamResults() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (code) {
      fetchResults(code);
    }
  }, [code]);

  const fetchResults = async (accessCode: string) => {
    try {
      const res = await fetch(`http://localhost:8088/api/exams/${accessCode}/results`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => b.score - a.score);
        setResults(data);
      }
    } catch (e) {
      console.error("Lỗi khi lấy kết quả thi", e);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (results.length === 0) return;
    const headers = ["Hạng", "Tên học sinh", "Mã học sinh", "Mã đề thi", "Số câu đúng", "Tổng câu", "Điểm số", "Thời gian nộp"];
    const rows = results.map((r: any, i: number) => [
      i + 1,
      r.studentName,
      r.studentId,
      r.versionCode,
      r.correctAnswers,
      r.totalQuestions,
      r.score,
      new Date(r.submittedAt).toLocaleString('vi-VN')
    ]);
    const csvContent = [headers, ...rows].map(row => row.map((v: any) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ket_qua_${code}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalStudents = results.length;
  const averageScore = totalStudents > 0 
    ? (results.reduce((acc, curr) => acc + curr.score, 0) / totalStudents).toFixed(2) 
    : 0;
  
  const passedStudents = results.filter(r => r.score >= 5).length;
  const passedPercentage = totalStudents > 0 
    ? Math.round((passedStudents / totalStudents) * 100) 
    : 0;

  const maxScore = totalStudents > 0 ? Math.max(...results.map(r => r.score)) : 0;

  return (
    <main className="p-8 space-y-8 flex-1 bg-[#f8fafc]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.push("/teacher/dashboard")}
          className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Thống kê điểm số</h2>
          <p className="text-slate-500 font-medium">Mã phòng thi: <span className="text-sky-600 font-bold">{code}</span></p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#0A1F3E] rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
            <span className="material-symbols-outlined text-3xl">groups</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tổng lượt nộp</p>
            <p className="text-3xl font-black text-slate-800">{totalStudents}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#0A1F3E] rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <span className="material-symbols-outlined text-3xl">functions</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Điểm trung bình</p>
            <p className="text-3xl font-black text-slate-800">{averageScore}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A1F3E] rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tỷ lệ đạt (≥5)</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-800">{passedPercentage}%</p>
              <p className="text-xs text-slate-500 font-bold">({passedStudents} em)</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A1F3E] rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <span className="material-symbols-outlined text-3xl">workspace_premium</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Điểm cao nhất</p>
            <p className="text-3xl font-black text-slate-800">{maxScore}</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-[#0A1F3E] rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-cyan-950/30 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Danh sách học sinh nộp bài</h3>
          {results.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Xuat CSV
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Hạng</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Học sinh</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Mã đề thi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Số câu đúng</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Điểm số</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Thời gian nộp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 flex flex-col items-center">
                    <span className="material-symbols-outlined text-5xl mb-2 opacity-50">inbox</span>
                    Chưa có học sinh nào nộp bài.
                  </td>
                </tr>
              ) : (
                results.map((res, index) => (
                  <tr key={res.id} className="hover:bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-slate-200 text-slate-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{res.studentName}</p>
                      <p className="text-xs text-slate-500">ID: {res.studentId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">{res.versionCode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-700">{res.correctAnswers} / {res.totalQuestions}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-black text-lg ${res.score >= 8 ? 'text-green-600' : res.score >= 5 ? 'text-blue-600' : 'text-red-600'}`}>
                        {res.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(res.submittedAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
