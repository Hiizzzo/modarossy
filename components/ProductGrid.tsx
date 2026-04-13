"use client";

import { useState } from "react";
import Link from "next/link";
import { useDev, applyOverrides } from "@/lib/dev-store";
import { usePageTransition } from "@/lib/page-transition";
import { formatARS } from "@/lib/format";
import type { Product } from "@/lib/products";
import EditProductSheet from "./EditProductSheet";

export default function ProductGrid({ products }: { products: Product[] }) {
  const { isDev, overrides, moveUp, moveDown } = useDev();
  const [editing, setEditing] = useState<Product | null>(null);
  const transition = usePageTransition();

  const visible = applyOverrides(products, overrides);
  const allIds = visible.map((p) => p.id);

  if (visible.length === 0) {
    return (
      <div className="border border-dashed border-tinta/20 py-20 text-center text-tinta/60">
        No hay productos para mostrar.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((p, i) => {
          const cover = p.images[0];
          return (
            <div
              key={p.id}
              className="card-rise group relative"
              style={{ animationDelay: `${Math.min(i, 12) * 80}ms` }}
            >
              <Link
                href={`/producto/${p.slug}`}
                onClick={(e) => {
                  if (isDev) return;
                  e.preventDefault();
                  transition(`/producto/${p.slug}`);
                }}
                className={isDev ? "pointer-events-none block" : "block"}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-celeste-50">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={p.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-celeste-100 to-white text-celeste-400">
                      sin foto
                    </div>
                  )}
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-tinta/50">
                    {p.category ?? "Rossi"}
                  </p>
                  <h3 className="text-sm font-semibold leading-tight">
                    {p.name}
                  </h3>
                  <p className="text-sm font-bold">{formatARS(p.price)}</p>
                </div>
              </Link>

              {isDev && (
                <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-1">
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveUp(p.id, allIds)}
                      className="flex h-8 w-8 items-center justify-center bg-white/95 text-sm shadow ring-1 ring-tinta/10 hover:bg-celeste-50"
                      title="Mover arriba"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveDown(p.id, allIds)}
                      className="flex h-8 w-8 items-center justify-center bg-white/95 text-sm shadow ring-1 ring-tinta/10 hover:bg-celeste-50"
                      title="Mover abajo"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    onClick={() => setEditing(p)}
                    className="flex h-8 items-center gap-1 bg-tinta px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow hover:bg-celeste-600"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <EditProductSheet product={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
