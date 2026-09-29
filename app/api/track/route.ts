import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { findByTicket } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!rateLimit(`track:${clientIp(req)}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Çok fazla sorgu yapıldı. Biraz sonra tekrar dene." }, { status: 429 });
  }
  const url = new URL(req.url);
  const no = (url.searchParams.get("no") || "").trim();
  const tel = (url.searchParams.get("tel") || "").replace(/\D/g, "");
  if (!no || tel.length !== 4) {
    return NextResponse.json({ error: "Fiş numarasını ve telefonunun son 4 hanesini yaz." }, { status: 400 });
  }
  const r = await findByTicket(no);
  if (!r || r.phone.replace(/\D/g, "").slice(-4) !== tel) {
    return NextResponse.json({ error: "Bu bilgilerle eşleşen bir fiş bulunamadı. Fiş numarasını ve telefonun son 4 hanesini kontrol et." }, { status: 404 });
  }
  return NextResponse.json({
    ticketNo: r.ticketNo,
    device: [r.device, r.model].filter(Boolean).join(" "),
    status: r.status,
    updatedAt: r.updatedAt,
    history: r.history,
  });
}
