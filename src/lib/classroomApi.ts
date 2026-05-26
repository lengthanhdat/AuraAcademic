import { API_BASE as GLOBAL_API_BASE, getAuthHeaders } from "@/lib/api";

const API_BASE = `${GLOBAL_API_BASE}/classrooms`;

const jsonHeaders = () => ({
  "Content-Type": "application/json",
  ...getAuthHeaders(),
} as HeadersInit);

const authOnly = () => ({ ...getAuthHeaders() } as HeadersInit);

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data as T;
}

export const classroomApi = {
  /** Teacher: Tạo lớp học mới */
  createClassroom: (name: string, description: string) =>
    apiFetch<any>(API_BASE, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ name, description }),
    }),

  /** Teacher: Lấy danh sách lớp */
  getTeacherClassrooms: () =>
    apiFetch<any[]>(`${API_BASE}/teacher`, { headers: authOnly() }),

  /** Student: Lấy danh sách lớp đã tham gia */
  getStudentClassrooms: () =>
    apiFetch<any[]>(`${API_BASE}/student`, { headers: authOnly() }),

  /** All auth: Chi tiết lớp học (classroom, exams, materials) */
  getClassroomDetails: (id: string) =>
    apiFetch<{ classroom: any; exams: any[]; materials: any[] }>(
      `${API_BASE}/${id}`, { headers: authOnly() }
    ),

  /** All auth: Lấy lịch sử chat nhóm */
  getClassroomMessages: (id: string) =>
    apiFetch<any[]>(`${API_BASE}/${id}/messages`, { headers: authOnly() }),

  /** Student: Xin tham gia lớp bằng mã code */
  joinClassroom: (code: string) =>
    apiFetch<{ message: string }>(`${API_BASE}/join`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ code }),
    }),

  /** Teacher: Mời học sinh qua email */
  inviteStudent: (id: string, email: string) =>
    apiFetch<{ message: string }>(`${API_BASE}/${id}/invite`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ email }),
    }),

  /** Teacher: Duyệt học sinh từ danh sách chờ */
  approveStudent: (id: string, studentId: string) =>
    apiFetch<{ message: string }>(`${API_BASE}/${id}/approve/${studentId}`, {
      method: "POST",
      headers: authOnly(),
    }),

  /** Teacher: Từ chối học sinh */
  rejectStudent: (id: string, studentId: string) =>
    apiFetch<{ message: string }>(`${API_BASE}/${id}/reject/${studentId}`, {
      method: "POST",
      headers: authOnly(),
    }),
};
