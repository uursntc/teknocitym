// Eski sunucudaki (Railway) panel verilerini Cloudflare R2 kovasına kopyalar.
//
// Kullanım (proje klasöründe, DNS değiştirilmeden ÖNCE):
//   npx wrangler login
//   npm run migrate -- https://www.teknocitym.com PANEL_SIFRESI
//
// Neleri kopyalar: site içeriği (content.json), servis talepleri (requests.json) ve
// içerikte kullanılan, panelden yüklenmiş fotoğraflar (uploads/).
// Eski sunucuda hiçbir şeyi değiştirmez; yalnızca okur.

import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const BUCKET = "teknocitym-data";
const [from, password, ...flags] = process.argv.slice(2);
const local = flags.includes("--local"); // yalnızca test için: yerel R2 taklidine yazar

if (!from || !password) {
  console.error("Kullanım: npm run migrate -- https://www.teknocitym.com PANEL_SIFRESI");
  process.exit(1);
}
const base = from.replace(/\/+$/, "");
const outDir = path.join(process.cwd(), "migration-backup");

async function get(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url} → ${res.status} ${await res.text().catch(() => "")}`);
  return res;
}

function put(key, file, contentType) {
  const args = ["wrangler", "r2", "object", "put", `${BUCKET}/${key}`, "--file", file, "--content-type", contentType, local ? "--local" : "--remote"];
  const r = spawnSync("npx", args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) throw new Error(`R2'ye yüklenemedi: ${key}`);
}

console.log(`1/4 ${base} panelinde oturum açılıyor...`);
const login = await get(`${base}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ password }),
});
const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
if (!cookie) throw new Error("Oturum çerezi alınamadı.");

console.log("2/4 İçerik ve talepler indiriliyor...");
const content = await (await get(`${base}/api/content`)).json();
const requests = await (await get(`${base}/api/requests`, { headers: { cookie } })).json();
if (!Array.isArray(requests)) throw new Error("Talep listesi beklenen biçimde değil.");

await mkdir(path.join(outDir, "uploads"), { recursive: true });
await writeFile(path.join(outDir, "content.json"), JSON.stringify(content, null, 2));
await writeFile(path.join(outDir, "requests.json"), JSON.stringify(requests, null, 2));

const names = [...new Set([...JSON.stringify(content).matchAll(/\/api\/uploads\/([a-z0-9-]+\.(?:jpg|png|webp|avif|gif))/gi)].map((m) => m[1]))];
console.log(`3/4 ${names.length} fotoğraf indiriliyor...`);
const types = {};
for (const name of names) {
  const res = await get(`${base}/api/uploads/${name}`);
  types[name] = res.headers.get("content-type") || "application/octet-stream";
  await writeFile(path.join(outDir, "uploads", name), new Uint8Array(await res.arrayBuffer()));
}
console.log(`   Yedek: ${outDir}`);

console.log(`4/4 R2 kovasına (${BUCKET}) yükleniyor...`);
put("content.json", path.join(outDir, "content.json"), "application/json");
put("requests.json", path.join(outDir, "requests.json"), "application/json");
for (const name of names) put(`uploads/${name}`, path.join(outDir, "uploads", name), types[name]);

console.log(`Tamam: içerik, ${requests.length} talep ve ${names.length} fotoğraf kopyalandı.`);
