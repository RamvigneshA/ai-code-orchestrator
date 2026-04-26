import type { Metadata } from "next";
import { Geist, Geist_Mono ,Unkempt} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const unkempt = Unkempt({
  variable: "--font-unkempt-family",
  subsets: ["latin"],
  weight: "400"
});

export const metadata: Metadata = {
  title: "AI Code Orchestrator",
  description: "AI-powered code editor with tool-based orchestration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${unkempt.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
