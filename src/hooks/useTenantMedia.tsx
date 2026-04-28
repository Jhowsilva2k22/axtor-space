import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/imageCompress";

/**
 * Onda 3 v2 Fase 5 — banco de mídia do tenant.
 * Lê e escreve em `tenant_media` + Storage `tenant-media`.
 *
 * RLS já aplicada na tabela: só owner do tenant ou admin.
 * Bucket Storage privado — todos uploads precisam de auth.
 */

export type TenantMedia = {
  id: string;
  tenant_id: string;
  url: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  type: "image" | "logo" | "banner" | "avatar";
  used_in: string[] | null;
  created_at: string;
};

const QUERY_KEY = (tenantId: string) => ["tenantMedia", tenantId];

export const useTenantMedia = (tenantId: string | null) => {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: tenantId ? QUERY_KEY(tenantId) : ["tenantMedia", "_disabled"],
    queryFn: async (): Promise<TenantMedia[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("tenant_media")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as TenantMedia[] | null) ?? [];
    },
    enabled: !!tenantId,
  });

  const upload = useMutation({
    mutationFn: async (input: {
      file: File;
      type?: TenantMedia["type"];
    }): Promise<TenantMedia> => {
      if (!tenantId) throw new Error("tenantId obrigatório");

      // Compressão automática pra fotos pesadas — converte pra JPEG até ~1.5MB.
      let compressed: File = input.file;
      try {
        compressed = await compressImage(input.file, {
          maxDimension: 2048,
          maxBytes: 1_500_000,
          quality: 0.85,
        });
      } catch {
        // se falhar, segue com original (validação client-side já passou se chegou aqui)
      }

      // 1. Sobe pro Storage privado
      const ext = compressed.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${tenantId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("tenant-media")
        .upload(path, compressed, {
          contentType: compressed.type || "image/jpeg",
          upsert: false,
        });
      if (upErr) throw upErr;

      // 2. Pega URL pública (signed URL ou public URL — bucket é privado, mas
      // o Supabase devolve URL pública que só funciona com auth)
      const { data: pub } = supabase.storage.from("tenant-media").getPublicUrl(path);

      // 3. Insere row no banco
      const { data, error } = await supabase
        .from("tenant_media")
        .insert({
          tenant_id: tenantId,
          url: pub.publicUrl,
          file_name: compressed.name,
          mime_type: compressed.type,
          size_bytes: compressed.size,
          type: input.type ?? "image",
        })
        .select()
        .single();
      if (error) throw error;

      return data as TenantMedia;
    },
    onSuccess: () => {
      if (tenantId) queryClient.invalidateQueries({ queryKey: QUERY_KEY(tenantId) });
    },
  });

  const remove = useMutation({
    mutationFn: async (item: TenantMedia): Promise<void> => {
      if (!tenantId) throw new Error("tenantId obrigatório");

      // 1. Tenta apagar do Storage (extrai path da URL)
      try {
        const url = new URL(item.url);
        // Pattern: /storage/v1/object/public/tenant-media/<path>
        const marker = "/tenant-media/";
        const idx = url.pathname.indexOf(marker);
        if (idx >= 0) {
          const path = url.pathname.substring(idx + marker.length);
          await supabase.storage.from("tenant-media").remove([path]);
        }
      } catch {
        // se falhar, segue — row do banco será removida mesmo
      }

      // 2. Apaga row
      const { error } = await supabase.from("tenant_media").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (tenantId) queryClient.invalidateQueries({ queryKey: QUERY_KEY(tenantId) });
    },
  });

  return {
    items: list.data ?? [],
    loading: list.isLoading,
    error: list.error,
    upload: upload.mutateAsync,
    uploading: upload.isPending,
    remove: remove.mutateAsync,
    removing: remove.isPending,
  };
};
