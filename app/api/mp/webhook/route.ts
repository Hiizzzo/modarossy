import { NextResponse } from "next/server";
import { payment } from "@/lib/mercadopago";
import { createServiceClient } from "@/lib/supabase/server";
import {
  createShipment,
  DEFAULT_WEIGHT_GRAMS,
  DEFAULT_HEIGHT_CM,
  DEFAULT_WIDTH_CM,
  DEFAULT_LENGTH_CM,
} from "@/lib/zipnova";
import { notifyNewOrder } from "@/lib/telegram";
import { sendOrderReceipt } from "@/lib/email";
import type { ShippingOption } from "@/lib/shipping-types";
import type { CartItem } from "@/lib/cart-store";

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

        // Fetch full order for notifications + shipment
        const { data: fullOrder } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();

        if (fullOrder) {
          const notifPayload = {
            id: fullOrder.id,
            total: fullOrder.total,
            customer: fullOrder.customer,
            items: fullOrder.items,
            shipping_option: fullOrder.shipping_option,
            shipping_cost: fullOrder.shipping_cost,
            mp_payment_id: String(paymentId),
          };
          await Promise.all([
            notifyNewOrder(notifPayload),
            sendOrderReceipt(notifPayload),
          ]);
        }

        if (
          fullOrder?.shipping_option &&
          !fullOrder.zipnova_shipment_id &&
          process.env.ZIPNOVA_API_KEY &&
          process.env.ZIPNOVA_AUTO_CREATE === "true"
        ) {
          try {
            const option = fullOrder.shipping_option as ShippingOption;
            const customer = fullOrder.customer as {
              name: string;
              email?: string;
              instagram?: string;
              phone?: string;
              street: string;
              street_number: string;
              city: string;
              state: string;
              zip: string;
              document: string;
            };
            const orderItems = fullOrder.items as CartItem[];

            // Fetch product dimensions
            const productIds = [
              ...new Set(orderItems.map((i) => i.productId)),
            ];
            const { data: products } = await supabase
              .from("products")
              .select("id, weight_grams, height_cm, width_cm, length_cm")
              .in("id", productIds);

            const productMap = new Map(
              (products ?? []).map((p: any) => [p.id, p])
            );

            const shipmentItems = orderItems.flatMap((item) => {
              const product = productMap.get(item.productId) as any;
              return Array.from({ length: item.qty }, () => ({
                weight: product?.weight_grams ?? DEFAULT_WEIGHT_GRAMS,
                height: product?.height_cm ?? DEFAULT_HEIGHT_CM,
                width: product?.width_cm ?? DEFAULT_WIDTH_CM,
                length: product?.length_cm ?? DEFAULT_LENGTH_CM,
                description: item.name,
              }));
            });

            const result = await createShipment({
              logisticCode: option.logisticCode,
              serviceCode: option.serviceCode,
              carrierId: option.carrierId,
              declaredValue:
                fullOrder.total - (fullOrder.shipping_cost ?? 0),
              externalId: orderId.replace(/-/g, "").substring(0, 30),
              destination: {
                name: customer.name,
                street: customer.street,
                street_number: customer.street_number,
                document: customer.document,
                email: customer.email ?? "noreply@modarossy.com",
                phone: customer.phone ?? "",
                state: customer.state,
                city: customer.city,
                zipcode: customer.zip,
              },
              items: shipmentItems,
            });

            await supabase
              .from("orders")
              .update({
                zipnova_shipment_id: result.shipmentId,
                tracking_code: result.trackingCode,
                shipping_status: "created",
              })
              .eq("id", orderId);
          } catch (shipErr) {
            console.error("Zipnova shipment creation failed:", shipErr);
            // Don't fail the webhook — payment is already confirmed
          }
        }
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
