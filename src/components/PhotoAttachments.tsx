import { useEffect, useMemo, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

const MAX_FILE_BYTES = 500 * 1024;
const MAX_FILES = 6;

async function compressPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not process this image.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let blob: Blob | null = null;
    for (const quality of [0.82, 0.74, 0.66, 0.58, 0.5]) {
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= MAX_FILE_BYTES) break;
    }
    if (!blob) throw new Error("This image could not be compressed.");
    if (blob.size > MAX_FILE_BYTES) throw new Error("This image is too detailed to reduce below 500 KB. Please choose a smaller image.");
    const baseName = file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "casting-photo";
    return new File([blob], baseName + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}

export function PhotoAttachments({ files, onChange, maxFiles = MAX_FILES }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => previews.forEach((item) => URL.revokeObjectURL(item.url)), [previews]);

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    const remaining = maxFiles - files.length;
    if (remaining <= 0) { setError("A maximum of six photos can be attached to each case."); return; }
    const selected = Array.from(list).slice(0, remaining);
    if (list.length > remaining) setError("Only the first " + remaining + " selected image(s) were added. The limit is six per case.");
    setBusy(true);
    const processed: File[] = [];
    const failures: string[] = [];
    for (const file of selected) {
      if (!file.type.startsWith("image/")) { failures.push(file.name + ": not an image"); continue; }
      try { processed.push(await compressPhoto(file)); }
      catch (e) { failures.push(file.name + ": " + (e instanceof Error ? e.message : "could not process")); }
    }
    if (processed.length) onChange([...files, ...processed]);
    if (failures.length) setError(failures.join(" · "));
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">Photographic evidence</p>
          <p className="text-xs text-slate-500">Add up to six photos of the defect, casting, tree or setup. Images are resized and compressed before upload.</p>
        </div>
        <span className="text-xs font-medium text-slate-500">{files.length}/{maxFiles} attached</span>
      </div>
      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-teal-500 hover:bg-teal-50">
        <span className="flex items-center gap-2 text-sm font-semibold text-teal-800"><Camera className="h-5 w-5" /> <ImagePlus className="h-4 w-4" /> {busy ? "Preparing photos…" : "Take a photo or choose images"}</span>
        <span className="text-xs text-slate-500">JPEG, PNG or WebP · up to 500 KB each after compression</span>
        <input className="sr-only" type="file" accept="image/*" capture="environment" multiple disabled={busy || files.length >= maxFiles} onChange={(event) => { void addFiles(event.target.files); event.currentTarget.value = ""; }} />
      </label>
      {error && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">{error}</p>}
      {previews.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {previews.map(({ file, url }, index) => (
          <div key={file.name + file.lastModified + index} className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
            <img src={url} alt={"Casting evidence " + (index + 1)} className="h-32 w-full object-cover" />
            <div className="flex items-center justify-between gap-2 p-2"><span className="truncate text-xs text-slate-600">{file.name}</span><span className="shrink-0 text-[10px] text-slate-400">{Math.round(file.size / 1024)} KB</span></div>
            <button type="button" aria-label={"Remove photo " + (index + 1)} onClick={() => onChange(files.filter((_, i) => i !== index))} className="absolute right-2 top-2 rounded-full bg-slate-900/80 p-1.5 text-white hover:bg-red-700"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>}
    </div>
  );
}
