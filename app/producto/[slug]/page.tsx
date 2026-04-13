import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import ProductDetail from "@/components/ProductDetail";

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();
  return (
    <div className="container-edge pb-10 pt-3 sm:pt-4">
      <ProductDetail product={product} />
    </div>
  );
}
