"use client";

import type { ReactNode } from "react";

export type TicketPreset = { type?: string; device?: string; issue?: string };

export function presetTicket(detail: TicketPreset) {
  window.dispatchEvent(new CustomEvent<TicketPreset>("ticket:preset", { detail }));
}

/** Servis fişine giden ve fişi belirli bir talep türüyle açan bağlantı. */
export function PresetLink({
  preset,
  className,
  children,
  href = "#fis",
}: {
  preset: TicketPreset;
  className?: string;
  children: ReactNode;
  href?: string;
}) {
  return (
    <a href={href} className={className} onClick={() => presetTicket(preset)}>
      {children}
    </a>
  );
}
