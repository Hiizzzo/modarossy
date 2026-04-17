import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type VariantInput = {
  size: string;
  color: string;
  stock: number;
  photoKey?: string;
};

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
    const variants = JSON.parse(variantsRaw) as VariantInput[];

    // Colectar fotos por color (nuevo flujo) y foto única (flujo legacy).
    const photoByKey = new Map<string, File>();
    for (const [k, v] of form.entries()) {
      if (k.startsWith("photo_") && v instanceof File) {
        photoByKey.set(k.slice("photo_".length), v);
      }
    }
    const legacyPhoto = form.get("photo") as File | null;

    if (!name || !price) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }
    if (photoByKey.size === 0 && !legacyPhoto) {
      return NextResponse.json({ error: "Falta la foto" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const id = crypto.randomUUID();

    // Subir todas las fotos y armar map photoKey -> publicUrl.
    const urls = new Map<string, string>();
    const uploads: Promise<{ error: unknown }>[] = [];

    if (photoByKey.size > 0) {
      for (const [key, file] of photoByKey.entries()) {
        const path = `${id}/${key}-${Date.now()}-${file.name}`;
        const publicUrl = supabase.storage
          .from("product-images")
          .getPublicUrl(path).data.publicUrl;
        urls.set(key, publicUrl);
        const buf = Buffer.from(await file.arrayBuffer());
        uploads.push(
          supabase.storage
            .from("product-images")
            .upload(path, buf, { contentType: file.type, upsert: true })
        );
      }
    } else if (legacyPhoto) {
      const path = `${id}/${Date.now()}-${legacyPhoto.name}`;
      const publicUrl = supabase.storage
        .from("product-images")
        .getPublicUrl(path).data.publicUrl;
      urls.set("__legacy__", publicUrl);
      const buf = Buffer.from(await legacyPhoto.arrayBuffer());
      uploads.push(
        supabase.storage
          .from("product-images")
          .upload(path, buf, { contentType: legacyPhoto.type, upsert: true })
      );
    }

    const coverUrl = urls.values().next().value as string;

    const insertRes = await supabase.from("products").insert({
      id,
      name,
      slug,
      description,
      price,
      category,
      gender: gender || null,
      images: [coverUrl],
      active: true,
    });
    if (insertRes.error) throw insertRes.error;

    const variantRows = variants.map((v) => ({
      product_id: id,
      size: v.size || null,
      color: v.color || null,
      stock: v.stock,
    }));

    const [uploadsRes, varRes] = await Promise.all([
      Promise.all(uploads),
      variantRows.length
        ? supabase.from("product_variants").insert(variantRows)
        : Promise.resolve({ error: null }),
    ]);

    for (const r of uploadsRes) {
      if (r.error) throw r.error;
    }
    if (varRes.error) throw varRes.error;

    return NextResponse.json({ id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
