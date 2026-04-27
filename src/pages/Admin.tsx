import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, ArrowUp, ArrowDown, LogOut, ExternalLink, Eye, EyeOff, BarChart3, GripVertical, FileEdit, Send, Undo2, Copy, Palette, Sparkles, Gift, Menu, Stethoscope, MoreVertical, Droplet, Megaphone } from "lucide-react";
import { Upload } from "lucide-react";
import { ThemeToggle, useAdminLockedTheme } from "@/components/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconPicker } from "@/components/IconPicker";
import { BlockMetricsBadge } from "@/components/BlockMetricsBadge";
import { CampaignManager } from "@/components/CampaignManager";
import { CategoriesManager, type Category } from "@/components/CategoriesManager";
import { compressImage } from "@/lib/imageCompress";
import ImageCropDialog from "@/components/ImageCropDialog";
import { Combobox } from "@/components/Combobox";
import { TenantSelector } from "@/components/TenantSelector";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { DeepDiagnosticCard } from "@/components/DeepDiagnosticCard";
import { BioTemplatePicker } from "@/components/BioTemplatePicker";
import { BioHeaderEditor } from "@/components/bio/BioHeaderEditor";
import { BioBlocksManager } from "@/components/bio/BioBlocksManager";
import { QRCodeDialog } from "@/components/QRCodeDialog";
import { MyLinksCard } from "@/components/MyLinksCard";
import { PartnerCtasEditor } from "@/components/PartnerCtasEditor";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Lock } from "lucide-react";
import { readPendingSignup, clearPendingSignup } from "@/lib/pendingSignup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

type BioConfig = {
  id: string;
  display_name: string;
  headline: string;
  sub_headline: string | null;
  avatar_url: string | null;
  footer_text: string | null;
  cover_url: string | null;
};
type Block = {
  id: string;
  kind: string;
  label: string;
  description: string | null;
  url: string;
  icon: string | null;
  icon_url: string | null;
  icon_generations_count: number;
  badge: string | null;
  highlight: boolean;
  position: number;
  is_active: boolean;
  use_brand_color: boolean;
  size: "sm" | "md" | "lg";
  category_id: string | null;
  draft_data: Partial<Block> | null;
  has_draft: boolean;
};

// KINDS movido pra src/components/bio/blockKinds.ts (Onda 3 v2 PR2 refactor).

const Admin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  useAdminLockedTheme();
  const { current: currentTenant, loading: tenantLoading, tenants, refresh: refreshTenants } = useCurrentTenant();
  const [cfg, setCfg] = useState<BioConfig | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const activeBlocksCount = blocks.filter((b) => b.is_active).length;
  const plan = usePlanLimits(activeBlocksCount);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  // Crop dialog: arquivo escolhido aguardando ajuste antes do upload
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [cfgDirty, setCfgDirty] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dirtyBlocks, setDirtyBlocks] = useState<Set<string>>(new Set());
  const [savingAll, setSavingAll] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [publishImmediate, setPublishImmediate] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // ⚠️ Hooks que precisam rodar em TODO render (antes de qualquer early return),
  // senão React vê contagens diferentes entre loading vs logado e quebra com
  // "Rendered fewer hooks than expected".
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Auto-finalização de cadastro: se o usuário acabou de confirmar email e voltou,
  // não tem tenant nenhum e deixou um pendingSignup salvo, criamos o tenant aqui.
  // Cobre o gap entre signUp() (sem sessão) e o retorno via /verify.
  useEffect(() => {
    if (authLoading || tenantLoading || !user) return;
    if (currentTenant || tenants.length > 0) return;
    if (finalizing) return;
    const pending = readPendingSignup();
    if (!pending) return;
    // Só finaliza se o email do pending bater com o do usuário logado (segurança).
    if (pending.email && user.email && pending.email !== user.email.toLowerCase()) {
      clearPendingSignup();
      return;
    }
    void (async () => {
      setFinalizing(true);
      setFinalizeError(null);
      const { data, error } = await supabase.rpc("create_tenant_for_user" as any, {
        _slug: pending.slug,
        _display_name: pending.displayName,
        _invite_code: pending.inviteCode || null,
      } as any);
      if (error) {
        setFinalizeError(error.message);
        setFinalizing(false);
        return;
      }
      const planLabel = (data as any)?.plan;
      clearPendingSignup();
      if (planLabel === "partner") toast.success("bem-vinda ✨ acesso parceiro liberado");
      else if (planLabel === "tester") toast.success("bem-vindo ✨ acesso beta-tester liberado");
      else toast.success("sua bio está pronta");
      await refreshTenants();
      setFinalizing(false);
    })();
  }, [authLoading, tenantLoading, user, currentTenant, tenants.length, finalizing, refreshTenants]);

  const load = async () => {
    if (!currentTenant) {
      setCfg(null);
      setBlocks([]);
      setCategories([]);
      setLoadError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const [{ data: c, error: cfgError }, { data: b, error: blocksError }, { data: cats, error: catsError }] = await Promise.all([
        supabase.from("bio_config").select("*").eq("tenant_id", currentTenant.id).eq("singleton", true).maybeSingle(),
        supabase.from("bio_blocks").select("*").eq("tenant_id", currentTenant.id).order("position", { ascending: true }),
        supabase.from("bio_categories").select("*").eq("tenant_id", currentTenant.id).order("position", { ascending: true }),
      ]);

      const error = cfgError ?? blocksError ?? catsError;
      if (error) throw error;

      setCfg((c as any) ?? null);
      setBlocks((b as any) ?? []);
      setCategories((cats as any) ?? []);
      setCfgDirty(false);
      setDirtyBlocks(new Set());
    } catch (error: any) {
      const message = error?.message ?? "Não foi possível carregar o painel";
      toast.error(message);
      setLoadError(message);
      setCfg(null);
      setBlocks([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // PROTEÇÃO: Se houver alterações não salvas (dirty), não recarrega automaticamente
    // para não sobrescrever o que o usuário está digitando ao voltar de outra aba.
    const hasUnsavedChanges = dirtyBlocks.size > 0 || cfgDirty;
    
    if (!authLoading && !tenantLoading && user && !hasUnsavedChanges) {
      void load();
    }
  }, [authLoading, tenantLoading, user, currentTenant?.id]); // dirtyBlocks e cfgDirty propositalmente fora das dependências para não disparar load() quando o usuário digita

  if (authLoading || tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center grain">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  // Não-logado → tela de login.
  // Logado (admin OU tenant owner) → entra no painel. RLS já protege os dados
  // por tenant — admin enxerga tudo, owner só o tenant dele.
  if (!user) return <Navigate to="/admin/login" replace />;

  const saveCfg = async () => {
    if (!cfg) return;
    setSaving(true);
    const { error } = await supabase
      .from("bio_config")
      .update({
        display_name: cfg.display_name,
        headline: cfg.headline,
        sub_headline: cfg.sub_headline,
        avatar_url: cfg.avatar_url,
        footer_text: cfg.footer_text,
        cover_url: cfg.cover_url,
      })
      .eq("id", cfg.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Bio atualizada");
      setCfgDirty(false);
    }
  };

  const addBlock = async () => {
    if (!currentTenant) return toast.error("Nenhum tenant ativo selecionado");
    const nextPos = (blocks[blocks.length - 1]?.position ?? 0) + 1;
    const { data, error } = await supabase
      .from("bio_blocks")
      .insert({
        tenant_id: currentTenant.id,
        kind: "link",
        label: "Novo bloco",
        url: "https://",
        icon: "Link2",
        position: nextPos,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setBlocks((bs) => [...bs, data as any]);
  };

  const duplicateBlock = async (b: Block) => {
    if (!currentTenant) return toast.error("Nenhum tenant ativo selecionado");
    const nextPos = (blocks[blocks.length - 1]?.position ?? 0) + 1;
    const { data, error } = await supabase
      .from("bio_blocks")
      .insert({
        tenant_id: currentTenant.id,
        kind: b.kind,
        label: `${b.label} (cópia)`,
        description: b.description,
        url: b.url,
        icon: b.icon,
        icon_url: b.icon_url,
        badge: b.badge,
        highlight: b.highlight,
        use_brand_color: b.use_brand_color,
        size: "md",
        category_id: b.category_id,
        position: nextPos,
        is_active: false,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setBlocks((bs) => [...bs, data as any]);
    toast.success("Bloco duplicado — revise e ative");
  };

  // Campos que entram em rascunho. position/is_active são sempre publicados (UX direta).
  const DRAFT_FIELDS: (keyof Block)[] = [
    "kind", "label", "description", "url", "icon", "icon_url",
    "badge", "highlight", "use_brand_color", "category_id",
  ];

  // Mescla campos publicados + rascunho para exibição/edição no admin.
  const viewBlock = (b: Block): Block => {
    if (!b.has_draft || !b.draft_data) return b;
    return { ...b, ...(b.draft_data as Partial<Block>) };
  };

  const updateBlock = (id: string, patch: Partial<Block>) => {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    setDirtyBlocks((s) => {
      const n = new Set(s);
      n.add(id);
      return n;
    });
  };

  // Constrói o draft_data a partir dos campos atuais (no estado local).
  const buildDraft = (b: Block) => {
    const d: Record<string, any> = {};
    DRAFT_FIELDS.forEach((k) => {
      d[k as string] = (b as any)[k];
    });
    return d;
  };

  const saveBlock = async (b: Block, opts?: { publish?: boolean }) => {
    const publish = !!opts?.publish || publishImmediate;
    if (publish) {
      const { error } = await supabase
        .from("bio_blocks")
        .update({
          kind: b.kind,
          label: b.label,
          description: b.description,
          url: b.url,
          icon: b.icon,
          badge: b.badge,
          highlight: b.highlight,
          is_active: b.is_active,
          position: b.position,
          use_brand_color: b.use_brand_color,
          size: b.size,
          category_id: b.category_id,
          draft_data: null,
          has_draft: false,
        })
        .eq("id", b.id);
      if (error) return toast.error(error.message);
      setBlocks((bs) => bs.map((x) => (x.id === b.id ? { ...x, draft_data: null, has_draft: false } : x)));
      toast.success("Bloco publicado");
    } else {
      const draft = buildDraft(b);
      const { error } = await supabase
        .from("bio_blocks")
        .update({
          // Campos sempre publicados: posição e visibilidade
          position: b.position,
          is_active: b.is_active,
          draft_data: draft,
          has_draft: true,
        })
        .eq("id", b.id);
      if (error) return toast.error(error.message);
      setBlocks((bs) => bs.map((x) => (x.id === b.id ? { ...x, draft_data: draft, has_draft: true } : x)));
      toast.success("Rascunho salvo");
    }
    setDirtyBlocks((s) => {
      const n = new Set(s);
      n.delete(b.id);
      return n;
    });
  };

  const publishBlock = async (b: Block) => {
    setPublishingId(b.id);
    await saveBlock(b, { publish: true });
    setPublishingId(null);
  };

  const discardDraft = async (b: Block) => {
    if (!confirm("Descartar rascunho deste bloco?")) return;
    const { error, data } = await supabase
      .from("bio_blocks")
      .update({ draft_data: null, has_draft: false })
      .eq("id", b.id)
      .select()
      .single();
    if (error) return toast.error(error.message);
    setBlocks((bs) => bs.map((x) => (x.id === b.id ? (data as any) : x)));
    setDirtyBlocks((s) => {
      const n = new Set(s);
      n.delete(b.id);
      return n;
    });
    toast.success("Rascunho descartado");
  };

  const deleteBlock = async (id: string) => {
    if (!confirm("Excluir esse bloco?")) return;
    const { error } = await supabase.from("bio_blocks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setBlocks((bs) => bs.filter((b) => b.id !== id));
    setDirtyBlocks((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= blocks.length) return;
    const a = blocks[idx], c = blocks[j];
    const newBlocks = [...blocks];
    newBlocks[idx] = { ...c, position: a.position };
    newBlocks[j] = { ...a, position: c.position };
    setBlocks(newBlocks);
    await Promise.all([
      supabase.from("bio_blocks").update({ position: c.position }).eq("id", a.id),
      supabase.from("bio_blocks").update({ position: a.position }).eq("id", c.id),
    ]);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, position: i + 1 }));
    setBlocks(reordered);
    const updates = reordered.map((b) =>
      supabase.from("bio_blocks").update({ position: b.position }).eq("id", b.id),
    );
    const results = await Promise.all(updates);
    const failed = results.filter((r: any) => r?.error).length;
    if (failed > 0) toast.error("Falha ao salvar nova ordem");
  };

  const uploadAvatar = async (file: File | Blob) => {
    if (!cfg) return;
    setUploadingAvatar(true);
    const inputFile: File = file instanceof File
      ? file
      : new File([file], `avatar-${Date.now()}.jpg`, { type: file.type || "image/jpeg" });
    let upload: File = inputFile;
    try {
      upload = await compressImage(inputFile, { maxDimension: 1024, maxBytes: 1_200_000, quality: 0.9 });
    } catch {
      // se falhar compressão, segue com original
    }
    if (upload.size > 5 * 1024 * 1024) {
      setUploadingAvatar(false);
      toast.error("Imagem muito grande mesmo após compressão. Tente outra foto.");
      return;
    }
    const ext = upload.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `bio/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, upload, {
      cacheControl: "3600",
      upsert: false,
      contentType: upload.type,
    });
    if (upErr) {
      setUploadingAvatar(false);
      return toast.error(upErr.message);
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: updErr } = await supabase
      .from("bio_config")
      .update({ avatar_url: url })
      .eq("id", cfg.id);
    setUploadingAvatar(false);
    if (updErr) return toast.error(updErr.message);
    setCfg({ ...cfg, avatar_url: url });
    toast.success("Foto atualizada");
  };

  const uploadCover = async (file: File | Blob) => {
    if (!cfg) return;
    setUploadingCover(true);
    const inputFile: File = file instanceof File
      ? file
      : new File([file], `cover-${Date.now()}.jpg`, { type: file.type || "image/jpeg" });
    let upload: File = inputFile;
    try {
      // Capa entra com blur+vinheta no fundo, então 1600px e 2MB são suficientes
      // (mantém leveza sem perda visível).
      upload = await compressImage(inputFile, { maxDimension: 1600, maxBytes: 2_000_000, quality: 0.85 });
    } catch {
      // segue com original
    }
    if (upload.size > 8 * 1024 * 1024) {
      setUploadingCover(false);
      toast.error("Imagem muito grande mesmo após compressão. Tente outra foto.");
      return;
    }
    const ext = upload.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `bio/cover-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("bio-covers").upload(path, upload, {
      cacheControl: "3600",
      upsert: false,
      contentType: upload.type,
    });
    if (upErr) {
      setUploadingCover(false);
      return toast.error(upErr.message);
    }
    const { data: pub } = supabase.storage.from("bio-covers").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: updErr } = await supabase
      .from("bio_config")
      .update({ cover_url: url })
      .eq("id", cfg.id);
    setUploadingCover(false);
    if (updErr) return toast.error(updErr.message);
    setCfg({ ...cfg, cover_url: url });
    toast.success("Capa de fundo atualizada");
  };

  const removeCover = async () => {
    if (!cfg) return;
    const { error } = await supabase
      .from("bio_config")
      .update({ cover_url: null })
      .eq("id", cfg.id);
    if (error) return toast.error(error.message);
    setCfg({ ...cfg, cover_url: null });
    toast.success("Capa removida");
  };

  const updateCfg = (patch: Partial<BioConfig>) => {
    setCfg((c) => (c ? { ...c, ...patch } : c));
    setCfgDirty(true);
  };

  const saveAll = async () => {
    if (!cfg) return;
    setSavingAll(true);
    const tasks: any[] = [];
    if (cfgDirty) {
      tasks.push(
        supabase
          .from("bio_config")
          .update({
            display_name: cfg.display_name,
            headline: cfg.headline,
            sub_headline: cfg.sub_headline,
            avatar_url: cfg.avatar_url,
            footer_text: cfg.footer_text,
            cover_url: cfg.cover_url,
          })
          .eq("id", cfg.id),
      );
    }
    const dirtyList = blocks.filter((b) => dirtyBlocks.has(b.id));
    for (const b of dirtyList) {
      if (publishImmediate) {
        tasks.push(
          supabase
            .from("bio_blocks")
            .update({
              kind: b.kind,
              label: b.label,
              description: b.description,
              url: b.url,
              icon: b.icon,
              badge: b.badge,
              highlight: b.highlight,
              is_active: b.is_active,
              position: b.position,
              use_brand_color: b.use_brand_color,
              size: b.size,
              category_id: b.category_id,
              draft_data: null,
              has_draft: false,
            })
            .eq("id", b.id),
        );
      } else {
        const draft = buildDraft(b);
        tasks.push(
          supabase
            .from("bio_blocks")
            .update({
              position: b.position,
              is_active: b.is_active,
              draft_data: draft,
              has_draft: true,
            })
            .eq("id", b.id),
        );
      }
    }
    const results = await Promise.all(tasks);
    setSavingAll(false);
    const failed = results.filter((r: any) => r?.error).length;
    if (failed > 0) {
      toast.error(`${failed} alteração(ões) falharam`);
    } else {
      const verb = publishImmediate ? "publicada" : "salva como rascunho";
      toast.success(`${tasks.length} alteração${tasks.length === 1 ? "" : "ões"} ${verb}${publishImmediate ? "" : "s"}`);
      setCfgDirty(false);
      // Refletir local: marca has_draft=true se foi rascunho
      if (!publishImmediate) {
        setBlocks((bs) =>
          bs.map((b) =>
            dirtyBlocks.has(b.id)
              ? { ...b, draft_data: buildDraft(b), has_draft: true }
              : b,
          ),
        );
      } else {
        setBlocks((bs) =>
          bs.map((b) =>
            dirtyBlocks.has(b.id) ? { ...b, draft_data: null, has_draft: false } : b,
          ),
        );
      }
      setDirtyBlocks(new Set());
    }
  };

  const totalDirty = (cfgDirty ? 1 : 0) + dirtyBlocks.size;
  const totalDrafts = blocks.filter((b) => b.has_draft).length;

  return (
    <div className="relative min-h-screen overflow-hidden grain">
      <div className="aurora-a" />
      <div className="aurora-b" />
      <header className="sticky top-0 z-30 border-b border-gold/30 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-[10px] leading-none uppercase tracking-[0.3em] text-muted-foreground mb-1">painel</p>
            <h1 className="font-display text-2xl leading-none mt-0.5">Admin</h1>
          </div>

          {/* Desktop nav (lg+) */}
          <div className="hidden lg:flex items-center gap-2 flex-wrap justify-end">
            {totalDrafts > 0 && (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-amber-500/60 bg-amber-500/10 px-3 text-[10px] uppercase tracking-[0.2em] text-amber-500">
                <FileEdit className="h-3 w-3" />
                {totalDrafts} rascunho{totalDrafts === 1 ? "" : "s"}
              </span>
            )}
            <TenantSelector />
            <ThemeToggle />
            {plan.canUseThemes ? (
              <Link to="/admin/templates" className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                Templates <Palette className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <UpgradeModal feature="themes">
                <button type="button" className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold/30 bg-card/20 px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:border-gold hover:text-primary">
                  Templates <Lock className="h-3 w-3" />
                </button>
              </UpgradeModal>
            )}
            {plan.canUseAnalytics ? (
              <Link to="/admin/analytics" className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                Analytics <BarChart3 className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <UpgradeModal feature="analytics">
                <button type="button" className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold/30 bg-card/20 px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:border-gold hover:text-primary">
                  Analytics <Lock className="h-3 w-3" />
                </button>
              </UpgradeModal>
            )}
            {plan.canUseImprovements ? (
              <Link to="/admin/improvements" className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                Sugestões IA <Sparkles className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <UpgradeModal feature="improvements">
                <button type="button" className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold/30 bg-card/20 px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:border-gold hover:text-primary">
                  Sugestões IA <Lock className="h-3 w-3" />
                </button>
              </UpgradeModal>
            )}
            {isAdmin && (
              <Link to="/admin/invites" className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                Convites <Gift className="h-3.5 w-3.5" />
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/landing-partners" className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                Parceiros <Megaphone className="h-3.5 w-3.5" />
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/diagnostics" className="inline-flex h-10 items-center gap-2 rounded-sm border border-border bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-all hover:border-gold hover:text-primary">
                DIAGNÓSTICO
              </Link>
            )}
            {currentTenant && (
              <QRCodeDialog
                url={`${window.location.origin}/${currentTenant.slug}`}
                slug={currentTenant.slug}
              />
            )}
            <Link to="/bio" target="_blank" className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
              Ver bio <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button onClick={signOut} className="inline-flex h-10 items-center gap-2 rounded-sm border border-border bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
              Sair <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Mobile / tablet: badge de rascunhos + theme + hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            {totalDrafts > 0 && (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-amber-500/60 bg-amber-500/10 px-2 text-[10px] uppercase tracking-[0.2em] text-amber-500">
                <FileEdit className="h-3 w-3" />
                {totalDrafts}
              </span>
            )}
            <ThemeToggle />
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Abrir menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-gold bg-card/40 text-primary transition-all hover:bg-gradient-gold-soft"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-sm border-l border-gold/30 bg-background/95 backdrop-blur">
                <SheetHeader>
                  <SheetTitle className="font-display text-xl">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-3" onClick={(e) => {
                  // fecha o sheet ao clicar em qualquer Link/button de navegação
                  const target = e.target as HTMLElement;
                  if (target.closest("a, button")) setMenuOpen(false);
                }}>
                  <div className="pb-2">
                    <TenantSelector />
                  </div>

                  {plan.canUseThemes ? (
                    <Link to="/admin/templates" className="inline-flex h-11 items-center justify-between gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                      <span>Templates</span> <Palette className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <UpgradeModal feature="themes">
                      <button type="button" className="inline-flex h-11 items-center justify-between gap-2 rounded-sm border border-gold/30 bg-card/20 px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:border-gold hover:text-primary">
                        <span>Templates</span> <Lock className="h-3 w-3" />
                      </button>
                    </UpgradeModal>
                  )}

                  {plan.canUseAnalytics ? (
                    <Link to="/admin/analytics" className="inline-flex h-11 items-center justify-between gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                      <span>Analytics</span> <BarChart3 className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <UpgradeModal feature="analytics">
                      <button type="button" className="inline-flex h-11 items-center justify-between gap-2 rounded-sm border border-gold/30 bg-card/20 px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:border-gold hover:text-primary">
                        <span>Analytics</span> <Lock className="h-3 w-3" />
                      </button>
                    </UpgradeModal>
                  )}

                  {plan.canUseImprovements ? (
                    <Link to="/admin/improvements" className="inline-flex h-11 items-center justify-between gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                      <span>Sugestões IA</span> <Sparkles className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <UpgradeModal feature="improvements">
                      <button type="button" className="inline-flex h-11 items-center justify-between gap-2 rounded-sm border border-gold/30 bg-card/20 px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:border-gold hover:text-primary">
                        <span>Sugestões IA</span> <Lock className="h-3 w-3" />
                      </button>
                    </UpgradeModal>
                  )}

                  {isAdmin && (
                    <Link to="/admin/invites" className="inline-flex h-11 items-center justify-between gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                      <span>Convites</span> <Gift className="h-3.5 w-3.5" />
                    </Link>
                  )}

                  {isAdmin && (
                    <Link to="/admin/landing-partners" className="inline-flex h-11 items-center justify-between gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                      <span>Parceiros landing</span> <Megaphone className="h-3.5 w-3.5" />
                    </Link>
                  )}

                  {isAdmin && (
                    <Link to="/admin/diagnostics" className="inline-flex h-11 items-center justify-between gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                      <span>Diagnóstico</span> <Stethoscope className="h-3.5 w-3.5" />
                    </Link>
                  )}

                  {currentTenant && (
                    <QRCodeDialog
                      url={`${window.location.origin}/${currentTenant.slug}`}
                      slug={currentTenant.slug}
                    />
                  )}

                  <Link to="/bio" target="_blank" className="inline-flex h-11 items-center justify-between gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                    <span>Ver bio</span> <ExternalLink className="h-3.5 w-3.5" />
                  </Link>

                  <button onClick={signOut} className="mt-2 inline-flex h-11 items-center justify-between gap-2 rounded-sm border border-border bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
                    <span>Sair</span> <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {!currentTenant ? (
        finalizing ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-display text-2xl">Preparando sua <span className="text-gold italic">bio</span></p>
            <p className="max-w-md text-sm text-muted-foreground">
              Estamos liberando seu acesso e criando sua bio agora. Isso leva só alguns segundos.
            </p>
          </div>
        ) : finalizeError ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="font-display text-2xl">Não conseguimos finalizar seu cadastro</p>
            <p className="max-w-md text-sm text-muted-foreground">{finalizeError}</p>
            <Button asChild className="btn-luxe h-11 rounded-sm px-6 text-xs uppercase tracking-[0.2em]">
              <Link to="/signup">Recomeçar cadastro</Link>
            </Button>
          </div>
        ) : (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="font-display text-2xl">Nenhum tenant selecionado</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Entre novamente ou selecione um tenant para abrir o painel.
            </p>
          </div>
        )
      ) : loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : loadError ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-display text-2xl">Não foi possível abrir o painel</p>
          <p className="max-w-md text-sm text-muted-foreground">{loadError}</p>
          <Button onClick={() => void load()} className="btn-luxe h-11 rounded-sm px-6 text-xs uppercase tracking-[0.2em]">
            Tentar novamente
          </Button>
        </div>
      ) : !cfg ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-display text-2xl">Configuração da bio não encontrada</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Esse tenant ainda não tem uma configuração inicial da bio disponível.
          </p>
        </div>
      ) : (
        <main className="mx-auto max-w-5xl space-y-12 px-6 py-10">
          <OnboardingChecklist
            hasAvatar={!!cfg.avatar_url}
            hasHeadline={(() => {
              const h = (cfg.headline ?? "").trim().toLowerCase();
              if (!h) return false;
              // Seeds padrão criados pela RPC create_tenant_for_user (não contam como "preenchido")
              const defaults = [
                "bem-vindo à minha bio",
                "bem-vinda à sua bio",
                "bem-vindo à sua bio",
                "bem-vinda à minha bio",
              ];
              return !defaults.includes(h);
            })()}
            hasActiveBlock={blocks.some((b) => b.is_active)}
            bioUrl={currentTenant?.slug ? `/${currentTenant.slug}` : "/bio"}
            onFocusHeader={() => {
              const el = document.getElementById("admin-header-section");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            onFocusBlocks={() => {
              const el = document.getElementById("admin-blocks-section");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <DeepDiagnosticCard />
          {currentTenant && (
            <MyLinksCard slug={currentTenant.slug} tenantId={currentTenant.id} />
          )}
          {currentTenant && (
            <PartnerCtasEditor tenantId={currentTenant.id} slug={currentTenant.slug} />
          )}
          {/* Cabeçalho da bio (extraído pra <BioHeaderEditor /> reutilizável — Onda 3 v2 PR1) */}
          <BioHeaderEditor
            cfg={cfg}
            currentTenant={currentTenant}
            saving={saving}
            uploadingAvatar={uploadingAvatar}
            uploadingCover={uploadingCover}
            onUpdate={updateCfg}
            onSave={saveCfg}
            onPickAvatarFile={(f) => setPendingAvatarFile(f)}
            onPickCoverFile={(f) => setPendingCoverFile(f)}
            onRemoveCover={removeCover}
          />

          {/* Blocos (extraído pra <BioBlocksManager /> reutilizável — Onda 3 v2 PR2) */}
          <BioBlocksManager
            blocks={blocks}
            categories={categories}
            tenantId={currentTenant?.id ?? ""}
            canAddBlock={plan.canAddBlock}
            maxBlocks={plan.limits.max_blocks}
            publishingId={publishingId}
            sensors={sensors}
            viewBlock={viewBlock}
            onAddBlock={addBlock}
            onTemplateApplied={() => void load()}
            onChangeBlock={updateBlock}
            onSaveBlock={saveBlock}
            onPublishBlock={publishBlock}
            onDiscardDraft={discardDraft}
            onDeleteBlock={deleteBlock}
            onDuplicateBlock={duplicateBlock}
            onMoveBlock={move}
            onDragEnd={handleDragEnd}
          />

          {currentTenant && <CategoriesManager tenantId={currentTenant.id} />}
        </main>
      )}

      {totalDirty > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-6">
          <div className="pointer-events-auto flex flex-wrap items-center gap-4 rounded-sm border-gold-gradient bg-background/95 px-5 py-3 shadow-2xl backdrop-blur">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {totalDirty} alteração{totalDirty === 1 ? "" : "ões"} pendente{totalDirty === 1 ? "" : "s"}
            </span>
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              publicar já
              <Switch checked={publishImmediate} onCheckedChange={setPublishImmediate} />
            </label>
            <Button
              onClick={saveAll}
              disabled={savingAll}
              className="btn-luxe h-10 rounded-sm px-5 text-[11px] uppercase tracking-[0.2em]"
            >
              {savingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : publishImmediate ? (
                <><Send className="h-4 w-4" /> Publicar tudo</>
              ) : (
                <><Save className="h-4 w-4" /> Salvar rascunhos</>
              )}
            </Button>
          </div>
        </div>
      )}

      <ImageCropDialog
        file={pendingAvatarFile}
        aspect={1}
        cropShape="round"
        title="Ajustar foto de perfil"
        onCancel={() => setPendingAvatarFile(null)}
        onConfirm={async (blob) => {
          setPendingAvatarFile(null);
          await uploadAvatar(blob);
        }}
      />
      <ImageCropDialog
        file={pendingCoverFile}
        aspect={16 / 9}
        cropShape="rect"
        title="Ajustar capa de fundo"
        onCancel={() => setPendingCoverFile(null)}
        onConfirm={async (blob) => {
          setPendingCoverFile(null);
          await uploadCover(blob);
        }}
      />
    </div>
  );
};

export default Admin;