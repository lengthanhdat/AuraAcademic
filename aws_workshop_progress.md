# 📝 Nhật ký tiến độ thực hành AWS Workshop (Hệ "Độ xe")

Do chúng ta quyết định giữ lại hệ thống cũ và "độ" lên chuẩn Enterprise thay vì đập đi xây lại, file này sẽ ghi chú chính xác những gì đã làm, những gì dùng lại, và những gì đã tạo mới để bạn dễ dàng theo dõi.

---

## 🟢 Phần 5.2: Thiết kế mạng VPC (Hoàn tất)

✅ **Bước 1: VPC & NAT Gateway**
- **Quyết định:** GIỮ NGUYÊN VPC cũ (`aura-academic`). KHÔNG tạo mới.
- **Đã làm:** Gắn thêm **NAT Gateway** vào subnet Public để cấp Internet cho các subnet Private.
- **Đã làm:** Trỏ Route Table của Private Subnet ra NAT Gateway.

✅ **Bước 2: Cấp phát IP tự động (Auto-assign IP)**
- **Đã làm:** Bật tính năng `Enable auto-assign public IPv4 address` cho 2 Public Subnet (`aura-academic-subnet-public1-ap-southeast-1a` và cái còn lại).

✅ **Bước 3: Tường lửa (Security Groups)**
- **Quyết định:** "Độ" lại các Security Group có sẵn thay vì tạo mới toàn bộ.
- **Đã làm:** 
  - `aura-academic-alb-sg` (Lễ tân): Mở Port 80, 443 từ Internet (0.0.0.0/0).
  - `aura-academic-ecs-sg` (Backend): Mở Port 8080. Nguồn chỉ cho phép từ Lễ tân (`aura-academic-alb-sg`).
  - `aura-academic-ai-sg` (AI EC2): Mở Port 8001 từ Lễ tân, Port 4000 từ Backend. **Đã bỏ Port 22 (SSH)** vì sẽ kết nối qua Session Manager bảo mật hơn.

---

## 🟡 Phần 5.3: Triển khai Backend lên ECS Fargate (Đang tiến hành)

✅ **Bước 1: Kho chứa Docker Image (Amazon ECR)**
- **Quyết định:** TẬN DỤNG LẠI kho `aura-academic-be` cũ.
- **Đã làm:** Không cần tạo mới. Giữ nguyên để tận dụng CI/CD Github Actions cũ.

⏳ **Bước 2: Thiết lập Application Load Balancer (ALB)**
- **Quyết định:** TẬN DỤNG LẠI ALB cũ (`aura-academic-alb`).
- **Đã làm:** Kiểm tra ALB đang gắn đúng vào VPC và Security Group `aura-academic-alb-sg`.
- **Đang làm:** 
  - Tạo mới **Target Group** tên `aura-academic-ecs-tg` (Target type: **IP**, Port: 8080).
  - Trỏ cái **Listener (HTTP:80)** của ALB cũ sang Target Group mới này.

---

✅ **Bước 3: Tạo Cụm tính toán (ECS Cluster)**
- **Quyết định:** TẬN DỤNG LẠI Cluster cũ (`aura-academic-cluster`).
- **Chiến thuật (Zero Downtime):** 
  - KHÔNG xóa Service cũ ngay. Cứ để hệ thống cũ tiếp tục chạy phục vụ user.
  - Sẽ tạo Service mới (phiên bản Enterprise) chạy song song. Khi nào Service mới chạy ổn, ALB sẽ tự động bẻ lái request sang, lúc đó mới quay lại tắt Service cũ đi. Đúng chuẩn Deploy thực chiến!

⏳ **Bước 4 & 5: Task Definition & ECS Service**
- **Đang làm:** Chuẩn bị cấu hình để chạy ứng dụng vào đúng Private Subnet mới.

---
*Ghi chú: Sẽ tiếp tục cập nhật khi tiến sang các bước tạo Fargate Service.*

---

## 🟢 Phần 5.4: EC2 GPU AI (Hoàn tất)

✅ **Bước 1 & 2 & 3 & 4: Khởi tạo, Gán quyền và Chạy AI Engine**
- **Đã làm:** Khởi tạo thành công máy ảo EC2 `aura-academic-ai-server` trong Private Subnet.
- **Đã làm:** Gán quyền IAM Role (SSM & CloudWatch) để có thể chui vào máy ảo không cần mở Port 22 (SSH).
- **Đã làm:** Cài đặt đầy đủ thư viện (có kèm cờ vượt rào `--break-system-packages` của Ubuntu 24.04) và các thư viện đồ họa hệ thống (`libgl1`, `libglib2.0-0`).
- **Đã làm:** Kéo code từ Github và khởi chạy AI Engine ngầm thành công với lệnh `nohup`.

⏳ **Bước 5: Tạo Target Group và Gắn vào Load Balancer**
- **Đang làm:** Sẽ tạo Target Group `aura-academic-ai-tg` (Port 8001) trỏ vào máy EC2 này, và cấu hình ALB Route traffic tới.

---

## 🗑️ Danh sách "Tàn dư" đã được trảm (Cleaned-up)
*Hệ thống Enterprise mới đã chạy mượt mà 100%, chúng ta đã xóa sổ những món "đồ cổ" này để tiết kiệm tiền AWS:*
1. ✅ **(Đã xóa) ECS Service cũ:** Cái service cũ chạy ngầm trong `aura-academic-cluster`.
2. ✅ **(Đã xóa) Target Group cũ:** `aura-academic-tg-ec2` (tàn dư của Backend EC2 cũ).
3. ✅ **(Đã xóa) EC2 Instance cũ:** Máy ảo Ubuntu cũ từng dùng để chạy Backend. Hệ thống giờ đã hoàn toàn Serverless (Fargate) cho Backend và chỉ giữ 1 con EC2 cho AI.
