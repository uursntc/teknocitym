export const STATUSES = [
  "Alındı",
  "Arıza tespiti",
  "Onay bekliyor",
  "Onarımda",
  "Hazır",
  "Teslim edildi",
  "İptal",
] as const;
export type Status = (typeof STATUSES)[number];

/** Müşterinin fiş sorgulamada gördüğü akış (İptal hariç). */
export const TRACK_FLOW: Status[] = ["Alındı", "Arıza tespiti", "Onay bekliyor", "Onarımda", "Hazır", "Teslim edildi"];

export const REQUEST_TYPES = ["Tamir", "Satın alma", "Takas"] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const DEVICES = [
  "iPhone",
  "iPad",
  "MacBook",
  "Apple Watch / AirPods",
  "PlayStation / Konsol",
  "Bilgisayar / Laptop",
  "Diğer",
];

export const ISSUES = [
  "Ekran kırık",
  "Batarya",
  "Şarj olmuyor",
  "Sıvı teması",
  "Açılmıyor",
  "Ses / kamera",
  "Isınma / fan",
  "Kol / tuş",
  "Yazılım",
  "Diğer",
];

export type ServiceRequest = {
  id: string;
  ticketNo: string;
  createdAt: string;
  updatedAt: string;
  type: RequestType;
  device: string;
  model: string;
  issues: string[];
  note: string;
  name: string;
  phone: string;
  status: Status;
  internalNote: string;
  history: { status: Status; at: string }[];
};

export type NewRequestInput = Pick<ServiceRequest, "type" | "device" | "model" | "issues" | "note" | "name" | "phone">;

export function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}
