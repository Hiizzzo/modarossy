"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ProductFormShared from "./admin/ProductFormShared";

export default function CreateProductSheet({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative mx-auto flex max-h-[calc(100svh-9rem)] w-full max-w-sm flex-col overflow-y-auto"
      >
        <ProductFormShared mode="create" onSuccess={onClose} onCancel={onClose} />
      </div>
    </div>,
    document.body
  );
}
