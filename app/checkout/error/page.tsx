import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="container-edge py-16"><div className="mx-auto max-w-md bg-celeste-50 p-10 text-center">
      <h1 className="text-2xl font-semibold">No pudimos procesar el pago</h1>
      <p className="mt-2 text-tinta/70">Probá de nuevo o usá otro medio.</p>
      <Link href="/carrito" className="btn-primary mt-6">
        Volver al carrito
      </Link>
    </div></div>
  );
}
