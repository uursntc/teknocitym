"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { href: "#hizmetler", label: "Hizmetler" },
  { href: "#tamir", label: "Tamir" },
  { href: "#cihazlar", label: "Cihazlar" },
  { href: "#servis", label: "Tamir talebi" },
  { href: "#sorgula", label: "Fiş sorgula" },
  { href: "#sss", label: "Sık sorulanlar" },
  { href: "#iletisim", label: "İletişim" },
];

export function SiteHeader({ name, waHref }: { name: string; waHref: string }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById("top");
      const bottom = hero ? hero.getBoundingClientRect().bottom : 0;
      setDark(bottom > 64);
      document.body.classList.toggle("in-hero", bottom > 80);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header className={`site-header${dark && !open ? " is-dark" : ""}`}>
      <div className="wrap header-row">
        <a className="brand" href="#top" aria-label={`${name}, sayfanın başına git`}>
          <span className="brand-word">{name}</span>
        </a>
        <nav id="site-nav" className={`nav${open ? " open" : ""}`} aria-label="Ana menü" onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <a className="btn btn-solid btn-sm header-cta" href={waHref} target="_blank" rel="noopener noreferrer">
            <span>WhatsApp&apos;tan yaz</span>
          </a>
          <button className="menu-btn" type="button" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((o) => !o)}>
            {open ? "Kapat" : "Menü"}
          </button>
        </div>
      </div>
    </header>
  );
}
