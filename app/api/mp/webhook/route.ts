import { NextResponse } from "next/server";
import { payment } from "@/lib/mercadopago";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const paymentId =
      body?.data?.id ?? new URL(req.url).searchParams.get("data.id");
    if (!paymentId) return NextResponse.json({ ok: true });

    const pay = await payment.get({ id: paymentId });
    const status = pay.status;
    const orderId = pay.external_reference;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !orderId) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createServiceClient();

    if (status === "approved") {
      const { data: order } = await supabase
        .from("orders")
        .select("items, status")
        .eq("id", orderId)
        .maybeSingle();

      if (order && order.status !== "paid") {
        const items = (order.items ?? []) as Array<{
          variantId: string;
          qty: number;
        }>;

        for (const item of items) {
          const { data: v } = await supabase
            .from("product_variants")
            .select("stock")
            .eq("id", item.variantId)
            .maybeSingle();
          if (v) {
            await supabase
              .from("product_variants")
              .update({ stock: Math.max(0, v.stock - item.qty) })
              .eq("id", item.variantId);
          }
        }

        await supabase
          .from("orders")
          .update({
            status: "paid",
            mp_payment_id: String(paymentId),
          })
          .eq("id", orderId);
      }
    } else if (status === "rejected" || status === "cancelled") {
      await supabase
        .from("orders")
        .update({ status: "failed", mp_payment_id: String(paymentId) })
        .eq("id", orderId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
