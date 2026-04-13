"use client";

import { useDev } from "@/lib/dev-store";

export default function AnnouncementBar() {
  const isDev = useDev((s) => s.isDev);

  if (isDev) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 bg-tinta py-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white">
        Modo edición
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
      <div className="announcement-track flex w-max gap-16 whitespace-nowrap py-2 text-[11px] font-semibold uppercase tracking-[0.2em]">
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
