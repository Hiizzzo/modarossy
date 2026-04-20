import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { formatARS } from "@/lib/format";
import DispatchActions from "@/components/admin/DispatchActions";

export const dynamic = "force-dynamic";

type OrderItem = {
  name?: string;
  qty?: number;
  price?: number;
  size?: string;
  color?: string;
};

type Customer = {
  name?: string;
  email?: string;
  instagram?: string;
  phone?: string;
  street?: string;
  street_number?: string;
  city?: string;
  state?: string;
  zip?: string;
} | null;

type Order = {
  id: string;
  status: string;
  total: number;
  customer: Customer;
  items: OrderItem[] | null;
  created_at: string;
  mp_payment_id: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  tracking_code: string | null;
  shipping_option: { carrierName?: string; serviceName?: string } | null;
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function customerContact(c: Customer): string {
  return c?.instagram ?? c?.email ?? "—";
}

function OrderCard({
  order,
  action,
}: {
  order: Order;
  action?: "dispatch" | "deliver" | null;
}) {
  const items = Array.isArray(order.items) ? order.items : [];
  const nItems = items.reduce((s, i) => s + (i.qty ?? 0), 0);
  const address = order.customer
    ? [
        order.customer.street,
        order.customer.street_number,
        order.customer.city,
        order.customer.state,
        order.customer.zip ? `(${order.customer.zip})` : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  const isDelivered = !!order.delivered_at;

  return (
    <li
      className={`rounded-2xl p-3 ring-1 ${
        isDelivered ? "bg-green-50 ring-green-200" : "bg-white ring-celeste-100"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {order.customer?.name ?? "Sin nombre"}
          </p>
          <p className="truncate text-[11px] text-tinta/60">
            {customerContact(order.customer)} · {formatDate(order.created_at)}
          </p>
        </div>
        {isDelivered && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs text-white">
            ✓
          </span>
        )}
      </div>

      {address && (
        <p className="mt-1 text-[11px] text-tinta/60">{address}</p>
      )}

      <ul className="mt-2 space-y-0.5 text-[11px] text-tinta/70">
        {items.map((i, idx) => (
          <li key={idx} className="flex justify-between gap-2">
            <span className="truncate">
              {i.qty}× {i.name}
              {i.size ? ` · ${i.size}` : ""}
              {i.color ? ` · ${i.color}` : ""}
            </span>
            <span className="font-semibold text-tinta">
              {formatARS((i.price ?? 0) * (i.qty ?? 0))}
            </span>
          </li>
        ))}
      </ul>

      {order.shipping_option && (
        <p className="mt-1.5 text-[10px] text-tinta/60">
          {order.shipping_option.carrierName} ·{" "}
          {order.shipping_option.serviceName}
          {order.tracking_code ? ` · ${order.tracking_code}` : ""}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-celeste-100 pt-2">
        <span className="text-[11px] text-tinta/60">
          {nItems} {nItems === 1 ? "item" : "items"}
        </span>
        <span className="text-base font-bold">{formatARS(order.total)}</span>
      </div>

      {order.dispatched_at && !isDelivered && (
        <p className="mt-1 text-[10px] text-tinta/50">
          Despachado: {formatDate(order.dispatched_at)}
        </p>
      )}
      {order.delivered_at && (
        <p className="mt-1 text-[10px] text-green-700">
          Entregado: {formatDate(order.delivered_at)}
        </p>
      )}

      {action && <DispatchActions orderId={order.id} action={action} />}
    </li>
  );
}

export default async function VentasPage() {
  const allOrders = await getOrders();
  const paid = allOrders.filter(
    (o) => o.status === "approved" || o.status === "paid"
  );

  const pendientesDespacho = paid.filter((o) => !o.dispatched_at);
  const despachadosEnCamino = paid.filter(
    (o) => o.dispatched_at && !o.delivered_at
  );
  const entregados = paid.filter((o) => o.delivered_at);

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

      <div className="flex items-center justify-between pt-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-tinta/60">
          📦 Pendientes de despacho
        </p>
        <span className="rounded-full bg-tinta px-2 py-0.5 text-[10px] font-bold text-white">
          {pendientesDespacho.length}
        </span>
      </div>

      {pendientesDespacho.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-tinta/20 py-10 text-center text-xs text-tinta/60">
          No hay pedidos pendientes de despacho.
        </div>
      ) : (
        <ul className="space-y-3">
          {pendientesDespacho.map((o) => (
            <OrderCard key={o.id} order={o} action="dispatch" />
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-tinta/60">
          🚚 Despachados
        </p>
        <span className="rounded-full bg-celeste-500 px-2 py-0.5 text-[10px] font-bold text-white">
          {despachadosEnCamino.length + entregados.length}
        </span>
      </div>

      {despachadosEnCamino.length === 0 && entregados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-tinta/20 py-10 text-center text-xs text-tinta/60">
          Todavía no despachaste ningún pedido.
        </div>
      ) : (
        <ul className="space-y-3">
          {despachadosEnCamino.map((o) => (
            <OrderCard key={o.id} order={o} action="deliver" />
          ))}
          {entregados.map((o) => (
            <OrderCard key={o.id} order={o} action={null} />
          ))}
        </ul>
      )}
    </div>
  );
}
