export const API_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8088";
export const API_BASE = `${API_ORIGIN.replace(/\/$/, "")}/api`;

export function getAuthHeaders(extra?: HeadersInit): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
