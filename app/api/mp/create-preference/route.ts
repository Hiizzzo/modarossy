import { NextResponse } from "next/server";
import { preference } from "@/lib/mercadopago";
import { createServiceClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/cart-store";
import type { ShippingOption } from "@/lib/shipping-types";
import {
  quoteShipment,
  DEFAULT_WEIGHT_GRAMS,
  DEFAULT_HEIGHT_CM,
  DEFAULT_WIDTH_CM,
  DEFAULT_LENGTH_CM,
} from "@/lib/zipnova";

type Body = {
  items: CartItem[];
  customer: {
    name: string;
    instagram: string;
    phone?: string;
    street: string;
    street_number: string;
    city: string;
    state: string;
    zip: string;
    document: string;
  };
  shippingOption?: ShippingOption;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body.items?.length) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Supabase no configurado" },
        { status: 500 }
      );
    }

    const supabase = createServiceClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // Cargar precios canonicos del DB (no confiar en body.items[i].price)
    const variantIds = body.items.map((i) => i.variantId);
    const { data: variantRows } = await supabase
      .from("product_variants")
      .select("id, stock, product_id, products(id, price, name, weight_grams, height_cm, width_cm, length_cm)")
      .in("id", variantIds);

    type VariantRow = {
      id: string;
      stock: number;
      product_id: string;
      products: {
        id: string;
        price: number;
        name: string;
        weight_grams: number | null;
        height_cm: number | null;
        width_cm: number | null;
        length_cm: number | null;
      } | null;
    };
    const variantMap = new Map<string, VariantRow>(
      ((variantRows ?? []) as unknown as VariantRow[]).map((v) => [v.id, v])
    );

    const safeItems: (CartItem & { price: number })[] = [];
    for (const item of body.items) {
      const v = variantMap.get(item.variantId);
      if (!v || !v.products) {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.name}` },
          { status: 404 }
        );
      }
      if (v.stock < item.qty) {
        return NextResponse.json(
          { error: `Sin stock para ${item.name}` },
          { status: 409 }
        );
      }
      safeItems.push({ ...item, price: Number(v.products.price) });
    }

    const productTotal = safeItems.reduce((t, i) => t + i.price * i.qty, 0);

    // Revalidar costo de envio contra Zipnova
    let shippingCost = 0;
    let validatedShippingOption: ShippingOption | null = null;
    if (body.shippingOption && process.env.ZIPNOVA_API_KEY) {
      try {
        const shipmentItems = safeItems.flatMap((item) => {
          const p = variantMap.get(item.variantId)?.products;
          return Array.from({ length: item.qty }, () => ({
            weight: p?.weight_grams ?? DEFAULT_WEIGHT_GRAMS,
            height: p?.height_cm ?? DEFAULT_HEIGHT_CM,
            width: p?.width_cm ?? DEFAULT_WIDTH_CM,
            length: p?.length_cm ?? DEFAULT_LENGTH_CM,
            description: item.name,
          }));
        });
        const options = await quoteShipment(
          {
            city: body.customer.city,
            state: body.customer.state,
            zipcode: body.customer.zip,
          },
          shipmentItems,
          productTotal
        );
        const match = options.find((o) => o.id === body.shippingOption!.id);
        if (!match) {
          return NextResponse.json(
            { error: "Opción de envío no disponible" },
            { status: 400 }
          );
        }
        validatedShippingOption = match;
        shippingCost = match.price;
      } catch (e) {
        console.error("Shipping re-quote failed:", e);
        return NextResponse.json(
          { error: "No se pudo validar el envío" },
          { status: 500 }
        );
      }
    }

    const total = productTotal + shippingCost;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        status: "pending",
        total,
        customer: body.customer,
        items: safeItems,
        shipping_option: validatedShippingOption,
        shipping_cost: shippingCost,
      })
      .select("id")
      .single();
    if (error) throw error;
    const orderId = order.id;

    const mpItems = safeItems.map((i) => ({
      id: i.variantId,
      title: `${i.name}${i.size ? ` · ${i.size}` : ""}`,
      quantity: i.qty,
      unit_price: i.price,
      currency_id: "ARS" as const,
    }));

    if (shippingCost > 0 && validatedShippingOption) {
      mpItems.push({
        id: "shipping",
        title: `Envío - ${validatedShippingOption.carrierName} (${validatedShippingOption.serviceName})`,
        quantity: 1,
        unit_price: shippingCost,
        currency_id: "ARS" as const,
      });
    }

    const pref = await preference.create({
      body: {
        items: mpItems,
        external_reference: orderId ?? undefined,
        back_urls: {
          success: `${siteUrl}/checkout/exito`,
          pending: `${siteUrl}/checkout/pendiente`,
          failure: `${siteUrl}/checkout/error`,
        },
        ...(siteUrl.startsWith("https://")
          ? { auto_return: "approved" as const, notification_url: `${siteUrl}/api/mp/webhook` }
          : {}),
      },
    });

    await supabase
      .from("orders")
      .update({ mp_preference_id: pref.id })
      .eq("id", orderId);

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
