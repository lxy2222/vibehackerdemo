import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "汇报不返工",
  description: "根据原话和进度生成工作汇报，先预览网页幻灯片，再按意见调整",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
