import Link from "next/link";

export default function PendientePage() {
  return (
    <div className="container-edge py-16"><div className="mx-auto max-w-md bg-celeste-50 p-10 text-center">
      <h1 className="text-2xl font-semibold">Pago pendiente</h1>
      <p className="mt-2 text-tinta/70">
        Cuando se acredite te avisamos por mail.
      </p>
      <Link href="/" className="btn-ghost mt-6">
        Volver al inicio
      </Link>
    </div></div>
  );
}
