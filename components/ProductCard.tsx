import Link from "next/link";
import { formatARS } from "@/lib/format";
import type { Product } from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
  const cover = product.images[0];
  return (
    <Link href={`/producto/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-celeste-50">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-celeste-100 to-white text-celeste-400">
            sin foto
          </div>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">{product.name}</h3>
          <p className="text-xs text-tinta/60">{product.category}</p>
        </div>
        <div className="text-sm font-semibold">{formatARS(product.price)}</div>
      </div>
    </Link>
  );
}
