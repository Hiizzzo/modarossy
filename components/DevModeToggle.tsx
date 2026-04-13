"use client";

import { useEffect, useState } from "react";
import { useDev } from "@/lib/dev-store";

export default function DevModeToggle() {
  const { isDev, enable, disable, resetAll } = useDev();
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
      {isDev && (
        <div className="fixed bottom-14 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 bg-tinta px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-lg ring-1 ring-white/20">
          <span className="flex h-2 w-2 animate-pulse rounded-full bg-celeste-400" />
          Modo edición
          <button
            onClick={() => {
              if (confirm("¿Resetear todos los cambios locales?")) resetAll();
            }}
            className="border-l border-white/20 pl-3 hover:text-celeste-300"
          >
            Reset
          </button>
          <button
            onClick={disable}
            className="border-l border-white/20 pl-3 hover:text-celeste-300"
          >
            Salir
          </button>
        </div>
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
