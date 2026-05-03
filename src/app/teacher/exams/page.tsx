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

  // 1. Khôi phục dữ liệu từ LocalStorage khi trang tải lại
  useEffect(() => {
    const savedData = localStorage.getItem("exam_builder_state");
    if (savedData) {
      try {
        const { step: savedStep, title, duration, questionCount, questions, versionCount, extractedText: savedText } = JSON.parse(savedData);
        if (savedStep) setStep(savedStep === "generating" ? "upload" : savedStep);
        if (title) setTitle(title);
        if (duration) setDuration(duration);
        if (questionCount) setQuestionCount(questionCount);
        if (questions) setQuestions(questions);
        if (versionCount) setVersionCount(versionCount);
        if (savedText) setExtractedText(savedText);
        // Khôi phục ảnh - lưu trong sessionStorage (nhanh hơn, không giới hạn như localStorage)
        const savedImages = sessionStorage.getItem("exam_extracted_images");
        if (savedImages) setExtractedImages(JSON.parse(savedImages));
      } catch (e) {
        console.error("Lỗi khôi phục dữ liệu:", e);
      }
    }
  }, []);

  // 2. Tự động lưu dữ liệu vào LocalStorage khi có thay đổi
  useEffect(() => {
    if ((step !== "upload" && step !== "generating") || (questions || []).length > 0) {
      const stateToSave = { step, title, duration, questionCount, questions, versionCount, extractedText };
      localStorage.setItem("exam_builder_state", JSON.stringify(stateToSave));
    }
  }, [step, title, duration, questionCount, questions, versionCount, extractedText]);

  // Tách riêng việc lưu ảnh vào sessionStorage
  useEffect(() => {
    if (extractedImages.length > 0) {
      sessionStorage.setItem("exam_extracted_images", JSON.stringify(extractedImages));
    }
  }, [extractedImages]);

  // Hàm xóa dữ liệu sau khi lưu thành công
  const clearPersistedState = () => {
    localStorage.removeItem("exam_builder_state");
  };

  const PHASE_LOGS = [
    { text: "Đang tải tài liệu lên máy chủ...",        progress: 10 },
    { text: "Trích xuất nội dung văn bản...",           progress: 25 },
    { text: "AI đang đọc và hiểu tài liệu...",         progress: 45 },
    { text: "Đang tạo câu hỏi thông minh...",          progress: 65 },
    { text: "Kiểm tra chất lượng câu hỏi...",          progress: 80 },
    { text: "Hoàn thiện bộ đề thi...",                 progress: 92 },
  ];

  // Dọn dẹp polling interval khi component unmount
  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const handleGenerate = async () => {
    if (!file)        { setError("Vui lòng chọn file tài liệu."); return; }
    if (!title.trim()) { setError("Vui lòng nhập tên kỳ thi.");  return; }
    setError("");
    setGenProgress(0);
    setStep("generating");

    // ── Bước 1: Upload file → nhận jobId ngay lập tức ──────────────
    let jobId: string;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("questionCount", String(questionCount));

      const uploadRes = await fetch("http://localhost:8088/api/ai/generate-questions", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Không thể gửi file lên máy chủ.");
      }
      jobId = uploadData.jobId;
      setGenProgress(15);
      setGenLog("Tài liệu đã tải lên. AI đang xử lý...");
    } catch (e: any) {
      toast.error("Không thể kết nối máy chủ", {
        description: e.message || "Hãy kiểm tra backend có đang chạy không.",
      });
      setStep("upload");
      return;
    }

    // ── Bước 2: Polling GET /api/ai/jobs/{jobId} mỗi 2.5 giây ─────
    let phaseIdx = 1;
    let pollCount = 0;
    const MAX_POLLS = 240; // 240 × 2.5s = 10 phút tối đa

    pollingRef.current = setInterval(async () => {
      pollCount++;

      // Cập nhật log & progress bar theo pha
      const phase = PHASE_LOGS[Math.min(phaseIdx, PHASE_LOGS.length - 1)];
      setGenLog(phase.text);
      setGenProgress(Math.min(phase.progress + pollCount, 92));
      if (pollCount % 3 === 0) phaseIdx = Math.min(phaseIdx + 1, PHASE_LOGS.length - 1);

      // Timeout guard
      if (pollCount > MAX_POLLS) {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        toast.error("Hết thời gian xử lý (10 phút)", {
          description: "AI mất quá nhiều thời gian. Hãy thử lại với tệp nhỏ hơn hoặc ít câu hỏi hơn.",
          duration: 8000,
        });
        setStep("upload");
        return;
      }

      try {
        const pollRes = await fetch(`http://localhost:8088/api/ai/jobs/${jobId}`);
        if (!pollRes.ok) return; // Tạm thời bỏ qua lỗi mạng nhất thời

        const job = await pollRes.json();

        if (job.status === "DONE") {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setGenProgress(100);
          setQuestions(job.questions || []);
          setExtractedText(job.extractedText || "");
          const imgs = job.extractedImages || [];
          setExtractedImages(imgs);
          sessionStorage.setItem("exam_extracted_images", JSON.stringify(imgs));
          toast.success(`Tạo thành công ${(job.questions || []).length} câu hỏi!`);
          setStep("review");
        } else if (job.status === "FAILED") {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          const errMsg = job.errorMessage || "AI không thể xử lý tài liệu này.";
          toast.error("AI xử lý thất bại", {
            description: errMsg,
            duration: 8000,
          });
          setStep("upload");
        }
        // status === "PROCESSING" → tiếp tục polling
      } catch {
        // Lỗi mạng tạm thời — tiếp tục polling, không dừng
      }
    }, 2500);
  };

  const handleShuffle = () => {
    setQuestions(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const updateQuestion = (idx: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, text } : q));
  };

  const updateOption = (qIdx: number, oIdx: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => i === qIdx
      ? { ...q, options: q.options.map((o, j) => j === oIdx ? { ...o, text } : o) }
      : q));
  };

  const setCorrect = (qIdx: number, oId: string) => {
    setQuestions(prev => prev.map((q, i) => i === qIdx
      ? { ...q, options: q.options.map(o => ({ ...o, isCorrect: o.id === oId })) }
      : q));
  };

  const deleteQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const addManualQuestion = () => {
    const newQ: Question = {
      id: Date.now().toString(),
      type: "Trắc nghiệm",
      text: "Nhập nội dung câu hỏi mới tại đây...",
      options: [
        { id: "a", text: "Đáp án A", isCorrect: true },
        { id: "b", text: "Đáp án B", isCorrect: false },
        { id: "c", text: "Đáp án C", isCorrect: false },
        { id: "d", text: "Đáp án D", isCorrect: false },
      ]
    };
    setQuestions(prev => [...prev, newQ]);
    // Scroll xuống cuối
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleAIChat = async () => {
    if (!aiCommand.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch("http://localhost:8088/api/ai/chat-refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: aiCommand,
          documentText: extractedText,
          images: extractedImages  // Gửi kèm ảnh để AI nhìn thấy bảng/hình trong file
        })
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        // GHÉP vào cuối danh sách hiện có (không thay thế)
        setQuestions(prev => [...prev, ...data.questions]);
        setAiCommand("");
        alert(`✅ Đã thêm thành công ${data.questions.length} câu hỏi vào đề thi!`);
      } else {
        alert("AI không tạo được câu hỏi nào. Hãy mô tả cụ thể hơn nội dung câu hỏi bạn muốn.");
      }
    } catch (e) {
      alert("Lỗi khi kết nối với trợ lý AI");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSave = async (status: string) => {
    setIsSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      // Tạo các mã đề tự động
      const versions = [];
      const codes = ["101", "202", "303", "404", "505", "606", "707", "808"];
      
      for (let i = 0; i < versionCount; i++) {
        // Xáo trộn câu hỏi cho từng mã đề
        const shuffledQuestions = [...(questions || [])].sort(() => Math.random() - 0.5).map(q => ({
          ...q,
          // Xáo trộn luôn cả các lựa chọn (options) trong từng câu
          options: [...(q.options || [])].sort(() => Math.random() - 0.5)
        }));
        
        versions.push({
          versionCode: codes[i] || `MĐ${100 + i}`,
          questions: shuffledQuestions
        });
      }

      const res = await fetch("http://localhost:8088/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          duration, 
          shuffle, 
          aiProctoring, 
          teacherId: user.id, 
          status, 
          versions, // Gửi danh sách mã đề thay vì list câu hỏi đơn lẻ
          extractedImages
        }),
      });

      if (res.ok) {
        const savedExam = await res.json();
        clearPersistedState();
        if (status === "WAITING") {
          // Redirect đến trang quản lý phòng thi
          router.push(`/teacher/exam-room/${savedExam.id}`);
        } else {
          router.push("/teacher/dashboard");
        }
      } else {
        const d = await res.json();
        alert("Lỗi: " + (d.error || "Không thể lưu"));
      }
    } catch { alert("Không thể kết nối máy chủ."); }
    finally { setIsSaving(false); }
  };

  const renderContentWithImages = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[IMG_\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[IMG_(\d+)\]/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (extractedImages[idx]) {
          return (
            <img 
              key={i} 
              src={`data:image/jpeg;base64,${extractedImages[idx]}`} 
              alt={`Hình ảnh ${idx}`} 
              className="max-w-full h-auto max-h-80 my-3 rounded-lg border border-slate-200 mx-auto shadow-sm object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          );
        }
        return null;
      }
      if (!part.trim()) return null;
      return (
        <ReactMarkdown 
          key={i} 
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({node, ...props}) => <div className="overflow-x-auto my-3"><table className="border-collapse w-full text-sm" {...props} /></div>,
            th: ({node, ...props}) => <th className="border border-slate-300 bg-blue-50 px-3 py-2 text-left font-bold text-slate-700" {...props} />,
            td: ({node, ...props}) => <td className="border border-slate-300 px-3 py-2 text-slate-600" {...props} />,
            p: ({node, ...props}) => <p className="my-1 leading-relaxed" {...props} />
          }}
        >
          {part}
        </ReactMarkdown>
      );
    });
  };

  if (step === "generating") return (
    <main className="flex-1 flex items-center justify-center bg-[#f7f9fb]">
      <div className="text-center space-y-6 max-w-sm w-full px-6">
        {/* Animated icon */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00355f] to-[#0f4c81] animate-pulse opacity-20" />
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00355f] to-[#0f4c81] flex items-center justify-center shadow-xl shadow-blue-900/20">
            <span className="material-symbols-outlined text-white text-5xl" style={{fontVariationSettings:"'FILL' 1"}}>auto_awesome</span>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-blue-900 mb-1">AI đang phân tích tài liệu</h2>
          <p className="text-sm text-slate-500">Vui lòng không đóng trang này</p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-[#00355f] to-[#0f4c81] transition-all duration-700 ease-out"
            style={{ width: `${genProgress}%` }}
          />
        </div>

        {/* Phase log */}
        <p className="text-sm font-medium text-slate-600 min-h-[20px] animate-pulse">{genLog}</p>

        {/* Dots */}
        <div className="flex justify-center gap-1.5">
          {[0,1,2,3].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-[#00355f] animate-bounce" style={{animationDelay:`${i*150}ms`}} />
          ))}
        </div>

        <p className="text-xs text-slate-400">Đang tạo {questionCount} câu hỏi · Có thể mất 30–60 giây</p>
      </div>
    </main>
  );

  if (step === "preview") return (
    <main className="flex-1 overflow-y-auto bg-[#f7f9fb] p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Xem trước đề thi (Góc nhìn học sinh)</p>
            <h2 className="text-2xl font-black text-blue-900">{title}</h2>
            <p className="text-sm text-slate-500 mt-1">Thời gian: {duration} phút · {(questions || []).length} câu hỏi</p>
          </div>
          <button onClick={() => setStep("review")} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-blue-900 font-bold text-sm hover:bg-slate-50">
            ← Quay lại chỉnh sửa
          </button>
        </div>
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Câu {idx + 1}</p>
              <div className="text-base font-semibold text-slate-800 mb-3 max-w-none">
                {renderContentWithImages(q.text)}
              </div>
              {q.imageUrl && (
                <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={q.imageUrl} alt={`Hình minh họa câu ${idx + 1}`} className="max-w-full max-h-64 object-contain mx-auto block p-2" />
                </div>
              )}
              <div className="grid grid-cols-1 gap-2">
                {(q.options || []).map(opt => (
                  <label key={opt.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 cursor-pointer border border-transparent hover:border-blue-200 transition-all">
                    <input type="radio" name={`prev-q${idx}`} className="text-[#00355f]" />
                    <span className="text-sm text-slate-700">{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );

  if (step === "review") return (
    <main className="flex-1 flex overflow-hidden h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f7f9fb]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Xem lại & Chỉnh sửa</p>
            <h2 className="text-2xl font-black text-blue-900">AI đã tạo {(questions || []).length} câu hỏi</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={handleShuffle} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50">
              <span className="material-symbols-outlined text-sm">shuffle</span> Xáo trộn
            </button>
            <button onClick={() => setStep("preview")} className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 font-bold text-sm hover:bg-blue-100">
              <span className="material-symbols-outlined text-sm">visibility</span> Xem trước
            </button>
          </div>
        </div>

        {questions.map((q, qIdx) => (
          <div key={q.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-start gap-4">
              <span className="text-[10px] font-black px-2 py-1 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider shrink-0 mt-1">Câu {qIdx + 1}</span>
              <div className="flex-1">
                  {/* Xem nội dung dưới dạng Markdown để bảng hiển thị đẹp */}
                  <div className="text-base font-medium text-slate-800 max-w-none mb-2">
                    {renderContentWithImages(q.text)}
                  </div>
                  {/* Textarea ẩn để vẫn chỉnh sửa được nội dung */}
                  <details className="mt-1">
                    <summary className="text-xs text-blue-500 cursor-pointer hover:underline">✏️ Chỉnh sửa nội dung câu hỏi</summary>
                    <textarea
                      className="w-full mt-2 text-sm text-slate-700 border border-slate-200 rounded-lg p-2 resize-none outline-none bg-slate-50 focus:ring-2 focus:ring-blue-200 leading-relaxed font-mono"
                      rows={5}
                      value={q.text}
                      onChange={e => updateQuestion(qIdx, e.target.value)}
                    />
                  </details>
                {q.imageUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={q.imageUrl} alt={`Hình minh họa câu ${qIdx + 1}`} className="max-w-full max-h-48 object-contain mx-auto block p-2" />
                  </div>
                )}
              </div>
              <button onClick={() => deleteQuestion(qIdx)} className="text-slate-300 hover:text-red-500 p-1 transition-colors shrink-0">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(q.options || []).map((opt, oIdx) => (
                <div 
                  key={opt.id} 
                  onClick={() => setCorrect(qIdx, opt.id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    opt.isCorrect 
                    ? 'bg-green-50 border-green-500 shadow-sm' 
                    : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    opt.isCorrect ? 'border-green-600 bg-green-600' : 'border-slate-300'
                  }`}>
                    {opt.isCorrect && <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>}
                  </div>
                  <input
                    type="text"
                    value={opt.text}
                    onClick={(e) => e.stopPropagation()} // Ngăn việc nhấn vào input làm đổi đáp án đúng
                    onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                    className={`flex-1 text-sm bg-transparent border-none outline-none focus:ring-0 ${
                      opt.isCorrect ? 'font-bold text-green-900' : 'text-slate-700'
                    }`}
                  />
                  {opt.isCorrect && <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Đúng</span>}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Action Buttons & AI Chat */}
        <div className="space-y-6 pt-4">
          <div className="flex gap-4">
            <button 
              onClick={addManualQuestion}
              className="flex-1 py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Thêm câu hỏi thủ công
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-200 bg-gradient-to-br from-white to-blue-50/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-blue-600 animate-pulse">auto_awesome</span>
              <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest">Trợ lý AI (Chỉnh sửa thông minh)</h4>
            </div>
            <div className="relative">
              <textarea 
                value={aiCommand}
                onChange={e => setAiCommand(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAIChat(); } }}
                placeholder="VD: Thêm câu hỏi số 12 trong file tôi đã gửi... hoặc: Tạo thêm 2 câu về chủ đề Di truyền học..."
                className="w-full p-4 pr-12 rounded-xl border border-blue-100 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none text-sm min-h-[90px]"
              />
              <button 
                onClick={handleAIChat}
                disabled={isAiLoading || !aiCommand.trim()}
                className="absolute bottom-3 right-3 w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {isAiLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined">send</span>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">info</span>
              AI sẽ dựa trên nội dung tài liệu cũ và yêu cầu mới của bạn để cập nhật bộ đề.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-80 overflow-y-auto bg-white border-l border-slate-200 p-6 shrink-0 space-y-6">
        <h3 className="text-lg font-black text-blue-900">Tóm tắt & Lưu</h3>
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Tổng câu hỏi</span>
            <span className="font-bold text-blue-900">{(questions || []).length} câu</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Số mã đề</span>
            <div className="flex items-center gap-1">
              <input 
                type="number" 
                min="1" max="20"
                value={versionCount} 
                onChange={e => setVersionCount(Number(e.target.value) || 1)}
                className="w-14 text-right font-bold text-blue-900 bg-white border border-blue-200 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-blue-300 transition-all"
              />
              <span className="font-bold text-blue-900 text-xs">mã đề</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Thời gian</span>
            <div className="flex items-center gap-1">
              <input 
                type="number" 
                min="1" max="300"
                value={duration} 
                onChange={e => setDuration(Number(e.target.value) || 1)}
                className="w-14 text-right font-bold text-blue-900 bg-white border border-blue-200 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-blue-300 transition-all"
              />
              <span className="font-bold text-blue-900 text-xs">phút</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <button onClick={() => handleSave("WAITING")} disabled={isSaving} className="w-full py-3.5 rounded-xl bg-gradient-to-br from-[#00355f] to-[#0f4c81] text-white font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
            {isSaving ? "Đang tạo..." : "🚀 Tạo phòng thi"}
          </button>
          <button onClick={() => { handleSave("DRAFT"); clearPersistedState(); }} disabled={isSaving} className="w-full py-3 rounded-xl bg-white border border-slate-200 text-blue-900 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50">
            💾 Lưu bản nháp
          </button>
          <button onClick={() => { setStep("upload"); clearPersistedState(); }} className="w-full py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all">
            ← Tạo đề thi mới
          </button>
        </div>
      </div>
    </main>
  );

  // Step: Upload
  return (
    <main className="flex-1 overflow-y-auto bg-[#f7f9fb] p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Quản lý kỳ thi › AI Question Builder</p>
          <h2 className="text-3xl font-black text-blue-900">Tạo đề thi bằng AI</h2>
          <p className="text-slate-500 mt-1">Tải lên tài liệu và AI sẽ tự động tạo bộ câu hỏi kiểm tra phù hợp.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-red-500">error</span>
              <span>{error}</span>
            </div>
            {file && title.trim() && (
              <button
                onClick={handleGenerate}
                className="mt-1 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Thử lại ngay
              </button>
            )}
          </div>
        )}

        {/* File Upload */}
        <div
          onClick={() => fileRef.current?.click()}
          className={`p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 bg-white hover:border-[#00355f] hover:bg-blue-50/30'}`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${file ? 'bg-green-100 text-green-600' : 'bg-[#00355f]/5 text-[#00355f]'}`}>
            <span className="material-symbols-outlined text-4xl" style={{fontVariationSettings:"'FILL' 1"}}>{file ? "check_circle" : "cloud_upload"}</span>
          </div>
          {file ? (
            <div className="text-center">
              <p className="font-bold text-green-700">{file.name}</p>
              <p className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · Nhấp để đổi file</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-bold text-blue-900">Kéo thả hoặc nhấp để tải tài liệu</p>
              <p className="text-sm text-slate-500 mt-1">Hỗ trợ PDF, DOCX, TXT · Tối đa 30MB</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
        </div>

        {/* Config */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
          <h3 className="font-black text-blue-900">Cấu hình đề thi</h3>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Tên kỳ thi</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Kiểm tra giữa kỳ - Lập trình Web" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm border border-slate-200 focus:ring-2 focus:ring-[#00355f]/20 outline-none" />
          </div>

          <div className="grid grid-cols-1">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Thời gian làm bài (phút)</label>
              <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm border border-slate-200 outline-none focus:ring-2 focus:ring-[#00355f]/20" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Số câu hỏi: <span className="text-[#00355f] text-base">{questionCount}</span></label>
            </div>
            <input type="range" min="5" max="50" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} className="w-full accent-[#00355f]" />
            <div className="flex justify-between text-xs text-slate-400 mt-1"><span>5 câu</span><span>50 câu</span></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Số lượng mã đề (Version): <span className="text-[#00355f] text-base">{versionCount}</span></label>
            </div>
            <input type="range" min="1" max="8" value={versionCount} onChange={e => setVersionCount(Number(e.target.value))} className="w-full accent-[#00355f]" />
            <div className="flex justify-between text-xs text-slate-400 mt-1"><span>1 mã đề</span><span>8 mã đề</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[{label:"Xáo trộn câu hỏi", icon:"shuffle", val:shuffle, set:setShuffle},
              {label:"AI Giám sát", icon:"visibility", val:aiProctoring, set:setAiProctoring}].map(({label,icon,val,set}) => (
              <div key={label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00355f] text-xl">{icon}</span>
                  <span className="text-sm font-bold text-blue-900">{label}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input checked={val} onChange={e => set(e.target.checked)} className="sr-only peer" type="checkbox" />
                  <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00355f]"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleGenerate} disabled={!file || !title.trim()} className="w-full py-4 rounded-2xl bg-gradient-to-br from-[#00355f] to-[#0f4c81] text-white font-black text-lg shadow-xl shadow-[#00355f]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings:"'FILL' 1"}}>auto_awesome</span>
          Tạo đề thi bằng AI
        </button>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-bold mb-1">💡 Gợi ý để tạo đề thi tốt nhất:</p>
          <ul className="space-y-1 text-amber-700 text-xs list-disc list-inside">
            <li>Tài liệu có nội dung rõ ràng, đầy đủ thông tin sẽ cho kết quả tốt hơn</li>
            <li>File PDF/DOCX có thể đọc được (không phải ảnh scan) cho kết quả chính xác nhất</li>
            <li>Sau khi AI tạo xong, bạn có thể chỉnh sửa từng câu hỏi và đáp án</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
