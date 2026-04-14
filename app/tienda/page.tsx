import ProductGrid from "@/components/ProductGrid";
import { getAllProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: { cat?: string };
}) {
  const { cat } = searchParams;
  const products = await getAllProducts(cat);

  return (
    <div className="container-edge pb-12 pt-5 sm:pt-10">
      <ProductGrid products={products} />
    </div>
  );
}
