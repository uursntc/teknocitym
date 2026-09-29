import defaults from "./default-content.json";

export type Hour = { day: string; time: string };
export type HeroStep = { label: string; title: string; description: string };
export type Category = { title: string; text: string; tag: string; photo: string; alt: string };
export type GalleryItem = { photo: string; caption: string };
export type Device = { name: string; sale: string; repairs: string };
export type Rule = { title: string; text: string };
export type Faq = { q: string; a: string };

export type SiteContent = {
  store: {
    name: string;
    whatsapp: string;
    phoneDisplay: string;
    phoneTel: string;
    instagram: string;
    address: string;
    mapsQuery: string;
    hours: Hour[];
  };
  hero: { title: string; subtitle: string; steps: HeroStep[] };
  intro: { title: string; text: string };
  categories: Category[];
  gallery: { title: string; text: string; items: GalleryItem[] };
  sales: { lead: string; items: string[] };
  repair: { lead: string; items: string[] };
  devices: Device[];
  rules: Rule[];
  faq: Faq[];
  kvkk: string;
};

export const DEFAULT_CONTENT = defaults as SiteContent;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Kayıtlı içeriği varsayılanlarla birleştirir; eksik alanlar varsayılandan gelir. */
export function mergeContent(saved: unknown): SiteContent {
  const base = structuredClone(DEFAULT_CONTENT) as unknown as Record<string, unknown>;
  if (!isObject(saved)) return base as unknown as SiteContent;
  for (const key of Object.keys(base)) {
    const incoming = saved[key];
    const current = base[key];
    if (incoming === undefined || incoming === null) continue;
    if (isObject(current) && isObject(incoming)) {
      base[key] = { ...current, ...incoming };
    } else if (Array.isArray(current) === Array.isArray(incoming) && typeof current === typeof incoming) {
      base[key] = incoming;
    }
  }
  const out = base as unknown as SiteContent;
  // Giriş animasyonu tam olarak 4 adım ister
  const steps = Array.isArray(out.hero.steps) ? out.hero.steps : [];
  out.hero.steps = DEFAULT_CONTENT.hero.steps.map((d, i) => ({ ...d, ...(steps[i] || {}) }));
  return out;
}
