import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { formatARS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const products = await getAllProducts();

  return (
    <div className="space-y-4 px-3 pb-20 pt-4 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Productos</h1>
        <Link
          href="/admin/ventas"
          className="rounded-full bg-celeste-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white"
        >
          Ventas
        </Link>
      </div>

      <ul className="divide-y divide-celeste-100 overflow-hidden rounded-2xl ring-1 ring-celeste-100">
        {products.map((p) => {
          const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
          return (
            <li key={p.id} className="flex items-center gap-3 bg-white px-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="truncate text-[11px] uppercase tracking-wide text-tinta/50">
                  {p.category}
                </p>
                <p className="mt-0.5 text-sm font-bold">{formatARS(p.price)}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  totalStock > 0
                    ? "bg-celeste-100 text-celeste-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {totalStock}
              </span>
              <Link
                href={`/admin/productos/${p.id}`}
                className="rounded-full bg-tinta px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white"
              >
                Editar
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
