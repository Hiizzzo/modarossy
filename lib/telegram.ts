type OrderForNotification = {
  id: string;
  total: number;
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
  };
  items: Array<{ name: string; qty: number; size?: string; color?: string }>;
  shipping_option?: { carrierName: string; serviceName: string } | null;
  shipping_cost?: number | null;
  mp_payment_id?: string | null;
};

export async function notifyNewOrder(order: OrderForNotification) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const lines: string[] = [];
  lines.push("🛍️ *Nueva venta confirmada*");
  lines.push("");
  lines.push(`*Orden:* \`${order.id}\``);
  lines.push(`*Pago MP:* \`${order.mp_payment_id ?? "-"}\``);
  lines.push(`*Total:* $${order.total.toLocaleString("es-AR")}`);
  lines.push("");
  lines.push("*Productos:*");
  for (const it of order.items) {
    const extra = [it.size, it.color].filter(Boolean).join(" · ");
    lines.push(`• ${it.qty}× ${it.name}${extra ? ` (${extra})` : ""}`);
  }
  lines.push("");
  lines.push("*Cliente:*");
  lines.push(`${order.customer.name}`);
  const contact = order.customer.instagram ?? order.customer.email ?? "-";
  lines.push(`${contact}${order.customer.phone ? ` · ${order.customer.phone}` : ""}`);
  lines.push(
    `${order.customer.street} ${order.customer.street_number}, ${order.customer.city}, ${order.customer.state} (${order.customer.zip})`
  );
  if (order.shipping_option) {
    lines.push("");
    lines.push(
      `*Envío:* ${order.shipping_option.carrierName} - ${order.shipping_option.serviceName} ($${(order.shipping_cost ?? 0).toLocaleString("es-AR")})`
    );
  }

  const text = lines.join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
  } catch (e) {
    console.error("Telegram notify failed:", e);
  }
}
