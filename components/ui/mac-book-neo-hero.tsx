"use client";

/*
 * FrameSequenceHero (mac-book-neo-hero)
 *
 * Kaydırmaya bağlı kare dizisi animasyonu. 21st.dev'deki orijinal bileşenden
 * uyarlandı; yapılan değişiklikler:
 *  - Kareler <img> yerine <canvas> üzerine çiziliyor: kaydırırken titreme olmaz,
 *    retina ekranda net görünür ve her karede React yeniden çizim yapmaz.
 *  - Sahne tüm sayfaya "fixed" yapışmak yerine kendi bölümünde "sticky" duruyor;
 *    animasyon bitince sayfanın geri kalanı normal şekilde akar.
 *  - İlerleme window.scrollY yerine bölümün konumundan hesaplanıyor, bu yüzden
 *    bileşen sayfanın herhangi bir yerinde kullanılabilir.
 *  - Yükleme ekranı yalnızca sahneyi kaplar; metni `loadingText` ile değişir.
 *  - Karenin odak noktası (`focusX`, `focusY`) her ekranda ortalanır.
 *  - Geniş ekranda başlık, adım kartları başlayınca kaybolur; animasyon öne çıkar.
 *  - "Hareketi azalt" tercihinde kareler yumuşatılmadan doğrudan gösterilir.
 *  - Üst menü isteğe bağlı: brand / navLinks / ctaLabel verilmezse çizilmez.
 */

import * as React from "react";
import { useEffect, useRef, useState } from "react";

export type FrameSequenceStep = {
  from: number;
  to: number;
  color: string;
  num?: string;
  total?: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  label: string;
};

export type FrameSequenceHeroProps = {
  frameCount: number;
  framePath: (i: number) => string;
  eagerCount?: number;
  scrollHeight?: string;
  brand?: React.ReactNode;
  navLinks?: { label: string; href: string }[];
  ctaLabel?: string;
  ctaHref?: string;
  title: React.ReactNode;
  subtitle?: string;
  steps: FrameSequenceStep[];
  className?: string;
  id?: string;
  /** Yükleme ekranı metni; yüzde değeri parametre olarak gelir. */
  loadingText?: (pct: number) => string;
  /** Karedeki ana nesnenin konumu (0–1). Dikey ekranlarda bu nokta ortalanır. */
  focusX?: number;
  focusY?: number;
  /** Karelerin kenar rengiyle aynı arka plan rengi. */
  background?: string;
};

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const pad2 = (n: number) => String(n).padStart(2, "0");

export function FrameSequenceHero({
  frameCount,
  framePath,
  eagerCount = 140,
  scrollHeight = "600vh",
  brand,
  navLinks = [],
  ctaLabel,
  ctaHref = "#",
  title,
  subtitle,
  steps,
  className,
  id,
  loadingText = (p) => (p < 100 ? `Yükleniyor %${p}` : "Hazır"),
  focusX = 0.5,
  focusY = 0.5,
  background = "#0D0D0E",
}: FrameSequenceHeroProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const cacheRef = useRef<HTMLImageElement[]>([]);
  const targetFrameRef = useRef(0);
  const displayFrameRef = useRef(0);
  const lastShownRef = useRef(-1);
  const rafRef = useRef<number | null>(null);
  const reducedRef = useRef(false);
  const stickyTopRef = useRef(0);

  // Değişen props'ları efektleri yeniden kurmadan okumak için
  const optsRef = useRef({ framePath, focusX, focusY, background, steps });
  optsRef.current = { framePath, focusX, focusY, background, steps };

  const [loadPct, setLoadPct] = useState(0);
  const [loaderDone, setLoaderDone] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [subHidden, setSubHidden] = useState(false);
  const [copyHidden, setCopyHidden] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [stepLocal, setStepLocal] = useState(0);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cache = cacheRef.current;
    let cancelled = false;
    let loaded = 0;

    const ready = (img?: HTMLImageElement) => !!img && img.complete && img.naturalWidth > 0;

    /** idx karesini çizer; henüz yüklenmediyse en yakın yüklü kareyi kullanır. */
    const draw = (idx: number, force = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (!force && idx === lastShownRef.current) return;
      let img: HTMLImageElement | undefined = cache[idx];
      const exact = ready(img);
      if (!exact) {
        img = undefined;
        for (let d = 1; d < frameCount && !img; d++) {
          if (ready(cache[idx - d])) img = cache[idx - d];
          else if (ready(cache[idx + d])) img = cache[idx + d];
        }
        if (!img) return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx || !img) return;
      const { focusX: fx, focusY: fy, background: bg } = optsRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (!cw || !ch) return;
      const w = Math.round(cw * dpr);
      const h = Math.round(ch * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cw, ch);
      const fw = img.naturalWidth;
      const fh = img.naturalHeight;
      const portrait = cw / ch < 0.9;
      // Yatay ekranda kapla (cover); dikeyde nesneyi büyük tut ve ortala
      const s = portrait ? (cw / fw) * 1.55 : Math.max(cw / fw, ch / fh);
      const dw = fw * s;
      const dh = fh * s;
      // Geniş ekranda ilk karelerde nesne sağda durur (başlığa yer açar), sonra ortaya kayar.
      // Boşluk kalırsa arka plan rengiyle dolar.
      const k = portrait ? 1 : Math.min(1, idx / Math.max(1, (frameCount - 1) * 0.1));
      const targetX = 0.6 - 0.1 * (k * k * (3 - 2 * k));
      const dx = cw * targetX - fx * dw;
      const dy = ch * (portrait ? 0.47 : 0.5) - fy * dh;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, dx, dy, dw, dh);
      lastShownRef.current = exact ? idx : -1;
    };

    const tick = () => {
      const diff = targetFrameRef.current - displayFrameRef.current;
      if (reducedRef.current || Math.abs(diff) < 0.08) displayFrameRef.current = targetFrameRef.current;
      else displayFrameRef.current += diff * 0.28;
      const idx = clamp(Math.round(displayFrameRef.current), 0, frameCount - 1);
      draw(idx);
      if (displayFrameRef.current !== targetFrameRef.current) rafRef.current = requestAnimationFrame(tick);
      else rafRef.current = null;
    };
    const loop = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
    };

    // --- Kareleri yükle: önce ilk `eager` kare, sonra kalanlar ---
    const eager = Math.min(eagerCount, frameCount);
    const loadOne = (i: number) => {
      const img = new Image();
      img.decoding = "async";
      const settle = () => {
        if (cancelled) return;
        loaded += 1;
        setLoadPct(Math.round((loaded / frameCount) * 100));
        const current = clamp(Math.round(displayFrameRef.current), 0, frameCount - 1);
        if (i === current || lastShownRef.current === -1) draw(current, true);
        if (loaded === eager) {
          setLoaderDone(true);
          for (let j = eager; j < frameCount; j++) loadOne(j);
        }
      };
      img.onload = settle;
      img.onerror = settle;
      img.src = optsRef.current.framePath(i + 1);
      cache[i] = img;
    };
    for (let i = 0; i < eager; i++) loadOne(i);

    // --- Kaydırma ---
    const measure = () => {
      const stage = stageRef.current;
      stickyTopRef.current = stage ? parseFloat(getComputedStyle(stage).top) || 0 : 0;
    };
    const onScroll = () => {
      const track = trackRef.current;
      const stage = stageRef.current;
      if (!track || !stage) return;
      const rect = track.getBoundingClientRect();
      const total = track.offsetHeight - stage.offsetHeight;
      const p = clamp((stickyTopRef.current - rect.top) / Math.max(1, total), 0, 1);
      targetFrameRef.current = p * (frameCount - 1);
      loop();
      setProgress(p);
      setNavScrolled(window.scrollY > 4);
      setSubHidden(p > 0.012);
      setCopyHidden(p > 0.035);
      const list = optsRef.current.steps;
      let idx = -1;
      let local = 0;
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        if (p >= s.from && p < s.to) {
          idx = i;
          local = (p - s.from) / (s.to - s.from);
          break;
        }
      }
      setActiveIdx(idx);
      setStepLocal(clamp(local, 0, 1));
    };
    const onResize = () => {
      measure();
      onScroll();
      draw(clamp(Math.round(displayFrameRef.current), 0, frameCount - 1), true);
    };

    measure();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [frameCount, eagerCount]);

  const hasNav = !!brand || navLinks.length > 0 || !!ctaLabel;

  return (
    <div id={id} className={cx("fsh-root", className)}>
      {hasNav && (
        <nav className={cx("fsh-nav", navScrolled && "fsh-nav-scrolled")}>
          <div className="fsh-brand">{brand}</div>
          {navLinks.length > 0 && (
            <div className="fsh-nav-links">
              {navLinks.map((l) => (
                <a key={l.label} href={l.href}>
                  {l.label}
                </a>
              ))}
            </div>
          )}
          {ctaLabel && (
            <a href={ctaHref} className="fsh-cta">
              {ctaLabel}
            </a>
          )}
        </nav>
      )}

      <div ref={trackRef} className="fsh-track" style={{ height: scrollHeight }}>
        {/* Yapışkan sahne: bölüm boyunca ekranı kaplar */}
        <div ref={stageRef} className="fsh-stage">
          <div aria-hidden className={cx("fsh-loader", loaderDone && "fsh-loader-done")}>
            <div className="fsh-loader-text">{loadingText(loadPct)}</div>
            <div className="fsh-loader-track">
              <span className="fsh-loader-fill" style={{ width: `${loadPct}%` }} />
            </div>
          </div>

          <div className="fsh-canvas-wrap">
            <canvas ref={canvasRef} className="fsh-canvas" aria-hidden />
          </div>

          <div className={cx("fsh-copy", copyHidden && "fsh-copy-hidden")}>
            <h1 className="fsh-title">{title}</h1>
            {subtitle && <p className={cx("fsh-sub", subHidden && "fsh-sub-hidden")}>{subtitle}</p>}
          </div>

          <div className="fsh-cards">
            {steps.map((s, i) => {
              const isActive = activeIdx === i;
              const isPrev = activeIdx >= 0 && i < activeIdx;
              return (
                <article
                  key={i}
                  aria-hidden={!isActive}
                  style={{ "--c": s.color } as React.CSSProperties}
                  className={cx("fsh-card", isActive && "fsh-card-active", isPrev && "fsh-card-prev")}
                >
                  <div className="fsh-card-inner">
                    <span aria-hidden className="fsh-card-glow" />
                    <div className="fsh-card-head">
                      <span className="fsh-card-num">
                        <strong>{s.num ?? pad2(i + 1)}</strong> / {s.total ?? pad2(steps.length)}
                      </span>
                      <span aria-hidden className="fsh-card-icon">
                        {s.icon ?? "✦"}
                      </span>
                    </div>
                    <h3 className="fsh-card-title">{s.title}</h3>
                    <p className="fsh-card-desc">{s.description}</p>
                    <div className="fsh-card-foot">
                      <div className="fsh-ticks">
                        {steps.map((_, j) => {
                          const done = j < activeIdx;
                          const cur = j === activeIdx;
                          return (
                            <i key={j} className="fsh-tick">
                              <span
                                style={{
                                  transform: `scaleX(${done ? 1 : cur ? stepLocal : 0})`,
                                  transition: done ? "none" : "transform 160ms linear",
                                }}
                              />
                            </i>
                          );
                        })}
                      </div>
                      <span className="fsh-card-label">{s.label}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="fsh-progress" aria-hidden>
            <span className="fsh-progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FrameSequenceHero;
