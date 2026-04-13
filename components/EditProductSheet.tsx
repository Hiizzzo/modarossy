"use client";

import { useState } from "react";
import { useDev } from "@/lib/dev-store";
import type { Product } from "@/lib/products";

export default function EditProductSheet({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { overrides, setOverride, setVariantStock } = useDev();
  const o = overrides[product.id] ?? {};

  const [name, setName] = useState(o.name ?? product.name);
  const [price, setPrice] = useState(o.price ?? product.price);
  const [image, setImage] = useState(o.image ?? product.images[0] ?? "");
  const [variants, setVariants] = useState(
    product.variants.map((v) => ({
      id: v.id,
      label: [v.size, v.color].filter(Boolean).join(" · ") || "Único",
      stock: o.variants?.[v.id]?.stock ?? v.stock,
    }))
  );

  const save = () => {
    setOverride(product.id, { name, price, image });
    variants.forEach((v) => setVariantStock(product.id, v.id, v.stock));
    onClose();
  };

  const hide = () => {
    setOverride(product.id, { hidden: true });
    onClose();
  };

  const field =
    "h-11 w-full rounded-full border border-celeste-200 px-4 text-sm focus:border-celeste-500 focus:outline-none";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Editar producto</h3>
          <button onClick={onClose} className="text-tinta/60 hover:text-tinta">
            ✕
          </button>
        </div>

        <label className="block text-xs font-medium uppercase tracking-wider text-tinta/60">
          Nombre
        </label>
        <input
          className={field}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="block text-xs font-medium uppercase tracking-wider text-tinta/60">
          Precio
        </label>
        <input
          type="number"
          min={0}
          className={field}
          value={price || ""}
          onChange={(e) => setPrice(Number(e.target.value))}
        />

        <label className="block text-xs font-medium uppercase tracking-wider text-tinta/60">
          Imagen (URL)
        </label>
        <input
          className={field}
          placeholder="https://..."
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="preview"
            className="h-32 w-full rounded-xl object-cover ring-1 ring-celeste-100"
          />
        )}

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-tinta/60">
            Stock por variante
          </div>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={v.id} className="flex items-center gap-2">
                <span className="flex-1 text-sm">{v.label}</span>
                <input
                  type="number"
                  min={0}
                  className="h-9 w-24 rounded-full border border-celeste-200 px-3 text-center text-sm"
                  value={v.stock}
                  onChange={(e) =>
                    setVariants((vs) =>
                      vs.map((x, j) =>
                        j === i ? { ...x, stock: Number(e.target.value) } : x
                      )
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={hide} className="btn-ghost !py-2 text-sm text-red-500">
            Ocultar
          </button>
          <button onClick={onClose} className="btn-ghost flex-1 !py-2 text-sm">
            Cancelar
          </button>
          <button onClick={save} className="btn-primary flex-1 !py-2 text-sm">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
