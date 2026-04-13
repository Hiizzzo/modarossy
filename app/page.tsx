import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { getFeaturedProducts } from "@/lib/products";

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <section className="container-edge pb-10 pt-10 sm:pt-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow">Shop</p>
          <h2 className="mt-2 text-3xl font-bold uppercase tracking-tighter sm:text-5xl">
            Destacados
          </h2>
        </div>
        <Link
          href="/tienda"
          className="text-[11px] font-semibold uppercase tracking-[0.12em] text-tinta/70 hover:text-celeste-600"
        >
          Ver todo →
        </Link>
      </div>
      <ProductGrid products={featured} />
    </section>
  );
}
