# AuraAcademic - AI Proctoring & Exam Platform AWS Architecture
*(Cost-Optimized • Secure • Scalable • Highly Available)*

---

## 1. Kiến trúc tổng thể (Architecture Components)
Sơ đồ bao gồm các thành phần sau:

**🌐 Người dùng (Users)**
- Student
- Teacher

**☁️ AWS Cloud**
- **AWS Region**
  - **Virtual Private Cloud (VPC)**
    - **Public Subnets (2 Availability Zones)**
      - Internet Gateway (IGW)
      - AWS WAF (Web Application Firewall)
      - AWS Shield Standard
      - Amazon CloudFront
      - Application Load Balancer (ALB)
      - NAT Gateway (hoặc NAT Instance để tối ưu chi phí theo tài liệu hiện tại)
    - **Private Subnets (2 Availability Zones)**
      - **Amazon ECS Fargate**
        - Spring Boot Backend
        - Auto Scaling
        - Blue/Green Deployment
      - **Amazon EC2 GPU Spot Instance**
        - FastAPI YOLOv8
        - LiteLLM Proxy
        - Rolling Update
    - **Internal**
      - VPC Communication giữa ECS và EC2

**🗄️ Storage & Database**
- **Amazon S3**: Next.js Frontend Static Assets
- **MongoDB Atlas**:
  - Automated Backups
  - Connection Pooling
  - Flexible Document Database

**🧠 External AI Services**
- Google Gemini API
- Groq API

**✉️ Email Service**
- Amazon SES

**🔒 Security & Secrets**
- AWS IAM
- AWS Secrets Manager (hoặc Systems Manager Parameter Store)
- Security Groups (Least Privilege)
- VPC Flow Logs

**📊 Monitoring & Observability**
- Amazon CloudWatch
  - Container Insights (ECS)
  - GPU Utilization Metrics (EC2)
  - Application Performance Monitoring (APM)
  - Logs & Metrics
  - Alarms
  - Dashboards
- Cost & Usage Reports

**🔄 CI/CD Pipeline**
- GitHub Actions
  - ↓ Build & Test
  - ↓ Amazon ECR
  - ↓ Deployment
    - ECS Fargate (Blue/Green Deployment)
    - EC2 GPU (Rolling Update)

---

## 2. Luồng xử lý (Traffic Flow)
1. Người dùng truy cập website qua **HTTPS**.
2. Request được chuyển đến **Amazon CloudFront**.
3. CloudFront phân phối nội dung tĩnh từ **Amazon S3** (Next.js Frontend).
4. Các REST API (`/api/*`) được chuyển tới **Application Load Balancer**.
5. ALB định tuyến request đến **Amazon ECS Fargate** (Spring Boot Backend).
6. Các WebSocket (`/ws/detect/*`) được ALB chuyển tới **EC2 GPU** chạy FastAPI + YOLOv8.
7. ECS và EC2 giao tiếp nội bộ thông qua mạng **Private VPC**.
8. ECS kết nối **MongoDB Atlas** thông qua NAT Gateway/NAT Instance.
9. ECS gửi Email OTP qua **Amazon SES**.
10. LiteLLM Proxy gọi **Google Gemini API** và **Groq API** để xử lý AI.
11. GitHub Actions build Docker image, đẩy lên **Amazon ECR** và triển khai đến ECS/EC2.
12. **Amazon CloudWatch** thu thập logs, metrics và giám sát toàn bộ hệ thống.

---

## 3. Khối Security
- **AWS WAF** bảo vệ khỏi các cuộc tấn công Web.
- **AWS Shield Standard** chống DDoS.
- **Security Groups** theo nguyên tắc Least Privilege.
- **IAM Roles và Policies**.
- **AWS Secrets Manager** lưu trữ: Database URI, JWT Secret, Gemini API Key, Groq API Key, SES Credentials.
- **VPC Flow Logs** giám sát lưu lượng mạng.
- **HTTPS/TLS** với AWS Certificate Manager.

---

## 4. Khối Monitoring & Observability
- **Amazon CloudWatch** bao gồm:
  - Metrics
  - Logs
  - Container Insights cho ECS
  - GPU Utilization Metrics cho EC2
  - Application Performance Monitoring (APM)
  - Alarms
  - Dashboards
- **Cost & Usage Reports**

---

## 5. Khối CI/CD
**GitHub Actions**
- ↓ Build
- ↓ Unit Test
- ↓ Docker Build
- ↓ Amazon ECR
- ↓ Deploy
  - ECS Fargate (Blue/Green Deployment)
  - EC2 GPU (Rolling Update)

---

## 6. Architecture Highlights
- **CloudFront + S3** giúp tăng tốc phân phối nội dung toàn cầu.
- **ECS Fargate** tự động mở rộng theo CPU/Memory.
- **EC2 GPU Spot Instance** tối ưu chi phí xử lý AI.
- **LiteLLM Proxy** giúp quản lý và chuyển tiếp yêu cầu tới nhiều AI Provider.
- **MongoDB Atlas Serverless** hỗ trợ mở rộng linh hoạt.
- Hệ thống triển khai trên **VPC** với Public và Private Subnets riêng biệt.
- **AWS WAF, Shield Standard và Security Groups** tăng cường bảo mật.
- **CloudWatch** cung cấp khả năng giám sát và cảnh báo theo thời gian thực.
- **GitHub Actions kết hợp Amazon ECR** giúp tự động hóa quy trình CI/CD.
- Kiến trúc hỗ trợ mở rộng, tính sẵn sàng cao và tối ưu chi phí.

---

## 7. Cost Optimization
- **ECS** sử dụng Fargate Spot để giảm chi phí tính toán.
- **EC2 GPU Spot Instance** tiết kiệm 70-90% chi phí AI.
- **NAT Instance** có thể thay thế NAT Gateway đối với môi trường đồ án hoặc thử nghiệm.
- **CloudFront** giảm băng thông và tăng tốc độ truy cập.
- **MongoDB Atlas Free Tier hoặc Serverless** phù hợp giai đoạn phát triển.
- **Amazon SES** có chi phí thấp cho dịch vụ gửi Email.
- **Auto Scaling** giúp chỉ sử dụng tài nguyên khi cần thiết.

---

## 8. Legend
- **HTTPS Request** - Người dùng gửi yêu cầu.
- **Internal Traffic** - Giao tiếp nội bộ trong VPC.
- **WebSocket** - Kết nối thời gian thực cho AI Proctoring.
- **REST API** - Giao tiếp giữa Frontend và Backend.
- **Outbound Internet** - Truy cập MongoDB Atlas, Gemini API, Groq API thông qua NAT.
- **Logs & Metrics** - Dữ liệu giám sát gửi về CloudWatch.
- **CI/CD Flow** - Luồng triển khai từ GitHub Actions đến ECR và ECS/EC2.
