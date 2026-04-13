import React from "react";

const items: React.ReactNode[] = [
  "Envíos a todo el país",
  <span key="mp" className="flex items-center gap-2">
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mp.png"
        alt="Mercado Pago"
        className="h-6 w-6 object-contain"
      />
    </span>
    Pagá en cuotas
  </span>,
  "Local en Chascomús · Juan Manuel de Rosas 720",
  "Nueva temporada disponible",
];

export default function AnnouncementBar() {
  const loop = [...items, ...items];
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 overflow-hidden border-t border-white/10 bg-tinta text-white">
      <div className="announcement-track flex w-max gap-12 whitespace-nowrap py-2 text-[11px] font-medium uppercase tracking-[0.18em]">
        {loop.map((t, i) => (
          <span key={i} className="flex items-center gap-12">
            {t}
            <span className="text-celeste-400">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
