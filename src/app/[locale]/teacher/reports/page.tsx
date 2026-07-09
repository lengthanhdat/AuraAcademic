"use client";
import { useEffect, useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function ReportsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("TeacherReports");
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/exams/teacher/${teacherId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Lọc các kỳ thi đã kết thúc (FINISHED/COMPLETED) hoặc đã có học sinh nộp bài
        const closed = data.filter((e: any) => e.status === "FINISHED" || e.status === "COMPLETED" || (e.submissionCount && e.submissionCount > 0));
        setExams(closed);
      }
    } catch (e) {
      console.error(t("err_fetch"), e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-8 bg-[#F8FAFC] dark:bg-[#051329]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-[#E2E8F0] flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-purple-600">assessment</span>
              {t("page_title")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{t("page_desc")}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">{t("loading")}</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white dark:bg-[#0A1F3E] rounded-3xl p-16 text-center border border-slate-200 dark:border-cyan-950/40 shadow-sm">
            <div className="w-20 h-20 bg-slate-100 dark:bg-cyan-950/50 dark:text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-slate-400">bar_chart_off</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-[#E2E8F0] mb-2">{t("no_reports")}</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{t("no_reports_desc")}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0A1F3E] rounded-2xl shadow-sm border border-slate-200 dark:border-cyan-950/40 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40 border-b border-slate-100 dark:border-cyan-950/30">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{t("th_exam_name")}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{t("th_room_code")}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{t("th_submissions")}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{t("th_status")}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">{t("th_actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-800 dark:text-[#E2E8F0]">{exam.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{new Date(exam.startTime || Date.now()).toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-mono text-sm bg-slate-100 dark:bg-cyan-950/50 dark:text-slate-300 px-2 py-1 rounded text-slate-600 font-bold">{exam.accessCode}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-600 text-lg">groups</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{exam.submissionCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full ${exam.status === 'COMPLETED' ? 'bg-green-50 text-green-700' : 'bg-slate-100 dark:bg-cyan-950/50 dark:text-slate-300 text-slate-600'}`}>
                        {exam.status === 'COMPLETED' ? t("ended") : exam.status === 'FINISHED' ? t("closed") : t("ongoing")}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => router.push(`/teacher/exams/results/detail/?code=${exam.accessCode}`)}
                        className="px-4 py-2 bg-purple-50 text-purple-700 font-bold text-sm rounded-lg hover:bg-purple-600 hover:text-white transition-all inline-flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">leaderboard</span>
                        {t("view_scores")}
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
