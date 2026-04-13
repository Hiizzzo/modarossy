import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default function NuevoProductoPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-start px-4 pt-4">
      <ProductForm />
    </div>
  );
}
