import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async redirects() {
    // Eski siteden Google'ın hâlâ hafızasında tuttuğu sayfa adresleri.
    // Yeni site tek sayfa olduğu için bunları ana sayfadaki ilgili
    // bölüme veya ana sayfaya yönlendiriyoruz ki 404 yerine site açılsın.
    return [
      { source: "/hizmetler", destination: "/#hizmetler", permanent: true },
      { source: "/hakkimizda", destination: "/", permanent: true },
      { source: "/iletisim", destination: "/#iletisim", permanent: true },
      { source: "/servis", destination: "/#servis", permanent: true },
      { source: "/tamir", destination: "/#tamir", permanent: true },
      { source: "/satis", destination: "/#satis", permanent: true },
    ];
  },
};

export default nextConfig;
