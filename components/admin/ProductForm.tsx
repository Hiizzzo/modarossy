"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type VariantDraft = {
  size: string;
  color: string;
  stock: number;
};

export default function ProductForm() {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: 0,
    category: "mujer",
  });
  const [variants, setVariants] = useState<VariantDraft[]>([
    { size: "S", color: "", stock: 0 },
    { size: "M", color: "", stock: 0 },
    { size: "L", color: "", stock: 0 },
  ]);
  const [files, setFiles] = useState<File[]>([]);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addVariant = () =>
    setVariants((v) => [...v, { size: "", color: "", stock: 0 }]);

  const updateVariant = (idx: number, patch: Partial<VariantDraft>) =>
    setVariants((v) => v.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  const removeVariant = (idx: number) =>
    setVariants((v) => v.filter((_, i) => i !== idx));

  const uploadImages = async (productId: string) => {
    const urls: string[] = [];
    for (const f of files) {
      const path = `${productId}/${Date.now()}-${f.name}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, f, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const slug =
        form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const { data: product, error } = await supabase
        .from("products")
        .insert({
          name: form.name,
          slug,
          description: form.description,
          price: form.price,
          category: form.category,
          images: [],
        })
        .select("id")
        .single();
      if (error) throw error;

      const urls = await uploadImages(product.id);
      if (urls.length) {
        await supabase.from("products").update({ images: urls }).eq("id", product.id);
      }

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

      setMsg("Producto creado ✓");
      setForm({ name: "", slug: "", description: "", price: 0, category: "mujer" });
      setVariants([{ size: "S", color: "", stock: 0 }]);
      setFiles([]);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const field = "h-11 w-full rounded-full border border-celeste-200 px-4 text-sm focus:border-celeste-500 focus:outline-none";

  return (
    <form onSubmit={save} className="space-y-8">
      <div className="card space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Nombre"
            className={field}
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
          />
          <input
            placeholder="slug (opcional)"
            className={field}
            value={form.slug}
            onChange={(e) => setField("slug", e.target.value)}
          />
          <input
            required
            type="number"
            min={0}
            placeholder="Precio"
            className={field}
            value={form.price || ""}
            onChange={(e) => setField("price", Number(e.target.value))}
          />
          <select
            className={field}
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
          >
            <option value="mujer">Mujer</option>
            <option value="hombre">Hombre</option>
            <option value="accesorios">Accesorios</option>
          </select>
        </div>
        <textarea
          placeholder="Descripción"
          rows={3}
          className="w-full rounded-2xl border border-celeste-200 p-4 text-sm"
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
        />

        <div>
          <label className="mb-2 block text-sm font-medium">Imágenes</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="text-sm"
          />
          {files.length > 0 && (
            <p className="mt-1 text-xs text-tinta/60">{files.length} archivos</p>
          )}
        </div>
      </div>

      <div className="card space-y-3 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Variantes y stock</h2>
          <button type="button" onClick={addVariant} className="text-sm text-celeste-600">
            + Agregar
          </button>
        </div>
        {variants.map((v, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_120px_auto] items-center gap-2">
            <input
              placeholder="Talle"
              className={field}
              value={v.size}
              onChange={(e) => updateVariant(i, { size: e.target.value })}
            />
            <input
              placeholder="Color"
              className={field}
              value={v.color}
              onChange={(e) => updateVariant(i, { color: e.target.value })}
            />
            <input
              type="number"
              min={0}
              placeholder="Stock"
              className={field}
              value={v.stock}
              onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
            />
            <button
              type="button"
              onClick={() => removeVariant(i)}
              className="text-xs text-tinta/60 hover:text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {msg && <p className="text-sm">{msg}</p>}
      <button disabled={saving} className="btn-primary">
        {saving ? "Guardando..." : "Guardar producto"}
      </button>
    </form>
  );
}
