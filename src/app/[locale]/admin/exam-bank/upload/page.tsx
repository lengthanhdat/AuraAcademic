"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "@/navigation";
import { useLocale } from "next-intl";
import { ALL_SUBJECTS } from "@/lib/curriculum";
import { API_BASE } from "@/lib/api";

export default function ExamBankUploadPage() {
  const router = useRouter();
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [examTitle, setExamTitle] = useState("");
  const [duration, setDuration] = useState(45);
  const [subject, setSubject] = useState(ALL_SUBJECTS[0] || "Toán học");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // UI State
  const [dragging, setDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [progressMsg, setProgressMsg] = useState("");

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const processFile = (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".docx") && !name.endsWith(".pdf")) {
      setError("Chỉ hỗ trợ file DOCX và PDF.");
      return;
    }
    setError("");
    setSelectedFile(file);
  };

  const handleSmartImport = async () => {
    if (!selectedFile) {
      setError("Vui lòng chọn file đề thi (DOCX/PDF).");
      return;
    }
    if (!examTitle.trim()) {
      setError("Vui lòng nhập tên đề thi.");
      return;
    }

    setIsProcessing(true);
    setError("");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("accessToken");

    try {
      // BƯỚC 1: Gọi API trích xuất câu hỏi
      setProgressMsg("Đang dùng AI trích xuất câu hỏi từ file...");
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const extractRes = await fetch(`${API_BASE}/questions/extract`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      const extractData = await extractRes.json();
      
      if (!extractRes.ok) {
        throw new Error(extractData.error || "Lỗi khi phân tích file.");
      }

      const questions = extractData.questions || [];
      if (questions.length === 0) {
        throw new Error("Không tìm thấy câu hỏi nào trong file.");
      }

      // BƯỚC 2: Gom toàn bộ câu hỏi và Tạo Đề thi (Bỏ qua bước Review)
      setProgressMsg(`Đã trích xuất ${questions.length} câu. Đang lưu vào Ngân hàng...`);
      
      const formattedQuestions = questions.map((q: any, idx: number) => ({
        id: String(idx + 1),
        type: "Trắc nghiệm",
        text: q.text,
        imageUrl: q.imageBase64 || null,
        options: q.options.map((o: any) => ({
          id: o.id,
          text: o.text,
          isCorrect: false,
        })),
      }));

      const examPayload = {
        title: examTitle.trim(),
        duration: duration,
        teacherId: user.id,
        teacherName: user.fullName,
        status: "PUBLISHED", // Tự động công khai trong Ngân hàng
        versions: [{ versionCode: "A", questions: formattedQuestions }],
        extractedImages: [],
        folderId: null,
        subject: subject,
        isPractice: true, // Cờ Ngân hàng đề thi
        isBankItem: true, // Cờ Ngân hàng đề thi
      };

      const createRes = await fetch(`${API_BASE}/exams`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(examPayload),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.message || "Lỗi khi lưu đề thi vào Ngân hàng.");
      }

      // Thành công, điều hướng về trang Ngân hàng
      router.push(`/admin/exam-bank`);
      
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra trong quá trình xử lý.");
    } finally {
      setIsProcessing(false);
      setProgressMsg("");
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] p-8">
      {/* Nút quay lại */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push(`/admin/exam-bank`)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Thêm Đề Thi Siêu Tốc</h1>
          <p className="text-slate-500 text-sm mt-0.5">Upload file và lưu thẳng vào Ngân hàng đề thi trong 1 cú click.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Cột trái: Upload File */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 h-full flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">upload_file</span>
              File Đề Thi
            </h2>
            
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`flex-1 min-h-[250px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-all ${isProcessing ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-50" : dragging ? "border-blue-500 bg-blue-50 scale-[1.02] cursor-pointer" : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer"}`}
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-blue-600">cloud_upload</span>
              </div>
              <p className="text-lg font-bold text-slate-700 mb-2">Kéo thả hoặc nhấn để chọn file</p>
              <p className="text-slate-400 text-sm">Hỗ trợ định dạng DOCX, PDF (Tối đa 30MB)</p>
              <input ref={fileInputRef} type="file" accept=".docx,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} disabled={isProcessing} />
            </div>

            {selectedFile && (
              <div className="mt-4 flex items-center gap-4 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                <span className="material-symbols-outlined text-blue-500 text-3xl">description</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                {!isProcessing && (
                  <button onClick={() => setSelectedFile(null)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                )}
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-200 flex items-start gap-2">
                <span className="material-symbols-outlined text-red-500">error</span>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Thông tin đề thi */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500">tune</span>
              Cấu hình Ngân hàng
            </h2>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Tên Đề Thi <span className="text-red-500">*</span></label>
                <input
                  value={examTitle}
                  onChange={e => setExamTitle(e.target.value)}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold transition-all"
                  placeholder="Ví dụ: Đề thi thử THPT Môn Toán 2026"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Môn học</label>
                <div className="relative">
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold appearance-none transition-all cursor-pointer"
                  >
                    {ALL_SUBJECTS.map((sub: string) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Thời gian làm bài (Phút)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  disabled={isProcessing}
                  min={5}
                  max={180}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold transition-all"
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <button
                onClick={handleSmartImport}
                disabled={isProcessing || !selectedFile || !examTitle.trim()}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    <span>{progressMsg || "Đang xử lý..."}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">bolt</span>
                    Lưu vào Ngân hàng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
