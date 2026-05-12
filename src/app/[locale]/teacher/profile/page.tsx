"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/components/ui/AlertProvider";

export default function TeacherProfile() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [user, setUser] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);

  // States cho form
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ 
    fullName: "", 
    phoneNumber: "", 
    birthDate: "", 
    gender: "",
    title: "",
    department: "",
    workplace: "",
    schedule: "",
    certificates: "",
    experience: ""
  });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  
  // Trạng thái loading / msg
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
        phoneNumber: u.phoneNumber || "",
        birthDate: u.birthDate || "",
        gender: u.gender || "",
        title: u.title || "",
        department: u.department || "",
        workplace: u.workplace || "",
        schedule: u.schedule || "",
        certificates: u.certificates || "",
        experience: u.experience || ""
      });

      const token = localStorage.getItem("accessToken");

      // Fetch danh sách kỳ thi của giảng viên
      fetch(`http://localhost:8088/api/exams/teacher/${u.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setExams(data);
        })
        .catch(err => console.error("Error fetching teacher exams:", err));
    }
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showAlert({
        title: t("file_error"),
        message: t("avatar_type_error"),
        type: "error"
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showAlert({
        title: t("file_large"),
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
            title: t("success"),
            message: t("avatar_success"),
            type: "success"
          });
        } else {
          showAlert({
            title: t("avatar_error"),
            message: t("avatar_error_msg"),
            type: "error"
          });
        }
      } catch {
        showAlert({
          title: t("connect_error"),
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
        body: JSON.stringify({ 
          fullName: form.fullName,
          phoneNumber: form.phoneNumber,
          birthDate: form.birthDate,
          gender: form.gender,
          title: form.title,
          department: form.department,
          workplace: form.workplace,
          schedule: form.schedule,
          certificates: form.certificates,
          experience: form.experience
        }),
      });
      if (res.ok) {
        const updated = { 
          ...user, 
          fullName: form.fullName,
          phoneNumber: form.phoneNumber,
          birthDate: form.birthDate,
          gender: form.gender,
          title: form.title,
          department: form.department,
          workplace: form.workplace,
          schedule: form.schedule,
          certificates: form.certificates,
          experience: form.experience
        };
        localStorage.setItem("user", JSON.stringify(updated));
        window.dispatchEvent(new Event("user-updated"));
        setUser(updated);
        showAlert({
          title: t("success"),
          message: t("profile_success"),
          type: "success"
        });
        setIsEditing(false);
      } else {
        showAlert({
          title: t("update_error"),
          message: t("profile_error_msg"),
          type: "error"
        });
      }
    } catch {
      showAlert({
        title: t("connect_error"),
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
      setPwMsg({ type: "error", text: t("pw_mismatch") });
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
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ type: "success", text: t("pw_success") });
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setPwMsg({ type: "", text: "" }), 3000);
      } else {
        setPwMsg({ type: "error", text: data.error || t("pw_error") });
      }
    } catch {
      setPwMsg({ type: "error", text: t("server_conn_error") });
    } finally {
      setChangingPw(false);
    }
  };

  if (!user) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  const totalExams = exams.length;
  const totalStudents = exams.reduce((acc, curr) => acc + (curr.submissionCount || 0), 0);
  const totalClasses = new Set(exams.map(ex => ex.title?.split('-')[0].trim())).size || 0;

  const getExamStatus = (exam: any) => {
    if (exam.status === 'FINISHED') return { label: t("ended"), color: 'bg-slate-100 text-slate-600' };
    if (exam.status === 'DRAFT') return { label: t("draft"), color: 'bg-blue-100 text-blue-800' };
    
    if (exam.status === 'PUBLISHED') {
      if (exam.startTime && exam.duration) {
        const endTime = exam.startTime + (exam.duration * 60 * 1000);
        if (Date.now() > endTime) {
          return { label: t("ended"), color: 'bg-slate-100 text-slate-600' };
        }
      }
      return { label: t("ongoing"), color: 'bg-green-100 text-green-800' };
    }
    return { label: exam.status || 'N/A', color: 'bg-slate-100 text-slate-600' };
  };

  return (
    <div className="flex-1 p-8 max-w-[1400px] w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Profile Card */}
      <section className="mb-8">
        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative group cursor-pointer">
            <div className="w-32 h-32 rounded-full border-4 border-surface overflow-hidden shadow-md bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white text-5xl font-bold">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.fullName?.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute inset-0 bg-black/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer text-[10px] font-bold text-white flex-col gap-1">
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              Đổi ảnh
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
            <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-primary mb-1 tracking-tight">{user.fullName}</h1>
            <p className="text-lg font-medium text-on-surface-variant flex items-center justify-center md:justify-start gap-2">
              <span className="material-symbols-outlined text-primary text-sm">workspace_premium</span>
              {user.title || t("instructor")}
            </p>
            <p className="text-secondary flex items-center justify-center md:justify-start gap-2 mt-1">
              <span className="material-symbols-outlined text-sm">hub</span>
              {user.department || t("department")}
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="bg-surface-container-high text-on-surface font-semibold py-2.5 px-6 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">{isEditing ? 'close' : 'edit'}</span>
              {isEditing ? t("cancel_update") : t("update_profile")}
            </button>
            <button className="bg-gradient-to-br from-primary to-primary-container text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">share</span>
              Chia sẻ
            </button>
          </div>
        </div>
      </section>

      {/* Edit Form */}
      {isEditing && (
        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-primary/10 mb-8 animate-in fade-in slide-in-from-top-4">
          <h4 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">edit_document</span>
            Cập nhật thông tin giảng viên
          </h4>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest block mb-1">Họ và tên</label>
                <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:border-primary text-on-surface transition-colors" required />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest block mb-1">Chức danh</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:border-primary text-on-surface transition-colors" placeholder="VD: {t('instructor')} Cao cấp" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest block mb-1">Khoa / Bộ môn</label>
                <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:border-primary text-on-surface transition-colors" placeholder="VD: Khoa CNTT" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest block mb-1">Số điện thoại</label>
                <input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:border-primary text-on-surface transition-colors" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest block mb-1">Phòng làm việc</label>
                <input value={form.workplace} onChange={e => setForm({ ...form, workplace: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:border-primary text-on-surface transition-colors" placeholder="VD: Phòng 402, Tòa nhà C1" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest block mb-1">Lịch tiếp SV</label>
                <input value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:border-primary text-on-surface transition-colors" placeholder="VD: Thứ 3 & Thứ 5 (14:00 - 16:30)" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest block mb-1">Ngày sinh</label>
                <input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:border-primary text-on-surface transition-colors" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest block mb-1">Giới tính</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:border-primary text-on-surface transition-colors">
                  <option value="">{t('select_gender')}</option>
                  <option value="Nam">Nam</option>
                  <option value=t("female")>{t('female')}</option>
                  <option value=t("other")>{t('other')}</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest block mb-1">Kinh nghiệm làm việc & Dự án</label>
                <textarea rows={3} value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:border-primary text-on-surface transition-colors" placeholder="VD: 5 năm giảng dạy bộ môn Kiến trúc phần mềm..." />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest block mb-1">{t('certificates')}</label>
                <textarea rows={3} value={form.certificates} onChange={e => setForm({ ...form, certificates: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:border-primary text-on-surface transition-colors" placeholder="VD: Chứng chỉ AWS Certified Solutions Architect..." />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-all">
                <span className="material-symbols-outlined text-sm">save</span>
                {saving ? t("saving") : t("save_changes")}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed-dim">contact_page</span>
              Thông tin liên hệ & Công tác
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4 p-4 bg-surface-container-lowest rounded-lg">
                <span className="material-symbols-outlined text-blue-600 mt-1">mail</span>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Email công vụ</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 bg-surface-container-lowest rounded-lg">
                <span className="material-symbols-outlined text-blue-600 mt-1">call</span>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Số điện thoại</p>
                  <p className={`font-medium ${!user.phoneNumber ? "text-slate-400 italic" : ""}`}>{user.phoneNumber || "Chưa cập nhật"}</p>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 bg-surface-container-lowest rounded-lg">
                <span className="material-symbols-outlined text-blue-600 mt-1">apartment</span>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Phòng làm việc</p>
                  <p className={`font-medium ${!user.workplace ? "text-slate-400 italic" : ""}`}>{user.workplace || "Chưa cập nhật"}</p>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 bg-surface-container-lowest rounded-lg border-l-4 border-tertiary-container">
                <span className="material-symbols-outlined text-on-tertiary-container mt-1">event_available</span>
                <div>
                  <p className="text-xs text-on-tertiary-container uppercase tracking-wider font-bold">Lịch tiếp sinh viên</p>
                  <p className={`font-medium ${!user.schedule ? "text-slate-400 italic" : ""}`}>{user.schedule || "Chưa cập nhật"}</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Work Experience */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed-dim">work</span>
              Kinh nghiệm & Dự án
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">
              {user.experience || t("no_experience")}
            </p>
          </div>

          {/* Certificates */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed-dim">verified</span>
              Chứng chỉ & Giải thưởng
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">
              {user.certificates || t("no_certificates")}
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
            <h4 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined">lock</span>
              Bảo mật tài khoản
            </h4>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:border-primary text-on-surface" placeholder="Mật khẩu hiện tại" required />
              <input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:border-primary text-on-surface" placeholder="Mật khẩu mới" required />
              <button type="submit" className="w-full py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl">{changingPw ? "Đang xử lý..." : "Cập nhật mật khẩu"}</button>
            </form>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-6 text-white flex flex-col justify-between relative overflow-hidden group shadow-lg">
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-white/10 text-9xl group-hover:scale-110 transition-transform">school</span>
              <div>
                <p className="text-on-primary-container text-sm font-semibold uppercase tracking-widest">Lớp học</p>
                <h4 className="text-4xl font-black mt-2">{totalClasses.toString().padStart(2, '0')}</h4>
              </div>
              <p className="text-sm text-on-primary-container mt-4">Số lớp đang phụ trách giảng dạy</p>
            </div>
            <div className="bg-surface-container-highest rounded-xl p-6 flex flex-col justify-between group shadow-sm">
              <div>
                <p className="text-on-surface-variant text-sm font-semibold uppercase tracking-widest">Kỳ thi</p>
                <h4 className="text-4xl font-black text-primary mt-2">{totalExams}</h4>
              </div>
              <p className="text-sm text-on-surface-variant mt-4">Tổng số kỳ thi đã được tạo</p>
            </div>
            <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-8 shadow-sm flex items-center justify-between border border-outline-variant/10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl">groups</span>
                </div>
                <div>
                  <p className="text-on-surface-variant text-sm font-semibold uppercase tracking-widest">Sinh viên</p>
                  <h4 className="text-4xl font-black text-primary">{totalStudents.toLocaleString()}</h4>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-on-surface-variant">Số lượt sinh viên nộp bài thi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Managed Exams Table */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/10">
        <div className="px-8 py-6 flex items-center justify-between bg-surface-container-low/30">
          <h3 className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-fixed-dim">assignment</span>
            Các kỳ thi đang quản lý
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
                <th className="px-8 py-4">Tên bài thi</th>
                <th className="px-8 py-4">Số lượng thí sinh</th>
                <th className="px-8 py-4">Trạng thái</th>
                <th className="px-8 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {exams.length > 0 ? exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-surface-container-low/30 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-bold text-on-surface">{exam.title}</p>
                    <p className="text-xs text-on-surface-variant">Mã phòng: {exam.accessCode}</p>
                  </td>
                  <td className="px-8 py-5 font-bold text-primary">{exam.submissionCount || 0} nộp</td>
                  <td className="px-8 py-5">
                    {(() => {
                      const status = getExamStatus(exam);
                      return (
                        <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => router.push(`/teacher/exam-editor/${exam.id}`)} className="text-primary hover:underline font-bold text-sm">Chi tiết</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-8 py-10 text-center text-on-surface-variant italic">Chưa có bài thi nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
