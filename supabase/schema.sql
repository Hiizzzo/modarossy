-- Rossi Ropa — schema

create extension if not exists "pgcrypto";

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  category text,
  gender text,
  images text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  size text,
  color text,
  stock int not null default 0
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  mp_preference_id text,
  mp_payment_id text,
  status text not null default 'pending',
  total numeric(10,2) not null,
  customer jsonb,
  items jsonb,
  created_at timestamptz default now()
);

-- Storage bucket: create manually in Supabase dashboard called "product-images" (public read).

-- Basic RLS (opcional — endurecer antes de producción)
alter table products enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;

create policy "read products" on products for select using (active = true);
create policy "read variants" on product_variants for select using (true);

-- Migration for existing installs
alter table products add column if not exists gender text;
alter table product_variants add column if not exists image_url text;
