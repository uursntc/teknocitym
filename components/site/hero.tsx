"use client";

import { BadgeCheck, BatteryCharging, Cpu, Smartphone } from "lucide-react";
import { FrameSequenceHero, type FrameSequenceStep } from "@/components/ui/mac-book-neo-hero";
import type { SiteContent } from "@/lib/content";

/*
 * Kareler public/frames klasöründe. Kendi videonu kullanmak istersen README'deki
 * ffmpeg komutuyla kareleri üretip FRAME_COUNT değerini güncelle.
 */
const FRAME_COUNT = 120;
const framePath = (i: number) => `/frames/frame_${String(i).padStart(4, "0")}.webp`;

const RANGES: [number, number][] = [
  [0.02, 0.28],
  [0.28, 0.55],
  [0.55, 0.82],
  [0.82, 1.01],
];
const ICONS = [<Smartphone key="s" />, <BatteryCharging key="b" />, <Cpu key="c" />, <BadgeCheck key="t" />];
const SHADES = ["#ffffff", "#d4d4d8", "#a1a1aa", "#ffffff"];

export function Hero({ hero }: { hero: SiteContent["hero"] }) {
  const steps: FrameSequenceStep[] = hero.steps.slice(0, 4).map((s, i) => ({
    from: RANGES[i][0],
    to: RANGES[i][1],
    color: SHADES[i],
    icon: ICONS[i],
    title: s.title,
    description: s.description,
    label: s.label,
  }));

  return (
    <FrameSequenceHero
      id="top"
      frameCount={FRAME_COUNT}
      framePath={framePath}
      eagerCount={40}
      scrollHeight="560vh"
      title={hero.title}
      subtitle={hero.subtitle}
      steps={steps}
      focusX={0.46}
      focusY={0.5}
      background="#0D0D0E"
      loadingText={(p) => (p < 100 ? `Yükleniyor %${p}` : "Hazır")}
    />
  );
}
