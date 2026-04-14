import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const name = String(form.get("name") || "");
    const slug = String(form.get("slug") || "");
    const description = String(form.get("description") || "");
    const price = Number(form.get("price") || 0);
    const category = String(form.get("category") || "");
    const variantsRaw = String(form.get("variants") || "[]");
    const photo = form.get("photo") as File | null;

    if (!name || !price || !photo) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: product, error } = await supabase
      .from("products")
      .insert({ name, slug, description, price, category, images: [], active: true })
      .select("id")
      .single();
    if (error) throw error;

    const path = `${product.id}/${Date.now()}-${photo.name}`;
    const buf = Buffer.from(await photo.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(path, buf, { contentType: photo.type, upsert: false });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    await supabase
      .from("products")
      .update({ images: [pub.publicUrl] })
      .eq("id", product.id);

    const variants = JSON.parse(variantsRaw) as Array<{
      size: string;
      color: string;
      stock: number;
    }>;
    if (variants.length) {
      await supabase.from("product_variants").insert(
        variants.map((v) => ({
          product_id: product.id,
          size: v.size || null,
          color: v.color || null,
          stock: v.stock,
        }))
      );
    }

    return NextResponse.json({ id: product.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
