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

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const placeholder: Product[] = [
  {
    id: "demo-1",
    slug: "remera-basica-blanca",
    name: "Remera básica blanca",
    description: "Algodón peinado, corte regular.",
    price: 18900,
    category: "mujer",
    images: [img("photo-1521572163474-6864f9cf17ab")],
    active: true,
    variants: [
      { id: "v1", size: "S", color: "Blanco", stock: 5 },
      { id: "v2", size: "M", color: "Blanco", stock: 3 },
      { id: "v2b", size: "L", color: "Blanco", stock: 4 },
    ],
  },
  {
    id: "demo-2",
    slug: "buzo-oversize-celeste",
    name: "Buzo oversize celeste",
    description: "Friza premium, interior suave.",
    price: 42500,
    category: "mujer",
    images: [img("photo-1556821840-3a63f95609a7")],
    active: true,
    variants: [
      { id: "v3", size: "S", color: "Celeste", stock: 6 },
      { id: "v3b", size: "M", color: "Celeste", stock: 8 },
    ],
  },
  {
    id: "demo-3",
    slug: "pantalon-wide-leg",
    name: "Pantalón wide leg",
    description: "Tiro alto, caída fluida.",
    price: 56000,
    category: "mujer",
    images: [img("photo-1594633312681-425c7b97ccd1")],
    active: true,
    variants: [
      { id: "v4", size: "S", color: "Crudo", stock: 3 },
      { id: "v4b", size: "M", color: "Crudo", stock: 4 },
    ],
  },
  {
    id: "demo-4",
    slug: "campera-denim",
    name: "Campera denim",
    description: "Jean rígido, clásica.",
    price: 78000,
    category: "hombre",
    images: [img("photo-1551537482-f2075a1d41f2")],
    active: true,
    variants: [
      { id: "v5", size: "M", color: "Azul", stock: 3 },
      { id: "v5b", size: "L", color: "Azul", stock: 2 },
    ],
  },
  {
    id: "demo-5",
    slug: "vestido-lino-blanco",
    name: "Vestido lino blanco",
    description: "Lino puro, corte midi.",
    price: 64500,
    category: "mujer",
    images: [img("photo-1572804013309-59a88b7e92f1")],
    active: true,
    variants: [
      { id: "v6", size: "S", color: "Blanco", stock: 4 },
      { id: "v6b", size: "M", color: "Blanco", stock: 2 },
    ],
  },
  {
    id: "demo-6",
    slug: "camisa-oxford-celeste",
    name: "Camisa oxford celeste",
    description: "Algodón oxford, cuello italiano.",
    price: 48900,
    category: "hombre",
    images: [img("photo-1602810318383-e386cc2a3ccf")],
    active: true,
    variants: [
      { id: "v7", size: "M", color: "Celeste", stock: 5 },
      { id: "v7b", size: "L", color: "Celeste", stock: 4 },
      { id: "v7c", size: "XL", color: "Celeste", stock: 2 },
    ],
  },
  {
    id: "demo-7",
    slug: "pollera-plisada",
    name: "Pollera plisada",
    description: "Tiro alto, largo midi.",
    price: 39900,
    category: "mujer",
    images: [img("photo-1577900232427-18219b9166a0")],
    active: true,
    variants: [
      { id: "v8", size: "S", color: "Negro", stock: 3 },
      { id: "v8b", size: "M", color: "Negro", stock: 3 },
    ],
  },
  {
    id: "demo-8",
    slug: "sweater-tejido-crudo",
    name: "Sweater tejido crudo",
    description: "Tejido grueso, cuello redondo.",
    price: 52000,
    category: "hombre",
    images: [img("photo-1434389677669-e08b4cac3105")],
    active: true,
    variants: [
      { id: "v9", size: "M", color: "Crudo", stock: 4 },
      { id: "v9b", size: "L", color: "Crudo", stock: 3 },
    ],
  },
];

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!hasSupabase()) return placeholder;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("active", true)
    .limit(8);
  return (data as Product[] | null) ?? placeholder;
}

export async function getAllProducts(category?: string): Promise<Product[]> {
  if (!hasSupabase())
    return category ? placeholder.filter((p) => p.category === category) : placeholder;
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
  if (!hasSupabase()) return placeholder.find((p) => p.slug === slug) ?? null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Product | null) ?? null;
}
