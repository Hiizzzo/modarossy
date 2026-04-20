import { quoteShipment } from "../lib/zipnova";

const destination = {
  city: "Buenos Aires",
  state: "Ciudad Autónoma de Buenos Aires",
  zipcode: "1000",
};

const scenarios = [
  {
    label: "Producto chico — 500 g",
    item: { weight: 500, height: 10, width: 30, length: 40, description: "Cartera" },
    declared: 15000,
  },
  {
    label: "Producto grande — 2 kg",
    item: { weight: 2000, height: 25, width: 40, length: 50, description: "Campera + pantalón" },
    declared: 60000,
  },
];

async function main() {
  for (const s of scenarios) {
    console.log("\n=========================================");
    console.log(s.label);
    console.log(
      `  ${s.item.weight}g · ${s.item.height}×${s.item.width}×${s.item.length}cm · valor declarado $${s.declared.toLocaleString("es-AR")}`
    );
    console.log("=========================================");

    try {
      const options = await quoteShipment(destination, [s.item], s.declared);
      const sorted = [...options].sort((a, b) => a.price - b.price);

      for (const o of sorted) {
        const tag = o.tags.includes("cheapest") ? " ← MÁS BARATO" : "";
        console.log(
          `  ${o.carrierName.padEnd(22)} ${o.serviceName.padEnd(32)} $${o.price.toLocaleString("es-AR").padStart(10)}  (${o.deliveryMin}-${o.deliveryMax} días)${tag}`
        );
      }
    } catch (e) {
      console.error("  ERROR:", e instanceof Error ? e.message : e);
    }
  }
}

main();
