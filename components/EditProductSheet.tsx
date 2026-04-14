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
  const { overrides, setOverride, setVariantPatch } = useDev();
  const o = overrides[product.id] ?? {};

  const [name, setName] = useState(o.name ?? product.name);
  const [description, setDescription] = useState(o.description ?? product.description ?? "");
  const [price, setPrice] = useState(o.price ?? product.price);
  const image = o.image ?? product.images[0] ?? "";
  const [variants, setVariants] = useState(
    product.variants.map((v) => ({
      id: v.id,
      size: (o.variants?.[v.id]?.size ?? v.size ?? "") as string,
      color: (o.variants?.[v.id]?.color ?? v.color ?? "") as string,
      stock: o.variants?.[v.id]?.stock ?? v.stock,
    }))
  );

  const save = () => {
    setOverride(product.id, { name, description, price });
    variants.forEach((v) =>
      setVariantPatch(product.id, v.id, {
        stock: v.stock,
        size: v.size,
        color: v.color,
      })
    );
    onClose();
  };

  const hide = () => {
    setOverride(product.id, { hidden: true });
    onClose();
  };

  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const remove = async () => {
    setDeleting(true);
    try {
      const r = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      onClose();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative mx-auto w-full max-w-sm space-y-2.5 rounded-3xl bg-white p-4 shadow-2xl"
      >
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            className="h-10 min-w-0 flex-1 rounded-full border border-tinta/25 bg-white px-4 text-sm font-bold uppercase tracking-[0.08em] text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-tinta transition hover:bg-tinta/5 active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex h-32 w-full items-center justify-center rounded-2xl bg-white ring-1 ring-tinta/10">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full object-contain" />
          ) : (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-tinta/40">
              Sin foto
            </span>
          )}
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción"
          rows={2}
          className="w-full resize-none rounded-2xl border border-tinta/25 bg-white p-3 text-sm text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
        />

        <input
          type="number"
          value={price || ""}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="Precio"
          className="h-11 w-full rounded-full border border-tinta/25 bg-white px-4 text-sm text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
        />

        <div className="space-y-1.5">
          {variants.map((v, i) => {
            const update = (patch: Partial<typeof v>) =>
              setVariants((vs) => vs.map((x, j) => (i === j ? { ...x, ...patch } : x)));
            return (
              <div key={v.id} className="flex gap-1.5">
                <input
                  value={v.size}
                  onChange={(e) => update({ size: e.target.value })}
                  placeholder="Talle"
                  className="h-10 w-full min-w-0 rounded-full border border-tinta/25 bg-white px-3 text-sm text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
                />
                <input
                  type="number"
                  min={0}
                  value={v.stock}
                  onChange={(e) => update({ stock: Number(e.target.value) })}
                  className="h-10 w-14 flex-shrink-0 rounded-full border border-tinta/25 bg-white px-2 text-center text-sm font-semibold text-celeste-600 focus:border-celeste-500 focus:outline-none"
                />
              </div>
            );
          })}
        </div>

        <div className="flex gap-1.5 pt-1">
          <button
            type="button"
            onClick={hide}
            className="flex-1 rounded-full border border-tinta/25 bg-white py-3 text-[11px] font-bold uppercase tracking-wider text-tinta transition hover:bg-celeste-50"
          >
            Ocultar
          </button>
          <button
            type="button"
            onClick={() => setConfirmDel(true)}
            className="flex-1 rounded-full border border-tinta/25 bg-white py-3 text-[11px] font-bold uppercase tracking-wider text-tinta transition hover:bg-celeste-50"
          >
            Eliminar
          </button>
          <button
            type="button"
            onClick={save}
            className="flex-[2] rounded-full bg-tinta py-3 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-celeste-500"
          >
            Guardar
          </button>
        </div>

        {confirmDel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white/95 p-6 backdrop-blur-sm">
            <p className="text-center text-sm font-bold uppercase tracking-wider text-tinta">
              ¿Eliminar definitivamente?
            </p>
            <p className="text-center text-[11px] text-tinta/60">
              Esta acción no se puede deshacer
            </p>
            <div className="mt-2 flex w-full gap-2">
              <button
                type="button"
                onClick={() => setConfirmDel(false)}
                disabled={deleting}
                className="flex-1 rounded-full border border-tinta/25 bg-white py-3 text-[11px] font-bold uppercase tracking-wider text-tinta transition hover:bg-celeste-50 disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={deleting}
                className="flex-1 rounded-full bg-tinta py-3 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-celeste-500 disabled:opacity-40"
              >
                {deleting ? "Eliminando..." : "Confirmar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
