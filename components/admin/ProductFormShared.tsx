"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import { COLORS, colorBySlug } from "@/lib/colors";
import type { Product } from "@/lib/products";

const CATEGORIES = ["camperas", "carteras", "zapatillas", "mochilas"];

const SIZES_BY_CATEGORY: Record<string, string[]> = {
  zapatillas: ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
  camperas: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  carteras: ["Única"],
  mochilas: ["Única"],
};

type SizeStock = { size: string; stock: number };
type ColorGroup = {
  key: string;
  colorSlug: string;
  photo: File | null;
  photoPreview: string | null;
  sizes: SizeStock[];
};

let nextGroupId = 0;
const newGroup = (): ColorGroup => ({
  key: `c${Date.now().toString(36)}-${nextGroupId++}`,
  colorSlug: COLORS[0].slug,
  photo: null,
  photoPreview: null,
  sizes: [{ size: "", stock: 1 }],
});

interface ProductFormSharedProps {
  mode: "create" | "edit";
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
  customButtons?: React.ReactNode | ((props: { save: () => Promise<void>; loading: string | null }) => React.ReactNode);
}

export default function ProductFormShared({
  mode,
  product,
  onSuccess,
  onCancel,
  customButtons,
}: ProductFormSharedProps) {
  const router = useRouter();

  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState<string>(product?.category ?? "camperas");
  const [gender, setGender] = useState<"hombres" | "mujeres" | null>(
    (product?.gender as "hombres" | "mujeres" | null) ?? "hombres"
  );
  const [price, setPrice] = useState<string>(product ? String(product.price) : "");

  const [groups, setGroups] = useState<ColorGroup[]>(() => {
    if (mode === "edit" && product) {
      const byColor = new Map<string, { sizes: SizeStock[]; imageUrl?: string }>();

      for (const v of product.variants) {
        const color = v.color || COLORS[0].slug;
        if (!byColor.has(color)) {
          byColor.set(color, { sizes: [], imageUrl: v.image_url || undefined });
        }
        byColor.get(color)!.sizes.push({
          size: v.size || "",
          stock: v.stock,
        });
      }

      const result: ColorGroup[] = [];
      for (const [color, data] of byColor.entries()) {
        result.push({
          key: `c${Date.now().toString(36)}-${nextGroupId++}`,
          colorSlug: color,
          photo: null,
          photoPreview: data.imageUrl || null,
          sizes: data.sizes.length > 0 ? data.sizes : [{ size: "", stock: 1 }],
        });
      }

      return result.length > 0 ? result : [{
        key: `c${Date.now().toString(36)}-${nextGroupId++}`,
        colorSlug: COLORS[0].slug,
        photo: null,
        photoPreview: null,
        sizes: [{ size: "", stock: 1 }],
      }];
    }
    return [{
      key: `c${Date.now().toString(36)}-${nextGroupId++}`,
      colorSlug: COLORS[0].slug,
      photo: null,
      photoPreview: null,
      sizes: [{ size: "", stock: 1 }],
    }];
  });

  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [croppingKey, setCroppingKey] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const croppedPixelsRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mode === "create") {
      try {
        const c = localStorage.getItem("rossi-last-cat");
        if (c) setCategory(c);
        const g = localStorage.getItem("rossi-last-gender");
        if (g === "hombres" || g === "mujeres") setGender(g);
        else if (g === "null") setGender(null);
      } catch {}
    }
  }, [mode]);

  useEffect(() => {
    if (!openColorPicker) return;
    const handleClick = () => setOpenColorPicker(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openColorPicker]);

  const resizeImage = (file: File, max: number): Promise<File> =>
    new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (b) => res(new File([b!], file.name, { type: "image/jpeg" })),
          "image/jpeg",
          0.82
        );
      };
      img.src = URL.createObjectURL(file);
    });

  const updateGroup = (key: string, patch: Partial<ColorGroup>) =>
    setGroups((gs) => gs.map((g) => (g.key === key ? { ...g, ...patch } : g)));

  const addGroup = () => {
    setGroups((gs) => [...gs, newGroup()]);
  };

  const removeGroup = (key: string) => {
    setGroups((gs) => (gs.length <= 1 ? gs : gs.filter((g) => g.key !== key)));
  };

  const updateSize = (key: string, i: number, patch: Partial<SizeStock>) =>
    setGroups((gs) =>
      gs.map((g) =>
        g.key === key
          ? {
              ...g,
              sizes: g.sizes.map((s, j) => (i === j ? { ...s, ...patch } : s)),
            }
          : g
      )
    );

  const addSize = (key: string) =>
    setGroups((gs) =>
      gs.map((g) =>
        g.key === key
          ? { ...g, sizes: [...g.sizes, { size: "", stock: 1 }] }
          : g
      )
    );

  const removeSize = (key: string, i: number) =>
    setGroups((gs) =>
      gs.map((g) =>
        g.key === key
          ? { ...g, sizes: g.sizes.filter((_, j) => j !== i) }
          : g
      )
    );

  const onPhoto = async (key: string, f: File | null) => {
    if (!f) return;
    const resized = await resizeImage(f, 900);
    updateGroup(key, {
      photo: resized,
      photoPreview: URL.createObjectURL(resized),
    });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppingKey(key);
  };

  const onCropComplete = useCallback(
    (_: unknown, area: { x: number; y: number; width: number; height: number }) => {
      croppedPixelsRef.current = area;
    },
    []
  );

  const applyCrop = async () => {
    const key = croppingKey;
    if (!key) return;
    const group = groups.find((g) => g.key === key);
    if (!group?.photo || !group.photoPreview || !croppedPixelsRef.current) {
      setCroppingKey(null);
      return;
    }
    setLoading("Recortando...");
    const img = new Image();
    img.src = group.photoPreview;
    await new Promise((res) => (img.onload = res));
    const { x, y, width, height } = croppedPixelsRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), "image/jpeg", 0.85)
    );
    const cropped = new File(
      [blob],
      group.photo.name.replace(/\.[^.]+$/, "") + ".jpg",
      { type: "image/jpeg" }
    );
    setCroppingKey(null);
    setLoading("Eliminando fondo...");
    try {
      const fd = new FormData();
      fd.append("image", cropped);
      const res = await fetch("/api/bg-remove", { method: "POST", body: fd });
      if (res.ok) {
        const out = await res.blob();
        const noBg = new File(
          [out],
          cropped.name.replace(/\.[^.]+$/, "") + ".jpg",
          { type: "image/jpeg" }
        );
        updateGroup(key, {
          photo: noBg,
          photoPreview: URL.createObjectURL(noBg),
        });
      } else {
        updateGroup(key, {
          photo: cropped,
          photoPreview: URL.createObjectURL(cropped),
        });
      }
    } catch {
      updateGroup(key, {
        photo: cropped,
        photoPreview: URL.createObjectURL(cropped),
      });
    }
    setLoading(null);
  };

  const saveInternal = async () => {
    if (!name.trim() || !price) {
      setMsg("Falta nombre o precio");
      return;
    }
    const validGroups = groups.filter((g) => g.colorSlug && (g.photo || g.photoPreview));
    if (validGroups.length === 0) {
      setMsg("Agregá al menos un color con foto");
      return;
    }
    setLoading("Guardando...");
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append(
        "price",
        String(Math.ceil((Number(price) * 1.1) / 1000) * 1000)
      );
      fd.append("category", category);
      fd.append("gender", gender ?? "");

      if (mode === "create") {
        const slug = name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        fd.append("slug", `${slug}-${Date.now().toString(36)}`);
        fd.append("description", "");
        try {
          localStorage.setItem("rossi-last-cat", category);
          localStorage.setItem("rossi-last-gender", String(gender));
        } catch {}
      }

      const variants = validGroups.flatMap((g) =>
        g.sizes.map((s) => ({
          size: s.size,
          color: g.colorSlug,
          stock: s.stock,
          photoKey: g.key,
        }))
      );
      fd.append("variants", JSON.stringify(variants));

      for (const g of validGroups) {
        if (g.photo) {
          fd.append(`photo_${g.key}`, g.photo);
        }
      }

      const url = mode === "create" ? "/api/products" : `/api/products/${product!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const r = await fetch(url, { method, body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error al guardar");

      setMsg(mode === "create" ? "Producto guardado ✓" : "Producto actualizado ✓");

      if (mode === "create") {
        setGroups([newGroup()]);
        setName("");
        setPrice("");
      }

      setLoading(null);

      setTimeout(() => {
        router.refresh();
        onSuccess?.();
      }, 500);
    } catch (e) {
      setLoading(null);
      setMsg(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  const croppingGroup = croppingKey
    ? groups.find((g) => g.key === croppingKey)
    : null;

  return (
    <div className="relative mx-auto w-full max-w-md space-y-2.5 rounded-3xl bg-white p-4 shadow-2xl">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del producto"
          disabled={loading === "Guardando..."}
          className="h-12 min-w-0 flex-1 rounded-full border-2 border-tinta/25 bg-white px-5 text-base font-semibold text-tinta placeholder:font-normal placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none disabled:opacity-50"
        />
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-tinta transition hover:bg-tinta/5 active:scale-95"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
        {!onCancel && mode === "create" && (
          <button
            type="button"
            onClick={() => router.push("/tienda")}
            aria-label="Salir"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-tinta transition hover:bg-tinta/5 active:scale-95"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {groups.map((g, gi) => {
          const selectedColor = colorBySlug(g.colorSlug);
          return (
            <div key={g.key} className="space-y-2">
              {gi > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-tinta/60">
                    Variante {gi + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeGroup(g.key)}
                    aria-label="Quitar variante"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-tinta/40 hover:text-tinta"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputsRef.current[g.key]?.click()}
                className="flex h-28 w-full items-center justify-center rounded-xl border-2 border-tinta/25 bg-white text-tinta transition hover:bg-celeste-50"
              >
                {g.photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.photoPreview}
                    alt=""
                    className="h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M3 7h3l2-3h8l2 3h3v13H3z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Sacar o subir foto
                    </span>
                  </div>
                )}
              </button>
              <input
                ref={(el) => {
                  fileInputsRef.current[g.key] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPhoto(g.key, e.target.files?.[0] ?? null)}
              />

              {gi === 0 && (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender(gender === "hombres" ? null : "hombres")}
                    disabled={loading === "Guardando..."}
                    className={`h-12 rounded-full border-2 text-base font-bold uppercase tracking-wide transition disabled:opacity-50 ${
                      gender === "hombres" || gender === null
                        ? "border-celeste-500 bg-celeste-500 text-white"
                        : "border-tinta/25 bg-white text-tinta"
                    }`}
                  >
                    Hombres
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender(gender === "mujeres" ? null : "mujeres")}
                    disabled={loading === "Guardando..."}
                    className={`h-12 rounded-full border-2 text-base font-bold uppercase tracking-wide transition disabled:opacity-50 ${
                      gender === "mujeres" || gender === null
                        ? "border-celeste-500 bg-celeste-500 text-white"
                        : "border-tinta/25 bg-white text-tinta"
                    }`}
                  >
                    Mujeres
                  </button>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={loading === "Guardando..."}
                    className="h-12 w-full rounded-full border-2 border-tinta/25 bg-white px-3 text-base text-tinta focus:border-celeste-500 focus:outline-none disabled:opacity-50"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative flex items-center gap-2 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-tinta/60">Color:</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenColorPicker(openColorPicker === g.key ? null : g.key);
                    }}
                    style={{ background: selectedColor?.hex || "#e5e7eb" }}
                    className={`h-11 w-11 flex-shrink-0 rounded-full border-2 border-tinta/20 cursor-pointer transition hover:scale-110 ${
                      selectedColor?.slug === "blanco" ? "ring-1 ring-inset ring-tinta/10" : ""
                    }`}
                    title={selectedColor?.label || "Seleccionar color"}
                  />
                  <span className="text-sm font-semibold text-tinta">{selectedColor?.label}</span>
                </div>
                {gi === groups.length - 1 && (
                  <button
                    type="button"
                    onClick={addGroup}
                    className="ml-auto rounded-full border-2 border-dashed border-tinta/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-tinta/70 transition hover:border-tinta hover:text-tinta"
                  >
                    + Variante
                  </button>
                )}
                {openColorPicker === g.key && (
                  <div
                    className="absolute left-0 top-full mt-1 z-[60] grid grid-cols-5 gap-2 rounded-xl border-2 border-tinta/20 bg-white p-3 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {COLORS.map((c) => (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => {
                          updateGroup(g.key, { colorSlug: c.slug });
                          setOpenColorPicker(null);
                        }}
                        style={{ background: c.hex }}
                        className={`h-11 w-11 rounded-full border-2 transition hover:scale-110 ${
                          g.colorSlug === c.slug
                            ? "border-tinta ring-2 ring-celeste-500"
                            : "border-tinta/20"
                        } ${
                          c.slug === "blanco"
                            ? "ring-1 ring-inset ring-tinta/10"
                            : ""
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {g.sizes.map((s, i) => {
                  const categoryOptions = SIZES_BY_CATEGORY[category];
                  return (
                  <div key={i} className="flex gap-2">
                    {categoryOptions ? (
                      <select
                        value={s.size}
                        onChange={(e) =>
                          updateSize(g.key, i, { size: e.target.value })
                        }
                        className="h-12 w-28 rounded-full border-2 border-tinta/25 bg-white px-3 text-sm text-tinta focus:border-celeste-500 focus:outline-none"
                      >
                        <option value="">Talle</option>
                        {categoryOptions.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={s.size}
                        onChange={(e) =>
                          updateSize(g.key, i, { size: e.target.value })
                        }
                        placeholder="Talle"
                        className="h-12 w-28 rounded-full border-2 border-tinta/25 bg-white px-3 text-sm text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
                      />
                    )}
                    <div className="flex h-12 items-center gap-1 rounded-full border-2 border-tinta/25 bg-white px-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateSize(g.key, i, { stock: Math.max(0, s.stock - 1) })
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-tinta/60 hover:bg-tinta/10 hover:text-tinta active:scale-95"
                      >
                        −
                      </button>
                      <span className="min-w-[3ch] text-center text-base font-semibold text-tinta">
                        {s.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateSize(g.key, i, { stock: s.stock + 1 })}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-tinta/60 hover:bg-tinta/10 hover:text-tinta active:scale-95"
                      >
                        +
                      </button>
                    </div>
                    {i === g.sizes.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => addSize(g.key)}
                        className="h-12 w-12 flex-shrink-0 rounded-full bg-tinta text-lg text-white hover:bg-tinta/80"
                      >
                        +
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeSize(g.key, i)}
                        className="h-12 w-12 flex-shrink-0 text-2xl text-tinta/40 hover:text-tinta"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-3 pt-2">
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Precio"
            disabled={loading === "Guardando..."}
            className="h-12 w-36 rounded-full border-2 border-tinta/25 bg-white px-5 text-base text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none disabled:opacity-50"
          />
          {price && Number(price) > 0 && (
            <span className="whitespace-nowrap text-base font-bold uppercase tracking-wide text-tinta">
              Final: ${Math.ceil((Number(price) * 1.1) / 1000) * 1000}
            </span>
          )}
        </div>
      </div>

      {customButtons ? (
        typeof customButtons === 'function' ? customButtons({ save: saveInternal, loading }) : customButtons
      ) : (
        <button
          type="button"
          onClick={saveInternal}
          disabled={!!loading}
          className="w-full rounded-full bg-tinta py-3 text-base font-bold uppercase tracking-wider text-white transition hover:bg-tinta/80 disabled:opacity-40"
        >
          {loading || (mode === "create" ? "Guardar producto" : "Guardar cambios")}
        </button>
      )}

      {msg && <p className="text-center text-xs text-tinta/70">{msg}</p>}

      {mounted && croppingGroup && croppingGroup.photoPreview && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-white">
          <div className="relative flex-1">
            <Cropper
              image={croppingGroup.photoPreview}
              crop={crop}
              zoom={zoom}
              aspect={4 / 5}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              restrictPosition={false}
              style={{
                containerStyle: { background: "#ffffff" },
                cropAreaStyle: {
                  border: "1px solid rgba(0,0,0,0.15)",
                  color: "rgba(255,255,255,0)",
                  boxShadow: "0 0 0 9999px rgba(255,255,255,1)",
                },
              }}
            />
          </div>
          <div className="flex items-center gap-3 bg-white p-4">
            <span className="text-xs uppercase tracking-wider text-tinta/60">
              Zoom
            </span>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-celeste-500"
            />
          </div>
          <div className="flex gap-2 bg-white px-4 pb-4">
            <button
              type="button"
              onClick={() => setCroppingKey(null)}
              className="flex-1 border border-tinta/20 py-3 text-xs font-bold uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={applyCrop}
              className="flex-1 bg-celeste-500 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-celeste-600"
            >
              Listo
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
