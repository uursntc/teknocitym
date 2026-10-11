import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { BRAND_ALTERNATE_NAMES, BRAND_NAME, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/brand";

const hanken = Hanken_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: BRAND_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "/",
    siteName: BRAND_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  appleWebApp: { title: BRAND_NAME },
};

// Google'a sitenin adını ve adresini açıkça söyler (arama sonucundaki site adı için)
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND_NAME,
  alternateName: BRAND_ALTERNATE_NAMES,
  url: `${SITE_URL}/`,
  inLanguage: "tr-TR",
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
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      </head>
      <body>
        {children}
        {/* Yazdırılabilir servis fişi buraya taşınır (bkz. ticket-form.tsx); sayfanın
            geri kalanından bağımsız, body'nin doğrudan çocuğu olarak durur. */}
        <div id="print-root" />
      </body>
    </html>
  );
}
