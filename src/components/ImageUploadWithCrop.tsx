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
}

export function ImageUploadWithCrop({ value, onChange, folder = "avatars" }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImage(reader.result as string);
        setCropping(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("No 2d context");

    // Limit resolution for performance (max 800px)
    const MAX_SIZE = 800;
    let targetWidth = pixelCrop.width;
    let targetHeight = pixelCrop.height;

    if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
      const scale = MAX_SIZE / Math.max(targetWidth, targetHeight);
      targetWidth *= scale;
      targetHeight *= scale;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(
      image,
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
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, "image/jpeg", 0.85); // 0.85 quality for compression
    });
  };

  const handleUpload = async () => {
    if (!image || !croppedAreaPixels) return;

    setLoading(true);
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      const fileExt = "jpg";
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedBlob);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
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
        <DialogContent className="max-w-xl bg-card border-gold/20">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Enquadrar Foto</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-80 bg-black/20 rounded-xl overflow-hidden mt-4">
            {image && (
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Zoom</span>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={([val]) => setZoom(val)}
                className="flex-1"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
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
