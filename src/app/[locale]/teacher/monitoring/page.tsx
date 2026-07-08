"use client";
import { useEffect, useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

export default function MonitoringPage() {
  const router = useRouter();
  const t = useTranslations('TeacherMonitoring');
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCountMap, setActiveCountMap] = useState<Record<string, any>>({});

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
        // Lọc các kỳ thi đang diễn ra (PUBLISHED, STARTED hoặc WAITING)
        const live = data.filter((e: any) => e.status === "PUBLISHED" || e.status === "STARTED" || e.status === "WAITING");
        setExams(live);
      }
    } catch (e) {
      console.error(t('error_fetch'), e);
    } finally {
      setLoading(false);
    }
  };

  // Poll số lượng học sinh realtime
  useEffect(() => {
    if (exams.length === 0) return;
    
    const fetchCounts = async () => {
      const updates: Record<string, any> = {};
      await Promise.all(exams.map(async (exam) => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/exams/${exam.accessCode}/active-count`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
          });
          if (res.ok) {
            updates[exam.accessCode] = await res.json();
          }
        } catch {}
      }));
      setActiveCountMap(prev => ({ ...prev, ...updates }));
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => clearInterval(interval);
  }, [exams]);

  return (
    <main className="flex-1 p-8 bg-[#F8FAFC] dark:bg-[#051329]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-[#E2E8F0] flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-blue-600">videocam</span>
              {t("live_monitoring")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{t('subtitle')}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">{t('loading')}</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white dark:bg-[#0A1F3E] rounded-3xl p-16 text-center border border-slate-200 dark:border-cyan-950/40 shadow-sm">
            <div className="w-20 h-20 bg-slate-100 dark:bg-cyan-950/50 dark:text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-slate-400">event_busy</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-[#E2E8F0] mb-2">{t('empty_title')}</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{t('empty_desc')}</p>
            <button 
              onClick={() => router.push("/teacher/dashboard")}
              className="mt-8 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
            >
              Về bảng điều khiển
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div key={exam.id} className="bg-white dark:bg-[#0A1F3E] rounded-2xl border border-slate-200 dark:border-cyan-950/40 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{t('room_code')} {exam.accessCode}</span>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-[#E2E8F0] group-hover:text-blue-600 transition-colors">{exam.title}</h3>
                    </div>
                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40 p-3 rounded-xl border border-slate-100 dark:border-cyan-950/30">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{t('waiting')}</p>
                      <p className="text-xl font-black text-amber-600">{activeCountMap[exam.accessCode]?.lobbyCount || 0}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-cyan-950/30 dark:border-cyan-950/40 p-3 rounded-xl border border-slate-100 dark:border-cyan-950/30">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{t('taking_exam')}</p>
                      <p className="text-xl font-black text-blue-600">{activeCountMap[exam.accessCode]?.examCount || 0}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/teacher/exam-room/${exam.id}`)}
                    className="w-full py-3.5 bg-slate-800 dark:bg-[#0E3E7A] dark:hover:bg-[#00C6FF] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">meeting_room</span>
                    Vào phòng giám sát
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
