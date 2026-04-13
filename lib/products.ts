import { createServiceClient } from "@/lib/supabase/server";

export type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  images: string[];
  active: boolean;
  variants: Variant[];
};

function hasSupabase() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!hasSupabase()) return [];
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("active", true)
    .limit(8);
  return (data as Product[] | null) ?? [];
}

export async function getAllProducts(category?: string): Promise<Product[]> {
  if (!hasSupabase()) return [];
  const supabase = createServiceClient();
  let query = supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("active", true);
  if (category) query = query.eq("category", category);
  const { data } = await query;
  return (data as Product[] | null) ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!hasSupabase()) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Product | null) ?? null;
}
