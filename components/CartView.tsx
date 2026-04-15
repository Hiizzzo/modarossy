"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { formatARS } from "@/lib/format";

export default function CartView() {
  const { items, remove, setQty, total } = useCart();
  const [form, setForm] = useState({
    name: "Test Buyer",
    email: "test@test.com",
    phone: "1111111111",
    address: "Calle Test 123",
    city: "Chascomús",
    zip: "7130",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"cart" | "shipping">("cart");

  const canCheckout =
    form.name && form.email && form.address && form.city && form.zip;

  const onPay = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mp/create-preference", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items, customer: form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creando pago");
      window.location.href = data.init_point;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-[calc(100svh-9rem)] flex-col items-center justify-center gap-6 text-center">
        <svg
          width="72"
          height="72"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="-translate-x-[14px] text-tinta"
        >
          <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L21 8H6" />
          <circle cx="10" cy="20" r="1.4" />
          <circle cx="17" cy="20" r="1.4" />
        </svg>
        <h1 className="text-2xl font-bold uppercase tracking-tighter">
          El carrito está vacío
        </h1>
        <Link href="/tienda" className="btn-primary">
          Seguir comprando
        </Link>
      </div>
    );
  }

  if (step === "shipping") {
    return (
      <div className="mx-auto w-full max-w-sm space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep("cart")}
            aria-label="Volver"
            className="flex h-8 w-8 items-center justify-center rounded-full text-tinta hover:bg-tinta/5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold tracking-tight">Datos de envío</h1>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {(
            [
              ["name", "Nombre y apellido", "col-span-2"],
              ["email", "Email", "col-span-2"],
              ["phone", "Teléfono", ""],
              ["zip", "Código postal", ""],
              ["address", "Dirección", "col-span-2"],
              ["city", "Ciudad", "col-span-2"],
            ] as const
          ).map(([key, label, span]) => (
            <input
              key={key}
              placeholder={label}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className={`h-9 rounded-full border border-tinta/25 bg-white px-3 text-xs text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none ${span}`}
            />
          ))}
        </div>

        {error && <p className="text-center text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-between px-2 pt-1 text-sm">
          <span className="font-semibold uppercase tracking-wider text-tinta/70">Total</span>
          <span className="text-base font-bold text-tinta">{formatARS(total())}</span>
        </div>

        <button
          onClick={onPay}
          disabled={!canCheckout || loading}
          className="w-full rounded-full bg-tinta py-3 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-celeste-500 disabled:opacity-40"
        >
          {loading ? "Procesando..." : "Pagar"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">Tu carrito</h1>

      <ul className="space-y-1.5">
        {items.map((i) => {
          return (
            <li key={i.variantId} className="relative">
              <div className="flex items-stretch overflow-hidden rounded-2xl bg-white">
                <div className="flex flex-1 flex-col p-2">
                  <div className="flex items-center gap-2">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                      {i.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.image} alt={i.name} className="h-full w-full object-contain" draggable={false} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="break-words text-sm font-bold uppercase tracking-wide text-tinta">
                        {i.name}
                      </div>
                      <div className="mt-0.5 text-[13px] font-semibold text-tinta/70">
                        {[i.size, i.color].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 pr-11 text-right text-sm font-bold text-tinta">
                    {formatARS(i.price)}
                  </div>
                </div>
                <div className="flex w-14 flex-col items-center justify-center gap-1 bg-tinta px-2">
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setQty(i.variantId, i.qty + 1)}
                    className="text-white/80 hover:text-white"
                    aria-label="Más"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  <span className="text-base font-bold text-white">{i.qty}</span>
                  <button
                    type="button"
                    onClick={() => (i.qty <= 1 ? remove(i.variantId) : setQty(i.variantId, i.qty - 1))}
                    className="text-white/80 hover:text-white"
                    aria-label="Menos"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="grid grid-cols-3 items-baseline px-2 pt-10 text-sm">
        <span className="justify-self-start font-semibold uppercase tracking-wider text-tinta/70">
          Total
        </span>
        <span className="justify-self-center text-base font-bold text-tinta">
          {formatARS(total())}
        </span>
        <span className="justify-self-end text-[11px] font-semibold uppercase tracking-wider text-tinta/60">
          {items.reduce((n, i) => n + i.qty, 0)} items
        </span>
      </div>

      <button
        onClick={onPay}
        disabled={loading}
        className="w-full rounded-full bg-tinta py-3 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-celeste-500 disabled:opacity-40"
      >
        {loading ? "Procesando..." : "Finalizar compra"}
      </button>
      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
}
