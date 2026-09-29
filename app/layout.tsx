import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "teknocitym | Apple, PlayStation ve bilgisayar satış ve tamir",
  description:
    "iPhone, iPad, MacBook, PlayStation ve bilgisayar satışı ve teknik servisi. Ücretsiz arıza tespiti, fiş numarasıyla online durum sorgulama.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0D0D0E",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={hanken.variable}>
      <body>{children}</body>
    </html>
  );
}
