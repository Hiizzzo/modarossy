"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  action: "dispatch" | "deliver";
};

export default function DispatchActions({ orderId, action }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const label = action === "dispatch" ? "Marcar despachado" : "Marcar entregado";
  const loadingLabel = action === "dispatch" ? "Despachando..." : "Confirmando...";

  const onClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders/dispatch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "No se pudo actualizar");
        return;
      }
      router.refresh();
    } catch {
      alert("Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`mt-2 w-full rounded-full py-2 text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50 ${
        action === "dispatch"
          ? "bg-tinta text-white hover:bg-celeste-500"
          : "bg-celeste-500 text-white hover:bg-celeste-600"
      }`}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
