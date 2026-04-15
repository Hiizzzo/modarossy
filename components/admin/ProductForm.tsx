"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";

const GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_KEY || "";
const CATEGORIES = ["camperas", "carteras", "zapatillas", "mochilas"];

type Variant = { size: string; color: string; stock: number };

export default function ProductForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("camperas");
  const [gender, setGender] = useState<"hombres" | "mujeres">("hombres");

  useEffect(() => {
    try {
      const c = localStorage.getItem("rossi-last-cat");
      if (c) setCategory(c);
      const g = localStorage.getItem("rossi-last-gender");
      if (g === "hombres" || g === "mujeres") setGender(g);
    } catch {}
  }, []);
  const [price, setPrice] = useState<string>("");
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
          0.82
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
    const resized = await resizeImage(f, 900);
    setPhoto(resized);
    setPhotoPreview(URL.createObjectURL(resized));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropping(true);
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
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), "image/jpeg", 0.85)
    );
    const cropped = new File(
      [blob],
      photo.name.replace(/\.[^.]+$/, "") + ".jpg",
      { type: "image/jpeg" }
    );
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
      const fd = new FormData();
      fd.append("name", name);
      fd.append("slug", `${slug}-${Date.now().toString(36)}`);
      fd.append("description", "");
      fd.append("price", String(Math.ceil((Number(price) * 1.1) / 1000) * 1000));
      fd.append("category", category);
      fd.append("gender", gender);
      try {
        localStorage.setItem("rossi-last-cat", category);
        localStorage.setItem("rossi-last-gender", gender);
      } catch {}
      fd.append("variants", JSON.stringify(variants));
      fd.append("photo", photo);
      const r = await fetch("/api/products", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error al guardar");

      setMsg("Producto guardado ✓");
      setPhoto(null);
      setPhotoPreview(null);
      setName("");
      setPrice("");
      setVariants([{ size: "", color: "", stock: 1 }]);
      setLoading(null);
    } catch (e) {
      setLoading(null);
      setMsg(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-sm space-y-2.5 rounded-3xl bg-white p-4 shadow-2xl">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del producto"
          className="h-10 min-w-0 flex-1 rounded-full border border-tinta/25 bg-white px-4 text-sm font-semibold text-tinta placeholder:font-normal placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => router.push("/tienda")}
          aria-label="Salir"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-tinta transition hover:bg-tinta/5 active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex h-32 w-full items-center justify-center rounded-2xl border border-tinta/25 bg-white text-tinta transition hover:bg-celeste-50"
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
        className="hidden"
        onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setGender("hombres")}
          className={`h-11 rounded-full border text-[11px] font-bold uppercase tracking-wider transition ${
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
          className={`h-11 rounded-full border text-[11px] font-bold uppercase tracking-wider transition ${
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
            className="h-11 w-full rounded-full border border-tinta/25 bg-white px-4 text-sm text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
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
          className="h-11 w-full rounded-full border border-tinta/25 bg-white px-4 text-sm text-tinta focus:border-celeste-500 focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 pt-6">
        {variants.map((v, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              value={v.size}
              onChange={(e) => updateVariant(i, { size: e.target.value })}
              placeholder="Talle"
              className="h-11 w-full min-w-0 rounded-full border border-tinta/25 bg-white px-3 text-sm text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
            />
            <input
              type="number"
              value={v.stock}
              onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
              placeholder="Stock"
              className="h-11 w-16 rounded-full border border-tinta/25 bg-white px-3 text-sm text-tinta placeholder:text-tinta/50 focus:border-celeste-500 focus:outline-none"
            />
            {i === variants.length - 1 ? (
              <button
                type="button"
                onClick={addVariant}
                className="h-11 w-11 flex-shrink-0 rounded-full bg-tinta text-lg text-white hover:bg-tinta/80"
              >
                +
              </button>
            ) : (
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="h-11 w-11 flex-shrink-0 text-lg text-tinta/40 hover:text-tinta"
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
        className="w-full rounded-full bg-tinta py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-tinta/80 disabled:opacity-40"
      >
        {loading || "Guardar producto"}
      </button>

      {msg && <p className="text-center text-xs text-tinta/70">{msg}</p>}

      {cropping && photoPreview && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-white">
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
