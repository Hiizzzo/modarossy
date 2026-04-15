"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import { COLORS, colorBySlug } from "@/lib/colors";

const CATEGORIES = ["camperas", "carteras", "zapatillas", "mochilas"];

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
  colorSlug: "",
  photo: null,
  photoPreview: null,
  sizes: [{ size: "", stock: 1 }],
});

export default function ProductForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("camperas");
  const [gender, setGender] = useState<"hombres" | "mujeres">("hombres");
  const [price, setPrice] = useState<string>("");
  const [groups, setGroups] = useState<ColorGroup[]>(() => [newGroup()]);

  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [croppingKey, setCroppingKey] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const croppedPixelsRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    try {
      const c = localStorage.getItem("rossi-last-cat");
      if (c) setCategory(c);
      const g = localStorage.getItem("rossi-last-gender");
      if (g === "hombres" || g === "mujeres") setGender(g);
    } catch {}
  }, []);

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
    updateGroup(key, {
      photo: cropped,
      photoPreview: URL.createObjectURL(cropped),
    });
    setCroppingKey(null);
    setLoading(null);
  };

  const save = async () => {
    if (!name.trim() || !price) {
      setMsg("Falta nombre o precio");
      return;
    }
    const validGroups = groups.filter((g) => g.colorSlug && g.photo);
    if (validGroups.length === 0) {
      setMsg("Agregá al menos un color con foto");
      return;
    }
    setLoading("Guardando...");
    setMsg(null);
    try {
      const slug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const fd = new FormData();
      fd.append("name", name);
      fd.append("slug", `${slug}-${Date.now().toString(36)}`);
      fd.append("description", "");
      fd.append(
        "price",
        String(Math.ceil((Number(price) * 1.1) / 1000) * 1000)
      );
      fd.append("category", category);
      fd.append("gender", gender);
      try {
        localStorage.setItem("rossi-last-cat", category);
        localStorage.setItem("rossi-last-gender", gender);
      } catch {}

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
        fd.append(`photo_${g.key}`, g.photo!);
      }

      const r = await fetch("/api/products", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error al guardar");

      setMsg("Producto guardado ✓");
      setGroups([newGroup()]);
      setName("");
      setPrice("");
      setLoading(null);
    } catch (e) {
      setLoading(null);
      setMsg(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  const croppingGroup = croppingKey
    ? groups.find((g) => g.key === croppingKey)
    : null;

  return (
    <div className="relative mx-auto w-full max-w-sm space-y-2.5 rounded-3xl bg-white p-4 shadow-2xl">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del producto"
          disabled={loading === "Guardando..."}
          className="h-10 min-w-0 flex-1 rounded-full border border-tinta/25 bg-white px-4 text-sm font-semibold text-tinta placeholder:font-normal placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none disabled:opacity-50"
        />
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
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setGender("hombres")}
          disabled={loading === "Guardando..."}
          className={`h-11 rounded-full border text-[11px] font-bold uppercase tracking-wider transition disabled:opacity-50 ${
            gender === "hombres"
              ? "border-celeste-500 bg-celeste-500 text-white"
              : "border-tinta/25 bg-white text-tinta"
          }`}
        >
          Hombres
        </button>
        <button
          type="button"
          onClick={() => setGender("mujeres")}
          disabled={loading === "Guardando..."}
          className={`h-11 rounded-full border text-[11px] font-bold uppercase tracking-wider transition disabled:opacity-50 ${
            gender === "mujeres"
              ? "border-celeste-500 bg-celeste-500 text-white"
              : "border-tinta/25 bg-white text-tinta"
          }`}
        >
          Mujeres
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Precio"
            disabled={loading === "Guardando..."}
            className="h-11 w-full rounded-full border border-tinta/25 bg-white px-4 text-sm text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none disabled:opacity-50"
          />
          {price && Number(price) > 0 && (
            <span className="pointer-events-none absolute -bottom-7 left-0 whitespace-nowrap text-sm font-bold uppercase tracking-wider text-celeste-600">
              Final +10%: ${Math.ceil((Number(price) * 1.1) / 1000) * 1000}
            </span>
          )}
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={loading === "Guardando..."}
          className="h-11 w-full rounded-full border border-tinta/25 bg-white px-4 text-sm text-tinta focus:border-celeste-500 focus:outline-none disabled:opacity-50"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 pt-6">
        {groups.map((g, gi) => {
          const selectedColor = colorBySlug(g.colorSlug);
          return (
            <div
              key={g.key}
              className="space-y-2 rounded-2xl border border-tinta/15 bg-white p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-tinta/60">
                  Color {gi + 1}
                  {selectedColor ? ` · ${selectedColor.label}` : ""}
                </span>
                {groups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGroup(g.key)}
                    aria-label="Quitar color"
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
                )}
              </div>

              <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
                {COLORS.map((c) => {
                  const selected = g.colorSlug === c.slug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => updateGroup(g.key, { colorSlug: c.slug })}
                      aria-label={c.label}
                      title={c.label}
                      style={{ background: c.hex }}
                      className={`h-7 w-7 flex-shrink-0 rounded-full border-2 transition ${
                        selected
                          ? "scale-110 border-tinta"
                          : "border-tinta/20 hover:border-tinta/50"
                      } ${
                        c.slug === "blanco"
                          ? "ring-1 ring-inset ring-tinta/10"
                          : ""
                      }`}
                    />
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => fileInputsRef.current[g.key]?.click()}
                className="flex h-32 w-full items-center justify-center rounded-2xl border border-tinta/25 bg-white text-tinta transition hover:bg-celeste-50"
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
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M3 7h3l2-3h8l2 3h3v13H3z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span className="text-[11px] font-semibold uppercase tracking-wider">
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

              <div className="space-y-1.5">
                {g.sizes.map((s, i) => (
                  <div key={i} className="flex gap-1.5">
                    <input
                      value={s.size}
                      onChange={(e) =>
                        updateSize(g.key, i, { size: e.target.value })
                      }
                      placeholder="Talle"
                      className="h-11 w-full min-w-0 rounded-full border border-tinta/25 bg-white px-3 text-sm text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={s.stock}
                      onChange={(e) =>
                        updateSize(g.key, i, { stock: Number(e.target.value) })
                      }
                      placeholder="Stock"
                      className="h-11 w-16 rounded-full border border-tinta/25 bg-white px-3 text-sm text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
                    />
                    {i === g.sizes.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => addSize(g.key)}
                        className="h-11 w-11 flex-shrink-0 rounded-full bg-tinta text-lg text-white hover:bg-tinta/80"
                      >
                        +
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeSize(g.key, i)}
                        className="h-11 w-11 flex-shrink-0 text-lg text-tinta/40 hover:text-tinta"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addGroup}
          className="w-full rounded-full border border-dashed border-tinta/30 py-3 text-[11px] font-bold uppercase tracking-wider text-tinta/70 transition hover:border-tinta hover:text-tinta"
        >
          + Agregar otro color
        </button>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={!!loading}
        className="w-full rounded-full bg-tinta py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-tinta/80 disabled:opacity-40"
      >
        {loading || "Guardar producto"}
      </button>

      {msg && <p className="text-center text-xs text-tinta/70">{msg}</p>}

      {croppingGroup && croppingGroup.photoPreview && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-white">
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
        </div>
      )}
    </div>
  );
}
