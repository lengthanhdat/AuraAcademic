import { useEffect, useRef, useState } from "react";

export type ViolationType = 
  | "no_face" 
  | "multiple_faces" 
  | "cell_phone" 
  | "looking_left" 
  | "looking_right" 
  | "looking_down" 
  | "head_down_deep";

export const VIOLATION_LABELS: Record<ViolationType, string> = {
  no_face: "Không nhận diện được khuôn mặt",
  multiple_faces: "Phát hiện có nhiều người trong khung hình",
  cell_phone: "Phát hiện sử dụng điện thoại",
  looking_left: "Quay mặt sang trái",
  looking_right: "Quay mặt sang phải",
  looking_down: "Cúi nhìn tài liệu",
  head_down_deep: "Gập đầu hoặc quay lưng"
};

export function useProctoring(
  videoRef: React.RefObject<HTMLVideoElement>,
  examCode: string,
  isActive: boolean,
  isRecordingEnabled: boolean = false
) {
  const [currentViolations, setCurrentViolations] = useState<ViolationType[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
    }

    if (!isActive || !videoRef.current || !examCode) return;

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const studentId = user.id || "unknown";
    const studentName = encodeURIComponent(user.name || user.fullName || "Học sinh");

    // Kết nối WebSocket tới AI Service
    const aiBaseUrl = process.env.NEXT_PUBLIC_AI_URL || "ws://localhost:8001";
    const wsUrl = `${aiBaseUrl}/ws/detect/${examCode}/${studentId}?student_name=${studentName}&record=${isRecordingEnabled}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ Đã kết nối WebSocket tới AI Service");
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setCurrentViolations(data.currentViolations || []);
      } catch (e) {}
    };

    ws.onerror = (e) => console.error("Lỗi WebSocket AI Service:", e);
    ws.onclose = () => console.log("Ngắt kết nối WebSocket AI Service");

    const sendFrame = () => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL("image/jpeg", 0.8);
      
      ws.send(base64Image);
    };

    // Gửi liên tục 10 khung hình / giây (100ms) để tăng chất lượng video lưu trữ
    const interval = setInterval(sendFrame, 100);

    return () => {
      clearInterval(interval);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isActive, examCode, videoRef]);

  return { currentViolations };
}
