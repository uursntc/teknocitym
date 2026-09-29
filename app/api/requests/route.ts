import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createRequest, listRequests } from "@/lib/store";
import { ISSUES, REQUEST_TYPES, type RequestType } from "@/lib/requests";

export const dynamic = "force-dynamic";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Oturum açman gerekiyor." }, { status: 401 });
  return NextResponse.json(await listRequests());
}

export async function POST(req: Request) {
  if (!rateLimit(`req:${clientIp(req)}`, 6, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Kısa sürede çok fazla talep gönderildi. Biraz sonra tekrar dene ya da WhatsApp'tan yaz." }, { status: 429 });
  }
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Bot tuzağı: gerçek kullanıcılar bu alanı görmez
  if (str(b.website, 100)) return NextResponse.json({ ticketNo: "TC-000000-0000" });

  const type = (REQUEST_TYPES as readonly string[]).includes(String(b.type)) ? (b.type as RequestType) : "Tamir";
  const device = str(b.device, 60);
  const name = str(b.name, 80);
  const phone = str(b.phone, 30);
  const digits = phone.replace(/\D/g, "");
  const errors: Record<string, string> = {};
  if (!device) errors.device = "Cihaz türünü seç.";
  if (!name) errors.name = "Adını yaz.";
  if (digits.length < 10) errors.phone = "Telefon numaranı eksiksiz yaz.";
  if (b.consent !== true) errors.consent = "Devam etmek için onay kutusunu işaretle.";
  if (Object.keys(errors).length) return NextResponse.json({ error: "Eksik bilgi var.", errors }, { status: 400 });

  const issues = Array.isArray(b.issues) ? b.issues.filter((i): i is string => typeof i === "string" && ISSUES.includes(i)).slice(0, 10) : [];
  const created = await createRequest({
    type,
    device,
    model: str(b.model, 80),
    issues: type === "Tamir" ? issues : [],
    note: str(b.note, 1500),
    name,
    phone,
  });
  return NextResponse.json({ ticketNo: created.ticketNo });
}
