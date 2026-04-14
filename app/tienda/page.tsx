import ProductGrid from "@/components/ProductGrid";
import { getAllProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: { cat?: string; q?: string };
}) {
  const { cat, q } = searchParams;
  const all = await getAllProducts(cat);

  const term = (q ?? "").trim().toLowerCase();
  const products = term
    ? all.filter((p) => {
        const byName = p.name.toLowerCase().includes(term);
        const priceDigits = String(Math.round(p.price));
        const termDigits = term.replace(/\D/g, "");
        const byPrice = termDigits.length > 0 && priceDigits.includes(termDigits);
        return byName || byPrice;
      })
    : all;

  return (
    <div className="container-edge pb-12 pt-5 sm:pt-10">
      {term && (
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-tinta/60">
          Resultados para “{q}” · {products.length}
        </p>
      )}
      <ProductGrid products={products} />
    </div>
  );
}
