"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { classroomApi } from "@/lib/classroomApi";
import { useAlert } from "@/components/ui/AlertProvider";

type VerificationStatus = "STANDARD" | "PENDING" | "VERIFIED" | "REJECTED";

type TeacherProfile = {
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
  title?: string;
  department?: string;
  workplace?: string;
  schedule?: string;
  avatarUrl?: string;
  bio?: string;
  certificates?: string;
  experience?: string;
  provider?: string;
  hasPassword?: boolean;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  verificationStatus?: VerificationStatus;
};

type ProfileForm = {
  fullName: string;
  phoneNumber: string;
  birthDate: string;
  gender: string;
  title: string;
  department: string;
  workplace: string;
  schedule: string;
  bio: string;
  certificates: string;
  experience: string;
};

const emptyForm: ProfileForm = {
  fullName: "",
  phoneNumber: "",
  birthDate: "",
  gender: "",
  title: "",
  department: "",
  workplace: "",
  schedule: "",
  bio: "",
  certificates: "",
  experience: "",
};

const getStatusUi = (t: any): Record<VerificationStatus, {
  label: string;
  title: string;
  description: string;
  icon: string;
  avatarRing: string;
  badge: string;
  panel: string;
  action?: string;
}> => ({
  VERIFIED: {
    label: t("status_verified"),
    title: t("status_verified_title"),
    description: t("status_verified_desc"),
    icon: "verified",
    avatarRing: "bg-gradient-to-tr from-emerald-400 via-cyan-400 to-blue-500 shadow-[0_0_30px_rgba(16,185,129,0.35)]",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    panel: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  PENDING: {
    label: t("status_pending"),
    title: t("status_pending_title"),
    description: t("status_pending_desc"),
    icon: "pending",
    avatarRing: "bg-gradient-to-tr from-sky-300 via-blue-400 to-cyan-400 shadow-[0_0_22px_rgba(14,165,233,0.25)]",
    badge: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
    panel: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
  },
  REJECTED: {
    label: t("status_rejected"),
    title: t("status_rejected_title"),
    description: t("status_rejected_desc"),
    icon: "cancel",
    avatarRing: "bg-gradient-to-tr from-rose-300 via-red-400 to-orange-400 shadow-[0_0_22px_rgba(244,63,94,0.25)]",
    badge: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
    panel: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
    action: t("action_resend_verify"),
  },
  STANDARD: {
    label: t("status_standard"),
    title: t("status_standard_title"),
    description: t("status_standard_desc"),
    icon: "shield",
    avatarRing: "bg-slate-200 dark:bg-slate-700",
    badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    panel: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    action: t("action_verify_now"),
  },
});

const hasValue = (value: unknown) => typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;

const normalizeStatus = (value?: string): VerificationStatus => {
  if (value === "PENDING" || value === "VERIFIED" || value === "REJECTED") return value;
  return "STANDARD";
};

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

export default function TeacherProfilePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("TeacherProfile");
  const { showAlert } = useAlert();

  const [user, setUser] = useState<TeacherProfile | null>(null);
  const [verification, setVerification] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [emailVerificationPending, setEmailVerificationPending] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [twoFactorSetup, setTwoFactorSetup] = useState<any>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isTwoFactorBusy, setIsTwoFactorBusy] = useState(false);

  const updateLocalUser = (nextUser: TeacherProfile) => {
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
    window.dispatchEvent(new Event("user-updated"));
  };

  const fillForm = (nextUser: TeacherProfile) => {
    setForm({
      fullName: nextUser.fullName || "",
      phoneNumber: nextUser.phoneNumber || "",
      birthDate: nextUser.birthDate || "",
      gender: nextUser.gender || "",
      title: nextUser.title || "",
      department: nextUser.department || "",
      workplace: nextUser.workplace || "",
      schedule: nextUser.schedule || "",
      bio: nextUser.bio || "",
      certificates: nextUser.certificates || "",
      experience: nextUser.experience || "",
    });
  };

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const storedRaw = localStorage.getItem("user");
        const storedUser: TeacherProfile | null = storedRaw ? JSON.parse(storedRaw) : null;

        if (storedUser && !ignore) {
          setUser(storedUser);
          fillForm(storedUser);
        }

        const profileRes = await fetch(`${API_BASE}/users/me`, { headers: getAuthHeaders() });
        if (!profileRes.ok) throw new Error("PROFILE_FAILED");

        const profile: TeacherProfile = await profileRes.json();
        if (ignore) return;

        updateLocalUser(profile);
        fillForm(profile);

        const [verificationRes, teacherClassrooms, teacherExams] = await Promise.all([
          fetch(`${API_BASE}/users/me/verification`, { headers: getAuthHeaders() }),
          classroomApi.getTeacherClassrooms().catch(() => []),
          profile.id
            ? fetch(`${API_BASE}/exams/teacher/${profile.id}`, { headers: getAuthHeaders() })
                .then(res => res.ok ? res.json() : [])
                .catch(() => [])
            : Promise.resolve([]),
        ]);

        if (ignore) return;

        if (verificationRes.ok) {
          const verificationData = await verificationRes.json();
          setVerification(verificationData);
          updateLocalUser({ ...profile, verificationStatus: verificationData.verificationStatus });
        }
        setClassrooms(Array.isArray(teacherClassrooms) ? teacherClassrooms : []);
        setExams(Array.isArray(teacherExams) ? teacherExams : []);
      } catch {
        if (!ignore) {
          showAlert({ title: "Không tải được hồ sơ", message: "Vui lòng thử lại sau.", type: "error" });
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    loadProfile();
    return () => {
      ignore = true;
    };
  }, [showAlert]);

  const verificationStatus = useMemo(
    () => normalizeStatus(verification?.verificationStatus || user?.verificationStatus),
    [verification?.verificationStatus, user?.verificationStatus]
  );

  const currentStatus = getStatusUi(t)[verificationStatus];
  const displayName = user?.fullName || user?.email || t("default_teacher");
  const initials = displayName.trim().slice(0, 2).toUpperCase();
  const totalSubmissions = exams.reduce((sum, exam) => sum + Number(exam.submissionCount || 0), 0);
  const activeExams = exams.filter(exam => ["STARTED", "PUBLISHED", "WAITING"].includes(exam.status)).length;
  const needsPasswordSetup = user ? !user.hasPassword : false;

  const infoItems = [
    { icon: "mail", label: t("lbl_email"), value: user?.email },
    { icon: "call", label: t("lbl_phone"), value: user?.phoneNumber },
    { icon: "badge", label: t("lbl_title"), value: user?.title },
    { icon: "hub", label: t("lbl_department"), value: user?.department },
    { icon: "apartment", label: t("lbl_workplace"), value: user?.workplace },
    { icon: "event_available", label: t("lbl_schedule"), value: user?.schedule },
    { icon: "cake", label: t("lbl_birthdate"), value: user?.birthDate ? formatDate(user.birthDate) : "" },
    { icon: "wc", label: t("lbl_gender"), value: user?.gender },
    { icon: "login", label: t("lbl_last_login"), value: formatDateTime(user?.lastLoginAt) },
  ].filter(item => hasValue(item.value));

  const recentExams = [...exams]
    .sort((a, b) => String(b.createdAt || b.scheduledStartTime || "").localeCompare(String(a.createdAt || a.scheduledStartTime || "")))
    .slice(0, 5);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showAlert({ title: t("toast_avatar_error"), message: t("toast_avatar_invalid"), type: "error" });
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
        showAlert({ title: t("toast_avatar_success"), message: t("toast_avatar_success"), type: "success" });
      } catch (error: any) {
        showAlert({ title: t("toast_avatar_error"), message: error.message || t("toast_avatar_error"), type: "error" });
      } finally {
        event.target.value = "";
      }
    })();
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim()])
      );

      const res = await fetch(`${API_BASE}/users/me`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "SAVE_FAILED");
      }

      const updated = await res.json();
      updateLocalUser(updated);
      fillForm(updated);
      setIsEditing(false);
      showAlert({ title: t("toast_profile_success"), message: t("toast_profile_success"), type: "success" });
    } catch (error: any) {
      showAlert({ title: t("toast_profile_error"), message: error.message || t("toast_profile_error"), type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showAlert({ title: t("toast_pw_mismatch"), message: t("toast_pw_mismatch"), type: "warning" });
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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "PASSWORD_FAILED");
      }

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      if (user) {
        updateLocalUser({ ...user, hasPassword: true });
      }
      showAlert({
        title: needsPasswordSetup ? t("toast_pw_setup_success") : t("toast_pw_change_success"),
        message: needsPasswordSetup ? t("toast_pw_setup_success") : t("toast_pw_change_success"),
        type: "success",
      });
    } catch (error: any) {
      showAlert({ title: t("toast_pw_error"), message: error.message || t("toast_pw_error"), type: "error" });
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
          if (user) updateLocalUser({ ...user, emailVerified: true });
          showAlert({
            title: t("toast_email_verify_already"),
            message: t("toast_email_verify_already"),
            type: "info",
          });
          return;
        }
        throw new Error(message || "VERIFY_EMAIL_FAILED");
      }

      showAlert({
        title: t("toast_email_verify_sent"),
        message: t("toast_email_verify_sent"),
        type: "success",
      });
      setEmailVerificationPending(true);
      setEmailVerificationCode("");
    } catch (error: any) {
      showAlert({
        title: t("toast_error_load"),
        message: error.message || t("toast_error_load"),
        type: "error",
      });
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleConfirmEmailVerification = async () => {
    if (!user?.email) return;
    if (emailVerificationCode.trim().length !== 6) {
      showAlert({ title: t("toast_otp_missing"), message: t("toast_otp_missing"), type: "warning" });
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
      showAlert({ title: t("toast_email_verify_success"), message: t("toast_email_verify_success"), type: "success" });
    } catch (error: any) {
      showAlert({ title: t("toast_email_verify_error"), message: error.message || t("toast_email_verify_error"), type: "error" });
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleSetupTwoFactor = async () => {
    setIsTwoFactorBusy(true);
    try {
      const res = await fetch(`${API_BASE}/users/me/2fa/setup`, { headers: getAuthHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || "2FA_SETUP_FAILED");
      setTwoFactorSetup({ ...data, emailOtp: true });
      setTwoFactorCode("");
      showAlert({ title: t("toast_2fa_sent"), message: t("toast_2fa_sent"), type: "success" });
    } catch (error: any) {
      showAlert({ title: t("toast_error_load"), message: error.message || t("toast_error_load"), type: "error" });
    } finally {
      setIsTwoFactorBusy(false);
    }
  };

  const handleEnableTwoFactor = async () => {
    if (!twoFactorCode.trim()) {
      showAlert({ title: t("toast_otp_missing"), message: t("toast_otp_missing"), type: "warning" });
      return;
    }

    setIsTwoFactorBusy(true);
    try {
      const res = await fetch(`${API_BASE}/users/me/2fa/enable`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ code: twoFactorCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || "2FA_ENABLE_FAILED");

      if (user) updateLocalUser({ ...user, twoFactorEnabled: true });
      setTwoFactorSetup(null);
      setTwoFactorCode("");
      showAlert({ title: t("toast_2fa_enabled"), message: t("toast_2fa_enabled"), type: "success" });
    } catch (error: any) {
      showAlert({ title: t("toast_2fa_error"), message: error.message || t("toast_2fa_error"), type: "error" });
    } finally {
      setIsTwoFactorBusy(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!twoFactorCode.trim()) {
      showAlert({ title: t("toast_otp_missing"), message: t("toast_otp_missing"), type: "warning" });
      return;
    }

    setIsTwoFactorBusy(true);
    try {
      const res = await fetch(`${API_BASE}/users/me/2fa/disable`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ code: twoFactorCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || "2FA_DISABLE_FAILED");

      if (user) updateLocalUser({ ...user, twoFactorEnabled: false });
      setTwoFactorCode("");
      showAlert({ title: t("toast_2fa_disabled"), message: t("toast_2fa_disabled"), type: "success" });
    } catch (error: any) {
      showAlert({ title: t("toast_2fa_error"), message: error.message || t("toast_2fa_error"), type: "error" });
    } finally {
      setIsTwoFactorBusy(false);
    }
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-56 rounded-[28px] bg-white dark:bg-slate-900" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(item => <div key={item} className="h-28 rounded-2xl bg-white dark:bg-slate-900" />)}
          </div>
          <div className="h-96 rounded-[24px] bg-white dark:bg-slate-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-center md:p-8">
            <div className={`relative h-32 w-32 rounded-full p-1.5 ${currentStatus.avatarRing}`}>
              <div className="relative h-full w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                {user?.avatarUrl ? (
                  <Image src={user.avatarUrl} alt={displayName} fill sizes="128px" unoptimized className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-black text-slate-500">
                    {initials}
                  </div>
                )}
              </div>
              <span
                className={`absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-lg ${currentStatus.badge}`}
                title={currentStatus.label}
                aria-label={currentStatus.label}
              >
                <span className="material-symbols-outlined text-[24px]">{currentStatus.icon}</span>
              </span>
            </div>

            <div className="min-w-0 space-y-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">{t("header_profile")}</p>
                <h1 className="mt-2 break-words text-3xl font-black md:text-4xl">{displayName}</h1>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  {[user?.title, user?.department].filter(Boolean).join(" • ") || user?.email}
                </p>
              </div>
              <div className={`inline-flex max-w-full items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${currentStatus.panel}`}>
                <span className="material-symbols-outlined text-[20px]">{currentStatus.icon}</span>
                <span>{currentStatus.title}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 md:justify-end">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                {t("btn_change_avatar")}
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
              <button
                type="button"
                onClick={() => setIsEditing(prev => !prev)}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700"
              >
                <span className="material-symbols-outlined text-[20px]">{isEditing ? "close" : "edit"}</span>
                {isEditing ? t("btn_close_edit") : t("btn_edit_profile")}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard icon="school" label={t("stat_classrooms")} value={classrooms.length} tone="text-sky-600" />
          <StatCard icon="assignment" label={t("stat_exams_created")} value={exams.length} tone="text-indigo-600" />
          <StatCard icon="play_circle" label={t("stat_exams_active")} value={activeExams} tone="text-emerald-600" />
          <StatCard icon="fact_check" label={t("stat_submissions")} value={totalSubmissions} tone="text-rose-600" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <Panel title={t("panel_info")} icon="person">
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
                <EmptyState icon="person_add" text={t("empty_info")} />
              )}
            </Panel>

            {(hasValue(user?.bio) || hasValue(user?.experience) || hasValue(user?.certificates)) && (
              <Panel title={t("panel_expertise")} icon="workspace_premium">
                <div className="space-y-4">
                  {hasValue(user?.bio) && <TextBlock label={t("lbl_bio")} value={user?.bio} />}
                  {hasValue(user?.experience) && <TextBlock label={t("lbl_experience")} value={user?.experience} />}
                  {hasValue(user?.certificates) && <TextBlock label={t("lbl_certificates")} value={user?.certificates} />}
                </div>
              </Panel>
            )}

            <Panel title={t("panel_recent_exams")} icon="assignment">
              {recentExams.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentExams.map(exam => (
                    <div key={exam.id || exam.accessCode} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="break-words font-extrabold text-slate-800 dark:text-white">{exam.title || t("unnamed_exam")}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {[exam.questionCount ? t("questions_count", { count: exam.questionCount }) : null, exam.duration ? t("duration_minutes", { count: exam.duration }) : null, exam.subject].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => exam.accessCode && router.push(`/teacher/exams/results/detail/?code=${exam.accessCode}`)}
                        disabled={!exam.accessCode}
                        className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-extrabold text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300"
                      >
                        {t("view_results")}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="assignment_late" text={t("empty_exams")} />
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title={t("panel_auth_status")} icon={currentStatus.icon}>
              <div className={`rounded-2xl border p-4 ${currentStatus.panel}`}>
                <p className="font-black">{currentStatus.title}</p>
                <p className="mt-2 text-sm leading-6 opacity-90">{currentStatus.description}</p>
                {verification?.note && (
                  <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm font-semibold dark:bg-slate-950/30">
                    {t("note", { note: verification.note })}
                  </p>
                )}
                <div className="mt-3 space-y-1 text-sm font-semibold opacity-90">
                  {verification?.submittedAt && <p>{t("submitted_at", { time: formatDateTime(verification.submittedAt) })}</p>}
                  {verification?.verifiedAt && <p>{t("verified_at", { time: formatDateTime(verification.verifiedAt) })}</p>}
                </div>
              </div>
              {currentStatus.action && (
                <button
                  type="button"
                  onClick={() => router.push(`/teacher/verify`)}
                  className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                >
                  {currentStatus.action}
                </button>
              )}
            </Panel>

            {isEditing && (
              <Panel title={t("panel_update_profile")} icon="edit">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <Input label={t("lbl_fullname")} value={form.fullName} onChange={value => setForm({ ...form, fullName: value })} required />
                  <Input label={t("lbl_phone")} value={form.phoneNumber} onChange={value => setForm({ ...form, phoneNumber: value })} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label={t("lbl_birthdate")} type="date" value={form.birthDate} onChange={value => setForm({ ...form, birthDate: value })} />
                    <Select label={t("lbl_gender")} value={form.gender} onChange={value => setForm({ ...form, gender: value })} t={t} />
                  </div>
                  <Input label={t("lbl_title")} value={form.title} onChange={value => setForm({ ...form, title: value })} />
                  <Input label={t("lbl_department")} value={form.department} onChange={value => setForm({ ...form, department: value })} />
                  <Input label={t("lbl_workplace")} value={form.workplace} onChange={value => setForm({ ...form, workplace: value })} />
                  <Input label={t("lbl_schedule")} value={form.schedule} onChange={value => setForm({ ...form, schedule: value })} />
                  <Textarea label={t("lbl_bio")} value={form.bio} onChange={value => setForm({ ...form, bio: value })} />
                  <Textarea label={t("lbl_experience")} value={form.experience} onChange={value => setForm({ ...form, experience: value })} />
                  <Textarea label={t("lbl_certificates")} value={form.certificates} onChange={value => setForm({ ...form, certificates: value })} />
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full rounded-2xl bg-sky-600 px-4 py-3 font-black text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? t("btn_saving") : t("btn_save")}
                  </button>
                </form>
              </Panel>
            )}

            <Panel title={t("panel_security")} icon="lock">
              <div className="mb-5 space-y-3">
                <SecurityActionRow
                  label={t("lbl_email")}
                  value={user?.emailVerified ? t("sec_verified") : t("sec_unverified")}
                  ok={!!user?.emailVerified}
                  actionLabel={!user?.emailVerified ? (isSendingVerification ? t("btn_sending") : t("btn_verify")) : undefined}
                  onAction={!user?.emailVerified ? handleSendEmailVerification : undefined}
                  disabled={isSendingVerification}
                />
                {emailVerificationPending && !user?.emailVerified && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                    <div className="mb-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      {t("msg_otp_sent_email", { email: user?.email || "" })}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={emailVerificationCode}
                        onChange={event => setEmailVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        inputMode="numeric"
                        placeholder={t("placeholder_otp")}
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center font-black tracking-[0.3em] outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={handleConfirmEmailVerification}
                        disabled={isSendingVerification || emailVerificationCode.length !== 6}
                        className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-black text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t("btn_confirm")}
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
                  value={user?.twoFactorEnabled ? t("sec_enabled") : t("sec_disabled")}
                  ok={!!user?.twoFactorEnabled}
                  actionLabel={user?.twoFactorEnabled ? t("btn_send_disable") : t("btn_send_enable")}
                  onAction={handleSetupTwoFactor}
                  disabled={isTwoFactorBusy}
                />

                {(twoFactorSetup || user?.twoFactorEnabled) && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                    {twoFactorSetup && (
                      <div className="mb-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        {t("msg_otp_sent_2fa", { action: user?.twoFactorEnabled ? t("btn_disable").toLowerCase() : t("btn_confirm").toLowerCase() })}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        value={twoFactorCode}
                        onChange={event => setTwoFactorCode(event.target.value)}
                        maxLength={6}
                        inputMode="numeric"
                        placeholder={t("placeholder_otp")}
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center font-black tracking-[0.3em] outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={user?.twoFactorEnabled ? handleDisableTwoFactor : handleEnableTwoFactor}
                        disabled={isTwoFactorBusy}
                        className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-black text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {user?.twoFactorEnabled ? t("btn_disable") : t("btn_confirm")}
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
                        {needsPasswordSetup ? t("pw_setup_title") : t("pw_change_title")}
                      </h3>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
                        {needsPasswordSetup ? t("pw_setup_desc") : t("pw_change_desc")}
                      </p>
                    </div>
                  </div>
                </div>

                {user?.hasPassword && (
                  <PasswordInput label={t("lbl_current_pw")} value={passwordForm.currentPassword} onChange={value => setPasswordForm({ ...passwordForm, currentPassword: value })} autoComplete="current-password" required t={t} />
                )}
                <PasswordInput label={t("lbl_new_pw")} value={passwordForm.newPassword} onChange={value => setPasswordForm({ ...passwordForm, newPassword: value })} autoComplete="new-password" required t={t} />
                <PasswordInput label={t("lbl_confirm_pw")} value={passwordForm.confirmPassword} onChange={value => setPasswordForm({ ...passwordForm, confirmPassword: value })} autoComplete="new-password" required t={t} />
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {isChangingPassword ? t("btn_saving") : needsPasswordSetup ? t("btn_setup_pw") : t("btn_change_pw")}
                </button>
              </form>
            </Panel>

            <Panel title={t("panel_recent_classes")} icon="groups">
              {classrooms.length > 0 ? (
                <div className="space-y-3">
                  {classrooms.slice(0, 4).map(classroom => (
                    <button
                      type="button"
                      key={classroom.id}
                      onClick={() => router.push(`/teacher/classrooms/detail/?id=${classroom.id}`)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left hover:border-sky-200 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-extrabold">{classroom.name || t("default_class")}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{classroom.classCode || classroom.code || t("no_class_code")}</p>
                      </div>
                      <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState icon="groups" text={t("empty_classes")} />
              )}
            </Panel>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: string; label: string; value: number; tone: string }) {
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

function TextBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 whitespace-pre-line leading-7 text-slate-700 dark:text-slate-200">{value}</p>
    </div>
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
        <option value="">{t ? t("gender_not_updated") : "Chưa cập nhật"}</option>
        <option value="Nam">{t ? t("gender_male") : "Nam"}</option>
        <option value="Nữ">{t ? t("gender_female") : "Nữ"}</option>
        <option value="Khác">{t ? t("gender_other") : "Khác"}</option>
      </select>
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</span>
      <textarea
        value={value}
        onChange={event => onChange(event.target.value)}
        rows={4}
        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-sky-500/10"
      />
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
