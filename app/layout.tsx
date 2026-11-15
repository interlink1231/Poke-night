import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poke-night",
  description: "하나의 긴 여정으로 이어지는 픽셀 월드 RPG"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101712"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
