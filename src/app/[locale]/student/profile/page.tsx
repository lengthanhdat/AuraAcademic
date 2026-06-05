"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { useAlert } from "@/components/ui/AlertProvider";

type StudentProfile = {
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  studentId?: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
  title?: string;
  department?: string;
  avatarUrl?: string;
  provider?: string;
  hasPassword?: boolean;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
};

type ProfileForm = {
  fullName: string;
  studentId: string;
  phoneNumber: string;
  birthDate: string;
  gender: string;
  title: string;
  department: string;
};

const emptyForm: ProfileForm = {
  fullName: "",
  studentId: "",
  phoneNumber: "",
  birthDate: "",
  gender: "",
  title: "",
  department: "",
};

const hasValue = (value: unknown) => typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
};

const formatDateTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", { hour12: false });
};

const compressAvatar = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const img = new window.Image();
  const url = URL.createObjectURL(file);

  img.onload = () => {
    URL.revokeObjectURL(url);
    const maxSize = 512;
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Không thể xử lý ảnh này."));
      return;
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    resolve(canvas.toDataURL("image/webp", 0.82));
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error("Không đọc được ảnh này."));
  };

  img.src = url;
});

import { useTranslations, useLocale } from "next-intl";

export default function StudentProfilePage() {
  const t = useTranslations("StudentProfile");
  const tCommon = useTranslations("TeacherProfile");
  const locale = useLocale();
  const { showAlert } = useAlert();

  const [user, setUser] = useState<StudentProfile | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [emailVerificationPending, setEmailVerificationPending] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isTwoFactorBusy, setIsTwoFactorBusy] = useState(false);

  const updateLocalUser = (nextUser: StudentProfile) => {
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
    window.dispatchEvent(new Event("user-updated"));
  };

  const fillForm = (nextUser: StudentProfile) => {
    setForm({
      fullName: nextUser.fullName || "",
      studentId: nextUser.studentId || "",
      phoneNumber: nextUser.phoneNumber || "",
      birthDate: nextUser.birthDate || "",
      gender: nextUser.gender || "",
      title: nextUser.title || "",
      department: nextUser.department || "",
    });
  };

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const storedRaw = localStorage.getItem("user");
        const storedUser: StudentProfile | null = storedRaw ? JSON.parse(storedRaw) : null;

        if (storedUser && !ignore) {
          setUser(storedUser);
          fillForm(storedUser);
        }

        const profileRes = await fetch(`${API_BASE}/users/me`, { headers: getAuthHeaders() });
        if (!profileRes.ok) throw new Error("PROFILE_FAILED");

        const profile: StudentProfile = await profileRes.json();
        if (ignore) return;

        updateLocalUser(profile);
        fillForm(profile);

        if (profile.id) {
          const resultRes = await fetch(`${API_BASE}/exams/results/student/${profile.id}`, { headers: getAuthHeaders() });
          const data = await resultRes.json().catch(() => []);
          if (!ignore && Array.isArray(data)) {
            setResults(data.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()));
          }
        }
      } catch {
        if (!ignore) showAlert({ title: tCommon("toast_error_load"), message: tCommon("toast_error_load"), type: "error" });
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    loadProfile();
    return () => {
      ignore = true;
    };
  }, [showAlert]);

  const displayName = user?.fullName || user?.email || t("default_name");
  const initials = displayName.trim().slice(0, 2).toUpperCase();
  const totalExams = results.length;
  const averageScore = totalExams > 0 ? results.reduce((sum, item) => sum + Number(item.score || 0), 0) / totalExams : 0;
  const bestScore = totalExams > 0 ? Math.max(...results.map(item => Number(item.score || 0))) : 0;
  const passCount = results.filter(item => Number(item.score || 0) >= 5).length;
  const needsPasswordSetup = user ? !user.hasPassword : false;

  const infoItems = [
    { icon: "mail", label: t("detail_email"), value: user?.email },
    { icon: "badge", label: t("field_student_id"), value: user?.studentId },
    { icon: "groups", label: t("field_class"), value: user?.department },
    { icon: "school", label: t("field_program"), value: user?.title },
    { icon: "call", label: t("detail_phone"), value: user?.phoneNumber },
    { icon: "cake", label: t("detail_dob"), value: user?.birthDate ? formatDate(user.birthDate) : "" },
    { icon: "wc", label: t("detail_gender"), value: user?.gender },
    { icon: "login", label: tCommon("lbl_last_login"), value: formatDateTime(user?.lastLoginAt) },
  ].filter(item => hasValue(item.value));

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showAlert({ title: t("avatar_type_error"), message: t("avatar_type_error"), type: "error" });
      return;
    }

    (async () => {
      try {
        const avatarUrl = await compressAvatar(file);
        const res = await fetch(`${API_BASE}/users/me/avatar`, {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ avatarUrl }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || data.error || "AVATAR_FAILED");
        updateLocalUser(data);
        showAlert({ title: t("avatar_success"), message: t("avatar_success"), type: "success" });
      } catch (error: any) {
        showAlert({ title: t("avatar_error"), message: error.message || t("avatar_error"), type: "error" });
      } finally {
        event.target.value = "";
      }
    })();
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
      const res = await fetch(`${API_BASE}/users/me`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || "SAVE_FAILED");

      updateLocalUser(data);
      fillForm(data);
      setIsEditing(false);
      showAlert({ title: t("profile_success"), message: t("profile_success"), type: "success" });
    } catch (error: any) {
      showAlert({ title: t("profile_error"), message: error.message || t("profile_error"), type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showAlert({ title: t("pw_mismatch"), message: t("pw_mismatch"), type: "warning" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch(`${API_BASE}/users/me/password`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || "PASSWORD_FAILED");

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      if (user) {
        updateLocalUser({ ...user, hasPassword: true });
      }
      showAlert({
        title: needsPasswordSetup ? tCommon("toast_pw_setup_success") : tCommon("toast_pw_change_success"),
        message: needsPasswordSetup ? tCommon("toast_pw_setup_success") : tCommon("toast_pw_change_success"),
        type: "success",
      });
    } catch (error: any) {
      showAlert({ title: t("pw_error"), message: error.message || t("pw_error"), type: "error" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendEmailVerification = async () => {
    if (!user?.email) return;
    setIsSendingVerification(true);
    try {
      const res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.message || data.error || "";
        if (message.includes("được xác thực") || message.includes("đã xác thực")) {
          updateLocalUser({ ...user, emailVerified: true });
          showAlert({ title: tCommon("toast_email_verify_already"), message: tCommon("toast_email_verify_already"), type: "info" });
          return;
        }
        throw new Error(message || "VERIFY_EMAIL_FAILED");
      }

      showAlert({ title: tCommon("toast_email_verify_sent"), message: tCommon("toast_email_verify_sent"), type: "success" });
      setEmailVerificationPending(true);
      setEmailVerificationCode("");
    } catch (error: any) {
      showAlert({ title: tCommon("toast_error_load"), message: error.message || tCommon("toast_error_load"), type: "error" });
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleConfirmEmailVerification = async () => {
    if (!user?.email) return;
    if (emailVerificationCode.trim().length !== 6) {
      showAlert({ title: tCommon("toast_otp_missing"), message: tCommon("toast_otp_missing"), type: "warning" });
      return;
    }

    setIsSendingVerification(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, token: emailVerificationCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || "VERIFY_EMAIL_FAILED");

      updateLocalUser({ ...user, emailVerified: true });
      setEmailVerificationPending(false);
      setEmailVerificationCode("");
      showAlert({ title: tCommon("toast_email_verify_success"), message: tCommon("toast_email_verify_success"), type: "success" });
    } catch (error: any) {
      showAlert({ title: tCommon("toast_email_verify_error"), message: error.message || tCommon("toast_email_verify_error"), type: "error" });
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleSendTwoFactorOtp = async () => {
    setIsTwoFactorBusy(true);
    try {
      const res = await fetch(`${API_BASE}/users/me/2fa/setup`, { headers: getAuthHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || "2FA_SETUP_FAILED");

      setTwoFactorPending(true);
      setTwoFactorCode("");
      showAlert({ title: tCommon("toast_2fa_sent"), message: tCommon("toast_2fa_sent"), type: "success" });
    } catch (error: any) {
      showAlert({ title: tCommon("toast_error_load"), message: error.message || tCommon("toast_error_load"), type: "error" });
    } finally {
      setIsTwoFactorBusy(false);
    }
  };

  const handleConfirmTwoFactor = async () => {
    if (!twoFactorCode.trim()) {
      showAlert({ title: tCommon("toast_otp_missing"), message: tCommon("toast_otp_missing"), type: "warning" });
      return;
    }

    setIsTwoFactorBusy(true);
    try {
      const endpoint = user?.twoFactorEnabled ? "disable" : "enable";
      const res = await fetch(`${API_BASE}/users/me/2fa/${endpoint}`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ code: twoFactorCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || "2FA_CONFIRM_FAILED");

      if (user) updateLocalUser({ ...user, twoFactorEnabled: !user.twoFactorEnabled });
      setTwoFactorPending(false);
      setTwoFactorCode("");
      showAlert({
        title: user?.twoFactorEnabled ? tCommon("toast_2fa_disabled") : tCommon("toast_2fa_enabled"),
        message: user?.twoFactorEnabled ? tCommon("toast_2fa_disabled") : tCommon("toast_2fa_enabled"),
        type: "success",
      });
    } catch (error: any) {
      showAlert({ title: tCommon("toast_2fa_error"), message: error.message || tCommon("toast_2fa_error"), type: "error" });
    } finally {
      setIsTwoFactorBusy(false);
    }
  };

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative h-32 w-32 overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-xl">
                {user?.avatarUrl ? (
                  <Image src={user.avatarUrl} alt={displayName} fill sizes="128px" unoptimized className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl font-black">{initials}</div>
                )}
                <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 bg-black/45 text-xs font-black text-white opacity-0 transition hover:opacity-100">
                  <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                  {t("change_photo")}
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">{t("title")}</p>
                <h1 className="mt-2 break-words text-3xl font-black md:text-4xl">{displayName}</h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  {user?.studentId && <Badge icon="badge" text={user.studentId} />}
                  {user?.department && <Badge icon="groups" text={user.department} />}
                  {user?.title && <Badge icon="school" text={user.title} />}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(prev => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700"
            >
              <span className="material-symbols-outlined text-[20px]">{isEditing ? "close" : "edit"}</span>
              {isEditing ? t("btn_close") : t("btn_edit")}
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard icon="assignment" label={t("summary_exams")} value={totalExams.toString()} tone="text-sky-600" />
          <StatCard icon="speed" label={t("summary_avg")} value={averageScore.toFixed(1)} tone="text-indigo-600" />
          <StatCard icon="workspace_premium" label={t("stat_best")} value={bestScore.toFixed(1)} tone="text-emerald-600" />
          <StatCard icon="task_alt" label={t("stat_pass")} value={`${passCount}/${totalExams}`} tone="text-rose-600" />
        </section>

        {isEditing && (
          <Panel title={t("update_title")} icon="edit">
            <form onSubmit={handleSaveProfile} className="grid gap-4 md:grid-cols-2">
              <Input label={t("field_fullname")} value={form.fullName} onChange={value => setForm({ ...form, fullName: value })} required />
              <Input label={t("field_student_id")} value={form.studentId} onChange={value => setForm({ ...form, studentId: value })} />
              <Input label={t("field_class")} value={form.department} onChange={value => setForm({ ...form, department: value })} />
              <Input label={t("field_program")} value={form.title} onChange={value => setForm({ ...form, title: value })} />
              <Input label={t("field_phone")} value={form.phoneNumber} onChange={value => setForm({ ...form, phoneNumber: value })} />
              <Input label={t("detail_dob")} type="date" value={form.birthDate} onChange={value => setForm({ ...form, birthDate: value })} />
              <Select label={t("detail_gender")} value={form.gender} onChange={value => setForm({ ...form, gender: value })} t={t} />
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full rounded-2xl bg-sky-600 px-4 py-3 font-black text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? t("btn_saving") : t("btn_save")}
                </button>
              </div>
            </form>
          </Panel>
        )}

        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <Panel title={tCommon("panel_info")} icon="person">
              {infoItems.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {infoItems.map(item => (
                    <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                      <span className="material-symbols-outlined mt-0.5 text-[22px] text-sky-600 dark:text-sky-300">{item.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">{item.label}</p>
                        <p className="mt-1 break-words font-bold text-slate-700 dark:text-slate-200">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="person_add" text={tCommon("empty_info")} />
              )}
            </Panel>

            <Panel title={t("results_title")} icon="bar_chart">
              {results.length > 0 ? (
                <div className="overflow-hidden">
                  <div className="hidden grid-cols-[minmax(180px,1fr)_84px_150px_112px] items-center gap-4 border-b border-slate-100 px-3 pb-3 text-xs font-black uppercase tracking-wide text-slate-400 dark:border-slate-800 md:grid">
                    <span>{t("col_exam")}</span>
                    <span className="text-center">{t("col_score")}</span>
                    <span>{t("col_date")}</span>
                    <span className="text-center">{t("col_status")}</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {results.slice(0, 6).map((item, index) => {
                      const score = Number(item.score || 0);
                      const passed = score >= 5;
                      return (
                        <div
                          key={item.id || index}
                          className="grid gap-3 px-3 py-4 md:grid-cols-[minmax(180px,1fr)_84px_150px_112px] md:items-center md:gap-4"
                        >
                          <div className="min-w-0">
                            <p className="line-clamp-2 font-black leading-snug text-slate-900 dark:text-white">
                              {item.examTitle || `${t("col_exam")} #${item.examId || index + 1}`}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-400 md:hidden">
                              {formatDateTime(item.submittedAt) || "--"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between md:block md:text-center">
                            <span className="text-xs font-black uppercase tracking-wide text-slate-400 md:hidden">{t("col_score")}</span>
                            <span className={`text-2xl font-black tabular-nums ${passed ? "text-emerald-600" : "text-sky-600"}`}>
                              {score.toFixed(1)}
                            </span>
                          </div>

                          <div className="hidden text-sm font-semibold leading-5 text-slate-500 dark:text-slate-400 md:block">
                            {formatDateTime(item.submittedAt) || "--"}
                          </div>

                          <div className="flex items-center justify-between md:justify-center">
                            <span className="text-xs font-black uppercase tracking-wide text-slate-400 md:hidden">{t("col_status")}</span>
                            <span className={`inline-flex min-w-[82px] items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-black ${passed ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"}`}>
                              {passed ? t("status_pass") : t("status_fail")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <EmptyState icon="assignment_late" text={t("no_data")} />
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title={tCommon("panel_security")} icon="lock">
              <div className="mb-5 space-y-3">
                <SecurityActionRow
                  label={tCommon("lbl_email")}
                  value={user?.emailVerified ? tCommon("sec_verified") : tCommon("sec_unverified")}
                  ok={!!user?.emailVerified}
                  actionLabel={!user?.emailVerified ? (isSendingVerification ? tCommon("btn_sending") : tCommon("btn_verify")) : undefined}
                  onAction={!user?.emailVerified ? handleSendEmailVerification : undefined}
                  disabled={isSendingVerification}
                />
                {emailVerificationPending && !user?.emailVerified && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                    <div className="mb-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      {tCommon("msg_otp_sent_email", { email: user?.email || "" })}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={emailVerificationCode}
                        onChange={event => setEmailVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        inputMode="numeric"
                        placeholder={tCommon("placeholder_otp")}
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center font-black tracking-[0.3em] outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={handleConfirmEmailVerification}
                        disabled={isSendingVerification || emailVerificationCode.length !== 6}
                        className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-black text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {tCommon("btn_confirm")}
                      </button>
                    </div>
                  </div>
                )}
                <SecurityActionRow
                  label="Đăng nhập"
                  value={needsPasswordSetup ? (user?.provider === "google" ? "Google" : "Chưa có mật khẩu") : user?.provider === "google" ? "Google + Mật khẩu" : "Mật khẩu"}
                  ok
                />
                <SecurityActionRow
                  label="2FA"
                  value={user?.twoFactorEnabled ? tCommon("sec_enabled") : tCommon("sec_disabled")}
                  ok={!!user?.twoFactorEnabled}
                  actionLabel={user?.twoFactorEnabled ? tCommon("btn_send_disable") : tCommon("btn_send_enable")}
                  onAction={handleSendTwoFactorOtp}
                  disabled={isTwoFactorBusy}
                />

                {(twoFactorPending || user?.twoFactorEnabled) && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                    {twoFactorPending && (
                      <div className="mb-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        {tCommon("msg_otp_sent_2fa", { action: user?.twoFactorEnabled ? tCommon("btn_disable").toLowerCase() : tCommon("btn_confirm").toLowerCase() })}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={twoFactorCode}
                        onChange={event => setTwoFactorCode(event.target.value)}
                        maxLength={6}
                        inputMode="numeric"
                        placeholder={tCommon("placeholder_otp")}
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center font-black tracking-[0.3em] outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={handleConfirmTwoFactor}
                        disabled={isTwoFactorBusy}
                        className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-black text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {user?.twoFactorEnabled ? tCommon("btn_disable") : tCommon("btn_confirm")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800">
                <div className={`rounded-2xl border p-4 ${needsPasswordSetup ? "border-sky-200 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10" : "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`material-symbols-outlined rounded-2xl p-2 ${needsPasswordSetup ? "bg-white text-sky-600 dark:bg-sky-950/60 dark:text-sky-300" : "bg-white text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300"}`}>
                      {needsPasswordSetup ? "add_moderator" : "verified_user"}
                    </span>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white">
                        {needsPasswordSetup ? tCommon("pw_setup_title") : tCommon("pw_change_title")}
                      </h3>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
                        {needsPasswordSetup ? tCommon("pw_setup_desc") : tCommon("pw_change_desc")}
                      </p>
                    </div>
                  </div>
                </div>

                {user?.hasPassword && (
                  <PasswordInput label={t("pw_current")} value={passwordForm.currentPassword} onChange={value => setPasswordForm({ ...passwordForm, currentPassword: value })} autoComplete="current-password" required t={tCommon} />
                )}
                <PasswordInput label={t("pw_new")} value={passwordForm.newPassword} onChange={value => setPasswordForm({ ...passwordForm, newPassword: value })} autoComplete="new-password" required t={tCommon} />
                <PasswordInput label={t("pw_confirm")} value={passwordForm.confirmPassword} onChange={value => setPasswordForm({ ...passwordForm, confirmPassword: value })} autoComplete="new-password" required t={tCommon} />
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {isChangingPassword ? t("btn_pw_processing") : needsPasswordSetup ? tCommon("btn_setup_pw") : t("btn_pw_update")}
                </button>
              </form>
            </Panel>
          </div>
        </section>
      </div>
    </div>
  );
}

function Badge({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-black text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      {text}
    </span>
  );
}

function StatCard({ icon, label, value, tone }: { icon: string; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className={`material-symbols-outlined text-[28px] ${tone}`}>{icon}</span>
        <p className={`text-3xl font-black ${tone}`}>{value}</p>
      </div>
      <p className="mt-3 text-sm font-black uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[24px] text-sky-600 dark:text-sky-300">{icon}</span>
        <h2 className="text-lg font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 dark:border-slate-700">
      <span className="material-symbols-outlined text-[40px]">{icon}</span>
      <p className="mt-2 font-bold">{text}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        required={required}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-sky-500/10"
      />
    </label>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  required = false,
  t,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  t?: any;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</span>
      <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white pr-2 transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:ring-sky-500/10">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={event => onChange(event.target.value)}
          required={required}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 rounded-2xl bg-transparent px-4 py-3 font-semibold outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible(prev => !prev)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label={visible ? (t ? t("hide_pw") : "Ẩn") : (t ? t("show_pw") : "Hiện")}
        >
          <span className="material-symbols-outlined text-[20px]">{visible ? "visibility_off" : "visibility"}</span>
        </button>
      </div>
    </label>
  );
}

function Select({ label, value, onChange, t }: { label: string; value: string; onChange: (value: string) => void, t?: any }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-sky-500/10"
      >
        <option value="">{t ? t("not_updated") : "Chưa cập nhật"}</option>
        <option value="Nam">{t ? t("gender_male") : "Nam"}</option>
        <option value="Nữ">{t ? t("gender_female") : "Nữ"}</option>
        <option value="Khác">{t ? t("gender_other") : "Khác"}</option>
      </select>
    </label>
  );
}

function SecurityActionRow({
  label,
  value,
  ok,
  actionLabel,
  onAction,
  disabled = false,
}: {
  label: string;
  value: string;
  ok: boolean;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
      <div className="min-w-0">
        <p className="font-bold text-slate-600 dark:text-slate-300">{label}</p>
        <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-black ${ok ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
          {value}
        </span>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          className="shrink-0 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-black text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
