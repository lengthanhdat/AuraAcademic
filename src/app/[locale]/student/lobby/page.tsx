"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useProctoring, VIOLATION_LABELS } from "@/hooks/useProctoring";

export default function StudentLobby() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code")?.toUpperCase() || "";
  const t = useTranslations('StudentLobby');
  const locale = useLocale();

  // ── State ──────────────────────────────────────────────────
  const [examInfo, setExamInfo] = useState<any>(null);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  // ── Refs ───────────────────────────────────────────────────
  const isEnteringRef = useRef(false);
  const esRef = useRef<EventSource | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── AI Proctoring ──────────────────────────────────────────
  const { currentViolations } = useProctoring(videoRef, code, cameraReady && !!examInfo?.aiProctoring);

  // ── Helpers ────────────────────────────────────────────────
  const enterExam = async (accessCode: string) => {
    if (isEnteringRef.current) return;
    isEnteringRef.current = true;
    setIsEntering(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:8088/api/exams/join/${accessCode}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const versionData = await res.json();
        sessionStorage.setItem("currentExam", JSON.stringify(versionData));
        window.location.href = `/${locale}/student/exams/take?code=${accessCode}`;
      } else {
        const msg = await res.text();
        setError(msg);
        isEnteringRef.current = false;
        setIsEntering(false);
      }
    } catch {
      setError(t('server_error'));
      isEnteringRef.current = false;
      setIsEntering(false);
    }
  };

  const startSSE = (examCode: string) => {
    if (esRef.current) return;
    const token = localStorage.getItem("accessToken");
    const es = new EventSource(`http://localhost:8088/api/exams/${examCode}/stream?token=${token}`);
    esRef.current = es;

    es.addEventListener("status", (e) => {
      const data = JSON.parse(e.data);
      setExamInfo((prev: any) => prev ? { ...prev, status: data.status, startTime: data.startTime } : prev);

      // Khi GV bấm "Bắt đầu thi" (STARTED) -> Cập nhật UI để học sinh bấm nút, không tự nhảy
      if (data.status === "STARTED") {
        // Giữ nguyên, không cần tự động gọi enterExam nữa, để học sinh tự bấm
      }
      if (data.status === "FINISHED" || data.status === "COMPLETED") {
        es.close(); esRef.current = null;
        setError(t('closed_error'));
      }
    });

    es.onerror = () => {
      es.close(); esRef.current = null;
      setTimeout(() => { if (examCode) startSSE(examCode); }, 500);
    };
  };

  // ── Effect: fetch lobby info ────────────────────────────────
  useEffect(() => {
    if (!code) { router.push("/student/dashboard"); return; }

    const fetchLobbyInfo = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`http://localhost:8088/api/exams/lobby/${code}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setExamInfo(data);
          // Cập nhật info xong thì khởi động SSE để lắng nghe các thay đổi tiếp theo
          startSSE(code); 

        } else {
          const msg = await res.text();
          setError(msg || "Không tìm thấy phòng thi.");
        }
      } catch {
        setError(t('server_error'));
      }
    };
    fetchLobbyInfo();
  }, [code]);

  // ── Effect: heartbeat + SSE (chỉ khi đã có examInfo) ───────
  useEffect(() => {
    if (!code || !examInfo) return;
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) return;

    const sendHeartbeat = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`http://localhost:8088/api/exams/${code}/heartbeat`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ studentId: user.id, status: "LOBBY" }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status && data.status !== examInfo.status) {
            setExamInfo((prev: any) => ({ ...prev, status: data.status }));
            // Xoá bỏ tự động nhảy vào thi tại đây, chỉ update UI để sáng nút
          }
        }
      } catch (e) {}
    };

    const sendLeaveFetch = () => {
      const token = localStorage.getItem("accessToken");
      fetch(`http://localhost:8088/api/exams/${code}/leave`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ studentId: user.id }),
      }).catch(() => {});
    };

    const sendLeaveBeacon = () => {
      navigator.sendBeacon(
        `http://localhost:8088/api/exams/${code}/leave`,
        new Blob([JSON.stringify({ studentId: user.id })], { type: "application/json" })
      );
    };

    sendHeartbeat();
    heartbeatRef.current = setInterval(sendHeartbeat, 5000);
    // Không gọi startSSE ở đây — đã được gọi trong fetchLobbyInfo khi status=PUBLISHED/WAITING

    window.addEventListener("beforeunload", sendLeaveBeacon);
    return () => {
      clearInterval(heartbeatRef.current!);
      window.removeEventListener("beforeunload", sendLeaveBeacon);
      esRef.current?.close();
      esRef.current = null;
      sendLeaveFetch();
    };
  }, [code, examInfo]);

  // ── Effect: camera ─────────────────────────────────────────
  useEffect(() => {
    if (!examInfo) return; 
    if (examInfo.aiProctoring === false) return; // Không bật AI -> Không bật cam

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 }, 
            frameRate: { ideal: 30 },
            facingMode: "user" 
          },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch {
        setCameraError(t('camera_error'));
      }
    };
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [examInfo?.aiProctoring]);

  // ── Early returns (sau tất cả hooks) ───────────────────────
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="bg-surface-container-low dark:bg-cyan-950/30 dark:text-slate-300est rounded-2xl p-10 text-center max-w-sm shadow-lg">
        <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-on-error-container text-3xl">error</span>
        </div>
        <h2 className="text-xl font-extrabold text-primary mb-2">{t('error_title')}</h2>
        <p className="text-on-surface-variant dark:text-slate-400 text-sm mb-6">{error}</p>
        <button onClick={() => router.push("/student/dashboard")} className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl">
          Quay về trang chủ
        </button>
      </div>
    </div>
  );

  if (!examInfo) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  const isStarted = examInfo.status === "STARTED" || examInfo.status === "PUBLISHED";

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-on-surface dark:text-slate-200 flex flex-col">
      {/* Header */}
      <header className="bg-surface-container-low dark:bg-cyan-950/30 dark:text-slate-300est border-b border-outline-variant/20 px-6 py-3 flex items-center justify-between">
        <span className="text-primary font-black tracking-tighter text-2xl font-headline">Aura Academic</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-slate-400">
            <span className="material-symbols-outlined text-sm">assignment</span>
            <span className="font-bold">{examInfo.title}</span>
            <span className="text-outline">·</span>
            <span>{examInfo.duration}{t('duration_unit')}</span>
          </div>
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${isStarted ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isStarted ? "bg-green-500" : "bg-amber-500"}`}></span>
            {isStarted ? t('status_started') : t('status_waiting')}
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-6 items-start">

          {/* LEFT — Camera (nếu có AI) HOẶC Info Card (nếu không AI) */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">{t('room_code')} {code}</p>
              <h1 className="text-2xl font-extrabold text-on-surface dark:text-slate-200">{examInfo.title}</h1>
              <p className="text-on-surface-variant dark:text-slate-400 text-sm mt-1">{t('duration_label')}<strong>{examInfo.duration}{t('duration_unit')}</strong></p>
            </div>

            {examInfo.aiProctoring ? (
              <>
                <div className={`relative aspect-video bg-neutral-900 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${currentViolations.length > 0 ? "border-4 border-error shadow-error/30 shadow-2xl scale-[1.02]" : "border-4 border-green-500/80 shadow-green-500/20 shadow-xl"}`}>
                  {cameraError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <span className="material-symbols-outlined text-4xl text-red-400">videocam_off</span>
                      <p className="text-red-300 text-sm font-medium">{cameraError}</p>
                    </div>
                  ) : (
                    <>
                      <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${currentViolations.length > 0 ? "opacity-70 grayscale-[30%]" : "opacity-100"}`} />
                      
                      {/* Trạng thái CHUẨN */}
                      {currentViolations.length === 0 && cameraReady && (
                        <div className="absolute inset-0 border-4 border-green-400 pointer-events-none rounded-xl"></div>
                      )}

                      {/* Cảnh báo AI (Hiển thị khi có vi phạm) */}
                      {currentViolations.length > 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-error/10 pointer-events-none p-4 text-center">
                          <div className="bg-error text-on-error px-4 py-2 rounded-full font-bold shadow-lg animate-bounce flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>warning</span>
                            PHÁT HIỆN VI PHẠM
                          </div>
                          <div className="flex flex-col gap-1">
                            {currentViolations.map((v: string) => (
                              <span key={v} className="bg-surface-container-high dark:bg-cyan-950/50 dark:text-slate-200est/90 text-error backdrop-blur-md px-3 py-1.5 rounded-lg font-medium text-sm shadow-sm border border-error/20">
                                {VIOLATION_LABELS[v as keyof typeof VIOLATION_LABELS]}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full z-10">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-white text-xs font-bold">LIVE</span>
                      </div>
                      <div className={`absolute top-3 right-3 flex items-center gap-1.5 backdrop-blur-sm px-3 py-1.5 rounded-full z-10 transition-colors ${currentViolations.length > 0 ? "bg-error text-on-error" : (cameraReady ? "bg-green-600/90 text-white shadow-lg" : "bg-black/60 text-white")}`}>
                        <span className="material-symbols-outlined text-sm">{currentViolations.length > 0 ? "gpp_bad" : (cameraReady ? "verified_user" : "shield")}</span>
                        <span className="text-xs font-medium">{currentViolations.length > 0 ? t('ai_warning') : (cameraReady ? t('ai_ok') : t('ai_monitoring'))}</span>
                      </div>
                      
                      {!cameraReady && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className={`rounded-xl p-4 border-l-4 transition-colors duration-300 flex gap-3 ${currentViolations.length > 0 ? "bg-error-container border-error text-on-error-container" : "bg-tertiary-container border-on-tertiary-container/30 text-on-tertiary-container"}`}>
                  <span className={`material-symbols-outlined mt-0.5 shrink-0 ${currentViolations.length > 0 ? "animate-pulse" : ""}`} style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  <p className="text-sm leading-relaxed font-medium">
                    <strong>Cảnh báo:</strong> Hệ thống AI giám sát camera liên tục. Không được chuyển tab, cúi gập mặt, quay sang hai bên, dùng điện thoại hoặc nhờ người hỗ trợ.
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-surface-container-low dark:bg-cyan-950/30 dark:text-slate-300est p-8 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center text-center aspect-video relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-4xl">security_update_good</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface dark:text-slate-200 mb-2">Sẵn sàng tham gia</h3>
                <p className="text-on-surface-variant dark:text-slate-400 text-sm max-w-xs">Kỳ thi này không kích hoạt chế độ giám sát bằng Camera. Vui lòng chuẩn bị tâm lý tốt nhất để làm bài.</p>
              </div>
            )}
          </div>

          {/* RIGHT — Rules + Action */}
          <div className="space-y-5">
            <div className="bg-surface-container-low dark:bg-cyan-950/30 dark:text-slate-300est rounded-xl p-5 shadow-sm border border-outline-variant/20">
              <h3 className="text-on-surface dark:text-slate-200 font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">rule</span>
                Nội quy phòng thi
              </h3>
              <ul className="space-y-3">
                {[
                  t('rules.0'),
                  t('rules.1'),
                  t('rules.2'),
                  t('rules.3'),
                  t('rules.4'),
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">check_circle</span>
                    <span className="text-on-surface-variant dark:text-slate-400 text-sm">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface-container-low dark:bg-cyan-950/30 dark:text-slate-300est rounded-xl p-5 shadow-sm border border-outline-variant/20 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="w-5 h-5 accent-primary rounded" />
                <span className="text-sm font-medium text-on-surface dark:text-slate-200">{t('agree_label')}</span>
              </label>

              {!isStarted ? (
                <div className="flex flex-col items-center gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full border-2 border-outline-variant border-t-primary animate-spin shrink-0"></div>
                    <div>
                      <p className="font-bold text-sm text-on-surface dark:text-slate-200">{t('waiting_teacher')}</p>
                      <p className="text-xs text-on-surface-variant dark:text-slate-400/60">{t('waiting_hint')}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-on-surface-variant dark:text-slate-400/40 font-bold tracking-widest uppercase">{t('secured_by')}</p>
                </div>
              ) : (
                <button
                  onClick={() => enterExam(code)}
                  disabled={!agreed || isEntering || examInfo.status !== 'STARTED'}
                  className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isEntering ? "sync" : (examInfo.status === 'STARTED' ? "play_circle" : "schedule")}
                  </span>
                  {isEntering ? t('btn_entering') : (examInfo.status === 'STARTED' ? t('btn_enter') : "Chưa đến giờ làm bài")}
                </button>
              )}
            </div>

            <p className="text-center text-[10px] text-on-surface-variant dark:text-slate-400/40 font-bold tracking-widest uppercase">
              Secured by Aura Academic · YOLO Proctoring v1.0
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
