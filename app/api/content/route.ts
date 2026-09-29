import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getContent, saveContent } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getContent());
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Oturum açman gerekiyor." }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Geçersiz içerik." }, { status: 400 });
  const saved = await saveContent(body);
  return NextResponse.json(saved);
}
