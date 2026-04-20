import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatARS } from "@/lib/format";

type SearchParams = {
  external_reference?: string;
  payment_id?: string;
  status?: string;
  merchant_order_id?: string;
};

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  shipping_cost: number | null;
  mp_payment_id: string | null;
  customer: {
    name: string;
    email?: string;
    instagram?: string;
    phone?: string;
    street: string;
    street_number: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    size?: string;
    color?: string;
  }> | null;
  shipping_option: {
    carrierName: string;
    serviceName: string;
    deliveryMin?: number;
    deliveryMax?: number;
  } | null;
};

export default async function ExitoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const orderId = searchParams.external_reference;
  const paymentId = searchParams.payment_id;

  let order: OrderRow | null = null;
  if (orderId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from("orders")
        .select(
          "id, created_at, status, total, shipping_cost, mp_payment_id, customer, items, shipping_option"
        )
        .eq("id", orderId)
        .single();
      order = data as OrderRow | null;
    } catch {
      order = null;
    }
  }

  const productsTotal =
    order?.items?.reduce((t, i) => t + i.price * i.qty, 0) ?? 0;

  return (
    <div className="container-edge py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center gap-3 pb-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-celeste-500 text-2xl text-white">
            ✓
          </div>
          <h1 className="text-2xl font-bold tracking-tight">¡Pago recibido!</h1>
          <p className="text-sm text-tinta/70">
            Ya preparamos tu pedido. Te enviamos el detalle por email.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-tinta/60">
              Orden
            </span>
            <span className="font-mono text-tinta">
              #{(order?.id ?? orderId ?? "—").slice(0, 8).toUpperCase()}
            </span>
          </div>
          {paymentId && (
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-tinta/60">
                Pago MP
              </span>
              <span className="font-mono text-tinta">{paymentId}</span>
            </div>
          )}

          {order?.items && order.items.length > 0 && (
            <>
              <hr className="border-tinta/10" />
              <ul className="space-y-1.5">
                {order.items.map((i, idx) => {
                  const extra = [i.size, i.color].filter(Boolean).join(" · ");
                  return (
                    <li key={idx} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-tinta">
                          {i.qty}× {i.name}
                        </div>
                        {extra && (
                          <div className="text-xs text-tinta/60">{extra}</div>
                        )}
                      </div>
                      <span className="shrink-0 font-bold text-tinta">
                        {formatARS(i.price * i.qty)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {order?.customer && (
            <>
              <hr className="border-tinta/10" />
              <div className="text-xs text-tinta/80">
                <div className="font-semibold uppercase tracking-wider text-tinta/60 pb-0.5">
                  Enviamos a
                </div>
                <div>{order.customer.name}</div>
                <div>
                  {order.customer.street} {order.customer.street_number},{" "}
                  {order.customer.city}, {order.customer.state} (
                  {order.customer.zip})
                </div>
              </div>
            </>
          )}

          {order?.shipping_option && (
            <div className="rounded-xl bg-celeste-50 p-2.5 text-xs">
              <div className="font-semibold text-tinta">
                {order.shipping_option.carrierName} ·{" "}
                {order.shipping_option.serviceName}
              </div>
              {order.shipping_option.deliveryMin !== undefined && (
                <div className="text-tinta/60">
                  Entrega estimada: {order.shipping_option.deliveryMin}-
                  {order.shipping_option.deliveryMax} días hábiles
                </div>
              )}
            </div>
          )}

          {order && (
            <>
              <hr className="border-tinta/10" />
              <div className="space-y-0.5 text-xs">
                <div className="flex items-center justify-between text-tinta/60">
                  <span>Productos</span>
                  <span>{formatARS(productsTotal)}</span>
                </div>
                {(order.shipping_cost ?? 0) > 0 && (
                  <div className="flex items-center justify-between text-tinta/60">
                    <span>Envío</span>
                    <span>{formatARS(order.shipping_cost ?? 0)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 text-sm">
                  <span className="font-semibold uppercase tracking-wider text-tinta/70">
                    Total pagado
                  </span>
                  <span className="text-base font-bold text-tinta">
                    {formatARS(order.total)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <Link
          href="/tienda"
          className="mt-4 block w-full rounded-full bg-tinta py-3 text-center text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-celeste-500"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
