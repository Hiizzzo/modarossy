import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const supabase = createServiceClient();

    // Si es JSON (legacy), solo actualizar campos básicos
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const patch: Record<string, unknown> = {};
      if (typeof body.category === "string") patch.category = body.category;
      if (typeof body.gender === "string") patch.gender = body.gender;
      if (typeof body.name === "string") patch.name = body.name;
      if (typeof body.price === "number") patch.price = body.price;
      if (Object.keys(patch).length === 0) {
        return NextResponse.json({ ok: true });
      }
      const { error } = await supabase.from("products").update(patch).eq("id", params.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // Si es FormData, actualizar todo incluyendo foto y variantes
    const fd = await req.formData();
    const patch: Record<string, unknown> = {};

    const category = fd.get("category");
    const gender = fd.get("gender");
    const name = fd.get("name");
    const price = fd.get("price");

    if (typeof category === "string") patch.category = category;
    if (typeof gender === "string") patch.gender = gender || null;
    if (typeof name === "string") patch.name = name;
    if (typeof price === "string") patch.price = Number(price);

    // Actualizar producto
    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from("products").update(patch).eq("id", params.id);
      if (error) throw error;
    }

    // Manejar múltiples fotos por color
    const variantsStr = fd.get("variants");
    if (typeof variantsStr === "string") {
      const variants = JSON.parse(variantsStr);

      // Subir fotos nuevas y obtener URLs
      const photoUrls = new Map<string, string>();
      const photoKeys = new Set<string>(variants.map((v: { photoKey: string }) => v.photoKey));

      for (const key of photoKeys) {
        const photo = fd.get(`photo_${key}`) as File | null;
        if (photo) {
          const path = `${params.id}/${key}-${Date.now()}-${photo.name}`;
          const publicUrl = supabase.storage
            .from("product-images")
            .getPublicUrl(path).data.publicUrl;
          photoUrls.set(key, publicUrl);
          const buf = Buffer.from(await photo.arrayBuffer());
          const { error: uploadErr } = await supabase.storage
            .from("product-images")
            .upload(path, buf, { contentType: photo.type, upsert: true });
          if (uploadErr) throw uploadErr;
        }
      }

      // Eliminar todas las variantes existentes del producto
      await supabase.from("product_variants").delete().eq("product_id", params.id);

      // Crear todas las variantes de nuevo
      type VariantIn = {
        size: string;
        color: string;
        stock: number;
        photoKey?: string;
        existingImageUrl?: string | null;
      };
      const variantRows = (variants as VariantIn[]).map((v) => ({
        product_id: params.id,
        size: v.size || null,
        color: v.color || null,
        stock: v.stock,
        image_url:
          (v.photoKey && photoUrls.get(v.photoKey)) ||
          v.existingImageUrl ||
          null,
      }));

      console.log("[PATCH] variantRows to insert:", JSON.stringify(variantRows, null, 2));
      if (variantRows.length > 0) {
        const { error: varErr, data: insData } = await supabase
          .from("product_variants")
          .insert(variantRows)
          .select();
        if (varErr) throw varErr;
        console.log("[PATCH] inserted rows:", JSON.stringify(insData, null, 2));
      }

      // La imagen principal del producto = la de la PRIMERA variante (new o existente)
      const firstVariant = variantRows[0];
      if (firstVariant?.image_url) {
        await supabase
          .from("products")
          .update({ images: [firstVariant.image_url] })
          .eq("id", params.id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/products/[id]] error:", e);
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
