"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentProfile() {
  const router = useRouter();
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
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg({ type: "", text: "" });
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
        setUser(updated);
        setProfileMsg({ type: "success", text: "Cập nhật hồ sơ thành công!" });
        setIsEditing(false);
        setTimeout(() => setProfileMsg({ type: "", text: "" }), 3000);
      } else {
        setProfileMsg({ type: "error", text: "Lỗi cập nhật hồ sơ." });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Không thể kết nối server." });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: "Mật khẩu mới không khớp!" });
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
        setPwMsg({ type: "success", text: "Đổi mật khẩu thành công!" });
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setPwMsg({ type: "", text: "" }), 3000);
      } else {
        const data = await res.json();
        setPwMsg({ type: "error", text: data.error || "Lỗi đổi mật khẩu." });
      }
    } catch {
      setPwMsg({ type: "error", text: "Không thể kết nối server." });
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
    if (score >= 9.0) return "Xuất sắc";
    if (score >= 8.0) return "Giỏi";
    if (score >= 6.5) return "Khá";
    if (score >= 5.0) return "Trung bình";
    return "Yếu";
  };
  
  const currentRank = totalExams > 0 ? getRank(parseFloat(avgScore)) : "--";

  const getAiInsight = () => {
    if (totalExams === 0) return "Bạn vừa mới tham gia hệ thống, hãy làm thêm bài thi để AI có thể phân tích nhé!";
    const score = parseFloat(avgScore);
    if (score >= 8.0) return `Bạn đang học rất tốt với GPA ${avgScore}.`;
    if (score >= 5.0) return `Bạn cần cố gắng thêm, GPA hiện tại là ${avgScore}.`;
    return "Hãy tập trung ôn luyện nhiều hơn nhé!";
  };

  return (
    <div className="flex-1 p-8 max-w-[1400px] w-full mx-auto animate-in fade-in duration-500">
      
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-primary tracking-tight">Hồ sơ cá nhân</h2>
          <p className="text-on-surface-variant text-sm mt-1">Quản lý thông tin học tập của bạn.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-primary">{user.fullName}</p>
            <p className="text-xs text-on-surface-variant">Học sinh</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
            {user.fullName?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {/* Hero Card */}
        <section className="bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold shadow-xl">
            {user.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-4xl font-extrabold text-primary mb-2">{user.fullName}</h3>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              {user.studentId && <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed-variant rounded-full text-xs font-bold uppercase tracking-wider">{user.studentId}</span>}
              {user.department && <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold uppercase tracking-wider">{user.department}</span>}
              {user.title && <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-bold uppercase tracking-wider">{user.title}</span>}
            </div>
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-3 bg-surface-container-high text-on-surface font-bold rounded-xl">{isEditing ? 'Đóng' : 'Sửa hồ sơ'}</button>
        </section>

        {/* Edit Form */}
        {isEditing && (
          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-primary/10">
            <h4 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">Cập nhật thông tin</h4>
            {profileMsg.text && <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${profileMsg.type === "error" ? "bg-error-container text-on-error-container" : "bg-green-100 text-green-800"}`}>{profileMsg.text}</div>}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder="Họ và tên" required />
                <input value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder="Mã học sinh" />
                <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder="Lớp (VD: 12A1)" />
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder="Hệ đào tạo (VD: Phổ thông)" />
                <input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder="Số điện thoại" />
                <input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" />
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface">
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <button type="submit" className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl">{saving ? "Đang lưu..." : "Lưu"}</button>
            </form>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
              <h4 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">Thông tin chi tiết</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="text-[10px] uppercase font-bold text-on-surface-variant block">Email</label><p className="font-medium">{user.email}</p></div>
                <div><label className="text-[10px] uppercase font-bold text-on-surface-variant block">Số điện thoại</label><p className={user.phoneNumber ? "font-medium" : "italic text-slate-400"}>{user.phoneNumber || "Chưa cập nhật"}</p></div>
                <div><label className="text-[10px] uppercase font-bold text-on-surface-variant block">Ngày sinh</label><p className={user.birthDate ? "font-medium" : "italic text-slate-400"}>{user.birthDate ? new Date(user.birthDate).toLocaleDateString("vi-VN") : "Chưa cập nhật"}</p></div>
                <div><label className="text-[10px] uppercase font-bold text-on-surface-variant block">Giới tính</label><p className={user.gender ? "font-medium" : "italic text-slate-400"}>{user.gender || "Chưa cập nhật"}</p></div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
              <h4 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">Đổi mật khẩu</h4>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder="Mật khẩu hiện tại" required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder="Mật khẩu mới" required />
                  <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" placeholder="Xác nhận mật khẩu" required />
                </div>
                <button type="submit" className="w-full py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl">{changingPw ? "Đang xử lý..." : "Cập nhật mật khẩu"}</button>
              </form>
            </div>
          </section>

          <section className="space-y-6">
            <div className="bg-surface-container-low rounded-xl p-6 shadow-sm border border-outline-variant/10">
              <h4 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">Tóm tắt học tập</h4>
              <div className="space-y-4">
                <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between"><span className="text-xs text-on-surface-variant">Kỳ thi</span><span className="text-xl font-black text-primary">{totalExams}</span></div>
                <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between"><span className="text-xs text-on-surface-variant">Điểm trung bình</span><span className="text-xl font-black text-primary">{avgScore}</span></div>
                <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between"><span className="text-xs text-on-surface-variant">Xếp loại</span><span className="text-xl font-black text-primary">{currentRank}</span></div>
              </div>
              <div className="mt-6 p-4 rounded-xl bg-tertiary-container/10 border-l-4 border-on-tertiary-container">
                <p className="text-xs text-on-surface leading-relaxed">{getAiInsight()}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Results Table */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-surface-container"><h4 className="text-lg font-bold text-primary">Kết quả thi gần đây</h4></div>
          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-surface-container-low/10 text-[10px] font-bold uppercase"><th className="px-6 py-4">Kỳ thi</th><th className="px-6 py-4">Ngày</th><th className="px-6 py-4">Điểm</th><th className="px-6 py-4">Trạng thái</th></tr></thead>
                <tbody className="divide-y divide-surface-container">
                  {results.slice(0, 5).map((res, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <span className="material-symbols-outlined text-[20px]">assignment</span>
                          </div>
                          <div>
                            <p className="font-bold text-primary">{res.examTitle || `Kỳ thi #${res.examId}`}</p>
                            <p className="text-[10px] text-on-surface-variant font-medium">Mã đề: {res.versionCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">{res.submittedAt ? new Date(res.submittedAt).toLocaleDateString("vi-VN") : "--"}</td>
                      <td className="px-6 py-4 font-black">{res.score?.toFixed(1)}</td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${res.score >= 5 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{res.score >= 5 ? "Đạt" : "Không đạt"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-on-surface-variant italic">Chưa có dữ liệu.</div>
          )}
        </section>
      </div>
    </div>
  );
}
