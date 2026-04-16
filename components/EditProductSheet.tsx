"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useDev } from "@/lib/dev-store";
import type { Product } from "@/lib/products";
import ProductFormShared from "./admin/ProductFormShared";

export default function EditProductSheet({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const router = useRouter();
  const { setOverride } = useDev();
  const [mounted, setMounted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => setMounted(true), []);

  const hide = () => {
    setOverride(product.id, { hidden: true });
    onClose();
    router.refresh();
  };

  const remove = async () => {
    setDeleting(true);
    setOverride(product.id, { hidden: true });
    try {
      await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    } catch {}
    router.refresh();
    onClose();
  };

  if (!mounted) return null;
  return createPortal(
    <div
      className="edit-sheet-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="edit-sheet-card relative mx-auto flex max-h-[calc(100svh-9rem)] w-full max-w-sm flex-col gap-2.5 overflow-y-auto rounded-3xl bg-white p-0 shadow-2xl"
      >
        <div className="px-3 pb-3">
          <ProductFormShared
            mode="edit"
            product={product}
            onSuccess={onClose}
            onCancel={onClose}
            customButtons={({ save, loading }: { save: () => Promise<void>; loading: string | null }) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={hide}
                  className="flex-1 rounded-full border-2 border-tinta/25 bg-white py-2 text-xs font-bold uppercase tracking-wider text-tinta transition hover:bg-celeste-50"
                >
                  Ocultar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDel(true)}
                  className="flex-1 rounded-full border-2 border-tinta/25 bg-white py-2 text-xs font-bold uppercase tracking-wider text-tinta transition hover:bg-celeste-50"
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={!!loading}
                  className="flex-[2] rounded-full bg-tinta py-3 text-base font-bold uppercase tracking-wider text-white transition hover:bg-tinta/80 disabled:opacity-40"
                >
                  {loading || "Guardar"}
                </button>
              </div>
            )}
          />
        </div>

        {confirmDel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white/95 p-6 backdrop-blur-sm">
            <p className="text-center text-sm font-bold uppercase tracking-wider text-tinta">
              ¿Eliminar definitivamente?
            </p>
            <p className="text-center text-[11px] text-tinta/60">
              Esta acción no se puede deshacer
            </p>
            <div className="mt-2 flex w-full gap-2">
              <button
                type="button"
                onClick={() => setConfirmDel(false)}
                disabled={deleting}
                className="flex-1 rounded-full border border-tinta/25 bg-white py-3 text-[11px] font-bold uppercase tracking-wider text-tinta transition hover:bg-celeste-50 disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={deleting}
                className="flex-1 rounded-full bg-tinta py-3 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-celeste-500 disabled:opacity-40"
              >
                {deleting ? "Eliminando..." : "Confirmar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
