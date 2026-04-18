import { Resend } from "resend";

type OrderForEmail = {
  id: string;
  total: number;
  customer: {
    name: string;
    email: string;
    street: string;
    street_number: string;
    city: string;
    state: string;
    zip: string;
  };
  items: Array<{ name: string; qty: number; price: number; size?: string; color?: string }>;
  shipping_option?: { carrierName: string; serviceName: string } | null;
  shipping_cost?: number | null;
  mp_payment_id?: string | null;
};

export async function sendOrderReceipt(order: OrderForEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Rossi Ropa <onboarding@resend.dev>";
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const fmt = (n: number) => `$${n.toLocaleString("es-AR")}`;

  const itemsHtml = order.items
    .map((i) => {
      const extra = [i.size, i.color].filter(Boolean).join(" · ");
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${i.qty}× ${i.name}${extra ? ` <span style="color:#888">(${extra})</span>` : ""}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${fmt(i.price * i.qty)}</td>
      </tr>`;
    })
    .join("");

  const shippingRow =
    order.shipping_option && order.shipping_cost
      ? `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">Envío - ${order.shipping_option.carrierName} (${order.shipping_option.serviceName})</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${fmt(order.shipping_cost)}</td>
        </tr>`
      : "";

  const html = `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#222">
  <h1 style="font-size:22px;margin:0 0 8px">¡Gracias por tu compra, ${order.customer.name}!</h1>
  <p style="color:#555;margin:0 0 24px">Tu pago fue acreditado. Abajo está el detalle de tu orden.</p>

  <div style="background:#f7f7f7;padding:16px;border-radius:8px;margin-bottom:20px">
    <div><strong>Orden:</strong> ${order.id}</div>
    ${order.mp_payment_id ? `<div><strong>Pago MP:</strong> ${order.mp_payment_id}</div>` : ""}
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <thead>
      <tr style="text-align:left;background:#fafafa">
        <th style="padding:8px;border-bottom:2px solid #ddd">Producto</th>
        <th style="padding:8px;border-bottom:2px solid #ddd;text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
      ${shippingRow}
      <tr>
        <td style="padding:12px 8px;font-weight:bold">Total</td>
        <td style="padding:12px 8px;text-align:right;font-weight:bold">${fmt(order.total)}</td>
      </tr>
    </tbody>
  </table>

  <div style="background:#f7f7f7;padding:16px;border-radius:8px;margin-bottom:20px">
    <strong>Dirección de envío</strong><br>
    ${order.customer.street} ${order.customer.street_number}<br>
    ${order.customer.city}, ${order.customer.state} (${order.customer.zip})
  </div>

  <p style="color:#888;font-size:13px">Te escribimos cuando el envío se despache. Si tenés dudas, respondé a este mail.</p>
</body></html>`;

  try {
    await resend.emails.send({
      from,
      to: order.customer.email,
      subject: `Tu compra en Rossi Ropa · Orden ${order.id.slice(0, 8)}`,
      html,
    });
  } catch (e) {
    console.error("Email send failed:", e);
  }
}
