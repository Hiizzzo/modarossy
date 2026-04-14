"use client";

import { usePathname } from "next/navigation";
import { useDev } from "@/lib/dev-store";

export default function AnnouncementBar() {
  const isDev = useDev((s) => s.isDev);
  const pathname = usePathname();
  const onNuevo = pathname === "/admin/productos/nuevo";

  if (isDev) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center bg-celeste-500 py-5 text-white">
        {!onNuevo && (
          <a
            href="/admin/productos/nuevo"
            aria-label="Agregar producto"
            className="flex items-center gap-3 text-white transition active:scale-95"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-[0.2em]">
              Agregar producto
            </span>
          </a>
        )}
        {onNuevo && (
          <span className="text-sm font-bold uppercase tracking-[0.2em]">
            Modo edición
          </span>
        )}
      </div>
    );
  }

  const items = [
    "Envíos a todo el país",
    "Juan Manuel de Rosas 720 · Chascomús",
  ];
  const loop = Array.from({ length: 6 }).flatMap(() => items);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 overflow-hidden bg-celeste-500 text-white">
      <div className="announcement-track flex w-max gap-16 whitespace-nowrap py-5 text-sm font-bold uppercase tracking-[0.2em]">
        {loop.map((t, i) => (
          <span key={i} className="flex items-center gap-16">
            {t}
            <span className="text-white/70">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
