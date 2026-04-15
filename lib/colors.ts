export const COLORS = [
  { slug: "negro", label: "Negro", hex: "#111111" },
  { slug: "blanco", label: "Blanco", hex: "#ffffff" },
  { slug: "gris", label: "Gris", hex: "#9ca3af" },
  { slug: "beige", label: "Beige", hex: "#d6c6a8" },
  { slug: "marron", label: "Marrón", hex: "#78451f" },
  { slug: "rojo", label: "Rojo", hex: "#dc2626" },
  { slug: "naranja", label: "Naranja", hex: "#f97316" },
  { slug: "amarillo", label: "Amarillo", hex: "#facc15" },
  { slug: "verde", label: "Verde", hex: "#16a34a" },
  { slug: "celeste", label: "Celeste", hex: "#60a5fa" },
  { slug: "azul", label: "Azul", hex: "#2563eb" },
  { slug: "violeta", label: "Violeta", hex: "#9333ea" },
  { slug: "rosa", label: "Rosa", hex: "#f472b6" },
] as const;

export type ColorSlug = (typeof COLORS)[number]["slug"];

export const colorBySlug = (s: string | null | undefined) =>
  COLORS.find((c) => c.slug === s) ?? null;
