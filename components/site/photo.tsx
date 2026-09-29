"use client";

import { useState } from "react";

/** Fotoğraf kutusu. Görsel yüklenemezse açıklamasıyla birlikte boş bir kutu gösterir. */
export function Photo({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(!src);
  return (
    <div className={`photo${failed ? " is-empty" : ""}${className ? ` ${className}` : ""}`}>
      {src ? <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} /> : null}
      <div className="photo-empty" aria-hidden={!failed}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <circle cx="9" cy="10" r="1.8" />
          <path d="M21 16l-5-5-9 9" />
        </svg>
        <span>{alt || "Fotoğraf"}</span>
      </div>
    </div>
  );
}
