"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProductOverride = {
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  order?: number;
  hidden?: boolean;
  variants?: Record<string, { stock?: number; size?: string; color?: string }>;
};

type DevState = {
  isDev: boolean;
  overrides: Record<string, ProductOverride>;
  enable: (password: string) => boolean;
  forceEnable: () => void;
  disable: () => void;
  setOverride: (productId: string, patch: ProductOverride) => void;
  setVariantStock: (productId: string, variantId: string, stock: number) => void;
  setVariantPatch: (
    productId: string,
    variantId: string,
    patch: { stock?: number; size?: string; color?: string }
  ) => void;
  moveUp: (productId: string, allIds: string[]) => void;
  moveDown: (productId: string, allIds: string[]) => void;
  resetAll: () => void;
};

const DEV_PASSWORD = "rossi";

export const useDev = create<DevState>()(
  persist(
    (set, get) => ({
      isDev: false,
      overrides: {},
      enable: (password) => {
        if (password === DEV_PASSWORD) {
          set({ isDev: true });
          return true;
        }
        return false;
      },
      forceEnable: () => set({ isDev: true }),
      disable: () => set({ isDev: false }),
      setOverride: (productId, patch) =>
        set((s) => ({
          overrides: {
            ...s.overrides,
            [productId]: { ...s.overrides[productId], ...patch },
          },
        })),
      setVariantStock: (productId, variantId, stock) =>
        set((s) => {
          const current = s.overrides[productId] ?? {};
          return {
            overrides: {
              ...s.overrides,
              [productId]: {
                ...current,
                variants: {
                  ...current.variants,
                  [variantId]: { ...current.variants?.[variantId], stock },
                },
              },
            },
          };
        }),
      setVariantPatch: (productId, variantId, patch) =>
        set((s) => {
          const current = s.overrides[productId] ?? {};
          return {
            overrides: {
              ...s.overrides,
              [productId]: {
                ...current,
                variants: {
                  ...current.variants,
                  [variantId]: { ...current.variants?.[variantId], ...patch },
                },
              },
            },
          };
        }),
      moveUp: (productId, allIds) => {
        const state = get();
        const ordered = [...allIds].sort((a, b) => {
          const oa = state.overrides[a]?.order ?? allIds.indexOf(a);
          const ob = state.overrides[b]?.order ?? allIds.indexOf(b);
          return oa - ob;
        });
        const idx = ordered.indexOf(productId);
        if (idx <= 0) return;
        [ordered[idx - 1], ordered[idx]] = [ordered[idx], ordered[idx - 1]];
        const next = { ...state.overrides };
        ordered.forEach((id, i) => {
          next[id] = { ...next[id], order: i };
        });
        set({ overrides: next });
      },
      moveDown: (productId, allIds) => {
        const state = get();
        const ordered = [...allIds].sort((a, b) => {
          const oa = state.overrides[a]?.order ?? allIds.indexOf(a);
          const ob = state.overrides[b]?.order ?? allIds.indexOf(b);
          return oa - ob;
        });
        const idx = ordered.indexOf(productId);
        if (idx < 0 || idx >= ordered.length - 1) return;
        [ordered[idx + 1], ordered[idx]] = [ordered[idx], ordered[idx + 1]];
        const next = { ...state.overrides };
        ordered.forEach((id, i) => {
          next[id] = { ...next[id], order: i };
        });
        set({ overrides: next });
      },
      resetAll: () => set({ overrides: {} }),
    }),
    { name: "rossi-dev" }
  )
);

export function applyOverrides<
  T extends {
    id: string;
    name: string;
    price: number;
    images: string[];
    variants: { id: string; stock: number; size: string | null; color: string | null }[];
  }
>(
  products: T[],
  overrides: Record<string, ProductOverride>,
  showHidden = false
): (T & { __hidden: boolean })[] {
  const mapped = products
    .map((p) => {
      const o = overrides[p.id];
      if (!o) return { ...p, __order: products.indexOf(p), __hidden: false };
      return {
        ...p,
        name: o.name ?? p.name,
        description: o.description ?? (p as { description?: string | null }).description ?? null,
        price: o.price ?? p.price,
        images: o.image ? [o.image, ...p.images.slice(1)] : p.images,
        variants: p.variants.map((v) => ({
          ...v,
          stock: o.variants?.[v.id]?.stock ?? v.stock,
          size: o.variants?.[v.id]?.size ?? v.size,
          color: o.variants?.[v.id]?.color ?? v.color,
        })),
        __order: o.order ?? products.indexOf(p),
        __hidden: o.hidden ?? false,
      };
    })
    .filter((p) => showHidden || !p.__hidden)
    .sort((a, b) => a.__order - b.__order)
    .map(({ __order, ...rest }) => rest as T & { __hidden: boolean });
  return mapped;
}
