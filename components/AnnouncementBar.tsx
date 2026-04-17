"use client";

import { useState } from "react";
import { useDev } from "@/lib/dev-store";
import CreateProductSheet from "./CreateProductSheet";

export default function AnnouncementBar() {
  const isDev = useDev((s) => s.isDev);
  const [showCreate, setShowCreate] = useState(false);

  if (isDev) {
    return (
      <>
        <div className="fixed inset-x-0 bottom-0 z-30 flex h-[56px] items-center justify-center bg-celeste-500 text-white">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            aria-label="Agregar producto"
            className="flex items-center gap-2.5 text-white transition active:scale-95"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="text-lg font-bold uppercase tracking-[0.2em]">
              Agregar producto
            </span>
          </button>
        </div>
        {showCreate && <CreateProductSheet onClose={() => setShowCreate(false)} />}
      </>
    );
  }

  const items = [
    "Envíos a todo el país",
    "Juan Manuel de Rosas 715 · Chascomús",
  ];
  const loop = Array.from({ length: 6 }).flatMap(() => items);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex h-[56px] items-center overflow-hidden bg-celeste-500 text-white">
      <div className="announcement-track flex w-max gap-16 whitespace-nowrap text-lg font-bold uppercase tracking-[0.2em]">
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
