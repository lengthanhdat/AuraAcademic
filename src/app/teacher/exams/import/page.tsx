"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface ParsedOption {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

interface ParsedQuestion {
  id: string;
  text: string;
  imageBase64: string | null;
  options: ParsedOption[];
}

type Step = "upload" | "preview" | "create";

export default function ImportFromFile() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step state
  const [step, setStep] = useState<Step>("upload");

  // Upload state
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Questions state
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  // Exam creation state
  const [examTitle, setExamTitle] = useState("");
  const [duration, setDuration] = useState(45);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // ─── Upload ───────────────────────────────────────────────────────

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const processFile = (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".docx") && !name.endsWith(".pdf")) {
      setUploadError("Chỉ hỗ trợ file DOCX và PDF.");
      return;
    }
    setUploadError("");
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("http://localhost:8088/api/questions/extract", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Lỗi khi xử lý file");
        return;
      }
      const qs: ParsedQuestion[] = data.questions || [];
      setQuestions(qs);
      // Mac dinh chon tat ca
      setSelected(new Set(qs.map((q) => q.id)));
      setStep("preview");
    } catch {
      setUploadError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend.");
    } finally {
      setUploading(false);
    }
  };

  // ─── Question Editing ─────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(questions.map((q) => q.id)));
  const deselectAll = () => setSelected(new Set());

  const setCorrectAnswer = (qId: string, optId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.map((o) => ({ ...o, isCorrect: o.id === optId })) }
          : q
      )
    );
  };

  const updateQuestionText = (qId: string, text: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, text } : q)));
  };

  const updateOptionText = (qId: string, optId: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.map((o) => (o.id === optId ? { ...o, text } : o)) }
          : q
      )
    );
  };

  // ─── Create Exam ──────────────────────────────────────────────────

  const handleCreateExam = async () => {
    if (!examTitle.trim()) { setCreateError("Vui lòng nhập tên bài kiểm tra"); return; }
    const selectedQs = questions.filter((q) => selected.has(q.id));
    if (selectedQs.length === 0) { setCreateError("Vui lòng chọn ít nhất 1 câu hỏi"); return; }

    setCreating(true);
    setCreateError("");

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    try {
      // Chuyen doi ParsedQuestion sang format Exam cua he thong
      const formattedQuestions = selectedQs.map((q, idx) => ({
        id: String(idx + 1),
        type: "Trắc nghiệm",
        text: q.text,
        imageUrl: q.imageBase64 || null,
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      }));

      // Tao exam voi 1 version duy nhat chua tat ca cac cau da chon
      const examPayload = {
        title: examTitle.trim(),
        duration: duration,
        teacherId: user.id,
        teacherName: user.fullName,
        status: "DRAFT",
        versions: [
          {
            versionCode: "A",
            questions: formattedQuestions,
          },
        ],
        extractedImages: {},
      };

      const res = await fetch("http://localhost:8088/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examPayload),
      });

      if (res.ok) {
        router.push("/teacher/dashboard");
      } else {
        const err = await res.json();
        setCreateError(err.message || "Lỗi khi tạo bài kiểm tra");
      }
    } catch {
      setCreateError("Không thể kết nối đến máy chủ.");
    } finally {
      setCreating(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────

  const selectedCount = selected.size;
  const totalCount = questions.length;

  return (
    <main className="min-h-screen bg-[#f8fafc] p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push("/teacher/dashboard")} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Nhập Câu Hỏi Từ File</h1>
          <p className="text-slate-500 text-sm mt-0.5">Tải lên DOCX/PDF, hệ thống tự động trích xuất câu hỏi — không cần AI.</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0 mb-10 max-w-lg">
        {[
          { key: "upload", label: "1. Tải lên File" },
          { key: "preview", label: "2. Xem & Chọn" },
          { key: "create", label: "3. Tạo Đề Thi" },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${step === s.key ? "bg-blue-600 text-white shadow-md" : (["upload", "preview", "create"].indexOf(step) > i ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-400")}`}>
              {["upload", "preview", "create"].indexOf(step) > i
                ? <span className="material-symbols-outlined text-sm">check_circle</span>
                : null}
              {s.label}
            </div>
            {i < 2 && <div className="w-8 h-0.5 bg-slate-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: UPLOAD ─────────────────────────────────────────── */}
      {step === "upload" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${dragging ? "border-blue-500 bg-blue-50 scale-[1.01]" : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/50"}`}
          >
            <span className="material-symbols-outlined text-6xl text-slate-400 mb-4 block">upload_file</span>
            <p className="text-lg font-bold text-slate-700">Kéo thả hoặc nhấn để chọn file</p>
            <p className="text-slate-400 text-sm mt-2">Hỗ trợ: DOCX, PDF · Tối đa 30MB</p>
            <input ref={fileInputRef} type="file" accept=".docx,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
          </div>

          {selectedFile && (
            <div className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600">description</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => setSelectedFile(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}

          {uploadError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-200">
              {uploadError}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            <p className="font-bold mb-1">Định dạng câu hỏi được hỗ trợ:</p>
            <p className="font-mono text-xs leading-relaxed">
              Câu 1: Nội dung câu hỏi...<br/>
              A. Đáp án A&nbsp;&nbsp;B. Đáp án B&nbsp;&nbsp;C. Đáp án C&nbsp;&nbsp;D. Đáp án D<br/>
              <br/>
              Giáo viên có thể tô đậm đáp án đúng trong DOCX hoặc thêm dấu * cuối đáp án đúng.
            </p>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-3"
          >
            {uploading
              ? <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Đang phân tích file...</>
              : <><span className="material-symbols-outlined">auto_fix_high</span>Trích Xuất Câu Hỏi</>
            }
          </button>
        </div>
      )}

      {/* ── STEP 2: PREVIEW & SELECT ───────────────────────────────── */}
      {step === "preview" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-black text-slate-800 text-lg">Kết quả trích xuất: <span className="text-blue-600">{totalCount} câu hỏi</span></p>
              <p className="text-slate-400 text-sm">Đã chọn: <span className="text-green-600 font-bold">{selectedCount}</span> / {totalCount}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={selectAll} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all">Chọn Tất Cả</button>
              <button onClick={deselectAll} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all">Bỏ Chọn Hết</button>
              <button
                onClick={() => { if (selectedCount > 0) setStep("create"); }}
                disabled={selectedCount === 0}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                Tiếp Theo <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id} className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${selected.has(q.id) ? "border-blue-400" : "border-slate-200 opacity-60"}`}>
                <div className="p-5">
                  {/* Question header */}
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selected.has(q.id)}
                      onChange={() => toggleSelect(q.id)}
                      className="mt-1 w-5 h-5 accent-blue-600 cursor-pointer flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Câu {idx + 1}</span>
                        <button
                          onClick={() => setEditingId(editingId === q.id ? null : q.id)}
                          className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">{editingId === q.id ? "visibility" : "edit"}</span>
                          {editingId === q.id ? "Xem" : "Sửa"}
                        </button>
                      </div>

                      {/* Question text */}
                      {editingId === q.id ? (
                        <textarea
                          value={q.text}
                          onChange={(e) => updateQuestionText(q.id, e.target.value)}
                          className="w-full text-slate-800 font-semibold text-sm border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[80px]"
                        />
                      ) : (
                        <div className="text-slate-800 font-semibold text-sm">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg" {...props} /></div>,
                              thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
                              th: ({node, ...props}) => <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200" {...props} />,
                              td: ({node, ...props}) => <td className="px-4 py-2 text-sm text-slate-700 border-b border-slate-200 whitespace-nowrap" {...props} />,
                              p: ({node, ...props}) => <p className="whitespace-pre-wrap mb-2" {...props} />
                            }}
                          >
                            {q.text}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* Question image */}
                      {q.imageBase64 && (
                        <div className="mt-3">
                          <img src={q.imageBase64} alt="Hình ảnh câu hỏi" className="max-h-48 rounded-lg border border-slate-200 object-contain" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setCorrectAnswer(q.id, opt.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${opt.isCorrect ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${opt.isCorrect ? "bg-green-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                          {opt.label}
                        </div>
                        {editingId === q.id ? (
                          <input
                            value={opt.text}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateOptionText(q.id, opt.id, e.target.value)}
                            className="flex-1 text-sm bg-transparent border-none outline-none text-slate-700"
                            placeholder={`Đáp án ${opt.label}`}
                          />
                        ) : (
                          <div className={`text-sm flex-1 ${opt.isCorrect ? "text-green-700 font-bold" : "text-slate-700"}`}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                p: ({node, ...props}) => <span {...props} />
                              }}
                            >
                              {opt.text || "*Trống*"}
                            </ReactMarkdown>
                          </div>
                        )}
                        {opt.isCorrect && <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>}
                      </div>
                    ))}
                  </div>

                  {/* No correct answer warning */}
                  {!q.options.some(o => o.isCorrect) && (
                    <p className="text-xs text-amber-600 font-bold mt-3 pl-9 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      Chưa chọn đáp án đúng. Click vào đáp án để đánh dấu.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="sticky bottom-4 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 flex items-center justify-between">
            <p className="font-bold text-slate-600 text-sm">Đã chọn <span className="text-blue-600">{selectedCount}</span> câu hỏi</p>
            <div className="flex gap-3">
              <button onClick={() => { setStep("upload"); setQuestions([]); setSelected(new Set()); }} className="px-4 py-2 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100 transition-all">Quay Lại</button>
              <button
                onClick={() => { if (selectedCount > 0) setStep("create"); }}
                disabled={selectedCount === 0}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                Tiếp Theo ({selectedCount} câu) <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: CREATE EXAM ────────────────────────────────────── */}
      {step === "create" && (
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800">Tạo Đề Thi</h2>
              <p className="text-slate-400 text-sm mt-1">Đã chọn <span className="font-bold text-blue-600">{selectedCount}</span> câu hỏi từ file. Điền thông tin để hoàn tất.</p>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-200">{createError}</div>
            )}

            <div>
              <label className="text-sm font-bold text-slate-500 block mb-2">Ten Bai Kiem Tra *</label>
              <input
                value={examTitle}
                onChange={e => setExamTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
                placeholder="Vi du: Kiem Tra Hoc Ki 1 - Toan 10"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-500 block mb-2">Thoi Gian Lam Bai (phut)</label>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                min={5}
                max={180}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
              />
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Số câu hỏi:</span>
                <span className="font-bold text-blue-800">{selectedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Thời gian:</span>
                <span className="font-bold text-blue-800">{duration} phút</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Trạng thái:</span>
                <span className="font-bold text-slate-600">Bản Nháp (có thể chỉnh sửa sau)</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("preview")} className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">
                Quay Lại
              </button>
              <button
                onClick={handleCreateExam}
                disabled={creating}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {creating
                  ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Đang tạo...</>
                  : <><span className="material-symbols-outlined text-sm">save</span>Lưu Bài Kiểm Tra</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
