# Rossi Ropa

Tienda online minimalista en celeste y blanco. Next.js 15 + Tailwind + Supabase + Mercado Pago.

## Setup

1. `npm install`
2. Copiá `.env.local.example` a `.env.local` y completá:
   - Credenciales de Supabase (URL, anon, service role)
   - `MP_ACCESS_TOKEN` de Mercado Pago (test o prod)
3. En Supabase corré el SQL de `supabase/schema.sql` y creá el bucket **product-images** (public read).
4. Creá un usuario admin en Supabase Auth (email/password).
5. `npm run dev` → http://localhost:3000

Sin credenciales de Supabase el sitio igual corre con productos demo.

## Flujo de compra
Carrito → datos → Mercado Pago Checkout Pro → webhook marca la orden `paid` y descuenta stock.

## Panel admin
`/admin/login` → cargar productos, imágenes y variantes con stock.

## Pendiente (fase 2)
- Integración Andreani (cotización y generación de guía)
- Importador CSV de productos
