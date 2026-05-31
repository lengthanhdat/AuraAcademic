"use client";
import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { API_BASE } from "@/lib/api";

interface Exam {
  id: string;
  title: string;
  subject: string;
  duration: number;
}

interface PublishToBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PublishToBankModal({ isOpen, onClose, onSuccess }: PublishToBankModalProps) {
  const locale = useLocale();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExams, setSelectedExams] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchMyExams();
      setSelectedExams(new Set());
      setError("");
    }
  }, [isOpen]);

  const fetchMyExams = async () => {
    setLoading(true);
    setError("");
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("accessToken");
      if (!user.id || !token) {
        setError("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        return;
      }
      const res = await fetch(`${API_BASE}/exams/teacher/${user.id}/templates`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Lọc các đề thi mẫu chưa được công khai vào ngân hàng (isPractice và isBankItem đều false)
        const unshared = (data || []).filter((exam: any) => !exam.isPractice && !exam.isBankItem);
        setExams(unshared);
      } else {
        setError(`Không thể tải dữ liệu từ máy chủ (Mã lỗi: ${res.status})`);
      }
    } catch (err: any) {
      console.error(err);
      setError(`Lỗi kết nối: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedExams);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedExams(next);
  };

  const handlePublish = async () => {
    if (selectedExams.size === 0) return;
    setPublishing(true);
    setError("");
    try {
      const token = localStorage.getItem("accessToken");
      const promises = Array.from(selectedExams).map(id =>
        fetch(`${API_BASE}/exams/${id}/publish-to-bank`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        })
      );
      await Promise.all(promises);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError("Đã xảy ra lỗi khi công khai đề thi. Vui lòng thử lại.");
    } finally {
      setPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Thêm vào Ngân hàng đề thi</h2>
            <p className="text-slate-500 text-sm mt-0.5">Chọn các đề thi bạn đã thiết kế để công khai cho học sinh ôn tập</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200 flex items-center gap-2">
              <span className="material-symbols-outlined">error</span> {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <svg className="animate-spin h-8 w-8 mb-4 text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <p className="font-medium">Đang tải danh sách đề thi...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-slate-400">inbox</span>
              </div>
              <p className="font-bold text-slate-700">Chưa có đề thi nào</p>
              <p className="text-sm">Bạn cần tạo đề thi trong phần &quot;Thiết kế đề thi&quot; trước.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exams.map(exam => (
                <div 
                  key={exam.id} 
                  onClick={() => toggleSelect(exam.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedExams.has(exam.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'}`}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedExams.has(exam.id)}
                    onChange={() => {}}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                  <div>
                    <h3 className={`font-bold ${selectedExams.has(exam.id) ? 'text-blue-800' : 'text-slate-800'}`}>{exam.title}</h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">book</span> {exam.subject || 'Không có môn học'}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">timer</span> {exam.duration} phút</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-500">
            Đã chọn <span className="text-blue-600 text-base">{selectedExams.size}</span> đề thi
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm">Hủy</button>
            <button 
              onClick={handlePublish}
              disabled={selectedExams.size === 0 || publishing}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center gap-2"
            >
              {publishing ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Đang xử lý...</>
              ) : (
                <><span className="material-symbols-outlined text-sm">public</span> Công khai vào Ngân hàng</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
