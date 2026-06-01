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

  const getScore = (result: any) => {
    const score = Number(result?.score);
    if (!Number.isFinite(score)) return 0;
    return Math.max(0, Math.min(10, score));
  };

  const formatSubmittedAt = (result: any) => {
    const raw = result?.submittedAt ?? result?.submitted_at ?? result?.submitTime ?? result?.createdAt;
    if (raw === null || raw === undefined || raw === "") return "";

    const date = typeof raw === "number" || /^\d+$/.test(String(raw))
      ? new Date(Number(raw))
      : new Date(raw);

    if (Number.isNaN(date.getTime())) return "";

    const pad = (value: number) => String(value).padStart(2, "0");
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const toCsvCell = (value: unknown) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
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
      getScore(r).toFixed(1),
      `\t${formatSubmittedAt(r)}`
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(toCsvCell).join(",")).join("\n");
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
    ? (results.reduce((acc, curr) => acc + getScore(curr), 0) / totalStudents).toFixed(1) 
    : 0;
  
  const passedStudents = results.filter(r => getScore(r) >= 5).length;
  const passedPercentage = totalStudents > 0 
    ? Math.round((passedStudents / totalStudents) * 100) 
    : 0;

  const maxScore = totalStudents > 0 ? Math.max(...results.map(getScore)) : 0;
  const minScore = totalStudents > 0 ? Math.min(...results.map(getScore)) : 0;
  const distribution = new Array(11).fill(0);
  results.forEach((result) => {
    distribution[Math.round(getScore(result))]++;
  });
  const maxBucket = Math.max(...distribution, 1);

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
          <p className="text-slate-500 font-medium">Mã phòng thi: <span className="text-purple-600 font-bold">{code}</span></p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-[#0A1F3E] rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
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
            <p className="text-3xl font-black text-slate-800">{maxScore.toFixed(1)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A1F3E] rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
            <span className="material-symbols-outlined text-3xl">south</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Điểm thấp nhất</p>
            <p className="text-3xl font-black text-slate-800">{minScore.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="bg-white dark:bg-[#0A1F3E] rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-5">Phân bố điểm</h3>
        {results.length === 0 ? (
          <div className="text-center text-slate-400 py-10 border border-dashed border-slate-200 rounded-2xl">
            Chưa có dữ liệu để thống kê.
          </div>
        ) : (
          <>
            <div className="flex items-end gap-1.5 h-32">
              {distribution.map((count, score) => (
                <div key={score} className="flex-1 flex flex-col items-center justify-end gap-1 group/bar">
                  <span className="text-[10px] font-bold text-slate-400">{count}</span>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-cyan-600/80 to-cyan-400/80 group-hover/bar:from-cyan-500 group-hover/bar:to-cyan-300 transition-all min-h-[4px]"
                    style={{ height: `${(count / maxBucket) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex mt-2">
              {Array.from({ length: 11 }, (_, i) => (
                <span key={i} className="flex-1 text-center text-[10px] font-bold text-slate-500">{i}</span>
              ))}
            </div>
            <p className="text-xs text-slate-500 text-center mt-2">Số học sinh theo từng mốc điểm 0-10</p>
          </>
        )}
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
              Xuất CSV
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
                      <span className={`font-black text-lg ${getScore(res) >= 8 ? 'text-green-600' : getScore(res) >= 5 ? 'text-blue-600' : 'text-red-600'}`}>
                        {getScore(res).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatSubmittedAt(res) || "--"}
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
