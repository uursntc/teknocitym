import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { mergeContent, type SiteContent } from "./content";
import type { NewRequestInput, ServiceRequest, Status } from "./requests";

/*
 * Dosya tabanlı depolama. Veriler ./data klasöründe JSON olarak durur:
 *   data/content.json   site içeriği (panelden düzenlenir)
 *   data/requests.json  servis talepleri
 *   data/uploads/       panelden yüklenen fotoğraflar
 * Kalıcı diski olan her Node sunucusunda çalışır (VPS, Render, Railway vb.).
 * Başka bir veritabanına geçmek istersen yalnızca bu dosyayı değiştirmen yeterli.
 */
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const REQUESTS_FILE = path.join(DATA_DIR, "requests.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tmp, file);
}

// Aynı anda gelen yazma işlemlerini sıraya koyar
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

export async function getContent(): Promise<SiteContent> {
  return mergeContent(await readJson<unknown>(CONTENT_FILE, null));
}

export async function saveContent(content: unknown): Promise<SiteContent> {
  const merged = mergeContent(content);
  await serialize(() => writeJson(CONTENT_FILE, merged));
  return merged;
}

export async function listRequests(): Promise<ServiceRequest[]> {
  return readJson<ServiceRequest[]>(REQUESTS_FILE, []);
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
    await writeJson(REQUESTS_FILE, all);
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
    await writeJson(REQUESTS_FILE, all);
    return req;
  });
}

export async function deleteRequest(id: string): Promise<boolean> {
  return serialize(async () => {
    const all = await listRequests();
    const next = all.filter((r) => r.id !== id);
    if (next.length === all.length) return false;
    await writeJson(REQUESTS_FILE, next);
    return true;
  });
}

export async function findByTicket(ticketNo: string): Promise<ServiceRequest | null> {
  const all = await listRequests();
  const no = ticketNo.trim().toUpperCase();
  return all.find((r) => r.ticketNo.toUpperCase() === no) || null;
}
