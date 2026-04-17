import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  quoteShipment,
  DEFAULT_WEIGHT_GRAMS,
  DEFAULT_HEIGHT_CM,
  DEFAULT_WIDTH_CM,
  DEFAULT_LENGTH_CM,
} from "@/lib/zipnova";
import type { CartItem } from "@/lib/cart-store";

type Body = {
  items: CartItem[];
  destination: {
    city: string;
    state: string;
    zipcode: string;
  };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body.items?.length) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }
    if (!body.destination?.city || !body.destination?.state || !body.destination?.zipcode) {
      return NextResponse.json({ error: "Destino incompleto" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch product dimensions for each unique product
    const productIds = [...new Set(body.items.map((i) => i.productId))];
    const { data: products } = await supabase
      .from("products")
      .select("id, weight_grams, height_cm, width_cm, length_cm")
      .in("id", productIds);

    const productMap = new Map(
      (products ?? []).map((p: any) => [p.id, p])
    );

    // Build quote items: one entry per cart item unit
    const quoteItems = body.items.flatMap((item) => {
      const product = productMap.get(item.productId) as any;
      const weight = product?.weight_grams ?? DEFAULT_WEIGHT_GRAMS;
      const height = product?.height_cm ?? DEFAULT_HEIGHT_CM;
      const width = product?.width_cm ?? DEFAULT_WIDTH_CM;
      const length = product?.length_cm ?? DEFAULT_LENGTH_CM;

      return Array.from({ length: item.qty }, () => ({
        weight,
        height,
        width,
        length,
        description: item.name,
      }));
    });

    const declaredValue = body.items.reduce((t, i) => t + i.price * i.qty, 0);

    const options = await quoteShipment(
      body.destination,
      quoteItems,
      declaredValue
    );

    return NextResponse.json({ options });
  } catch (e) {
    console.error("Shipping quote error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error cotizando envío" },
      { status: 500 }
    );
  }
}
