import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async redirects() {
    // Eski siteden Google'ın hâlâ hafızasında tuttuğu sayfa adresleri.
    // Yeni site tek sayfa olduğu için bunları ana sayfadaki ilgili
    // bölüme veya ana sayfaya yönlendiriyoruz ki 404 yerine site açılsın.
    // Eski site .html uzantılı çalıştığı için her adresin .html hâli de var.
    const legacy: [string, string][] = [
      ["hizmetler", "/#hizmetler"],
      ["hizmetlerimiz", "/#hizmetler"],
      ["hakkimizda", "/"],
      ["iletisim", "/#iletisim"],
      ["servis", "/#servis"],
      ["tamir", "/#tamir"],
      ["satis", "/#satis"],
      ["urunler", "/#cihazlar"],
      ["cihazlar", "/#cihazlar"],
      ["index", "/"],
    ];

    return legacy.flatMap(([name, destination]) => [
      { source: `/${name}`, destination, permanent: true },
      { source: `/${name}.html`, destination, permanent: true },
    ]);
  },
};

export default nextConfig;
