import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { deleteRequest, updateRequest } from "@/lib/store";
import { isStatus, type Status } from "@/lib/requests";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Oturum açman gerekiyor." }, { status: 401 });
  const { id } = await ctx.params;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: { status?: Status; internalNote?: string } = {};
  if (b.status !== undefined) {
    if (!isStatus(b.status)) return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
    patch.status = b.status;
  }
  if (typeof b.internalNote === "string") patch.internalNote = b.internalNote;
  const updated = await updateRequest(id, patch);
  if (!updated) return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Oturum açman gerekiyor." }, { status: 401 });
  const { id } = await ctx.params;
  const ok = await deleteRequest(id);
  if (!ok) return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
