import ProductGrid from "@/components/ProductGrid";
import { getFeaturedProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <section className="container-edge pb-2 pt-2 sm:pt-4">
      <h2 className="mb-3 text-xl font-bold uppercase tracking-tighter sm:text-3xl">
        Destacados
      </h2>
      <ProductGrid products={featured.slice(0, 4)} />
    </section>
  );
}
