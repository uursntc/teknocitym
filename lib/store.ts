import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { mergeContent, type SiteContent } from "./content";
import type { NewRequestInput, ServiceRequest, Status } from "./requests";

/*
 * Depolama. Veriler iki yerden birinde durur:
 *   Cloudflare'de: DATA_BUCKET adlı R2 kovası (wrangler.jsonc içinde tanımlı)
 *   Bilgisayarda (npm run dev) ve Node sunucusunda: ./data klasörü (ya da DATA_DIR)
 * İki tarafta da anahtarlar aynı:
 *   content.json   site içeriği (panelden düzenlenir)
 *   requests.json  servis talepleri
 *   uploads/       panelden yüklenen fotoğraflar
 */
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const CONTENT_KEY = "content.json";
const REQUESTS_KEY = "requests.json";

type StoredFile = { body: Uint8Array<ArrayBuffer>; contentType?: string };

// R2 kovasından kullandığımız kadarı (tam tipler @cloudflare/workers-types içinde)
type R2Bucket = {
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer>; httpMetadata?: { contentType?: string } } | null>;
  put(key: string, body: Uint8Array | string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
};

interface Backend {
  get(key: string): Promise<StoredFile | null>;
  put(key: string, body: Uint8Array | string, contentType: string): Promise<void>;
}

const fileBackend: Backend = {
  async get(key) {
    try {
      return { body: new Uint8Array(await fs.readFile(path.join(DATA_DIR, key))) };
    } catch {
      return null;
    }
  },
  async put(key, body) {
    const file = path.join(DATA_DIR, key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${crypto.randomBytes(4).toString("hex")}.tmp`;
    await fs.writeFile(tmp, body);
    await fs.rename(tmp, file);
  },
};

function r2Backend(bucket: R2Bucket): Backend {
  return {
    async get(key) {
      const obj = await bucket.get(key);
      if (!obj) return null;
      return { body: new Uint8Array(await obj.arrayBuffer()), contentType: obj.httpMetadata?.contentType };
    },
    async put(key, body, contentType) {
      await bucket.put(key, body, { httpMetadata: { contentType } });
    },
  };
}

async function backend(): Promise<Backend> {
  try {
    // Senkron mod bilerek seçildi: bağlam yalnızca Cloudflare'de ve npm run dev'de vardır.
    // Async mod next start altında da yerel bir R2 taklidi açar ve DATA_DIR'i yok sayardı.
    const { env } = getCloudflareContext();
    const bucket = (env as { DATA_BUCKET?: R2Bucket }).DATA_BUCKET;
    if (bucket) return r2Backend(bucket);
  } catch {
    // Cloudflare dışında (ör. next start) çalışıyoruz
  }
  return fileBackend;
}

// Dosya yoksa fallback döner. Okuma hatasında fırlatır: aksi halde geçici bir R2 hatasından
// sonra boş listeyle üzerine yazıp tüm talepleri silebilirdik.
async function readJson<T>(key: string, fallback: T): Promise<T> {
  const file = await (await backend()).get(key);
  return file ? (JSON.parse(new TextDecoder().decode(file.body)) as T) : fallback;
}

async function writeJson(key: string, value: unknown) {
  await (await backend()).put(key, JSON.stringify(value, null, 2), "application/json");
}

export async function getUpload(name: string): Promise<StoredFile | null> {
  return (await backend()).get(`uploads/${name}`);
}

export async function saveUpload(name: string, body: Uint8Array, contentType: string) {
  await (await backend()).put(`uploads/${name}`, body, contentType);
}

// Aynı anda gelen yazma işlemlerini sıraya koyar
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

export async function getContent(): Promise<SiteContent> {
  // İçerik okunamazsa site varsayılan içerikle açılmaya devam etsin
  return mergeContent(await readJson<unknown>(CONTENT_KEY, null).catch(() => null));
}

export async function saveContent(content: unknown): Promise<SiteContent> {
  const merged = mergeContent(content);
  await serialize(() => writeJson(CONTENT_KEY, merged));
  return merged;
}

export async function listRequests(): Promise<ServiceRequest[]> {
  return readJson<ServiceRequest[]>(REQUESTS_KEY, []);
}

function makeTicketNo(existing: Set<string>) {
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  for (let i = 0; i < 50; i++) {
    const no = `TC-${stamp}-${crypto.randomInt(1000, 10000)}`;
    if (!existing.has(no)) return no;
  }
  return `TC-${stamp}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function createRequest(input: NewRequestInput): Promise<ServiceRequest> {
  return serialize(async () => {
    const all = await listRequests();
    const now = new Date().toISOString();
    const req: ServiceRequest = {
      ...input,
      id: crypto.randomUUID(),
      ticketNo: makeTicketNo(new Set(all.map((r) => r.ticketNo))),
      createdAt: now,
      updatedAt: now,
      status: "Alındı",
      internalNote: "",
      history: [{ status: "Alındı", at: now }],
    };
    all.unshift(req);
    await writeJson(REQUESTS_KEY, all);
    return req;
  });
}

export async function updateRequest(
  id: string,
  patch: { status?: Status; internalNote?: string },
): Promise<ServiceRequest | null> {
  return serialize(async () => {
    const all = await listRequests();
    const req = all.find((r) => r.id === id);
    if (!req) return null;
    const now = new Date().toISOString();
    if (patch.status && patch.status !== req.status) {
      req.status = patch.status;
      req.history = [...(req.history || []), { status: patch.status, at: now }];
    }
    if (typeof patch.internalNote === "string") req.internalNote = patch.internalNote.slice(0, 2000);
    req.updatedAt = now;
    await writeJson(REQUESTS_KEY, all);
    return req;
  });
}

export async function deleteRequest(id: string): Promise<boolean> {
  return serialize(async () => {
    const all = await listRequests();
    const next = all.filter((r) => r.id !== id);
    if (next.length === all.length) return false;
    await writeJson(REQUESTS_KEY, next);
    return true;
  });
}

export async function findByTicket(ticketNo: string): Promise<ServiceRequest | null> {
  const all = await listRequests();
  const no = ticketNo.trim().toUpperCase();
  return all.find((r) => r.ticketNo.toUpperCase() === no) || null;
}
