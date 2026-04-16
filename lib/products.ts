import { unstable_noStore as noStore } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
  image_url: string | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  gender: string | null;
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
  noStore();
  if (!hasSupabase()) return [];
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("active", true)
    .limit(8);
  return (data as Product[] | null) ?? [];
}

export async function getAllProducts(
  category?: string,
  gender?: string
): Promise<Product[]> {
  noStore();
  if (!hasSupabase()) return [];
  const supabase = createServiceClient();
  let query = supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("active", true);
  if (category) query = query.eq("category", category);
  if (gender) {
    // Incluir productos del género específico Y productos unisex (gender: null)
    query = query.or(`gender.eq.${gender},gender.is.null`);
  }
  const { data, error } = await query;
  if (error) console.error("getAllProducts", error);
  return (data as Product[] | null) ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  noStore();
  if (!hasSupabase()) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Product | null) ?? null;
}
