import type { Metadata } from "next";
import { Noto_Sans_SC, ZCOOL_XiaoWei } from "next/font/google";
import "./globals.css";

const bodyFont = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body-face",
  display: "swap",
});

const displayFont = ZCOOL_XiaoWei({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display-face",
  display: "swap",
});

export const metadata: Metadata = {
  title: "汇报不返工",
  description: "根据一句话汇报和工作材料生成工作汇报，先预览网页幻灯片，再按意见调整",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${bodyFont.variable} ${displayFont.variable}`} suppressHydrationWarning>
      <body className={`${bodyFont.className} min-h-screen antialiased`}>{children}</body>
    </html>
  );
}
