import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { getFeaturedProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <section className="container-edge pb-2 pt-2 sm:pt-4">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="eyebrow text-[10px]">Shop</p>
          <h2 className="mt-1 text-xl font-bold uppercase tracking-tighter sm:text-3xl">
            Destacados
          </h2>
        </div>
        <Link
          href="/tienda"
          className="text-[10px] font-semibold uppercase tracking-[0.12em] text-tinta/70 hover:text-celeste-600"
        >
          Ver todo →
        </Link>
      </div>
      <ProductGrid products={featured} />
    </section>
  );
}
