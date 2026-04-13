import ProductGrid from "@/components/ProductGrid";
import { getAllProducts } from "@/lib/products";

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: { cat?: string };
}) {
  const { cat } = searchParams;
  const products = await getAllProducts(cat);

  return (
    <div className="container-edge pb-10 pt-10 sm:pt-16">
      <ProductGrid products={products} />
    </div>
  );
}
