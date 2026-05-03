import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin", "vietnamese"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Aura Academic | Smart Exam Engine",
  description: "Hệ thống thi trắc nghiệm thông minh tích hợp AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${manrope.variable} bg-surface text-on-surface min-h-screen flex flex-col font-body`}>
        {children}
      </body>
    </html>
  );
}
