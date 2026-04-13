"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { formatARS } from "@/lib/format";

export default function CartView() {
  const { items, remove, setQty, total } = useCart();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCheckout =
    items.length > 0 &&
    form.name &&
    form.email &&
    form.address &&
    form.city &&
    form.zip;

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

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tu carrito</h1>
        <ul className="divide-y divide-celeste-100 rounded-2xl ring-1 ring-celeste-100">
          {items.map((i) => (
            <li key={i.variantId} className="flex gap-4 p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-celeste-50">
                {i.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex flex-1 items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{i.name}</div>
                  <div className="text-xs text-tinta/60">
                    {[i.size, i.color].filter(Boolean).join(" · ")}
                  </div>
                  <div className="mt-1 text-sm">{formatARS(i.price)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={i.qty}
                    onChange={(e) => setQty(i.variantId, Number(e.target.value))}
                    className="h-9 w-16 rounded-full border border-celeste-200 px-3 text-center text-sm"
                  />
                  <button
                    onClick={() => remove(i.variantId)}
                    className="text-xs text-tinta/60 hover:text-red-500"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="card mt-6 space-y-4 p-6">
          <h2 className="text-lg font-semibold">Datos de envío</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["name", "Nombre y apellido"],
                ["email", "Email"],
                ["phone", "Teléfono"],
                ["address", "Dirección"],
                ["city", "Ciudad"],
                ["zip", "Código postal"],
              ] as const
            ).map(([key, label]) => (
              <input
                key={key}
                placeholder={label}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="h-11 rounded-full border border-celeste-200 px-4 text-sm focus:border-celeste-500 focus:outline-none"
              />
            ))}
          </div>
        </div>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl bg-celeste-50/60 p-6 ring-1 ring-celeste-100">
        <h2 className="text-lg font-semibold">Resumen</h2>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatARS(total())}</span>
        </div>
        <div className="flex justify-between text-sm text-tinta/60">
          <span>Envío</span>
          <span>Se coordina con Andreani</span>
        </div>
        <div className="flex justify-between border-t border-celeste-200 pt-3 text-base font-semibold">
          <span>Total</span>
          <span>{formatARS(total())}</span>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          onClick={onPay}
          disabled={!canCheckout || loading}
          className="btn-primary w-full"
        >
          {loading ? "Procesando..." : "Pagar con Mercado Pago"}
        </button>
        <p className="text-center text-xs text-tinta/50">
          Serás redirigido al checkout seguro de Mercado Pago.
        </p>
      </aside>
    </div>
  );
}
