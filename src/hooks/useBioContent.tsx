import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Onda 3 v2 Fase 3 — leitura/escrita do conteúdo da Bio (`bio_config` + `bio_blocks`).
 *
 * Usa as tabelas que JÁ existem (do /admin antigo). Convive com o editor antigo
 * sem quebrar nada — o user pode usar um ou outro até a migração estar completa.
 *
 * RLS já está aplicada nessas tabelas pelo schema do projeto. Não estamos mexendo.
 */

export type BioConfig = {
  tenant_id: string;
  display_name: string | null;
  headline: string | null;
  sub_headline: string | null;
  avatar_url: string | null;
  cover_url: string | null;
};

export type BioBlock = {
  id: string;
  tenant_id: string;
  position: number;
  label: string;
  url: string;
  kind: string | null;
  icon: string | null;
  is_active: boolean;
  use_brand_color?: boolean;
};

export const useBioContent = (tenantId: string | null) => {
  const queryClient = useQueryClient();
  const queryKey = ["bioContent", tenantId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<{ config: BioConfig | null; blocks: BioBlock[] }> => {
      if (!tenantId) return { config: null, blocks: [] };

      const [{ data: c, error: cErr }, { data: b, error: bErr }] = await Promise.all([
        supabase
          .from("bio_config")
          .select("tenant_id, display_name, headline, sub_headline, avatar_url, cover_url")
          .eq("tenant_id", tenantId)
          .maybeSingle(),
        supabase
          .from("bio_blocks")
          .select("id, tenant_id, position, label, url, kind, icon, is_active, use_brand_color")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("position", { ascending: true }),
      ]);

      if (cErr) console.warn("[useBioContent] bio_config error:", cErr);
      if (bErr) console.warn("[useBioContent] bio_blocks error:", bErr);

      return {
        config: (c as BioConfig | null) ?? null,
        blocks: (b as BioBlock[] | null) ?? [],
      };
    },
    enabled: !!tenantId,
    staleTime: 30_000,
  });

  const saveConfig = useMutation({
    mutationFn: async (patch: Partial<BioConfig>) => {
      if (!tenantId) throw new Error("tenantId obrigatório");
      const { error } = await supabase
        .from("bio_config")
        .update(patch)
        .eq("tenant_id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  /** Upload pro bucket `avatars/bio/`. Retorna a URL pública pra salvar em bio_config.avatar_url. */
  const uploadAvatar = useMutation({
    mutationFn: async (file: File): Promise<string> => {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Imagem maior que 5MB.");
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `bio/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      return pub.publicUrl;
    },
  });

  /** Upload pro bucket `bio-covers/`. Capa de fundo da bio. */
  const uploadCover = useMutation({
    mutationFn: async (file: File): Promise<string> => {
      if (file.size > 8 * 1024 * 1024) {
        throw new Error("Imagem maior que 8MB.");
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `bio/cover-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("bio-covers").upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("bio-covers").getPublicUrl(path);
      return pub.publicUrl;
    },
  });

  const addBlock = useMutation({
    mutationFn: async (input: { label: string; url: string; kind?: string | null }) => {
      if (!tenantId) throw new Error("tenantId obrigatório");
      const current = query.data?.blocks ?? [];
      const nextPosition =
        current.length > 0 ? Math.max(...current.map((b) => b.position)) + 1 : 0;
      const { error } = await supabase.from("bio_blocks").insert({
        tenant_id: tenantId,
        label: input.label,
        url: input.url,
        kind: input.kind ?? null,
        position: nextPosition,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateBlock = useMutation({
    mutationFn: async (input: { id: string; patch: Partial<BioBlock> }) => {
      const { error } = await supabase.from("bio_blocks").update(input.patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      // Soft-delete preservando histórico (mesma convenção do /admin antigo).
      const { error } = await supabase
        .from("bio_blocks")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    config: query.data?.config ?? null,
    blocks: query.data?.blocks ?? [],
    loading: query.isLoading,
    error: query.error,
    saveConfig: saveConfig.mutateAsync,
    savingConfig: saveConfig.isPending,
    uploadAvatar: uploadAvatar.mutateAsync,
    uploadingAvatar: uploadAvatar.isPending,
    addBlock: addBlock.mutateAsync,
    addingBlock: addBlock.isPending,
    updateBlock: updateBlock.mutateAsync,
    deleteBlock: deleteBlock.mutateAsync,
  };
};
