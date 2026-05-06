"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

type Option = { id: string; text: string; isCorrect: boolean };
type Question = { id: string; type: string; text: string; imageUrl?: string; options: Option[] };

type Step = "upload" | "generating" | "review" | "preview";

export default function ExamBuilder() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60);
  const [questionCount, setQuestionCount] = useState(20);
  const [shuffle, setShuffle] = useState(true);
  const [aiProctoring, setAiProctoring] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [extractedText, setExtractedText] = useState("");
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [versionCount, setVersionCount] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiCommand, setAiCommand] = useState("");
  const [error, setError] = useState("");
  const [genLog, setGenLog] = useState("Đang phân tích tài liệu...");
  const [genProgress, setGenProgress] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Khôi phục dữ liệu từ LocalStorage
  useEffect(() => {
    const savedData = localStorage.getItem("exam_builder_state");
    if (savedData) {
      try {
        const { step: savedStep, title, duration, questionCount, questions, versionCount, extractedText: savedText } = JSON.parse(savedData);
        if (savedStep && savedStep !== "generating") setStep(savedStep);
        if (title) setTitle(title);
        if (duration) setDuration(duration);
        if (questionCount) setQuestionCount(questionCount);
        if (questions) setQuestions(questions);
        if (versionCount) setVersionCount(versionCount);
        if (savedText) setExtractedText(savedText);
        const savedImages = sessionStorage.getItem("exam_extracted_images");
        if (savedImages) setExtractedImages(JSON.parse(savedImages));
      } catch (e) {
        console.error("Lỗi khôi phục dữ liệu:", e);
      }
    }
  }, []);

  // 2. Tự động lưu dữ liệu
  useEffect(() => {
    if (step !== "generating") {
      const stateToSave = { step, title, duration, questionCount, questions, versionCount, extractedText };
      localStorage.setItem("exam_builder_state", JSON.stringify(stateToSave));
    }
  }, [step, title, duration, questionCount, questions, versionCount, extractedText]);

  const clearPersistedState = () => {
    localStorage.removeItem("exam_builder_state");
  };

  const handleGenerate = async () => {
    if (!file)        { toast.error("Vui lòng chọn file tài liệu."); return; }
    if (!title.trim()) { toast.error("Vui lòng nhập tên kỳ thi.");  return; }
    
    setGenProgress(0);
    setStep("generating");

    let jobId: string;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("questionCount", String(questionCount));

      const uploadRes = await fetch("http://localhost:8088/api/ai/generate-questions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Không thể gửi file.");
      
      jobId = uploadData.jobId;
      setGenProgress(15);
      setGenLog("Tài liệu đã tải lên. AI đang xử lý...");
    } catch (e: any) {
      toast.error(e.message || "Không thể kết nối máy chủ");
      setStep("upload");
      return;
    }

    pollingRef.current = setInterval(async () => {
      try {
        const pollRes = await fetch(`http://localhost:8088/api/ai/jobs/${jobId}`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
        });
        if (!pollRes.ok) return;
        const job = await pollRes.json();

        if (job.status === "DONE") {
          clearInterval(pollingRef.current!);
          setQuestions(job.questions || []);
          setExtractedText(job.extractedText || "");
          const imgs = job.extractedImages || [];
          setExtractedImages(imgs);
          sessionStorage.setItem("exam_extracted_images", JSON.stringify(imgs));
          toast.success("Tạo thành công bộ đề!");
          setStep("review");
        } else if (job.status === "FAILED") {
          clearInterval(pollingRef.current!);
          toast.error(job.errorMessage || "AI xử lý thất bại");
          setStep("upload");
        }
      } catch {}
    }, 2500);
  };

  const handleSave = async (status: string) => {
    setIsSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const versions = [];
      const codes = ["101", "202", "303", "404"];
      for (let i = 0; i < versionCount; i++) {
        versions.push({
          versionCode: codes[i] || `MĐ${100 + i}`,
          questions: [...questions].sort(() => Math.random() - 0.5)
        });
      }
      const res = await fetch("http://localhost:8088/api/exams", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({ 
          title, duration, shuffle, aiProctoring, 
          teacherId: user.id, teacherName: user.fullName,
          status, versions, extractedImages
        }),
      });
      if (res.ok) {
        clearPersistedState();
        router.push("/teacher/dashboard");
        toast.success(status === "WAITING" ? "Đã công bố kỳ thi!" : "Đã lưu bản nháp");
      }
    } catch { toast.error("Không thể kết nối máy chủ."); }
    finally { setIsSaving(false); }
  };

  const deleteQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const addManualQuestion = () => {
    const newQ: Question = {
      id: Date.now().toString(),
      type: "Trắc nghiệm",
      text: "Nhập nội dung câu hỏi mới...",
      options: [
        { id: "a", text: "Đáp án A", isCorrect: true },
        { id: "b", text: "Đáp án B", isCorrect: false },
        { id: "c", text: "Đáp án C", isCorrect: false },
        { id: "d", text: "Đáp án D", isCorrect: false },
      ]
    };
    setQuestions(prev => [...prev, newQ]);
  };

  if (step === "generating") return (
    <main className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-6 max-w-sm w-full">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-25" />
          <div className="w-20 h-20 rounded-full bg-blue-900 flex items-center justify-center shadow-xl">
            <span className="material-symbols-outlined text-white text-4xl animate-spin">sync</span>
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-800">AI đang phân tích tài liệu...</h2>
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${genProgress}%` }} />
        </div>
        <p className="text-xs text-slate-400">Vui lòng không đóng trình duyệt</p>
      </div>
    </main>
  );

  return (
    <main className="flex-1 flex overflow-hidden bg-[#F8FAFC]">
      {/* LEFT COLUMN: Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Breadcrumbs & Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              <span>QUẢN LÝ KỲ THI</span>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="text-blue-600">AI QUESTION BUILDER</span>
            </div>
            <h1 className="text-3xl font-black text-[#00355f] tracking-tight">Thiết lập câu hỏi AI</h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#4c2b00] text-[#FFD700] rounded-full text-xs font-bold shadow-sm border border-[#FFD700]/20">
            <span className="material-symbols-outlined text-[16px] animate-pulse">auto_awesome</span>
            AI đang hoạt động
          </div>
        </div>

        {/* Upload Area */}
        <div 
          onClick={() => fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer group ${
            file ? "border-blue-400 bg-blue-50/30" : "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/10"
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-3xl">cloud_upload</span>
          </div>
          <h3 className="text-lg font-bold text-slate-700">
            {file ? file.name : "Tải tài liệu để AI tự động tạo câu hỏi"}
          </h3>
          <p className="text-sm text-slate-400 mt-2">Hỗ trợ các định dạng PDF, Word, TXT (Tối đa 25MB)</p>
          <button className="mt-4 text-blue-600 font-bold text-sm hover:underline">Chọn tệp từ máy tính</button>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
          
          {file && !questions.length && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="w-64">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Số lượng câu hỏi muốn tạo</label>
                <input 
                  type="number" 
                  value={questionCount} 
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-center font-bold text-blue-900 outline-none"
                />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
                className="px-8 py-3 bg-blue-900 text-white rounded-xl font-bold text-sm shadow-xl hover:bg-blue-800 transition-all"
              >
                Bắt đầu tạo câu hỏi
              </button>
            </div>
          )}
        </div>

        {/* Question List Header */}
        {(questions.length > 0 || step === "review") && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">list_alt</span>
                <h2 className="text-xl font-black text-slate-800">Danh sách câu hỏi gợi ý</h2>
              </div>
              <button 
                onClick={addManualQuestion}
                className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                Thêm câu hỏi mới
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                        CÂU {String(idx + 1).padStart(2, '0')} - {q.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => deleteQuestion(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                      <button className="p-2 text-slate-300 cursor-grab">
                        <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-lg font-bold text-slate-800 mb-6 leading-tight">
                    {q.text}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt) => (
                      <div 
                        key={opt.id}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          opt.isCorrect ? "bg-blue-50 border-blue-500/50" : "bg-slate-50 border-transparent hover:border-slate-200"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          opt.isCorrect ? "bg-blue-900 border-blue-900" : "bg-white border-slate-300"
                        }`}>
                          {opt.isCorrect && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className={`text-sm font-medium ${opt.isCorrect ? "text-blue-900" : "text-slate-600"}`}>
                          {opt.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Sidebar */}
      <div className="w-80 bg-white border-l border-slate-200 p-8 overflow-y-auto space-y-8 shrink-0 shadow-2xl shadow-slate-200/50">
        <div>
          <h2 className="text-xl font-black text-slate-800 mb-6">Cấu hình kỳ thi</h2>
          
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">TÊN KỲ THI</label>
              <input 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                placeholder="Nhập tên kỳ thi..."
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-200 outline-none transition-all font-semibold text-slate-700"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">THỜI GIAN LÀM BÀI (PHÚT)</label>
              <div className="relative">
                <input 
                  type="number"
                  value={duration} 
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-200 outline-none transition-all font-bold text-slate-700"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">MINS</span>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-500 text-[20px]">shuffle</span>
                  <span className="text-sm font-bold text-slate-700">Xáo trộn đề</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input checked={shuffle} onChange={e => setShuffle(e.target.checked)} className="sr-only peer" type="checkbox" />
                  <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">visibility</span>
                    <span className="text-sm font-bold text-slate-700">AI Proctoring</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input checked={aiProctoring} onChange={e => setAiProctoring(e.target.checked)} className="sr-only peer" type="checkbox" />
                    <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Giám sát trình duyệt & phát hiện gian lận bằng AI trong suốt thời gian thi.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">TÓM TẮT</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Tổng số câu hỏi</span>
              <span className="font-bold text-blue-900">{questions.length} câu</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Độ khó trung bình</span>
              <span className="font-bold text-blue-900">Trung bình</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <button 
            onClick={() => handleSave("WAITING")}
            disabled={isSaving || !questions.length}
            className="w-full py-4 bg-blue-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-900/20 hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? "Đang xử lý..." : "Lưu & Công bố"}
          </button>
          <button 
            onClick={() => handleSave("DRAFT")}
            disabled={isSaving || !questions.length}
            className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Lưu bản nháp
          </button>
        </div>
      </div>

      {/* Floating AI Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={() => {}} 
          className="w-14 h-14 bg-blue-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-3xl">auto_awesome</span>
        </button>
      </div>
    </main>
  );
}
