/** Yönetim panelindeki içerik formunun tanımı. Yeni alan eklemek için buraya bir satır ekle. */
export type ItemField = { key: string; label: string; kind: "text" | "textarea" | "photo" };

type FieldBase = { path: string; label: string; hint?: string };

export type FieldDef =
  | (FieldBase & { kind: "text" })
  | (FieldBase & { kind: "textarea" })
  | (FieldBase & { kind: "strings" })
  | (FieldBase & { kind: "list"; itemLabel: string; fixed?: boolean; item: ItemField[] });

export type SectionDef = { id: string; title: string; description?: string; fields: FieldDef[] };

export const ADMIN_SCHEMA: SectionDef[] = [
  {
    id: "store",
    title: "Mağaza bilgileri",
    description: "Telefon, WhatsApp, adres ve çalışma saatleri sitenin her yerinde bu bilgilerden gelir.",
    fields: [
      { kind: "text", path: "store.name", label: "Mağaza adı" },
      { kind: "text", path: "store.whatsapp", label: "WhatsApp numarası", hint: "Ülke koduyla, + ve boşluk olmadan: 905321234567" },
      { kind: "text", path: "store.phoneDisplay", label: "Telefon (sitede görünen)", hint: "Örn. 0 (532) 123 45 67" },
      { kind: "text", path: "store.phoneTel", label: "Telefon (arama bağlantısı)", hint: "Örn. +905321234567" },
      { kind: "text", path: "store.instagram", label: "Instagram kullanıcı adı", hint: "@ olmadan" },
      { kind: "textarea", path: "store.address", label: "Adres" },
      { kind: "text", path: "store.mapsQuery", label: "Harita araması", hint: "Google Haritalar'da mağazayı bulan metin" },
      {
        kind: "list",
        path: "store.hours",
        label: "Çalışma saatleri",
        itemLabel: "Satır",
        item: [
          { key: "day", label: "Gün", kind: "text" },
          { key: "time", label: "Saat", kind: "text" },
        ],
      },
    ],
  },
  {
    id: "hero",
    title: "Giriş animasyonu",
    description: "Sayfanın başındaki kaydırmalı telefon animasyonunun başlığı ve dört adım kartı.",
    fields: [
      { kind: "text", path: "hero.title", label: "Başlık" },
      { kind: "text", path: "hero.subtitle", label: "Alt yazı" },
      {
        kind: "list",
        path: "hero.steps",
        label: "Adım kartları",
        itemLabel: "Adım",
        fixed: true,
        item: [
          { key: "label", label: "Etiket", kind: "text" },
          { key: "title", label: "Başlık", kind: "text" },
          { key: "description", label: "Açıklama", kind: "textarea" },
        ],
      },
    ],
  },
  {
    id: "categories",
    title: "Kategoriler ve fotoğraflar",
    fields: [
      { kind: "text", path: "intro.title", label: "Bölüm başlığı" },
      { kind: "textarea", path: "intro.text", label: "Bölüm açıklaması" },
      {
        kind: "list",
        path: "categories",
        label: "Kategoriler",
        itemLabel: "Kategori",
        item: [
          { key: "photo", label: "Fotoğraf", kind: "photo" },
          { key: "alt", label: "Fotoğraf açıklaması", kind: "text" },
          { key: "title", label: "Başlık", kind: "text" },
          { key: "text", label: "Metin", kind: "textarea" },
          { key: "tag", label: "Etiket", kind: "text" },
        ],
      },
    ],
  },
  {
    id: "gallery",
    title: "Tezgâh fotoğrafları",
    fields: [
      { kind: "text", path: "gallery.title", label: "Bölüm başlığı" },
      { kind: "textarea", path: "gallery.text", label: "Bölüm açıklaması" },
      {
        kind: "list",
        path: "gallery.items",
        label: "Fotoğraflar",
        itemLabel: "Fotoğraf",
        item: [
          { key: "photo", label: "Fotoğraf", kind: "photo" },
          { key: "caption", label: "Alt yazı", kind: "text" },
        ],
      },
    ],
  },
  {
    id: "offer",
    title: "Satış ve tamir",
    fields: [
      { kind: "textarea", path: "sales.lead", label: "Satış açıklaması" },
      { kind: "strings", path: "sales.items", label: "Satış maddeleri" },
      { kind: "textarea", path: "repair.lead", label: "Tamir açıklaması" },
      { kind: "strings", path: "repair.items", label: "Tamir maddeleri" },
    ],
  },
  {
    id: "devices",
    title: "Cihaz tablosu",
    fields: [
      {
        kind: "list",
        path: "devices",
        label: "Satırlar",
        itemLabel: "Cihaz",
        item: [
          { key: "name", label: "Cihaz", kind: "text" },
          { key: "sale", label: "Satış", kind: "text" },
          { key: "repairs", label: "Sık yapılan tamirler", kind: "text" },
        ],
      },
    ],
  },
  {
    id: "rules",
    title: "Kurallar",
    fields: [
      {
        kind: "list",
        path: "rules",
        label: "Kurallar",
        itemLabel: "Kural",
        item: [
          { key: "title", label: "Başlık", kind: "text" },
          { key: "text", label: "Metin", kind: "textarea" },
        ],
      },
    ],
  },
  {
    id: "faq",
    title: "Sık sorulanlar",
    fields: [
      {
        kind: "list",
        path: "faq",
        label: "Sorular",
        itemLabel: "Soru",
        item: [
          { key: "q", label: "Soru", kind: "text" },
          { key: "a", label: "Cevap", kind: "textarea" },
        ],
      },
    ],
  },
  {
    id: "kvkk",
    title: "KVKK metni",
    description: "Servis fişindeki onay kutusunun altında açılan metin. Mağazanın kendi aydınlatma metniyle değiştir.",
    fields: [{ kind: "textarea", path: "kvkk", label: "Metin" }],
  },
];

export function getAt(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

export function setAt<T>(obj: T, path: string, value: unknown): T {
  const clone = structuredClone(obj) as unknown as Record<string, unknown>;
  const keys = path.split(".");
  let cur: Record<string, unknown> = clone;
  keys.slice(0, -1).forEach((k) => {
    if (!cur[k] || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  });
  cur[keys[keys.length - 1]] = value;
  return clone as unknown as T;
}
