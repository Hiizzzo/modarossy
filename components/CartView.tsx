"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { formatARS } from "@/lib/format";
import { PROVINCES } from "@/lib/provinces";
import type { ShippingOption } from "@/lib/shipping-types";

// TODO: QUITAR cuando activemos cobro de envio real.
// Se cotiza contra Zipnova (se elige carrier + se guarda en DB),
// pero no se le cobra el envio al cliente.
const FREE_SHIPPING = true;

export default function CartView() {
  const { items, remove, setQty, total } = useCart();
  const [form, setForm] = useState({
    name: "",
    instagram: "",
    phone: "",
    street: "",
    street_number: "",
    city: "",
    state: "",
    zip: "",
    document: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"cart" | "shipping" | "options">("cart");

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<ShippingOption | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const canQuote =
    form.name && form.instagram && form.street && form.street_number && form.city && form.state && form.zip && form.document;

  const onQuote = async () => {
    setQuoteLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items,
          destination: { city: form.city, state: form.state, zipcode: form.zip },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error cotizando envío");
      const options = (data.options ?? []) as ShippingOption[];
      if (options.length === 0) {
        throw new Error("No se encontraron opciones de envío para esta dirección.");
      }
      const cheapest = [...options].sort((a, b) => a.price - b.price)[0];
      setShippingOptions(options);
      setSelectedOption(cheapest);
      setStep("options");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setQuoteLoading(false);
    }
  };

  const onPay = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mp/create-preference", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items,
          customer: form,
          shippingOption: selectedOption,
        }),
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

  /* ── Step: Opciones de envío ── */
  if (step === "options") {
    const quotedShippingCost = selectedOption?.price ?? 0;
    const shippingCost = FREE_SHIPPING ? 0 : quotedShippingCost;
    const grandTotal = total() + shippingCost;

    return (
      <div className="mx-auto w-full max-w-sm space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep("shipping")}
            aria-label="Volver"
            className="flex h-8 w-8 items-center justify-center rounded-full text-tinta hover:bg-tinta/5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold tracking-tight">Envío</h1>
        </div>

        {selectedOption && (
          <div className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left">
            {selectedOption.carrierLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedOption.carrierLogo}
                alt={selectedOption.carrierName}
                className="h-8 w-8 shrink-0 rounded object-contain"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-tinta">
                  {selectedOption.carrierName}
                </span>
                <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                  Más barato
                </span>
              </div>
              <div className="text-xs text-tinta/60">
                {selectedOption.serviceName} · {selectedOption.deliveryMin}-{selectedOption.deliveryMax} días hábiles
              </div>
            </div>
            <span className="shrink-0 text-sm font-bold text-tinta">
              {FREE_SHIPPING ? "Gratis" : formatARS(selectedOption.price)}
            </span>
          </div>
        )}

        {error && <p className="text-center text-xs text-red-500">{error}</p>}

        <div className="space-y-0.5 px-2 pt-1">
          <div className="flex items-center justify-between text-xs text-tinta/60">
            <span>Productos</span>
            <span>{formatARS(total())}</span>
          </div>
          {shippingCost > 0 ? (
            <div className="flex items-center justify-between text-xs text-tinta/60">
              <span>Envío</span>
              <span>{formatARS(shippingCost)}</span>
            </div>
          ) : FREE_SHIPPING && selectedOption ? (
            <div className="flex items-center justify-between text-xs text-green-700">
              <span>Envío</span>
              <span className="font-semibold">Gratis</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between text-sm pt-1">
            <span className="font-semibold uppercase tracking-wider text-tinta/70">Total</span>
            <span className="text-base font-bold text-tinta">{formatARS(grandTotal)}</span>
          </div>
        </div>

        <button
          onClick={onPay}
          disabled={!selectedOption || loading}
          className="w-full rounded-full bg-tinta py-3 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-celeste-500 disabled:opacity-40"
        >
          {loading ? "Procesando..." : "Pagar"}
        </button>
      </div>
    );
  }

  /* ── Step: Datos de envío ── */
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
          <input
            placeholder="Nombre y apellido"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="col-span-2 h-9 rounded-full border border-tinta/25 bg-white px-3 text-xs text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
          />
          <input
            placeholder="Instagram (@usuario)"
            value={form.instagram}
            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            className="col-span-2 h-9 rounded-full border border-tinta/25 bg-white px-3 text-xs text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
          />
          <input
            placeholder="Teléfono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="h-9 rounded-full border border-tinta/25 bg-white px-3 text-xs text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
          />
          <input
            placeholder="DNI / CUIT"
            value={form.document}
            onChange={(e) => setForm({ ...form, document: e.target.value })}
            className="h-9 rounded-full border border-tinta/25 bg-white px-3 text-xs text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
          />
          <input
            placeholder="Calle"
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            className="col-span-2 h-9 rounded-full border border-tinta/25 bg-white px-3 text-xs text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
          />
          <input
            placeholder="Número"
            value={form.street_number}
            onChange={(e) => setForm({ ...form, street_number: e.target.value })}
            className="h-9 rounded-full border border-tinta/25 bg-white px-3 text-xs text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
          />
          <input
            placeholder="Código postal"
            value={form.zip}
            onChange={(e) => setForm({ ...form, zip: e.target.value })}
            className="h-9 rounded-full border border-tinta/25 bg-white px-3 text-xs text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
          />
          <input
            placeholder="Ciudad"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="col-span-2 h-9 rounded-full border border-tinta/25 bg-white px-3 text-xs text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
          />
          <select
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className="col-span-2 h-9 rounded-full border border-tinta/25 bg-white px-3 text-xs text-tinta focus:border-celeste-500 focus:outline-none"
          >
            <option value="" disabled>
              Provincia
            </option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-center text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-between px-2 pt-1 text-sm">
          <span className="font-semibold uppercase tracking-wider text-tinta/70">Subtotal</span>
          <span className="text-base font-bold text-tinta">{formatARS(total())}</span>
        </div>

        <button
          onClick={onQuote}
          disabled={!canQuote || quoteLoading}
          className="w-full rounded-full bg-tinta py-3 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-celeste-500 disabled:opacity-40"
        >
          {quoteLoading ? "Cotizando..." : "Ver opciones de envío"}
        </button>
      </div>
    );
  }

  /* ── Step: Carrito ── */
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
        onClick={() => setStep("shipping")}
        className="w-full rounded-full bg-tinta py-3 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-celeste-500 disabled:opacity-40"
      >
        Finalizar compra
      </button>
    </div>
  );
}
