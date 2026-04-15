"use client";

import { useEffect, useMemo, useState } from "react";
import { formatARS } from "@/lib/format";
import type { Product, Variant } from "@/lib/products";
import { colorBySlug } from "@/lib/colors";
import { useCart } from "@/lib/cart-store";
import { useRouter } from "next/navigation";

type ColorGroup = {
  color: string;
  image: string | null;
  variants: Variant[];
};

export default function ProductDetail({ product }: { product: Product }) {
  const colorGroups = useMemo<ColorGroup[]>(() => {
    const map = new Map<string, ColorGroup>();
    for (const v of product.variants) {
      if (!v.color) continue;
      let g = map.get(v.color);
      if (!g) {
        g = { color: v.color, image: v.image_url ?? null, variants: [] };
        map.set(v.color, g);
      }
      if (!g.image && v.image_url) g.image = v.image_url;
      g.variants.push(v);
    }
    return Array.from(map.values());
  }, [product.variants]);

  const [colorSlug, setColorSlug] = useState<string | null>(
    colorGroups[0]?.color ?? null
  );

  const activeGroup =
    colorGroups.find((g) => g.color === colorSlug) ?? null;
  const shownVariants = activeGroup?.variants ?? product.variants;
  const cover = activeGroup?.image ?? product.images[0] ?? null;

  const firstAvailable =
    shownVariants.find((v) => v.stock > 0) ?? shownVariants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");

  useEffect(() => {
    const first =
      shownVariants.find((v) => v.stock > 0) ?? shownVariants[0];
    setVariantId(first?.id ?? "");
  }, [colorSlug, shownVariants]);

  const variant = shownVariants.find((v) => v.id === variantId);

  const add = useCart((s) => s.add);
  const router = useRouter();

  const handleAdd = () => {
    if (!variant) return;
    add({
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      size: variant.size ?? undefined,
      color: variant.color ?? undefined,
      price: product.price,
      image: cover ?? "",
      qty: 1,
    });
    router.push("/carrito");
  };

  return (
    <div className="relative">
      <button
        onClick={() => router.back()}
        aria-label="Volver"
        className="absolute left-0 top-0 z-10 inline-flex h-7 w-7 items-center justify-center text-tinta/70 transition hover:text-celeste-600"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
      </button>

      <div className="grid gap-3 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-1.5">
          <div className="text-center lg:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-celeste-600">
              {product.category}
            </p>
            <h1 className="mt-0.5 text-lg font-bold uppercase tracking-tighter sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>
          </div>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-[200px] overflow-hidden bg-white lg:max-w-none">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-celeste-100 to-white text-celeste-400">
                sin foto
              </div>
            )}
          </div>

          {colorGroups.length > 1 && (
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {colorGroups.map((g) => {
                const c = colorBySlug(g.color);
                if (!c) return null;
                const selected = g.color === colorSlug;
                return (
                  <button
                    key={g.color}
                    type="button"
                    onClick={() => setColorSlug(g.color)}
                    aria-label={c.label}
                    title={c.label}
                    style={{ background: c.hex }}
                    className={`h-7 w-7 rounded-full border-2 transition ${
                      selected
                        ? "scale-110 border-tinta"
                        : "border-tinta/20 hover:border-tinta/50"
                    } ${
                      c.slug === "blanco"
                        ? "ring-1 ring-inset ring-tinta/10"
                        : ""
                    }`}
                  />
                );
              })}
            </div>
          )}

          <div className="flex flex-col items-center gap-1">
            <p className="text-center text-lg font-bold lg:text-2xl">
              {formatARS(product.price)}
            </p>
            <p className="self-start text-[11px] font-semibold uppercase tracking-wider text-tinta/60">
              <span className="inline-block w-36">En tienda física:</span>
              {formatARS(Math.floor(product.price / 1.1 / 1000) * 1000)}
            </p>
          </div>
        </div>

        <div className="space-y-3 lg:space-y-6">
          <div className="flex items-center gap-4">
            {product.description && (
              <p className="flex-1 text-base font-medium text-tinta/80 lg:text-lg">
                {product.description}
              </p>
            )}
            <div className="shrink-0">
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-tinta/60">
                Talle
              </label>
              <div className="flex flex-wrap justify-end gap-1.5">
                {shownVariants.map((v) => {
                  const disabled = v.stock <= 0;
                  const selected = v.id === variantId;
                  return (
                    <button
                      key={v.id}
                      disabled={disabled}
                      onClick={() => setVariantId(v.id)}
                      className={`min-w-[36px] border px-2 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                        selected
                          ? "border-tinta bg-tinta text-white"
                          : "border-tinta/15 hover:border-tinta"
                      } ${disabled ? "opacity-40" : ""}`}
                    >
                      {v.size || "Único"}
                    </button>
                  );
                })}
              </div>
              {variant && (
                <p className="mt-1 text-right text-[10px] text-tinta/60">
                  {variant.stock > 0
                    ? `${variant.stock} disponibles`
                    : "Sin stock"}
                </p>
              )}
            </div>
          </div>

          <button
            className="btn-primary w-full"
            disabled={!variant || variant.stock <= 0}
            onClick={handleAdd}
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}
