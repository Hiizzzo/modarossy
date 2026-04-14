"use client";

import { useCart } from "@/lib/cart-store";
import CartView from "@/components/CartView";

export default function CartDrawer() {
  const open = useCart((s) => s.open);
  const setOpen = useCart((s) => s.setOpen);

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-[65] h-full w-[78%] max-w-sm transform transition-transform duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.72) 0%, rgba(255,240,246,0.58) 40%, rgba(255,255,255,0.68) 100%)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          borderLeft: "1px solid rgba(255,255,255,0.55)",
          boxShadow:
            "-30px 0 80px -20px rgba(236,72,153,0.18), inset 1px 0 0 rgba(255,255,255,0.6)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(120% 60% at 0% 0%, rgba(255,255,255,0.7), transparent 60%), radial-gradient(80% 50% at 100% 100%, rgba(236,72,153,0.12), transparent 70%)",
          }}
        />
        <div className="relative flex h-full flex-col overflow-y-auto px-4 pb-6 pt-16">
          <button
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center text-tinta active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <CartView />
        </div>
      </aside>
    </>
  );
}
