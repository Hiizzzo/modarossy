const BASE_URL = "https://api.zipnova.com.ar/v2";

const key = process.env.ZIPNOVA_API_KEY;
const secret = process.env.ZIPNOVA_API_SECRET;
const accountId = parseInt(process.env.ZIPNOVA_ACCOUNT_ID, 10);
const originId = parseInt(process.env.ZIPNOVA_ORIGIN_ID, 10);

const headers = {
  Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

const destination = {
  city: "Buenos Aires",
  state: "Ciudad Autónoma de Buenos Aires",
  zipcode: "1000",
  country: "AR",
};

const scenarios = [
  {
    label: "Producto chico — 500 g (Cartera)",
    item: { weight: 500, height: 10, width: 30, length: 40, description: "Cartera", sku: "" },
    declared: 15000,
  },
  {
    label: "Producto grande — 2 kg (Campera + pantalón)",
    item: { weight: 2000, height: 25, width: 40, length: 50, description: "Campera pantalon", sku: "" },
    declared: 60000,
  },
];

async function quote(item, declared) {
  const res = await fetch(`${BASE_URL}/shipments/quote`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      account_id: accountId,
      origin_id: originId,
      declared_value: declared,
      type_packaging: "dynamic",
      destination,
      items: [item],
    }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.all_results ?? [];
}

function fmt(n) {
  return n.toLocaleString("es-AR");
}

for (const s of scenarios) {
  console.log("\n==========================================================");
  console.log(s.label);
  console.log(
    `  ${s.item.weight}g · ${s.item.height}×${s.item.width}×${s.item.length}cm · valor $${fmt(s.declared)}`
  );
  console.log("==========================================================");

  try {
    const results = await quote(s.item, s.declared);
    const options = results
      .map((r) => ({
        carrier: r.carrier?.name ?? "?",
        service: r.service_type?.name ?? "?",
        price: r.amounts?.price_incl_tax ?? r.amounts?.price ?? 0,
        min: r.delivery_time?.min ?? 0,
        max: r.delivery_time?.max ?? 0,
        tags: r.tags ?? [],
      }))
      .sort((a, b) => a.price - b.price);

    for (const o of options) {
      const tag = o.tags.includes("cheapest") ? " ← MÁS BARATO" : "";
      console.log(
        `  ${o.carrier.padEnd(22)} ${o.service.padEnd(32)} $${fmt(o.price).padStart(10)}  (${o.min}-${o.max}d)${tag}`
      );
    }
  } catch (e) {
    console.error("  ERROR:", e.message);
  }
}
