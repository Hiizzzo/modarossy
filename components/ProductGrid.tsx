"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDev, applyOverrides } from "@/lib/dev-store";
import { useCart } from "@/lib/cart-store";
import { usePageTransition } from "@/lib/page-transition";
import { formatARS } from "@/lib/format";
import type { Product } from "@/lib/products";
import { createClient } from "@/lib/supabase/client";
import EditProductSheet from "./EditProductSheet";

export default function ProductGrid({ products }: { products: Product[] }) {
  const { isDev, overrides, setOverride } = useDev();
  const addToCart = useCart((s) => s.add);
  const [editing, setEditing] = useState<Product | null>(null);
  const transition = usePageTransition();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("products-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_variants" },
        () => router.refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const baseVisible = useMemo(
    () => applyOverrides(products, overrides, isDev),
    [products, overrides, isDev]
  );

  const [order, setOrder] = useState<string[]>(() => baseVisible.map((p) => p.id));
  const [dragId, setDragId] = useState<string | null>(null);
  const holdTimer = useRef<number | null>(null);
  const startPt = useRef<{ x: number; y: number } | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastTap = useRef<{ id: string | null; t: number }>({ id: null, t: 0 });

  useEffect(() => {
    if (dragId) return;
    const next = baseVisible.map((p) => p.id);
    setOrder((prev) => {
      if (prev.length === next.length && prev.every((id, i) => id === next[i])) return prev;
      return next;
    });
  }, [baseVisible, dragId]);

  const visible = useMemo(() => {
    const map = new Map(baseVisible.map((p) => [p.id, p]));
    return order.map((id) => map.get(id)).filter(Boolean) as typeof baseVisible;
  }, [order, baseVisible]);

  const cancelHold = () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    if (!isDev) return;
    startPt.current = { x: e.clientX, y: e.clientY };
    cancelHold();
    holdTimer.current = window.setTimeout(() => {
      setDragId(id);
      if ("vibrate" in navigator) navigator.vibrate?.(30);
    }, 320);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDev) return;
    if (!dragId) {
      if (startPt.current) {
        const dx = e.clientX - startPt.current.x;
        const dy = e.clientY - startPt.current.y;
        if (Math.hypot(dx, dy) > 8) cancelHold();
      }
      return;
    }
    e.preventDefault();
    for (const id of order) {
      if (id === dragId) continue;
      const el = cardRefs.current[id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom
      ) {
        setOrder((prev) => {
          const from = prev.indexOf(dragId);
          const to = prev.indexOf(id);
          if (from < 0 || to < 0 || from === to) return prev;
          const next = [...prev];
          next.splice(from, 1);
          next.splice(to, 0, dragId);
          return next;
        });
        break;
      }
    }
  };

  const onPointerUp = () => {
    cancelHold();
    startPt.current = null;
    if (dragId) {
      order.forEach((id, i) => setOverride(id, { order: i }));
      setDragId(null);
    }
  };

  if (visible.length === 0) {
    return (
      <div className="border border-dashed border-tinta/20 py-20 text-center text-tinta/60">
        No hay productos para mostrar.
      </div>
    );
  }

  return (
    <>
      <div
        className="grid grid-cols-2 gap-x-2 gap-y-5 sm:gap-x-4 sm:gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: dragId ? "none" : undefined }}
      >
        {visible.map((p, i) => {
          const cover = p.images[0];
          const dragging = dragId === p.id;
          return (
            <div
              key={p.id}
              ref={(el) => {
                cardRefs.current[p.id] = el;
              }}
              data-product-card
              onPointerDown={(e) => onPointerDown(e, p.id)}
              className={`card-rise group relative select-none transition ${
                p.__hidden ? "opacity-40" : ""
              } ${dragging ? "z-10 scale-105 opacity-80 ring-2 ring-celeste-500" : ""}`}
              style={{ animationDelay: `${Math.min(i, 12) * 80}ms` }}
            >
              <Link
                href={`/producto/${p.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (isDev) {
                    const now = Date.now();
                    if (lastTap.current.id === p.id && now - lastTap.current.t < 400) {
                      setEditing(p);
                      lastTap.current = { id: null, t: 0 };
                    } else {
                      lastTap.current = { id: p.id, t: now };
                    }
                    return;
                  }
                  transition(`/producto/${p.slug}`);
                }}
                draggable={false}
                className="block"
              >
                <h3 className="mb-1 text-center text-base font-bold leading-tight sm:text-lg">
                  {p.name}
                </h3>
                <div className="relative aspect-square overflow-hidden bg-white">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={p.name}
                      draggable={false}
                      className="h-full w-full object-contain transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-celeste-100 to-white text-celeste-400">
                      sin foto
                    </div>
                  )}
                </div>
                <p className="mt-0.5 text-center text-xs font-bold">
                  {formatARS(p.price)}
                </p>
              </Link>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  const v = p.variants.find((x) => x.stock > 0) ?? p.variants[0];
                  if (!v) return;
                  const card = (e.currentTarget as HTMLElement).closest("[data-product-card]");
                  const srcImg = card?.querySelector("img") as HTMLImageElement | null;
                  const target = document.querySelector("[data-cart-target]") as HTMLElement | null;
                  if (srcImg && target && p.images[0]) {
                    const sr = srcImg.getBoundingClientRect();
                    const tr = target.getBoundingClientRect();
                    const fly = document.createElement("img");
                    fly.src = p.images[0];
                    fly.style.cssText = `position:fixed;left:${sr.left}px;top:${sr.top}px;width:${sr.width}px;height:${sr.height}px;object-fit:contain;pointer-events:none;z-index:9999;transition:all 650ms cubic-bezier(0.5,-0.2,0.7,1);will-change:transform,opacity;`;
                    document.body.appendChild(fly);
                    requestAnimationFrame(() => {
                      const dx = tr.left + tr.width / 2 - (sr.left + sr.width / 2);
                      const dy = tr.top + tr.height / 2 - (sr.top + sr.height / 2);
                      fly.style.transform = `translate(${dx}px, ${dy}px) scale(0.08) rotate(360deg)`;
                      fly.style.opacity = "0.2";
                    });
                    setTimeout(() => {
                      fly.remove();
                      target.animate(
                        [
                          { transform: "scale(1)" },
                          { transform: "scale(1.35)" },
                          { transform: "scale(1)" },
                        ],
                        { duration: 420, easing: "cubic-bezier(0.22,1,0.36,1)" }
                      );
                    }, 660);
                  }
                  addToCart({
                    variantId: v.id,
                    productId: p.id,
                    name: p.name,
                    size: v.size ?? undefined,
                    color: v.color ?? undefined,
                    price: p.price,
                    image: p.images[0],
                    qty: 1,
                  });
                }}
                className="mt-1 w-full bg-tinta py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-celeste-600 active:scale-95"
              >
                Añadir al carrito
              </button>

              {isDev && p.__hidden && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setOverride(p.id, { hidden: false })}
                  className="absolute bottom-14 right-1 z-10 flex h-7 items-center gap-1 bg-celeste-500 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-white shadow hover:bg-celeste-600"
                >
                  Mostrar
                </button>
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
