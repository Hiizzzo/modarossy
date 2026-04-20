"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useDev } from "@/lib/dev-store";

export default function Footer() {
  const { isDev } = useDev();
  const [asking, setAsking] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const enable = useDev((s) => s.enable);
  const tapsRef = useRef<{ count: number; t: number }>({ count: 0, t: 0 });

  const secretTap = () => {
    const now = Date.now();
    if (now - tapsRef.current.t > 1500) tapsRef.current.count = 0;
    tapsRef.current.t = now;
    tapsRef.current.count += 1;
    if (tapsRef.current.count >= 5 && !isDev) {
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
    <footer className="border-t border-tinta/10 bg-white">
      <div className="container-edge grid gap-10 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="text-3xl font-bold uppercase tracking-tighter">
            modarossy
          </div>
          <p className="mt-3 max-w-sm text-sm text-tinta/70">
            Ropa con identidad. Hecha en Argentina.
          </p>
        </div>
        <div>
          <p className="eyebrow">Tienda</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/tienda" className="hover:text-celeste-600">
                Ver todo
              </Link>
            </li>
            <li>
              <Link href="/tienda?cat=camperas" className="hover:text-celeste-600">
                Camperas
              </Link>
            </li>
            <li>
              <Link href="/tienda?cat=buzos" className="hover:text-celeste-600">
                Buzos
              </Link>
            </li>
            <li>
              <Link href="/tienda?cat=remeras" className="hover:text-celeste-600">
                Remeras
              </Link>
            </li>
            <li>
              <Link href="/tienda?cat=pantalones" className="hover:text-celeste-600">
                Pantalones
              </Link>
            </li>
            <li>
              <Link href="/tienda?cat=zapatillas" className="hover:text-celeste-600">
                Zapatillas
              </Link>
            </li>
            <li>
              <Link href="/tienda?cat=mochilas" className="hover:text-celeste-600">
                Mochilas
              </Link>
            </li>
            <li>
              <Link href="/tienda?cat=carteras" className="hover:text-celeste-600">
                Carteras
              </Link>
            </li>
            <li>
              <Link href="/tienda?cat=accesorios" className="hover:text-celeste-600">
                Accesorios
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Contacto</p>
          <address className="mt-4 space-y-1 text-sm not-italic text-tinta/70">
            <div>Juan Manuel de Rosas 715</div>
            <div>Chascomús, Buenos Aires</div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Juan+Manuel+de+Rosas+720+Chascomus"
              target="_blank"
              rel="noreferrer"
              className="inline-block pt-2 text-celeste-600 hover:underline"
            >
              Ver en el mapa →
            </a>
          </address>
        </div>
      </div>
      <div className="border-t border-tinta/10">
        <div className="container-edge flex flex-col items-center justify-between gap-2 py-5 text-[11px] uppercase tracking-[0.12em] text-tinta/50 sm:flex-row">
          <span>© {new Date().getFullYear()} Modarossy</span>
          <span
            onClick={secretTap}
            className="cursor-default select-none"
            aria-hidden
          >
            Pagos con Mercado Pago · Envíos Andreani
          </span>
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
    </footer>
  );
}
