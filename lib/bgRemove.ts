const BG_REMOVE_URL = process.env.BG_REMOVE_URL || "http://localhost:5000";

export type BgRemoveResult = {
  buf: Buffer;
  contentType: string;
  filename: string;
};

export async function removeBackground(
  input: Buffer,
  originalName: string,
  originalType: string
): Promise<BgRemoveResult> {
  try {
    const form = new FormData();
    const blob = new Blob([new Uint8Array(input)], { type: originalType });
    form.append("image", blob, originalName);

    const res = await fetch(`${BG_REMOVE_URL}/remove-bg?format=jpg`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(`bg-remove ${res.status}`);
    const data = (await res.json()) as { id: string; ext: string };

    const dl = await fetch(`${BG_REMOVE_URL}/download/${data.id}`);
    if (!dl.ok) throw new Error(`bg-remove download ${dl.status}`);
    const ab = await dl.arrayBuffer();

    const base = originalName.replace(/\.[^.]+$/, "");
    return {
      buf: Buffer.from(ab),
      contentType: data.ext === "png" ? "image/png" : "image/jpeg",
      filename: `${base}.${data.ext}`,
    };
  } catch (err) {
    console.warn("[bgRemove] fallback a original:", err);
    return { buf: input, contentType: originalType, filename: originalName };
  }
}
