import { getUpload } from "@/lib/store";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

type Ctx = { params: Promise<{ name: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { name } = await ctx.params;
  if (!/^[a-z0-9-]+\.(jpg|png|webp|avif|gif)$/i.test(name)) return new Response("Bulunamadı", { status: 404 });
  const file = await getUpload(name);
  if (!file) return new Response("Bulunamadı", { status: 404 });
  const ext = name.split(".").pop()!.toLowerCase();
  return new Response(file.body, {
    headers: {
      "Content-Type": file.contentType || MIME[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
