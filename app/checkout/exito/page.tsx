import Link from "next/link";

export default function ExitoPage() {
  return (
    <div className="container-edge py-16"><div className="mx-auto max-w-md bg-celeste-50 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-celeste-500 text-2xl text-white">
        ✓
      </div>
      <h1 className="mt-4 text-2xl font-semibold">¡Pago recibido!</h1>
      <p className="mt-2 text-tinta/70">
        Te vamos a escribir al mail con los detalles del envío.
      </p>
      <Link href="/tienda" className="btn-primary mt-6">
        Seguir comprando
      </Link>
    </div></div>
  );
}
