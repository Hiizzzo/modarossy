import { NextResponse } from "next/server";
import { preference } from "@/lib/mercadopago";
import { createServiceClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/cart-store";

type Body = {
  items: CartItem[];
  customer: {
    name: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    zip: string;
  };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body.items?.length) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const total = body.items.reduce((t, i) => t + i.price * i.qty, 0);

    let orderId: string | null = null;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createServiceClient();

      for (const item of body.items) {
        const { data: variant } = await supabase
          .from("product_variants")
          .select("stock")
          .eq("id", item.variantId)
          .maybeSingle();
        if (!variant || variant.stock < item.qty) {
          return NextResponse.json(
            { error: `Sin stock para ${item.name}` },
            { status: 409 }
          );
        }
      }

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          status: "pending",
          total,
          customer: body.customer,
          items: body.items,
        })
        .select("id")
        .single();
      if (error) throw error;
      orderId = order.id;
    }

    const pref = await preference.create({
      body: {
        items: body.items.map((i) => ({
          id: i.variantId,
          title: `${i.name}${i.size ? ` · ${i.size}` : ""}`,
          quantity: i.qty,
          unit_price: i.price,
          currency_id: "ARS",
        })),
        payer: {
          name: body.customer.name,
          email: body.customer.email,
          phone: body.customer.phone
            ? { number: body.customer.phone }
            : undefined,
          address: {
            street_name: body.customer.address,
            zip_code: body.customer.zip,
          },
        },
        external_reference: orderId ?? undefined,
        back_urls: {
          success: `${siteUrl}/checkout/exito`,
          pending: `${siteUrl}/checkout/pendiente`,
          failure: `${siteUrl}/checkout/error`,
        },
        auto_return: "approved",
        notification_url: `${siteUrl}/api/mp/webhook`,
      },
    });

    if (orderId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createServiceClient();
      await supabase
        .from("orders")
        .update({ mp_preference_id: pref.id })
        .eq("id", orderId);
    }

    return NextResponse.json({
      init_point: pref.init_point,
      preference_id: pref.id,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
