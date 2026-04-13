"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useDev } from "@/lib/dev-store";
import { createClient } from "@/lib/supabase/client";

export default function DevModeToggle() {
  const { isDev, enable, disable, resetAll, forceEnable } = useDev();
  const pathname = usePathname();
  const onNuevo = pathname === "/admin/productos/nuevo";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) forceEnable();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) forceEnable();
      else disable();
    });
    return () => sub.subscription.unsubscribe();
  }, [forceEnable, disable]);

  const fullExit = async () => {
    try {
      await createClient().auth.signOut();
    } catch {}
    disable();
    window.location.href = "/";
  };
  const [asking, setAsking] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        if (isDev) {
          disable();
        } else {
          setAsking(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDev, disable]);

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
    <>
      {isDev && !onNuevo && (
        <a
          href="/admin/productos/nuevo"
          className="fixed bottom-12 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 bg-celeste-500 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white shadow-xl transition hover:bg-celeste-600 active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Agregar producto
        </a>
      )}

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
    </>
  );
}
