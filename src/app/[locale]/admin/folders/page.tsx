"use client";
import { useState } from "react";
import useSWR from "swr";
import { authFetcher } from "@/hooks/useAuthFetch";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { ALL_SUBJECTS, GRADES } from "@/lib/curriculum";

interface Folder {
  id: string;
  name: string;
  description: string;
  grade: string;
  subject: string;
  createdAt: string;
}

interface FolderForm {
  name: string;
  description: string;
  grade: string;
  subject: string;
}

const EMPTY_FORM: FolderForm = { name: "", description: "", grade: "", subject: "" };

export default function AdminFoldersPage() {
  const { data: folders = [], isLoading, mutate } = useSWR<Folder[]>(
    `${API_BASE}/exam-bank/teacher/ADMIN/folders`,
    authFetcher,
    { revalidateOnFocus: false }
  );

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FolderForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("Tất cả");
  const [filterGrade, setFilterGrade] = useState("Tất cả");

  const filtered = folders.filter((f) => {
    const matchSearch = f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = filterSubject === "Tất cả" || f.subject === filterSubject;
    const matchGrade = filterGrade === "Tất cả" || f.grade === filterGrade;
    return matchSearch && matchSubject && matchGrade;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (folder: Folder) => {
    setEditingId(folder.id);
    setForm({
      name: folder.name,
      description: folder.description || "",
      grade: folder.grade || "",
      subject: folder.subject || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert("Tên chuyên đề không được để trống.");
    setSaving(true);
    try {
      const url = editingId
        ? `${API_BASE}/exam-bank/folders/${editingId}`
        : `${API_BASE}/exam-bank/folders`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(form),
      });
      if (res.ok) {
        mutate();
        setShowModal(false);
      } else {
        const err = await res.text();
        alert(`Lỗi: ${err}`);
      }
    } catch {
      alert("Lỗi kết nối máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xác nhận xóa chuyên đề "${name}"?\nTất cả đề thi trong chuyên đề sẽ không bị xóa nhưng sẽ không thuộc chuyên đề nào.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/exam-bank/folders/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) mutate();
      else alert("Lỗi khi xóa chuyên đề.");
    } catch {
      alert("Lỗi kết nối.");
    } finally {
      setDeletingId(null);
    }
  };

  // Group folders by subject for display
  const uniqueSubjects = Array.from(new Set(folders.map((f) => f.subject).filter(Boolean)));
  const uniqueGrades = Array.from(new Set(folders.map((f) => f.grade).filter(Boolean)));

  return (
    <main className="p-8 space-y-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <ScrollReveal variant="fade-up" duration={600}>
        <section className="bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] p-8 rounded-[2rem] shadow-lg relative overflow-hidden text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-4xl text-white">folder_special</span>
            </div>
            <h1 className="font-headline font-extrabold text-4xl text-white tracking-tight mb-2">
              Quản lý Chuyên đề
            </h1>
            <p className="text-white/80 max-w-lg leading-relaxed">
              Tạo và quản lý các chuyên đề (folder) trong Ngân hàng đề thi. Giáo viên sẽ chọn chuyên đề khi tạo đề luyện tập.
            </p>
          </div>
          <div className="relative z-10 flex-shrink-0">
            <button
              onClick={openCreate}
              className="px-6 py-3 bg-white text-[#0C2E5E] font-extrabold rounded-xl text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">add_circle</span>
              Tạo chuyên đề mới
            </button>
          </div>
        </section>
      </ScrollReveal>

      {/* Stats */}
      <ScrollReveal variant="fade-up" duration={600} delay={60}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Tổng chuyên đề", value: folders.length, icon: "folder_special", color: "from-blue-500 to-cyan-500" },
            { label: "Môn học", value: uniqueSubjects.length, icon: "category", color: "from-emerald-500 to-teal-500" },
            { label: "Khối lớp", value: uniqueGrades.length, icon: "school", color: "from-amber-500 to-orange-500" },
            { label: "Đang lọc", value: filtered.length, icon: "filter_list", color: "from-rose-500 to-pink-500" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-[#0A1F3E]/80 border border-slate-200/60 dark:border-cyan-950/40 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                <span className="material-symbols-outlined text-white text-xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-black text-on-surface dark:text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Filters */}
      <ScrollReveal variant="fade-up" duration={600} delay={100}>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 min-w-0">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input
              type="text"
              placeholder="Tìm chuyên đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-[#0A1F3E]/60 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none text-sm font-medium text-on-surface dark:text-slate-200 transition-all"
            />
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 text-lg">category</span>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white dark:bg-[#0A1F3E]/60 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer transition-all"
            >
              <option value="Tất cả">Tất cả môn</option>
              {uniqueSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 text-lg">school</span>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white dark:bg-[#0A1F3E]/60 border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer transition-all"
            >
              <option value="Tất cả">Tất cả lớp</option>
              {uniqueGrades.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
          </div>
        </div>
      </ScrollReveal>

      {/* Folder Grid */}
      <ScrollReveal variant="fade-up" duration={600} delay={150}>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-36 bg-white dark:bg-[#0A1F3E]/60 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center bg-white dark:bg-[#0A1F3E]/40 border border-dashed border-slate-200 dark:border-cyan-950/60 rounded-3xl">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-4 block">folder_off</span>
            <p className="font-bold text-slate-500 dark:text-slate-400 mb-2">
              {searchTerm || filterSubject !== "Tất cả" || filterGrade !== "Tất cả"
                ? "Không tìm thấy chuyên đề phù hợp"
                : "Chưa có chuyên đề nào"}
            </p>
            {!searchTerm && filterSubject === "Tất cả" && filterGrade === "Tất cả" && (
              <button
                onClick={openCreate}
                className="mt-4 px-5 py-2.5 bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Tạo chuyên đề đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((folder) => (
              <div
                key={folder.id}
                className="group bg-white dark:bg-[#0A1F3E]/80 rounded-2xl border border-slate-200/60 dark:border-cyan-950/40 p-5 shadow-sm hover:shadow-md transition-all hover:border-[#00C6FF]/30 dark:hover:border-[#00C6FF]/20 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>folder_special</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(folder)}
                      title="Sửa chuyên đề"
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(folder.id, folder.name)}
                      disabled={deletingId === folder.id}
                      title="Xóa chuyên đề"
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all disabled:opacity-40"
                    >
                      <span className={`material-symbols-outlined text-[18px] ${deletingId === folder.id ? "animate-spin" : ""}`}>
                        {deletingId === folder.id ? "refresh" : "delete"}
                      </span>
                    </button>
                  </div>
                </div>

                <h3 className="font-extrabold text-on-surface dark:text-slate-100 text-sm leading-snug mb-1.5 line-clamp-2">
                  {folder.name}
                </h3>
                {folder.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {folder.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {folder.grade && (
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-lg">
                      {folder.grade}
                    </span>
                  )}
                  {folder.subject && (
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg">
                      {folder.subject}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollReveal>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0A1F3E] rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200/60 dark:border-cyan-950/40">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200/60 dark:border-cyan-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0C2E5E] to-[#00C6FF] flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-white text-xl">{editingId ? "edit" : "add"}</span>
                </div>
                <h2 className="text-lg font-extrabold text-on-surface dark:text-slate-100">
                  {editingId ? "Sửa chuyên đề" : "Tạo chuyên đề mới"}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-cyan-950/40 transition-all"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Tên chuyên đề */}
              <div>
                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Tên chuyên đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Toán học - Lớp 12 - Giải tích"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#051329] border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none text-sm font-medium text-on-surface dark:text-slate-200 transition-all"
                />
              </div>

              {/* Môn học & Khối lớp */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Môn học
                  </label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#051329] border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none text-sm font-medium text-on-surface dark:text-slate-200 appearance-none transition-all"
                  >
                    <option value="">-- Chọn môn --</option>
                    {ALL_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Khối lớp
                  </label>
                  <select
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#051329] border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none text-sm font-medium text-on-surface dark:text-slate-200 appearance-none transition-all"
                  >
                    <option value="">-- Chọn lớp --</option>
                    {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Mô tả
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả ngắn về chuyên đề này..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#051329] border border-slate-200 dark:border-cyan-950/40 rounded-xl focus:ring-2 focus:ring-[#00C6FF]/30 outline-none text-sm font-medium text-on-surface dark:text-slate-200 resize-none transition-all"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-cyan-950/30 hover:bg-slate-200 dark:hover:bg-cyan-950/50 font-bold text-sm rounded-xl transition-all"
              >
                Huỷ
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-[#0C2E5E] to-[#0E3E7A] text-white font-extrabold text-sm rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <><span className="material-symbols-outlined text-lg animate-spin">refresh</span> Đang lưu...</>
                ) : (
                  <><span className="material-symbols-outlined text-lg">save</span> {editingId ? "Lưu thay đổi" : "Tạo chuyên đề"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
