import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { formatARS } from "@/lib/format";

export const dynamic = "force-dynamic";

type OrderItem = {
  name?: string;
  qty?: number;
  price?: number;
  size?: string;
  color?: string;
};

type Order = {
  id: string;
  status: string;
  total: number;
  customer: { name?: string; email?: string; phone?: string; address?: string } | null;
  items: OrderItem[] | null;
  created_at: string;
  mp_payment_id: string | null;
};

async function getOrders(): Promise<Order[]> {
  noStore();
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    return [];
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Order[] | null) ?? [];
}

const statusColor: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-600",
  cancelled: "bg-red-100 text-red-600",
};

export default async function VentasPage() {
  const allOrders = await getOrders();
  const orders = allOrders.filter((o) => o.status !== "pending");
  const paid = orders.filter(
    (o) => o.status === "approved" || o.status === "paid"
  );
  const total = paid.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const unitsSold = paid.reduce(
    (s, o) =>
      s +
      (Array.isArray(o.items)
        ? o.items.reduce((n, i) => n + (i.qty ?? 0), 0)
        : 0),
    0
  );

  const topProducts = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of paid) {
    if (!Array.isArray(o.items)) continue;
    for (const i of o.items) {
      const key = i.name ?? "—";
      const prev = topProducts.get(key) ?? { name: key, qty: 0, revenue: 0 };
      prev.qty += i.qty ?? 0;
      prev.revenue += (i.price ?? 0) * (i.qty ?? 0);
      topProducts.set(key, prev);
    }
  }
  const ranking = [...topProducts.values()].sort((a, b) => b.qty - a.qty);

  return (
    <div className="space-y-4 px-3 pb-20 pt-4 sm:px-6">
      <div>
        <Link
          href="/tienda"
          className="text-[10px] font-semibold uppercase tracking-[0.12em] text-tinta/60"
        >
          ← Tienda
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Ventas</h1>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-celeste-500 p-3 text-white">
          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] opacity-80">
            Ganancia
          </p>
          <p className="mt-1 text-lg font-bold leading-tight">{formatARS(total)}</p>
        </div>
        <div className="rounded-2xl bg-tinta p-3 text-white">
          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] opacity-70">
            Vendidos
          </p>
          <p className="mt-1 text-lg font-bold leading-tight">{unitsSold}</p>
        </div>
        <div className="rounded-2xl bg-white p-3 ring-1 ring-celeste-100">
          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-tinta/60">
            Órdenes
          </p>
          <p className="mt-1 text-lg font-bold leading-tight">{paid.length}</p>
        </div>
      </div>

      {ranking.length > 0 && (
        <div className="rounded-2xl bg-white p-3 ring-1 ring-celeste-100">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-tinta/60">
            Más vendidos
          </p>
          <ul className="space-y-1.5">
            {ranking.slice(0, 5).map((r) => (
              <li key={r.name} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-celeste-500 px-1.5 text-[10px] font-bold text-white">
                    {r.qty}
                  </span>
                  <span className="truncate font-semibold">{r.name}</span>
                </span>
                <span className="font-bold">{formatARS(r.revenue)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-tinta/60">
        Historial
      </p>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-tinta/20 py-16 text-center text-sm text-tinta/60">
          Todavía no hay ventas.
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const date = new Date(o.created_at);
            const items = Array.isArray(o.items) ? o.items : [];
            const nItems = items.reduce((s, i) => s + (i.qty ?? 0), 0);
            return (
              <li
                key={o.id}
                className="rounded-2xl bg-white p-3 ring-1 ring-celeste-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {o.customer?.name ?? "Sin nombre"}
                    </p>
                    <p className="truncate text-[11px] text-tinta/60">
                      {date.toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      statusColor[o.status] ?? "bg-tinta/10 text-tinta/70"
                    }`}
                  >
                    {o.status}
                  </span>
                </div>

                <ul className="mt-2 space-y-0.5 text-[11px] text-tinta/70">
                  {items.map((i, idx) => (
                    <li key={idx} className="flex justify-between gap-2">
                      <span className="truncate">
                        {i.qty}× {i.name}
                        {i.size ? ` · ${i.size}` : ""}
                      </span>
                      <span className="font-semibold text-tinta">
                        {formatARS((i.price ?? 0) * (i.qty ?? 0))}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-2 flex items-center justify-between border-t border-celeste-100 pt-2">
                  <span className="text-[11px] text-tinta/60">
                    {nItems} {nItems === 1 ? "item" : "items"}
                  </span>
                  <span className="text-base font-bold">{formatARS(o.total)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
