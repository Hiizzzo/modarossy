"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useCart } from "@/lib/cart-store";
import { useDev } from "@/lib/dev-store";
import { categories } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";

const supabaseFullLogout = async () => {
  try {
    await createClient().auth.signOut();
  } catch {}
};

export default function Navbar() {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const openCart = useCart((s) => s.setOpen);
  const isDev = useDev((s) => s.isDev);
  const forceEnable = useDev((s) => s.forceEnable);
  const disable = useDev((s) => s.disable);
  const resetAll = useDev((s) => s.resetAll);
  const [open, setOpen] = useState(false);
  const [gate, setGate] = useState(false);
  const [gatePw, setGatePw] = useState("");
  const [gateErr, setGateErr] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const tapsRef = useRef<{ count: number; t: number }>({ count: 0, t: 0 });

  const GATE_PASSWORD = "jaimito1842";

  const submitGate = (e: React.FormEvent) => {
    e.preventDefault();
    if (gatePw === GATE_PASSWORD) {
      setGate(false);
      setGatePw("");
      setGateErr(null);
      setAsking(true);
    } else {
      setGateErr("Contraseña incorrecta");
    }
  };

  const secretTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - tapsRef.current.t > 1500) tapsRef.current.count = 0;
    tapsRef.current.t = now;
    tapsRef.current.count += 1;
    if (tapsRef.current.count >= 8 && !isDev) {
      e.preventDefault();
      tapsRef.current.count = 0;
      setGate(true);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    forceEnable();
    setAsking(false);
    setEmail("");
    setPw("");
    window.location.href = "/admin";
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="bg-white/90 backdrop-blur">
        <nav className="container-edge flex h-14 items-center justify-between sm:h-16">
          <Link
            href="/"
            onClick={(e) => {
              setOpen(false);
              secretTap(e);
            }}
            className="select-none text-xl font-bold uppercase tracking-tighter text-celeste-500 transition-colors"
          >
            modarossy
          </Link>

          <div className="hidden items-center gap-10 md:flex">
            {categories.map((c) => (
              <Link
                key={c.slug || "all"}
                href={c.slug ? `/tienda?cat=${c.slug}` : "/tienda"}
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-tinta/80 transition hover:text-celeste-600"
              >
                {c.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openCart(true)}
              aria-label="Carrito"
              data-cart-target
              className="group relative flex h-9 w-9 items-center justify-center text-tinta transition-all duration-300 hover:text-celeste-500 active:scale-90 active:text-celeste-500"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L21 8H6" />
                <circle cx="10" cy="20" r="1.4" />
                <circle cx="17" cy="20" r="1.4" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-celeste-500 px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
            <button
              aria-label="Menú"
              onClick={() => setOpen((v) => !v)}
              className={`flex h-9 w-9 items-center justify-center transition-all duration-300 active:scale-90 md:hidden ${
                open ? "text-celeste-500" : "text-tinta hover:text-celeste-500"
              }`}
            >
              <span className="relative block h-3 w-4">
                <span
                  className={`absolute left-0 top-0 h-[2px] w-4 bg-current transition ${
                    open ? "translate-y-[5px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute bottom-0 left-0 h-[2px] w-4 bg-current transition ${
                    open ? "-translate-y-[5px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <div
          className={`overflow-hidden bg-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
            open ? "max-h-[80vh]" : "max-h-0"
          }`}
        >
          <div className="container-edge flex flex-col py-2">
            {categories.map((c) => (
              <Link
                key={c.slug || "all"}
                href={c.slug ? `/tienda?cat=${c.slug}` : "/tienda"}
                onClick={() => setOpen(false)}
                className="border-b border-tinta/5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-tinta/80"
              >
                {c.label}
              </Link>
            ))}
            {isDev && (
              <div className="mt-2 flex gap-2 pb-2">
                <button
                  onClick={async () => {
                    if (!confirm("¿Reiniciar todo? (restaura productos eliminados y descarta cambios locales)")) return;
                    try {
                      await fetch("/api/products/restore", { method: "POST" });
                    } catch {}
                    resetAll();
                    window.location.reload();
                  }}
                  className="flex-1 bg-celeste-500 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-celeste-600"
                >
                  Reiniciar
                </button>
                <button
                  onClick={async () => {
                    await supabaseFullLogout();
                    disable();
                    setOpen(false);
                    window.location.href = "/";
                  }}
                  className="flex-1 bg-celeste-500 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-celeste-600"
                >
                  Salir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {gate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={submitGate}
            className="relative w-full max-w-xs space-y-3 bg-white px-5 py-4 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setGate(false)}
              aria-label="Cerrar"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center text-tinta hover:text-tinta/70"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <h3 className="text-center text-xl font-bold uppercase tracking-[0.18em]">
              Clave
            </h3>
            <input
              type="text"
              autoFocus
              value={gatePw}
              onChange={(e) => setGatePw(e.target.value)}
              className="h-10 w-full border border-tinta/20 px-3 text-sm focus:border-celeste-500 focus:outline-none"
            />
            {gateErr && <p className="text-xs text-red-500">{gateErr}</p>}
            <button className="btn-primary w-full !py-2">Continuar</button>
          </form>
        </div>
      )}

      {asking && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={submit}
            className="relative w-full max-w-xs space-y-3 bg-white px-5 py-4 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setAsking(false)}
              aria-label="Cerrar"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center text-tinta hover:text-tinta/70"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <h3 className="text-center text-xl font-bold uppercase tracking-[0.18em]">
              Panel
            </h3>
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="h-10 w-full border border-tinta/20 px-3 text-sm focus:border-celeste-500 focus:outline-none"
            />
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Contraseña"
              className="h-10 w-full border border-tinta/20 px-3 text-sm focus:border-celeste-500 focus:outline-none"
            />
            {err && <p className="text-xs text-red-500">{err}</p>}
            <button disabled={loading} className="btn-primary w-full !py-2">
              {loading ? "..." : "Entrar"}
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
