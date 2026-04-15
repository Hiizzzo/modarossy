import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    if (typeof body.category === "string") patch.category = body.category;
    if (typeof body.gender === "string") patch.gender = body.gender;
    if (typeof body.name === "string") patch.name = body.name;
    if (typeof body.price === "number") patch.price = body.price;
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: true });
    }
    const supabase = createServiceClient();
    const { error } = await supabase.from("products").update(patch).eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("products")
      .update({ active: false })
      .eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
