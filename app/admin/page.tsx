import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { formatARS } from "@/lib/format";

export default async function AdminDashboard() {
  const products = await getAllProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Productos</h1>
      </div>

      <div className="overflow-hidden rounded-2xl ring-1 ring-celeste-100">
        <table className="w-full text-sm">
          <thead className="bg-celeste-50 text-left text-xs uppercase tracking-wider text-tinta/60">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-celeste-100">
            {products.map((p) => {
              const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-tinta/70">{p.category}</td>
                  <td className="px-4 py-3">{formatARS(p.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        totalStock > 0
                          ? "bg-celeste-100 text-celeste-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {totalStock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="text-celeste-600 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
