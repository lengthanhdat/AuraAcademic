"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: string[]; // ["teacher"], ["student"], ["admin"]
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      // Chua dang nhap -> ve trang login
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (!user.role || !allowedRoles.includes(user.role)) {
        // Sai quyen -> ve trang login
        router.replace("/login");
        return;
      }
      setIsAuthorized(true);
    } catch {
      localStorage.removeItem("user");
      router.replace("/login");
    }
  }, []);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <svg className="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p className="text-sm font-semibold">Dang xac thuc...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
