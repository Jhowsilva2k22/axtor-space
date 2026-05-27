import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, Trash2, Crop } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  bucket?: string;
}

type AspectOption = { label: string; value: number | undefined };

const ASPECT_OPTIONS: AspectOption[] = [
  { label: "Livre",    value: undefined },
  { label: "1:1",      value: 1 },
  { label: "4:5",      value: 4 / 5 },
  { label: "16:9",     value: 16 / 9 },
];

export function ImageUploadWithCrop({
  value,
  onChange,
  folder = "avatars",
  bucket = "avatars",
}: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aspectIdx, setAspectIdx] = useState(1); // 1:1 como padrão

  const currentAspect = ASPECT_OPTIONS[aspectIdx].value;

  const onCropComplete = useCallback((_croppedArea: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImage(reader.result as string);
        setCropping(true);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener("load", () => resolve(img));
      img.addEventListener("error", (error) => reject(error));
      img.setAttribute("crossOrigin", "anonymous");
      img.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const img = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("No 2d context");

    const MAX_SIZE = 1200;
    let targetWidth = pixelCrop.width;
    let targetHeight = pixelCrop.height;

    if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
      const scale = MAX_SIZE / Math.max(targetWidth, targetHeight);
      targetWidth = Math.round(targetWidth * scale);
      targetHeight = Math.round(targetHeight * scale);
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(
      img,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.88);
    });
  };

  const handleUpload = async () => {
    if (!image || !croppedAreaPixels) return;

    setLoading(true);
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      const fileName = `${Math.random().toString(36).substring(2)}.jpg`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, croppedBlob);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      onChange(data.publicUrl);
      setCropping(false);
      setImage(null);
      toast.success("Foto atualizada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao subir imagem: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative group w-40 h-40">
          <img src={value} alt="Avatar" className="w-full h-full object-cover rounded-[24px] border border-gold/20" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-[24px]">
            <label className="cursor-pointer p-2 hover:bg-white/20 rounded-full transition-colors">
              <Upload className="w-5 h-5 text-white" />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
            <button
              onClick={() => onChange("")}
              className="p-2 hover:bg-red-500/40 rounded-full transition-colors"
            >
              <Trash2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-gold/20 rounded-[24px] cursor-pointer hover:bg-gold/5 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 text-gold/40 mb-2" />
            <p className="text-[10px] uppercase tracking-widest text-gold/60">Subir Foto</p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
      )}

      <Dialog open={cropping} onOpenChange={setCropping}>
        <DialogContent className="max-w-2xl bg-card border-gold/20">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Enquadrar Foto</DialogTitle>
          </DialogHeader>

          {/* Seletor de proporção */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">Proporção</span>
            <div className="flex gap-1.5">
              {ASPECT_OPTIONS.map((opt, i) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => { setAspectIdx(i); setCrop({ x: 0, y: 0 }); }}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                    aspectIdx === i
                      ? "border-gold bg-gold/15 text-gold"
                      : "border-gold/20 text-muted-foreground hover:border-gold/40 hover:text-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Área de crop — maior e mais respiraçada */}
          <div className="relative w-full h-[460px] bg-black/30 rounded-2xl overflow-hidden mt-3">
            {image && (
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={currentAspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                showGrid={true}
                style={{
                  containerStyle: { borderRadius: "16px" },
                }}
              />
            )}
          </div>

          <div className="flex items-center gap-4 mt-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground shrink-0">Zoom</span>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={([val]) => setZoom(val)}
              className="flex-1"
            />
            <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
              {zoom.toFixed(1)}×
            </span>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setCropping(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button className="btn-luxe gap-2" onClick={handleUpload} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crop className="w-4 h-4" />}
              Salvar e Otimizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
