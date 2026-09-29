import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "tc_admin";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 saat

function secret() {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function createSessionValue() {
  const exp = String(Date.now() + SESSION_MAX_AGE * 1000);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionValue(value?: string) {
  if (!value || !secret()) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig) return false;
  const expected = sign(exp);
  if (expected.length !== sig.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  return Number(exp) > Date.now();
}

export async function isAdmin() {
  const store = await cookies();
  return verifySessionValue(store.get(SESSION_COOKIE)?.value);
}

export function checkPassword(input: string) {
  const pw = process.env.ADMIN_PASSWORD || "";
  if (!pw) return false;
  const a = crypto.createHash("sha256").update(input).digest();
  const b = crypto.createHash("sha256").update(pw).digest();
  return crypto.timingSafeEqual(a, b);
}
