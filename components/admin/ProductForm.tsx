"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import { createClient } from "@/lib/supabase/client";

const GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_KEY || "";
const CATEGORIES = ["camperas", "carteras", "zapatillas", "mochilas"];

type Variant = { size: string; color: string; stock: number };

export default function ProductForm() {
  const supabase = createClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("camperas");
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState<Variant[]>([
    { size: "", color: "", stock: 1 },
  ]);

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const croppedPixelsRef = useRef<{ x: number; y: number; width: number; height: number } | null>(
    null
  );

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
          0.9
        );
      };
      img.src = URL.createObjectURL(file);
    });

  const onPhoto = async (f: File | null) => {
    if (!f) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    setLoading("Quitando fondo...");
    try {
      const resized = await resizeImage(f, 1024);
      const url = "https://esm.sh/@imgly/background-removal@1.7.0";
      const mod = await import(/* webpackIgnore: true */ /* @vite-ignore */ url);
      const removeBackground = (mod as { removeBackground: (input: Blob, cfg?: unknown) => Promise<Blob> }).removeBackground;
      const cutoutBlob = await removeBackground(resized, {
        model: "isnet",
        output: { format: "image/png", quality: 0.9 },
      });
      const finalFile = new File([cutoutBlob], f.name.replace(/\.[^.]+$/, "") + ".png", {
        type: "image/png",
      });
      setPhoto(finalFile);
      setPhotoPreview(URL.createObjectURL(finalFile));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropping(true);
    } catch {
      setPhoto(f);
      setPhotoPreview(URL.createObjectURL(f));
      setMsg("No se pudo quitar el fondo, se usa la foto original");
    } finally {
      setLoading(null);
    }
  };

  const onCropComplete = useCallback(
    (_: unknown, area: { x: number; y: number; width: number; height: number }) => {
      croppedPixelsRef.current = area;
    },
    []
  );

  const applyCrop = async () => {
    if (!photo || !photoPreview || !croppedPixelsRef.current) {
      setCropping(false);
      return;
    }
    const img = new Image();
    img.src = photoPreview;
    await new Promise((res) => (img.onload = res));
    const { x, y, width, height } = croppedPixelsRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), "image/png")
    );
    const cropped = new File([blob], photo.name, { type: "image/png" });
    setPhoto(cropped);
    setPhotoPreview(URL.createObjectURL(cropped));
    setCropping(false);
  };

  const transcribe = async (blob: Blob): Promise<string> => {
    const fd = new FormData();
    fd.append("file", new File([blob], "audio.webm", { type: "audio/webm" }));
    fd.append("model", "whisper-large-v3-turbo");
    fd.append("language", "es");
    const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}` },
      body: fd,
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error?.message || "Error transcripción");
    return j.text || "";
  };

  const extractFromText = async (transcript: string) => {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: `Descripción de una prenda:\n"${transcript}"\n\nDevolvé SOLO un JSON con:\n- name: nombre corto en español\n- category: una de ${JSON.stringify(CATEGORIES)}\n- price: número en pesos (sin símbolos)\n- description: 1-2 oraciones\n- variants: array [{size, color, stock}]. Si no menciona stock usá 1. Sin talles usá [{size:"Único",color:"",stock:1}]\n\nSolo el JSON.`,
          },
        ],
        max_tokens: 500,
      }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error?.message || "Error IA");
    const text = j.choices?.[0]?.message?.content || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No se pudo leer la IA");
    return JSON.parse(match[0]);
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        try {
          setLoading("Transcribiendo...");
          const transcript = await transcribe(blob);
          setLoading("Analizando...");
          const d = await extractFromText(transcript);
          if (d.name) setName(d.name);
          if (d.category && CATEGORIES.includes(d.category)) setCategory(d.category);
          if (d.price) setPrice(String(d.price));
          if (d.description) setDescription(d.description);
          if (Array.isArray(d.variants) && d.variants.length) setVariants(d.variants);
          setLoading(null);
        } catch (e) {
          setLoading(null);
          setMsg(e instanceof Error ? e.message : "Error IA");
        }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      setMsg("No se pudo acceder al micrófono");
    }
  };

  const stopRec = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const updateVariant = (i: number, patch: Partial<Variant>) =>
    setVariants((vs) => vs.map((v, j) => (i === j ? { ...v, ...patch } : v)));
  const addVariant = () =>
    setVariants((vs) => [...vs, { size: "", color: "", stock: 1 }]);
  const removeVariant = (i: number) =>
    setVariants((vs) => vs.filter((_, j) => j !== i));

  const save = async () => {
    if (!photo) {
      setMsg("Falta la foto");
      return;
    }
    if (!name.trim() || !price) {
      setMsg("Falta nombre o precio");
      return;
    }
    setLoading("Guardando...");
    setMsg(null);
    try {
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const { data: product, error } = await supabase
        .from("products")
        .insert({
          name,
          slug: `${slug}-${Date.now().toString(36)}`,
          description,
          price: Number(price),
          category,
          images: [],
        })
        .select("id")
        .single();
      if (error) throw error;

      const path = `${product.id}/${Date.now()}-${photo.name}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, photo, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      await supabase.from("products").update({ images: [pub.publicUrl] }).eq("id", product.id);

      if (variants.length) {
        await supabase.from("product_variants").insert(
          variants.map((v) => ({
            product_id: product.id,
            size: v.size || null,
            color: v.color || null,
            stock: v.stock,
          }))
        );
      }

      setMsg("Producto guardado ✓");
      setPhoto(null);
      setPhotoPreview(null);
      setName("");
      setPrice("");
      setDescription("");
      setVariants([{ size: "", color: "", stock: 1 }]);
      setLoading(null);
    } catch (e) {
      setLoading(null);
      setMsg(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-sm space-y-2.5 rounded-3xl border-[3px] border-celeste-500 bg-celeste-500 p-4">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del producto"
          className="h-10 min-w-0 flex-1 rounded-full border-0 bg-white px-4 text-sm font-semibold text-black placeholder:font-normal placeholder:text-black/40 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => router.push("/tienda")}
          aria-label="Salir"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-celeste-500 text-white ring-2 ring-white transition hover:bg-celeste-600 active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex h-32 w-full items-center justify-center rounded-2xl bg-white text-celeste-600 transition hover:bg-white/90"
      >
        {photoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoPreview} alt="" className="h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 7h3l2-3h8l2 3h3v13H3z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span className="text-[11px] font-semibold uppercase tracking-wider">Sacar o subir foto</span>
          </div>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        onClick={recording ? stopRec : startRec}
        className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[11px] font-semibold uppercase tracking-wider transition ${
          recording
            ? "bg-red-500 text-white"
            : "bg-white text-celeste-600 hover:bg-white/90"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
        {recording ? "Detener" : "Grabar descripción"}
      </button>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción"
        rows={2}
        className="w-full resize-none rounded-2xl border-0 bg-white p-3 text-sm text-black placeholder:text-black/40 focus:outline-none"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Precio"
          className="h-11 w-full rounded-full border-0 bg-white px-4 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 w-full rounded-full border-0 bg-white px-4 text-sm text-black focus:border-black focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {variants.map((v, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              value={v.size}
              onChange={(e) => updateVariant(i, { size: e.target.value })}
              placeholder="Talle"
              className="h-11 w-full min-w-0 rounded-full border-0 bg-white px-3 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none"
            />
            <input
              value={v.color}
              onChange={(e) => updateVariant(i, { color: e.target.value })}
              placeholder="Color"
              className="h-11 w-full min-w-0 rounded-full border-0 bg-white px-3 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none"
            />
            <input
              type="number"
              value={v.stock}
              onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
              placeholder="Stock"
              className="h-11 w-16 rounded-full border-0 bg-white px-3 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none"
            />
            {i === variants.length - 1 ? (
              <button
                type="button"
                onClick={addVariant}
                className="h-11 w-11 flex-shrink-0 rounded-full bg-white text-lg text-celeste-600 hover:bg-white/90"
              >
                +
              </button>
            ) : (
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="h-11 w-11 flex-shrink-0 text-lg text-white/70 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={!!loading}
        className="w-full rounded-full bg-white py-3.5 text-sm font-bold uppercase tracking-wider text-celeste-600 transition hover:bg-white/90 disabled:opacity-40"
      >
        {loading || "Guardar producto"}
      </button>

      {msg && <p className="text-center text-xs text-white">{msg}</p>}

      {cropping && photoPreview && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black">
          <div className="relative flex-1">
            <Cropper
              image={photoPreview}
              crop={crop}
              zoom={zoom}
              aspect={4 / 5}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              restrictPosition={false}
            />
          </div>
          <div className="flex items-center gap-3 bg-white p-4">
            <span className="text-xs uppercase tracking-wider text-tinta/60">Zoom</span>
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
              onClick={() => setCropping(false)}
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
