/**
 * Comprime/redimensiona uma imagem no client antes de subir pro storage.
 * Útil pra fotos de celular modernas (>5MB) — converte pra JPEG até caber.
 * Aceita File ou Blob como entrada.
 */
export async function compressImage(
  file: File | Blob,
  opts: { maxDimension?: number; maxBytes?: number; quality?: number } = {},
): Promise<File> {
  const maxDimension = opts.maxDimension ?? 1600;
  const maxBytes = opts.maxBytes ?? 4 * 1024 * 1024; // 4MB alvo (margem do limite)
  let quality = opts.quality ?? 0.88;
  const inputName = (file as File).name ?? "image.jpg";
  const inputType = file.type || "image/jpeg";

  // SVG / GIF: não tenta comprimir — só valida tamanho
  if (!/^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(inputType)) {
    return file as File;
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Falha ao carregar imagem"));
    i.src = dataUrl;
  });

  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file as File;
  // Qualidade alta de reescala
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  // Tenta cair abaixo do alvo reduzindo quality progressivamente
  let blob: Blob | null = null;
  for (let i = 0; i < 6; i++) {
    blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", quality),
    );
    if (!blob) break;
    if (blob.size <= maxBytes) break;
    quality = Math.max(0.55, quality - 0.1);
  }

  if (!blob) return file as File;
  const newName = inputName.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
}