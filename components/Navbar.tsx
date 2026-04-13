"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useCart } from "@/lib/cart-store";
import { useDev } from "@/lib/dev-store";
import { megaCategories, type MegaCategory } from "@/lib/categories";

export default function Navbar() {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const isDev = useDev((s) => s.isDev);
  const enable = useDev((s) => s.enable);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<MegaCategory["key"] | null>(null);
  const [mobileCat, setMobileCat] = useState<MegaCategory["key"] | null>(null);
  const [asking, setAsking] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const tapsRef = useRef<{ count: number; t: number }>({ count: 0, t: 0 });
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setHovered(null), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const secretTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - tapsRef.current.t > 1500) tapsRef.current.count = 0;
    tapsRef.current.t = now;
    tapsRef.current.count += 1;
    if (tapsRef.current.count >= 5 && !isDev) {
      e.preventDefault();
      tapsRef.current.count = 0;
      setAsking(true);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enable(pw)) {
      setAsking(false);
      setPw("");
      setErr(null);
    } else {
      setErr("Contraseña incorrecta");
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div
        className="bg-white/90 backdrop-blur"
        onMouseLeave={scheduleClose}
      >
        <nav className="container-edge flex h-14 items-center justify-between sm:h-16">
          <Link
            href="/"
            onClick={(e) => {
              setOpen(false);
              secretTap(e);
            }}
            className="select-none text-xl font-bold uppercase tracking-tighter"
          >
            rossi<span className="text-celeste-500">.</span>
          </Link>

          <div className="hidden items-center gap-10 md:flex">
            {megaCategories.map((c) => (
              <div
                key={c.key}
                onMouseEnter={() => {
                  cancelClose();
                  setHovered(c.key);
                }}
                className="relative"
              >
                <Link
                  href={`/tienda?cat=${c.key}`}
                  className={`text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                    hovered === c.key ? "text-celeste-600" : "text-tinta/80"
                  }`}
                >
                  {c.label}
                </Link>
              </div>
            ))}
            <Link
              href="/tienda?cat=novedades"
              onMouseEnter={() => {
                cancelClose();
                setHovered(null);
              }}
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-tinta/80 transition hover:text-celeste-600"
            >
              Novedades
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/carrito"
              aria-label="Carrito"
              className="relative flex h-9 w-9 items-center justify-center text-tinta hover:text-celeste-600"
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
            </Link>
            <button
              aria-label="Menú"
              onClick={() => setOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center border border-tinta/15 md:hidden"
            >
              <span className="relative block h-3 w-4">
                <span
                  className={`absolute left-0 top-0 h-[2px] w-4 bg-tinta transition ${
                    open ? "translate-y-[5px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute bottom-0 left-0 h-[2px] w-4 bg-tinta transition ${
                    open ? "-translate-y-[5px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>

        {/* Desktop mega menu */}
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className={`absolute inset-x-0 top-full hidden overflow-hidden bg-white/95 backdrop-blur transition-all duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:block ${
            hovered
              ? "max-h-[500px] opacity-100"
              : "pointer-events-none max-h-0 opacity-0"
          }`}
        >
          {megaCategories.map((c) => (
            <div
              key={c.key}
              className={`container-edge grid grid-cols-4 gap-10 py-10 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                hovered === c.key
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none absolute inset-x-0 -translate-y-3 opacity-0"
              }`}
            >
              {c.groups.map((g, i) => (
                <div
                  key={g.title}
                  className={`transition-all duration-500 ${
                    hovered === c.key
                      ? "translate-y-0 opacity-100"
                      : "translate-y-2 opacity-0"
                  }`}
                  style={{ transitionDelay: hovered === c.key ? `${i * 60}ms` : "0ms" }}
                >
                  <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-tinta/50">
                    {g.title}
                  </p>
                  <ul className="space-y-2">
                    {g.items.map((it) => (
                      <li key={it.slug}>
                        <Link
                          href={`/tienda?cat=${c.key}&sub=${it.slug}`}
                          onClick={() => setHovered(null)}
                          className="text-sm font-medium text-tinta/85 transition hover:text-celeste-600"
                        >
                          {it.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Mobile menu */}
        <div
          className={`overflow-hidden bg-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
            open ? "max-h-[80vh]" : "max-h-0"
          }`}
        >
          <div className="container-edge flex flex-col py-2">
            {megaCategories.map((c) => {
              const isOpen = mobileCat === c.key;
              return (
                <div key={c.key} className="border-b border-tinta/5">
                  <button
                    onClick={() => setMobileCat(isOpen ? null : c.key)}
                    className="flex w-full items-center justify-between py-4 text-sm font-semibold uppercase tracking-[0.14em] text-tinta/80"
                  >
                    {c.label}
                    <span
                      className={`text-xs transition-transform duration-300 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pb-4 pl-1">
                      {c.groups.flatMap((g) =>
                        g.items.map((it) => (
                          <Link
                            key={`${g.title}-${it.slug}`}
                            href={`/tienda?cat=${c.key}&sub=${it.slug}`}
                            onClick={() => {
                              setOpen(false);
                              setMobileCat(null);
                            }}
                            className="py-1.5 text-sm text-tinta/70 hover:text-celeste-600"
                          >
                            {it.label}
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <Link
              href="/tienda?cat=novedades"
              onClick={() => setOpen(false)}
              className="border-b border-tinta/5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-tinta/80 last:border-b-0"
            >
              Novedades
            </Link>
          </div>
        </div>
      </div>

      {asking && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setAsking(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-xs space-y-3 bg-white p-6 shadow-2xl"
          >
            <h3 className="text-sm font-bold uppercase tracking-[0.12em]">
              Acceso restringido
            </h3>
            <input
              type="password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Contraseña"
              className="h-11 w-full border border-tinta/20 px-4 text-sm focus:border-celeste-500 focus:outline-none"
            />
            {err && <p className="text-xs text-red-500">{err}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAsking(false)}
                className="btn-ghost flex-1 !py-2"
              >
                Cancelar
              </button>
              <button className="btn-primary flex-1 !py-2">Entrar</button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
