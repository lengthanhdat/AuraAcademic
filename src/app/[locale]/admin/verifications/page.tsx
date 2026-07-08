"use client";
import { useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { authFetcher } from "@/hooks/useAuthFetch";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088") + "/api";

type VerificationStatus = "STANDARD" | "PENDING" | "VERIFIED" | "REJECTED" | "ALL";

interface TeacherRequest {
  id: string;
  fullName: string;
  email: string;
  verificationStatus: VerificationStatus;
  verificationProofUrl: string;
  verificationProofType: string;
  verificationNote: string;
  verificationRequestedAt: string;
  verifiedAt: string;
}

const STATUS_TABS: { value: VerificationStatus | "ALL"; label: string }[] = [
  { value: "PENDING", label: "Đang chờ" },
  { value: "VERIFIED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Đã từ chối" },
  { value: "STANDARD", label: "Chưa gửi" },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  STANDARD: { label: "Dùng thử", bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400" },
  PENDING:  { label: "Chờ duyệt", bg: "bg-blue-100 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400" },
  VERIFIED: { label: "Đã xác thực", bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400" },
  REJECTED: { label: "Từ chối", bg: "bg-red-100 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400" },
};

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminVerificationsPage() {
  const [activeTab, setActiveTab] = useState<VerificationStatus | "ALL">("PENDING");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<TeacherRequest | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const swrKey = `${API_BASE}/admin/verification-requests?status=${activeTab}`;
  const { data, isLoading } = useSWR<{ requests: TeacherRequest[]; pendingCount: number }>(swrKey, authFetcher, { revalidateOnFocus: false });
  const { data: allData } = useSWR<{ pendingCount: number }>(`${API_BASE}/admin/verification-requests?status=PENDING`, authFetcher, { dedupingInterval: 15000 });

  const requests = data?.requests ?? [];
  const pendingCount = allData?.pendingCount ?? 0;

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken")}` });

  const handleApprove = async (userId: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/verification-requests/${userId}/approve`, {
        method: "POST",
        headers: authHeader(),
      });
      if (res.ok) {
        showToast("success", "Đã duyệt tài khoản giáo viên thành công.");
        globalMutate(swrKey);
        globalMutate(`${API_BASE}/admin/verification-requests?status=PENDING`);
      } else {
        const d = await res.json();
        showToast("error", d.error || "Lỗi khi duyệt.");
      }
    } catch {
      showToast("error", "Không thể kết nối máy chủ.");
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = (request: TeacherRequest) => {
    setRejectTarget(request);
    setRejectNote("");
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/verification-requests/${rejectTarget.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ note: rejectNote || "Thông tin chứng minh không đủ điều kiện." }),
      });
      if (res.ok) {
        showToast("success", "Đã từ chối yêu cầu và gửi thông báo cho giáo viên.");
        setRejectModalOpen(false);
        globalMutate(swrKey);
        globalMutate(`${API_BASE}/admin/verification-requests?status=PENDING`);
      } else {
        showToast("error", "Lỗi khi từ chối.");
      }
    } catch {
      showToast("error", "Không thể kết nối máy chủ.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 space-y-6 flex-1">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-semibold transition-all ${
          toast.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-200"
            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/80 dark:border-red-800 dark:text-red-200"
        }`}>
          <span className="material-symbols-outlined text-base">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface dark:text-slate-200 font-headline flex items-center gap-2">
            Xác thực Giáo viên
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-black rounded-full animate-pulse">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-0.5">Duyệt yêu cầu xác thực từ giáo viên tự do</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white dark:bg-[#0A1F3E] p-1.5 rounded-xl border border-outline-variant/10 dark:border-cyan-950/40 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.value
                ? "bg-[#0C2E5E] text-white shadow-sm"
                : "text-on-surface-variant dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-cyan-950/30"
            }`}
          >
            {tab.label}
            {tab.value === "PENDING" && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0A1F3E] rounded-2xl border border-outline-variant/10 dark:border-cyan-950/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-cyan-950/30 border-b border-slate-100 dark:border-cyan-950/40">
                <th className="px-6 py-3.5 text-[11px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest">Giáo viên</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest">Loại bằng chứng</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest">Ngày gửi</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest">Trạng thái</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-widest text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-cyan-950/30">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-5">
                      <div className="h-4 bg-slate-100 dark:bg-cyan-950/40 rounded-full w-3/4" />
                    </td>
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-on-surface-variant dark:text-slate-400/50">
                      <span className="material-symbols-outlined text-4xl">verified_user</span>
                      <p className="text-sm font-medium">Không có yêu cầu nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const sc = STATUS_CONFIG[req.verificationStatus] ?? STATUS_CONFIG.STANDARD;
                  const isLink = req.verificationProofType === "LINK";
                  return (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-cyan-950/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-on-surface dark:text-slate-200 text-sm">{req.fullName || "—"}</p>
                        <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">{req.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        {req.verificationProofUrl ? (
                          <div className="max-w-xs">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant dark:text-slate-400 mb-1">
                              <span className="material-symbols-outlined text-xs">{isLink ? "link" : "description"}</span>
                              {isLink ? "Liên kết" : "Mô tả"}
                            </span>
                            {isLink ? (
                              <a
                                href={req.verificationProofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#00C6FF] hover:underline block truncate max-w-[200px]"
                              >
                                {req.verificationProofUrl}
                              </a>
                            ) : (
                              <p className="text-xs text-on-surface dark:text-slate-300 line-clamp-2">{req.verificationProofUrl}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-on-surface-variant dark:text-slate-400">{formatDate(req.verificationRequestedAt)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${sc.bg} ${sc.text}`}>
                          {sc.label}
                        </span>
                        {req.verificationNote && (
                          <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 max-w-[150px] truncate" title={req.verificationNote}>
                            Lý do: {req.verificationNote}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.verificationStatus === "PENDING" && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-xs">check</span>
                              Duyệt
                            </button>
                            <button
                              onClick={() => openRejectModal(req)}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-cyan-950/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-600 dark:text-slate-400 hover:text-red-600 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-xs">close</span>
                              Từ chối
                            </button>
                          </div>
                        )}
                        {req.verificationStatus === "VERIFIED" && (
                          <span className="text-xs text-emerald-600 font-semibold">{formatDate(req.verifiedAt)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isProcessing && setRejectModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#0A1F3E] w-full max-w-md rounded-2xl shadow-2xl border border-outline-variant/10 dark:border-cyan-950/40 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-cyan-950/40">
              <h3 className="text-lg font-bold text-on-surface dark:text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600">cancel</span>
                Từ chối yêu cầu xác thực
              </h3>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">
                Giáo viên: <strong className="text-on-surface dark:text-slate-200">{rejectTarget.fullName}</strong>
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Lý do từ chối <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Ví dụ: Liên kết không hợp lệ, thiếu thông tin chứng minh..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-cyan-950/20 border border-slate-200 dark:border-cyan-950/60 rounded-xl text-sm text-on-surface dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-red-400/40 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setRejectModalOpen(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-5 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing ? (
                    <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">close</span>
                  )}
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
