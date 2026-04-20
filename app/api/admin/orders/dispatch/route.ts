import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

type Body = {
  orderId: string;
  action: "dispatch" | "deliver";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body.orderId || !body.action) {
      return NextResponse.json(
        { error: "orderId y action son requeridos" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const now = new Date().toISOString();

    const patch =
      body.action === "dispatch"
        ? { dispatched_at: now }
        : { delivered_at: now, shipping_status: "delivered" };

    const { error } = await supabase
      .from("orders")
      .update(patch)
      .eq("id", body.orderId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Dispatch error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
