import { NextResponse } from "next/server";
import { removeBackground } from "@/lib/bgRemove";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const file = fd.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Falta imagen" }, { status: 400 });
    }
    const raw = Buffer.from(await file.arrayBuffer());
    const out = await removeBackground(raw, file.name, file.type);
    return new NextResponse(new Uint8Array(out.buf), {
      status: 200,
      headers: {
        "Content-Type": out.contentType,
        "Content-Disposition": `inline; filename="${out.filename}"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
