import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BioHeaderEditor, type BioHeaderConfig } from "@/components/bio/BioHeaderEditor";

/**
 * Onda 3 v2 Fase 3 — wrapper standalone do BioHeaderEditor.
 *
 * Usa o mesmo componente apresentacional do /admin antigo, mas com state e
 * lógica próprios (carrega bio_config, salva, faz upload pra Storage). Pra
 * Painel novo aba Bio.
 *
 * Diferença vs Admin.tsx: aqui upload é direto (sem crop dialog). Cropping
 * fica pra evolução futura — manter MVP enxuto.
 */
type Tenant = { id: string; slug: string; display_name: string } | null;

type DbBioConfig = {
  id: string;
  tenant_id: string;
  display_name: string | null;
  headline: string | null;
  sub_headline: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  footer_text: string | null;
};

export const BioHeaderEditorStandalone = ({
  tenantId,
  slug,
  displayName,
}: {
  tenantId: string;
  slug: string;
  displayName: string;
}) => {
  const [row, setRow] = useState<DbBioConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const tenant: Tenant = { id: tenantId, slug, display_name: displayName };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("bio_config")
        .select("id, tenant_id, display_name, headline, sub_headline, avatar_url, cover_url, footer_text")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        toast.error("Erro ao carregar bio.");
        setRow(null);
      } else {
        setRow((data as DbBioConfig | null) ?? null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </Card>
    );
  }

  if (!row) {
    return (
      <Card className="p-12 text-center">
        <h2 className="mb-2 font-display text-xl">Configuração da bio não encontrada</h2>
        <p className="text-sm text-muted-foreground">
          Esse tenant ainda não tem uma configuração inicial criada.
        </p>
      </Card>
    );
  }

  const cfg: BioHeaderConfig = {
    display_name: row.display_name ?? "",
    headline: row.headline ?? "",
    sub_headline: row.sub_headline,
    avatar_url: row.avatar_url,
    cover_url: row.cover_url,
    footer_text: row.footer_text,
  };

  const handleUpdate = (patch: Partial<BioHeaderConfig>) => {
    setRow((r) => (r ? { ...r, ...patch } : r));
  };

  const handleSave = async () => {
    if (!row) return;
    setSaving(true);
    const { error } = await supabase
      .from("bio_config")
      .update({
        display_name: row.display_name,
        headline: row.headline,
        sub_headline: row.sub_headline,
        avatar_url: row.avatar_url,
        cover_url: row.cover_url,
        footer_text: row.footer_text,
      })
      .eq("id", row.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Cabeçalho salvo.");
  };

  const handleUploadAvatar = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem maior que 5MB.");
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `bio/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      handleUpdate({ avatar_url: pub.publicUrl });
      toast.success("Foto enviada — clique Salvar pra publicar.");
    } catch (e) {
      toast.error(`Falha no upload: ${(e as Error).message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUploadCover = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Imagem maior que 8MB.");
      return;
    }
    setUploadingCover(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `bio/cover-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("bio-covers").upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("bio-covers").getPublicUrl(path);
      handleUpdate({ cover_url: pub.publicUrl });
      toast.success("Capa enviada — clique Salvar pra publicar.");
    } catch (e) {
      toast.error(`Falha no upload: ${(e as Error).message}`);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!row) return;
    const { error } = await supabase
      .from("bio_config")
      .update({ cover_url: null })
      .eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    handleUpdate({ cover_url: null });
    toast.success("Capa removida.");
  };

  return (
    <BioHeaderEditor
      cfg={cfg}
      currentTenant={tenant}
      saving={saving}
      uploadingAvatar={uploadingAvatar}
      uploadingCover={uploadingCover}
      onUpdate={handleUpdate}
      onSave={handleSave}
      onPickAvatarFile={handleUploadAvatar}
      onPickCoverFile={handleUploadCover}
      onRemoveCover={handleRemoveCover}
    />
  );
};
