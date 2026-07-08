"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type BrowserViolationType = "tab_switch" | "window_blur" | "fullscreen_exit" | "copy_attempt" | "devtools_attempt";

export const BROWSER_VIOLATION_LABELS: Record<BrowserViolationType, string> = {
  tab_switch: "Chuyển sang tab khác",
  window_blur: "Rời khỏi cửa sổ thi",
  fullscreen_exit: "Thoát chế độ toàn màn hình",
  copy_attempt: "Cố gắng sao chép văn bản",
  devtools_attempt: "Mở công cụ Developer",
};

export interface BrowserProctoringOptions {
  examCode: string;
  studentId: string | number;
  studentName: string;
  isActive: boolean;
  maxViolations?: number;
  onForceSubmit: () => void;
}

export function useBrowserProctoring({
  examCode,
  studentId,
  studentName,
  isActive,
  maxViolations = 3,
  onForceSubmit,
}: BrowserProctoringOptions) {
  const [violationCount, setViolationCount] = useState(0);
  const [lastViolation, setLastViolation] = useState<BrowserViolationType | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const violationCountRef = useRef(0); // dùng ref để tránh stale closure trong event listeners

  // Báo cáo vi phạm về backend
  const reportViolation = useCallback(async (type: BrowserViolationType) => {
    try {
      const token = localStorage.getItem("accessToken");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088') + ''}/api/exams/${examCode}/violation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId,
          studentName,
          type: `BROWSER_${type.toUpperCase()}`,
          videoBase64: null,
        }),
      });
    } catch (_) {
      // Bỏ qua lỗi mạng, không ảnh hưởng bài thi
    }
  }, [examCode, studentId, studentName]);

  // Xử lý khi có vi phạm
  const handleViolation = useCallback((type: BrowserViolationType) => {
    if (!isActive) return;

    violationCountRef.current += 1;
    const newCount = violationCountRef.current;

    setViolationCount(newCount);
    setLastViolation(type);
    setShowWarningModal(true);

    // Báo cáo backend bất đồng bộ
    reportViolation(type);

    // Nếu đã đạt ngưỡng tối đa → đình chỉ thi
    if (newCount >= maxViolations) {
      setTimeout(() => {
        setShowWarningModal(false);
        onForceSubmit();
      }, 3000);
    }
  }, [isActive, maxViolations, onForceSubmit, reportViolation]);

  // Yêu cầu vào chế độ toàn màn hình
  const requestFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.warn("Không thể vào chế độ toàn màn hình:", err);
    }
  }, []);

  const dismissWarning = useCallback(() => {
    setShowWarningModal(false);
    // Yêu cầu lại fullscreen sau khi học sinh bấm tiếp tục
    if (!document.fullscreenElement) {
      requestFullscreen();
    }
  }, [requestFullscreen]);

  useEffect(() => {
    if (!isActive) return;

    // ===  1. THEO DÕI FULLSCREEN ===
    const onFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        handleViolation("fullscreen_exit");
      }
    };

    // === 2. THEO DÕI CHUYỂN TAB ===
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleViolation("tab_switch");
      }
    };

    // === 3. THEO DÕI MẤT FOCUS CỬA SỔ ===
    const onWindowBlur = () => {
      handleViolation("window_blur");
    };

    // === 4. CHẶN CÁC PHÍM TẮT NGUY HIỂM ===
    const onKeydown = (e: KeyboardEvent) => {
      // Chặn F12
      if (e.key === "F12") {
        e.preventDefault();
        handleViolation("devtools_attempt");
        return;
      }

      // Chặn Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j")) {
        e.preventDefault();
        handleViolation("devtools_attempt");
        return;
      }
      if (e.ctrlKey && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        handleViolation("devtools_attempt");
        return;
      }

      // Chặn Ctrl+C, Ctrl+X
      if (e.ctrlKey && (e.key === "c" || e.key === "C" || e.key === "x" || e.key === "X")) {
        e.preventDefault();
        handleViolation("copy_attempt");
        return;
      }
    };

    // === 5. CHẶN MENU CHUỘT PHẢI & BÔI ĐEN VĂN BẢN ===
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation("copy_attempt");
    };

    // Đăng ký tất cả events
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onCopy);
    window.addEventListener("blur", onWindowBlur);

    // Cleanup khi component unmount hoặc isActive = false
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onCopy);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [isActive, handleViolation]);

  return {
    violationCount,
    lastViolation,
    showWarningModal,
    isFullscreen,
    requestFullscreen,
    dismissWarning,
    maxViolations,
  };
}
