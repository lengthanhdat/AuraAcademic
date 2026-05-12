import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import 'katex/dist/katex.min.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin", "vietnamese"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Aura Academic | Smart Exam Engine",
  description: "Hệ thống thi trắc nghiệm thông minh tích hợp AI",
};

import { AlertProvider } from "@/components/ui/AlertProvider";

export default async function RootLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const messages = await getMessages();

  return (
    <html lang={locale} className="light">
      <head>
        <link rel="icon" href="/logoweb.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${manrope.variable} bg-surface text-on-surface min-h-screen flex flex-col font-body`}>
        <NextIntlClientProvider messages={messages}>
          <AlertProvider>
            {children}
          </AlertProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
