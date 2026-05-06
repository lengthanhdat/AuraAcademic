// Centralized API utility for Admin panel
const BASE = "http://localhost:8088";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
    throw new Error(err.error || err.message || "Lỗi máy chủ");
  }
  return res.json();
}

// ─── Admin Stats ─────────────────────────────────────────────────────────────
export function fetchAdminStats() {
  return apiFetch<Record<string, number>>("/api/admin/stats");
}

// ─── Users ───────────────────────────────────────────────────────────────────
export function fetchUsers(role?: string, search?: string) {
  const params = new URLSearchParams();
  if (role && role !== "all") params.set("role", role);
  if (search) params.set("search", search);
  return apiFetch<any[]>(`/api/admin/users?${params}`);
}

export function createUser(data: { fullName: string; email: string; role: string }) {
  return apiFetch<any>("/api/admin/users", { method: "POST", body: JSON.stringify(data) });
}

export function updateUser(id: string, data: Record<string, any>) {
  return apiFetch<any>(`/api/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteUser(id: string) {
  return apiFetch<any>(`/api/admin/users/${id}`, { method: "DELETE" });
}

export function updateUserRole(id: string, role: string) {
  return apiFetch<any>(`/api/admin/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) });
}

export function toggleUserLock(id: string, locked: boolean) {
  return apiFetch<any>(`/api/admin/users/${id}/lock`, { method: "PUT", body: JSON.stringify({ locked }) });
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export function fetchAuditLogs(limit = 100) {
  return apiFetch<any[]>(`/api/admin/audit-logs?limit=${limit}`);
}

export function fetchAuditSummary() {
  return apiFetch<Record<string, number>>("/api/admin/audit-logs/summary");
}

// ─── Exams ───────────────────────────────────────────────────────────────────
export function fetchAdminExams() {
  return apiFetch<any[]>("/api/admin/exams");
}

export function deleteAdminExam(id: string) {
  return apiFetch<any>(`/api/admin/exams/${id}`, { method: "DELETE" });
}

// ─── Settings ────────────────────────────────────────────────────────────────
export function fetchSettings() {
  return apiFetch<Record<string, any>>("/api/admin/settings");
}

export function updateSettings(settings: Record<string, any>) {
  return apiFetch<any>("/api/admin/settings", { method: "PUT", body: JSON.stringify(settings) });
}

// ─── Sessions ────────────────────────────────────────────────────────────────
export function fetchAdminSessions() {
  return apiFetch<any[]>("/api/admin/sessions");
}

export function revokeAdminSession(id: string) {
  return apiFetch<any>(`/api/admin/sessions/${id}`, { method: "DELETE" });
}

