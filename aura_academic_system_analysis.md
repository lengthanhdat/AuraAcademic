# 🎓 AuraAcademic — Tổng hợp Kiến trúc & Luồng Hoạt động
> Phân tích từ source code thực tế | Cập nhật: 2026-07-06

---

## 1. TỔNG QUAN HỆ THỐNG

**AuraAcademic** là nền tảng thi trực tuyến tích hợp AI giám sát (AI Proctoring), được xây dựng theo kiến trúc **3-Service Architecture**:

| Service | Công nghệ | Port | Mô tả |
|---------|-----------|------|-------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, i18n | 3000 | Giao diện sinh viên & giáo viên |
| **Backend** | Spring Boot 3.2.5, Java 21, MongoDB | 8088 | Core API, Auth, Business Logic |
| **AI Service** | FastAPI, Python, YOLOv8, OpenCV | 8001 | Giám sát camera theo thời gian thực |

**Database:** MongoDB Atlas (cloud, Free Tier M0)  
**AI Gateway:** LiteLLM Proxy (load balancing 5 Gemini keys + 5 Groq keys)  
**Đa ngôn ngữ:** Tiếng Việt + Tiếng Anh (next-intl)

---

## 2. CÁC NHÂN VẬT (ACTORS)

| Nhân vật | Role | Quyền hạn chính |
|----------|------|-----------------|
| **Student** (Thí sinh) | `student` | Làm bài thi, xem kết quả, luyện tập, nhắn tin lớp học |
| **Teacher** (Giáo viên) | `teacher` | Tạo đề thi, quản lý lớp, xem báo cáo vi phạm, chat AI |
| **Admin** | `admin` | Quản lý user, cấu hình hệ thống, xem Audit Log |

---

## 3. CÁC MODULE CHÍNH & DATA MODELS

### 3.1 Module Xác thực (Auth Module)

**Service:** `AuthService.java` + `AuthController.java`

**User Model** — Collection: `users`
```
User {
  id, studentId, fullName, email, phoneNumber
  role: "student" | "teacher" | "admin"
  provider: "local" | "google"          # Đăng nhập Google OAuth
  emailVerified, emailVerificationToken  # Xác thực email
  passwordResetToken, passwordResetExpiry
  twoFactorEnabled, twoFactorSecret     # 2FA (TOTP)
  accountLocked, failedLoginAttempts    # Rate limiting
  verificationStatus: "STANDARD" | "PENDING" | "VERIFIED" | "REJECTED"  # Giáo viên
  avatarUrl, bio, certificates, experience
}
```

**Tính năng bảo mật:**
- JWT Access Token + Refresh Token (lưu MongoDB)
- Đăng nhập Google (Google OAuth ID Token verification)
- 2FA với TOTP (TOTP Spring Boot Starter)
- Rate Limiting với Bucket4j + Caffeine Cache
- Audit Log mọi hành động quan trọng
- Giáo viên phải qua duyệt (Hybrid Sandbox Model): STANDARD → PENDING → VERIFIED

---

### 3.2 Module Kỳ thi (Exam Module)

**Service:** `ExamController.java` (757 lines)

**Exam Model** — Collection: `exams`
```
Exam {
  id, title, duration, shuffle, aiProctoring, allowReview
  teacherId, teacherName
  status: "DRAFT" | "PUBLISHED" | "FINISHED"
  accessCode          # Mã phòng thi 6 ký tự (VD: A1B2C3)
  startTime, scheduledStartTime
  difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT"
  versions: [ExamVersion]   # Hỗ trợ nhiều version đề
  grade, subject            # Lớp, môn học
  classroomId               # Liên kết lớp học
  isPractice, isBankItem, isTemplate  # Phân loại đề
  folderId                  # Ngân hàng đề (thư mục)
}

ExamResult {
  examId, studentId, studentName
  answers, score, submittedAt
}
```

**API endpoints chính:**
- `GET /api/exams/{code}/stream` — SSE realtime (giáo viên theo dõi phòng thi)
- `POST /api/exams/submit` — Nộp bài
- `POST /api/exams/{code}/violation` — AI báo cáo gian lận
- `GET /api/exams/{code}/violations` — Xem danh sách vi phạm

---

### 3.3 Module Lớp học (Classroom Module)

**Service:** `ClassroomController.java` (28KB)

```
Classroom {
  id, name, teacherId
  studentIds: [String]
  posts, messages   # Bảng tin lớp học + nhắn tin
}
```

---

### 3.4 Module Tài liệu & Chat AI (Material + AI Chat)

```
Material {
  id, title, content, type   # Tài liệu của lớp học
  classroomId, teacherId
}

ChatMessage {
  id, roomId, senderId, content, timestamp
}
```

- **AI Chat:** `AiChatService.java` — Giáo viên chat với AI (Gemini/Groq) về đề thi
- **LiteLLM Proxy:** Load balancing 5 Gemini keys + 5 Groq keys, tự động failover

---

### 3.5 Module Vi phạm (Violation Module)

**Service:** `ViolationController.java`

```
ViolationLog {
  examCode, studentId, studentName
  type: "no_face" | "multiple_faces" | "cell_phone" | "looking_left" 
        | "looking_right" | "looking_down" | "head_down_deep"
  videoUrl (legacy), videoBase64   # Video bằng chứng 5 giây
  timestamp
}
```

---

## 4. AI SERVICE — YOLO Proctoring Engine

**File:** `AuraAcademic_AI/main.py`

### Công nghệ:
- **FastAPI** + WebSockets
- **YOLOv8n** (`yolov8n.pt`) — Phát hiện người & điện thoại (class 0=person, class 67=phone)
- **YOLOv8n-Pose** (`yolov8n-pose.pt`) — Phân tích khung xương/hướng mặt

### WebSocket endpoint:
```
WS /ws/detect/{exam_code}/{student_id}?student_name=X&record=true/false
```

### Thuật toán phát hiện vi phạm:
1. Nhận 3 frame/giây từ frontend (base64 JPEG)
2. Chạy YOLO detection → đếm người, phát hiện điện thoại (conf > 0.45)
3. Chạy YOLO Pose → phân tích tỉ lệ khoảng cách mũi/mắt để xác định hướng nhìn
4. **Counter-based**: Vi phạm phải liên tục ≥ 4 frames (~1.3s) mới kích hoạt (chống false positive)
5. Cooldown 5 giây giữa 2 lần báo cáo
6. Nếu `record=true` (đang thi): Xuất video 5 giây (buffer 15 frames) → encode `.webm` → Base64 → POST về Spring Boot
7. Nếu `record=false` (lobby): Chỉ cảnh báo UI, không gửi báo cáo

---

## 5. AI QUESTION EXTRACTION — Bóc tách đề thi

**Service:** `QuestionExtractionService.java` (514 lines)

### Luồng xử lý:
1. Upload file PDF/DOCX → `DocumentExtractorService` trích xuất text
2. **PDF có chữ**: Dùng `PDFTextStripper` (Apache PDFBox) → parse regex
3. **PDF scan ảnh**: Render thành ảnh → gửi Gemini Vision (`gemini-2.0-flash`) để OCR
4. Regex parsing: Tách câu hỏi, đáp án A/B/C/D, đánh dấu đúng sai
5. **LiteLLM Proxy** load balancing giữa 5 Gemini keys + 5 Groq keys

---

## 6. LUỒNG HOẠT ĐỘNG CHI TIẾT

### 🔐 Luồng 1: Đăng ký & Đăng nhập

```
User → [POST /api/auth/register]
  → Backend lưu User (emailVerified=false)
  → Gửi email xác thực (SMTP/SES)
  → User click link → [GET /api/auth/verify-email?token=...]
  → emailVerified=true

User → [POST /api/auth/login]
  → Kiểm tra failedLoginAttempts (khóa sau 5 lần)
  → BCrypt password verify
  → Nếu 2FA enabled → trả về 202 "OTP_REQUIRED" → gửi OTP qua email (TTL 10 phút)
  → User nhập OTP → [POST /api/auth/login/2fa]
  → Trả về { accessToken (JWT), refreshToken }

Google OAuth:
User → Frontend lấy Google ID Token
  → [POST /api/auth/google-login] { idToken }
  → Backend verify với Google API → tạo/tìm User
  → Trả về JWT
```

---

### 📋 Luồng 2: Giáo viên tạo & phát đề thi

```
Giáo viên → Upload PDF/DOCX
  → [POST /api/ai/extract-questions]
  → QuestionExtractionService chạy async (@Async)
  → Parse text hoặc Gemini Vision OCR
  → Trả về List<Question>

Giáo viên → Chỉnh sửa câu hỏi → Lưu đề thi (status=DRAFT)
  → [POST /api/exams] → Exam lưu MongoDB

Giáo viên → Publish đề: [PATCH /api/exams/{id}/publish]
  → status=PUBLISHED
  → Tạo accessCode ngẫu nhiên 6 ký tự
  → Hệ thống broadcast SSE cho các client đang nghe
```

---

### 🎓 Luồng 3: Sinh viên vào phòng thi (Lobby → Exam)

```
Sinh viên → Nhập accessCode → [GET /api/exams/join/{code}]
  → Kiểm tra exam status=PUBLISHED
  → Trả về thông tin đề thi (KHÔNG trả đáp án đúng)

Lobby:
Sinh viên → Browser kết nối WebSocket AI (record=false)
  → AI giám sát nhưng không lưu vi phạm
  → SSE stream nhận sự kiện "start" từ giáo viên

Giáo viên → [POST /api/exams/{code}/start]
  → ExamEventService broadcast SSE event "start"
  → TẤT CẢ sinh viên trong lobby tự động vào phòng thi

Trong phòng thi:
Sinh viên → WebSocket kết nối lại (record=true)
  → Browser gửi 3 frame/giây lên FastAPI :8001
  → AI xử lý real-time
  → Frontend nhận JSON {currentViolations: [...]} hiển thị nháy đỏ

Khi vi phạm:
AI (FastAPI) → [POST :8088/api/exams/{code}/violation] {videoBase64}
  → ViolationController lưu ViolationLog
  → ExamEventService broadcast SSE "violation" event
  → Giáo viên nhận cảnh báo realtime trong trang monitoring
```

---

### 📤 Luồng 4: Nộp bài & Xem kết quả

```
Sinh viên → [POST /api/exams/submit] { examId, answers }
  → Kiểm tra chưa nộp (idempotent)
  → Tính điểm → Lưu ExamResult
  → activeParticipantService.removeParticipant()
  → broadcast SSE "result" → giáo viên thấy realtime

Sinh viên → [GET /api/exams/{id}/result]
  → Trả về điểm, đáp án đúng (nếu allowReview=true)

Giáo viên → [GET /api/exams/{code}/violations]
  → Xem danh sách vi phạm kèm video Base64
```

---

### 📡 Luồng 5: Realtime (SSE)

```
Giáo viên → [GET /api/exams/{code}/stream]  (SSE connection)
  → ExamEventService.subscribe(code) → trả về SseEmitter

Các sự kiện được broadcast:
  "join"      → sinh viên vào lobby
  "start"     → bắt đầu kỳ thi
  "result"    → sinh viên nộp bài
  "violation" → AI phát hiện gian lận
  "leave"     → sinh viên rời phòng
```

---

## 7. FRONTEND PAGES MAP

### Student (Sinh viên) — `/student/...`
| Route | Chức năng |
|-------|-----------|
| `/student/dashboard` | Tổng quan, kỳ thi sắp tới |
| `/student/exams` | Vào thi (nhập mã) |
| `/student/lobby` | Phòng chờ + camera test |
| `/student/results` | Lịch sử bài làm, điểm số |
| `/student/exam-bank` | Ngân hàng đề luyện tập |
| `/student/classrooms` | Lớp học đã tham gia |
| `/student/materials` | Tài liệu học tập |
| `/student/notifications` | Thông báo |
| `/student/profile` | Hồ sơ cá nhân |

### Teacher (Giáo viên) — `/teacher/...`
| Route | Chức năng |
|-------|-----------|
| `/teacher/dashboard` | Tổng quan, thống kê |
| `/teacher/exams` | Quản lý kỳ thi (Tạo, edit, publish) |
| `/teacher/exam-room` | Điều hành phòng thi live |
| `/teacher/monitoring` | Xem camera + vi phạm realtime |
| `/teacher/reports` | Báo cáo vi phạm + video bằng chứng |
| `/teacher/exam-bank` | Ngân hàng đề thi |
| `/teacher/exam-templates` | Kho đề mẫu |
| `/teacher/classrooms` | Quản lý lớp học |
| `/teacher/materials` | Quản lý tài liệu |
| `/teacher/my-exams` | Đề thi của tôi |
| `/teacher/verify` | Xác minh tư cách giáo viên |
| `/teacher/profile` | Hồ sơ cá nhân |

---

## 8. TECH STACK TỔNG HỢP

### Backend (Spring Boot)
| Thư viện | Mục đích |
|----------|----------|
| Spring Boot 3.2.5 + Java 21 | Core Framework |
| Spring Data MongoDB | ORM cho MongoDB |
| Spring Security + JJWT 0.12.6 | Auth & JWT |
| Spring WebSocket | Chat phòng học |
| Spring Mail + Thymeleaf | Gửi email HTML |
| Google GenAI SDK 1.0.0 | Tích hợp Gemini API |
| Google API Client 2.4.0 | Verify Google ID Token |
| Apache PDFBox 3.0.2 | Parse PDF |
| Apache POI 5.3.0 | Parse DOCX |
| TOTP (dev.samstevens) 1.7.1 | 2FA TOTP |
| Bucket4j 8.10.1 + Caffeine | Rate Limiting |
| Spring Retry + AOP | Retry logic |
| Lombok 1.18.36 | Code generation |

### AI Service (FastAPI + Python)
| Thư viện | Mục đích |
|----------|----------|
| FastAPI + Uvicorn | API & WebSocket Server |
| Ultralytics YOLOv8 | Object Detection + Pose |
| OpenCV Headless | Image processing |
| NumPy | Matrix operations |

### Frontend (Next.js)
| Thư viện | Mục đích |
|----------|----------|
| Next.js 14 | React Framework + SSR |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| next-intl | Đa ngôn ngữ (VI/EN) |
| shadcn/ui | UI Components |

---

## 9. ĐỐI CHIẾU VỚI KIẾN TRÚC AWS (Điểm khớp & Điểm chưa khớp)

### ✅ Kiến trúc thực tế (Local Dev → AWS ready)

| Thành phần local | Thành phần AWS tương ứng |
|-----------------|--------------------------|
| Next.js dev server | S3 (static) + CloudFront CDN |
| Spring Boot :8088 | ECS Fargate Spot Container |
| FastAPI :8001 | EC2 GPU Spot (g4dn.xlarge) |
| MongoDB Atlas (local dev) | MongoDB Atlas (Cloud — **không đổi**) |
| SMTP (Spring Mail) | Amazon SES |
| Localhost network | NAT Instance → Internet |

### ⚠️ Lưu ý quan trọng cho sơ đồ

1. **FastAPI AI Service cần GPU** → Bắt buộc chạy trên EC2 GPU, không thể Fargate
2. **Luồng camera:** Browser → WebSocket → **EC2 GPU trực tiếp** (ALB route WebSockets đến EC2), **không qua ECS**
3. **Video bằng chứng:** EC2 GPU encode `.webm` → Base64 → POST về Spring Boot (`:8088/api/exams/{code}/violation`) → Lưu MongoDB (không cần S3 để đơn giản hóa)
4. **LiteLLM Proxy** (AI Service) chạy cùng EC2 hoặc ECS → gọi ra Gemini/Groq qua Internet
5. **MongoDB Atlas** là External Service (không nằm trong VPC)
6. **Không dùng SQS/Lambda** — Spring Boot dùng `@Async` cho bóc tách đề (đúng như đã thiết kế)

---

## 10. ĐIỂM CẦN CHÚ Ý KHI BÁO CÁO

1. **Unique selling point:** Hệ thống là **end-to-end tự xây**, từ AI detection đến lưu video bằng chứng — không dùng third-party proctoring đắt tiền
2. **Cost optimization thực sự:** 5 Gemini API keys luân phiên (free tier 1500 req/ngày × 5 = 7500 req/ngày miễn phí)
3. **Real-time stack:** SSE (Server-Sent Events) cho monitoring giáo viên, WebSocket cho camera stream — đều được implement thực tế
4. **Security depth:** JWT + Refresh Token + 2FA TOTP + Account Lockout + Rate Limiting + Audit Log — security rất nghiêm túc
