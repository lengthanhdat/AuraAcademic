"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/components/ui/AlertProvider";
import { useTranslations } from "next-intl";

export default function StudentProfile() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const t = useTranslations('StudentProfile');
  const [user, setUser] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);

  // States cho form
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ 
    fullName: "", 
    studentId: "", 
    phoneNumber: "", 
    birthDate: "", 
    gender: "",
    title: "", // Dùng cho "Hệ đào tạo"
    department: "" // Dùng cho "Lớp"
  });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setForm({ 
        fullName: u.fullName || "", 
        studentId: u.studentId || "",
        phoneNumber: u.phoneNumber || "",
        birthDate: u.birthDate || "",
        gender: u.gender || "",
        title: u.title || "",
        department: u.department || ""
      });
      
      const token = localStorage.getItem("accessToken");
      
      // Fetch kết quả thi
      fetch(`http://localhost:8088/api/exams/results/student/${u.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setResults(data.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0)));
          }
        })
        .catch(err => console.error("Error fetching results:", err));
    }
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showAlert({
        title: t("alert_file_error"),
        message: t("avatar_type_error"),
        type: "error"
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showAlert({
        title: t("alert_file_size"),
        message: t("avatar_size_error"),
        type: "error"
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch("http://localhost:8088/api/users/me/avatar", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ avatarUrl: base64 })
        });

        if (res.ok) {
          const updatedUser = { ...user, avatarUrl: base64 };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
          window.dispatchEvent(new Event("user-updated"));
          showAlert({
            title: t("alert_success"),
            message: t("avatar_success"),
            type: "success"
          });
        } else {
          showAlert({
            title: t("alert_upload_error"),
            message: t("avatar_error"),
            type: "error"
          });
        }
      } catch {
        showAlert({
            title: t("alert_connect_error"),
            message: t("server_error"),
            type: "error"
          });
      }
    };
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:8088/api/users/me`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = { ...user, ...form };
        localStorage.setItem("user", JSON.stringify(updated));
        window.dispatchEvent(new Event("user-updated"));
        setUser(updated);
        showAlert({
          title: t("alert_success"),
          message: t("profile_success"),
          type: "success"
        });
        setIsEditing(false);
      } else {
        showAlert({
          title: t("alert_save_error"),
          message: t("profile_error"),
          type: "error"
        });
      }
    } catch {
      showAlert({
        title: t("alert_connect_error"),
        message: t("server_error"),
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: t('pw_mismatch') });
      return;
    }
    setChangingPw(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:8088/api/users/me/password`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      if (res.ok) {
        setPwMsg({ type: "success", text: t('pw_success') });
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setPwMsg({ type: "", text: "" }), 3000);
      } else {
        const data = await res.json();
        setPwMsg({ type: "error", text: data.error || t('pw_error') });
      }
    } catch {
      setPwMsg({ type: "error", text: t('pw_server_error') });
    } finally {
      setChangingPw(false);
    }
  };

  if (!user) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  const totalExams = results.length;
  const avgScore = totalExams > 0 
    ? (results.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalExams).toFixed(2)
    : "0.00";
  
  const getRank = (score: number) => {
    if (score >= 9.0) return t("rank_excellent");
    if (score >= 8.0) return t("rank_good");
    if (score >= 6.5) return t("rank_fair");
    if (score >= 5.0) return t("rank_average");
    return t("rank_fail");
  };
  
  const currentRank = totalExams > 0 ? getRank(parseFloat(avgScore)) : "--";

  const getAiInsight = () => {
    if (totalExams === 0) return t("ai_insight_new");
    const score = parseFloat(avgScore);
    if (score >= 8.0) return t("ai_insight_good", {score: avgScore});
    if (score >= 5.0) return t("ai_insight_ok", {score: avgScore});
    return t("ai_insight_low");
  };

  return (
    <div className="flex-1 p-8 max-w-[1400px] w-full mx-auto animate-in fade-in duration-500">
      
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-primary tracking-tight">{t('title')}</h2>
          <p className="text-on-surface-variant text-sm mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-primary">{user.fullName}</p>
            <p className="text-xs text-on-surface-variant">{t('role')}</p>
          </div>
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary text-white flex items-center justify-center font-bold">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.fullName?.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {/* Hero Card */}
        <section className="bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="relative group cursor-pointer">
            <div className="w-32 h-32 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold shadow-xl">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.fullName?.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute inset-0 bg-black/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 rounded-3xl flex items-center justify-center transition-all duration-300 cursor-pointer text-[10px] font-bold text-white flex-col gap-1">
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              Đổi ảnh
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-4xl font-extrabold text-primary mb-2">{user.fullName}</h3>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              {user.studentId && <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed-variant rounded-full text-xs font-bold uppercase tracking-wider">{user.studentId}</span>}
              {user.department && <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold uppercase tracking-wider">{user.department}</span>}
              {user.title && <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-bold uppercase tracking-wider">{user.title}</span>}
            </div>
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-3 bg-surface-container-high text-on-surface font-bold rounded-xl">{isEditing ? t('btn_close') : t('btn_edit')}</button>
        </section>

        {/* Edit Form */}
        {isEditing && (
          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-primary/10">
            <h4 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">{t('update_title')}</h4>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder={t('field_fullname')} required />
                <input value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder={t('field_student_id')} />
                <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder={t('field_class')} />
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder={t('field_program')} />
                <input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder={t('field_phone')} />
                <input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" />
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface">
                  <option value="">{t('field_gender_placeholder')}</option>
                  <option value="Nam">{t('gender_male')}</option>
                  <option value="Nữ">{t('gender_female')}</option>
                  <option value="Khác">{t('gender_other')}</option>
                </select>
              </div>
              <button type="submit" className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl">{saving ? t('btn_saving') : t('btn_save')}</button>
            </form>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
              <h4 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">{t('detail_title')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="text-[10px] uppercase font-bold text-on-surface-variant block">{t('detail_email')}</label><p className="font-medium">{user.email}</p></div>
                <div><label className="text-[10px] uppercase font-bold text-on-surface-variant block">{t('detail_phone')}</label><p className={user.phoneNumber ? "font-medium" : "italic text-slate-400"}>{user.phoneNumber || t('not_updated')}</p></div>
                <div><label className="text-[10px] uppercase font-bold text-on-surface-variant block">{t('detail_dob')}</label><p className={user.birthDate ? "font-medium" : "italic text-slate-400"}>{user.birthDate ? new Date(user.birthDate).toLocaleDateString("vi-VN") : t('not_updated')}</p></div>
                <div><label className="text-[10px] uppercase font-bold text-on-surface-variant block">{t('detail_gender')}</label><p className={user.gender ? "font-medium" : "italic text-slate-400"}>{user.gender || t('not_updated')}</p></div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
              <h4 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">{t('password_title')}</h4>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder={t('pw_current')} required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder={t('pw_new')} required />
                  <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder={t('pw_confirm')} required />
                </div>
                <button type="submit" className="w-full py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl">{changingPw ? t('btn_pw_processing') : t('btn_pw_update')}</button>
              </form>
            </div>
          </section>

          <section className="space-y-6">
            <div className="bg-surface-container-low rounded-xl p-6 shadow-sm border border-outline-variant/10">
              <h4 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">{t('summary_title')}</h4>
              <div className="space-y-4">
                <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between"><span className="text-xs text-on-surface-variant">{t('col_exam')}</span><span className="text-xl font-black text-primary">{totalExams}</span></div>
                <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between"><span className="text-xs text-on-surface-variant">{t('summary_avg')}</span><span className="text-xl font-black text-primary">{avgScore}</span></div>
                <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between"><span className="text-xs text-on-surface-variant">{t('summary_rank')}</span><span className="text-xl font-black text-primary">{currentRank}</span></div>
              </div>
              <div className="mt-6 p-4 rounded-xl bg-tertiary-container/10 border-l-4 border-on-tertiary-container">
                <p className="text-xs text-on-surface leading-relaxed">{getAiInsight()}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Results Table */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-surface-container"><h4 className="text-lg font-bold text-primary">{t('results_title')}</h4></div>
          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-surface-container-low/10 text-[10px] font-bold uppercase"><th className="px-6 py-4">{t('col_exam')}</th><th className="px-6 py-4">{t('col_date')}</th><th className="px-6 py-4">{t('col_score')}</th><th className="px-6 py-4">{t('col_status')}</th></tr></thead>
                <tbody className="divide-y divide-surface-container">
                  {results.slice(0, 5).map((res, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <span className="material-symbols-outlined text-[20px]">assignment</span>
                          </div>
                          <div>
                            <p className="font-bold text-primary">{res.examTitle || `${t('col_exam')} #${res.examId}`}</p>
                            <p className="text-[10px] text-on-surface-variant font-medium">{t('col_score')} {res.versionCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">{res.submittedAt ? new Date(res.submittedAt).toLocaleDateString("vi-VN") : "--"}</td>
                      <td className="px-6 py-4 font-black">{res.score?.toFixed(1)}</td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${res.score >= 5 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{res.score >= 5 ? t('status_pass') : t('status_fail')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-on-surface-variant italic">{t('no_data')}</div>
          )}
        </section>
      </div>
    </div>
  );
}
