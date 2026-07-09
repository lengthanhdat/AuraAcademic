/**
 * Centralized fetcher for SWR that auto-attaches the Bearer token.
 * Handles 401/403 by clearing storage and redirecting to login.
 */
export const authFetcher = async (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401 || res.status === 403) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      
      const locale = window.location.pathname.split('/')[1] || 'vi';
      const validLocales = ['en', 'vi'];
      const currentLocale = validLocales.includes(locale) ? locale : 'vi';
      
      window.location.href = `/${currentLocale}/login`;
    }
    throw new Error("Session expired");
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
};

/** Get the current user from localStorage (client-side only) */
export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
