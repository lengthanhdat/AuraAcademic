# 🎓 Aura Academic - Frontend

[![Next.js](https://img.shields.io/badge/Next.js-14.2.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Aura Academic** is a modern, AI-powered examination management system designed to streamline the academic process for both students and teachers. This repository contains the frontend application built with Next.js 14.

---

## ✨ Features

### 👨‍🎓 For Students
- **Interactive Dashboard**: Track upcoming exams and recent performance.
- **Dynamic Exam Interface**: Seamlessly take exams with support for complex mathematical formulas via KaTeX.
- **Real-time Notifications**: Get instant feedback and alerts using Sonner.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop views.

### 👩‍🏫 For Teachers (In Development)
- **Exam Management**: Create, edit, and manage examination rooms.
- **AI-Powered Question Generation**: Leverage AI to assist in creating high-quality exam questions.
- **Student Performance Analytics**: Gain insights into class performance.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Math Rendering**: [KaTeX](https://katex.org/)
- **State Management**: React Hooks & Context API
- **Animations**: [Tailwind CSS Animate](https://github.com/jamiebuilds/tailwindcss-animate)

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/lengthanhdat/AuraAcademic.git
   cd AuraAcademic
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory and add your backend API URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

---

## 📂 Folder Structure

```text
.
├── app/                # Next.js App Router (Pages & Layouts)
│   ├── (auth)/         # Authentication routes
│   ├── student/        # Student-facing pages
│   ├── teacher/        # Teacher-facing pages
│   └── layout.tsx      # Root layout
├── components/         # Reusable UI components
├── lib/                # Utility functions and configurations
├── public/             # Static assets
├── styles/             # Global styles
├── .gitignore          # Git ignore rules
├── package.json        # Project dependencies and scripts
└── tailwind.config.ts  # Tailwind CSS configuration
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/lengthanhdat">lengthanhdat</a>
</p>
