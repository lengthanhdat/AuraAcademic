"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useRouter } from "@/navigation";

type ExamConfigDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  exam: any;
  defaultClassroomId?: string;
  lockClassroom?: boolean;
  onSuccess?: () => void;
};

export default function ExamConfigDrawer({
  isOpen,
  onClose,
  exam,
  defaultClassroomId,
  lockClassroom = false,
  onSuccess,
}: ExamConfigDrawerProps) {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [duration, setDuration] = useState<number | "">(60);
  const [versionCount, setVersionCount] = useState<number>(1);
  const [shuffle, setShuffle] = useState<boolean>(true);
  const [aiProctoring, setAiProctoring] = useState<boolean>(false);
  const [allowReview, setAllowReview] = useState<boolean>(true);
  const [classroomId, setClassroomId] = useState<string>("");
  const [scheduledStartTime, setScheduledStartTime] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setAllowReview(exam?.allowReview ?? true);
      setClassroomId(defaultClassroomId || "");
      // Fetch teacher classrooms
      setIsLoadingClassrooms(true);
      fetch("http://localhost:8088/api/classrooms/teacher", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then((data) => setClassrooms(data))
        .catch(() => toast.error("Không thể tải danh sách lớp học"))
        .finally(() => setIsLoadingClassrooms(false));
    }
  }, [isOpen, exam, defaultClassroomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam) return;

    setIsSubmitting(true);
    try {
      const payload = {
        duration: Number(duration) || 60,
        versionCount,
        shuffle,
        aiProctoring,
        allowReview,
        classroomId: classroomId || null,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime).getTime() : null,
      };

      const res = await fetch(`http://localhost:8088/api/exams/${exam.id}/clone-to-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedSession = await res.json();
        toast.success("Tạo kỳ thi thực tế và giao bài thành công!");
        onClose();
        if (onSuccess) {
          onSuccess();
        }
        // Redirect to active exam room
        router.push(`/teacher/exam-room/${savedSession.id}`);
      } else {
        const errText = await res.text();
        toast.error(`Lỗi: ${errText || "Không thể giao bài"}`);
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !isOpen || !exam) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      aria-labelledby="slide-over-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-md">
            <form
              onSubmit={handleSubmit}
              className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-[#071829] shadow-2xl border-l border-slate-200 dark:border-cyan-900/40 animate-in slide-in-from-right duration-250"
            >
              {/* Header */}
              <div className="p-7 pb-6 border-b border-slate-100 dark:border-cyan-950/40">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cấu hình & Giao bài</span>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                      {exam.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-cyan-950/40 transition-all"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 p-7 space-y-6">
                {/* Duration */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                    Thời gian làm bài (Phút) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      value={duration}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDuration(val === "" ? "" : Number(val));
                      }}
                      placeholder="VD: 60"
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white dark:bg-[#0A1F3E] dark:border-cyan-950/40 focus:border-blue-200 outline-none transition-all font-semibold text-slate-700 dark:text-slate-300"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">MINS</span>
                  </div>
                </div>

                {/* Version Count */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                    Số lượng đề
                  </label>
                  <select
                    value={versionCount}
                    onChange={(e) => setVersionCount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white dark:bg-[#0A1F3E] dark:border-cyan-950/40 focus:border-blue-200 outline-none transition-all font-semibold text-slate-700 dark:text-slate-300"
                  >
                    <option value={1}>1 Đề</option>
                    <option value={2}>2 Đề (Xáo trộn)</option>
                    <option value={3}>3 Đề (Xáo trộn)</option>
                    <option value={4}>4 Đề (Xáo trộn)</option>
                  </select>
                </div>

                {/* Scheduled Start Time */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                    Bắt đầu tự động (Tùy chọn)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledStartTime}
                    onChange={(e) => setScheduledStartTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white dark:bg-[#0A1F3E] dark:border-cyan-950/40 focus:border-blue-200 outline-none transition-all font-semibold text-slate-700 dark:text-slate-300"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Nếu để trống, kỳ thi sẽ ở trạng thái chờ kích hoạt thủ công.
                  </p>
                </div>

                {/* Classroom */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                    Giao cho lớp học (Tùy chọn)
                  </label>
                  <select
                    value={classroomId}
                    onChange={(e) => setClassroomId(e.target.value)}
                    disabled={isLoadingClassrooms || lockClassroom}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white dark:bg-[#0A1F3E] dark:border-cyan-950/40 focus:border-blue-200 outline-none transition-all font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50"
                  >
                    <option value="">-- Không giao lớp (Thi tự do) --</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Switches */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-cyan-950/40">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-cyan-950/20 rounded-2xl border border-slate-200/50 dark:border-cyan-950/30">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400">shuffle</span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Xáo trộn câu hỏi</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shuffle}
                        onChange={(e) => setShuffle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-[#0A1F3E] after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-cyan-950/20 rounded-2xl border border-slate-200/50 dark:border-cyan-950/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400">visibility</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">AI Proctoring</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiProctoring}
                          onChange={(e) => setAiProctoring(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-[#0A1F3E] after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                      Bật giám sát AI phát hiện chuyển tab hoặc rời camera trong quá trình thi.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-cyan-950/20 rounded-2xl border border-slate-200/50 dark:border-cyan-950/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400">fact_check</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cho phép xem đáp án</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowReview}
                          onChange={(e) => setAllowReview(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-[#0A1F3E] after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                      Tắt tùy chọn này để học sinh chỉ xem điểm tổng quan sau khi nộp bài.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-7 border-t border-slate-100 dark:border-cyan-950/40 bg-slate-50/50 dark:bg-[#071829] flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-100 dark:bg-cyan-950/30 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white text-xs font-black rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Giao bài ngay"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
