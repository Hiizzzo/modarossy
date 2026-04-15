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
    const gender = String(form.get("gender") || "");
    const variantsRaw = String(form.get("variants") || "[]");
    const photo = form.get("photo") as File | null;

    if (!name || !price || !photo) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const id = crypto.randomUUID();
    const path = `${id}/${Date.now()}-${photo.name}`;
    const publicUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    const buf = Buffer.from(await photo.arrayBuffer());
    const variants = JSON.parse(variantsRaw) as Array<{
      size: string;
      color: string;
      stock: number;
    }>;

    const insertRes = await supabase.from("products").insert({
      id,
      name,
      slug,
      description,
      price,
      category,
      gender: gender || null,
      images: [publicUrl],
      active: true,
    });
    if (insertRes.error) throw insertRes.error;

    const [upRes, varRes] = await Promise.all([
      supabase.storage
        .from("product-images")
        .upload(path, buf, { contentType: photo.type, upsert: true }),
      variants.length
        ? supabase.from("product_variants").insert(
            variants.map((v) => ({
              product_id: id,
              size: v.size || null,
              color: v.color || null,
              stock: v.stock,
            }))
          )
        : Promise.resolve({ error: null }),
    ]);

    if (upRes.error) throw upRes.error;
    if (varRes.error) throw varRes.error;

    return NextResponse.json({ id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
