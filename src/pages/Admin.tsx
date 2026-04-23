import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, ArrowUp, ArrowDown, LogOut, ExternalLink, Eye, EyeOff, BarChart3, GripVertical, FileEdit, Send, Undo2, Copy, Palette, Sparkles, Gift } from "lucide-react";
import { Upload } from "lucide-react";
import { ThemeToggle, useAdminLockedTheme } from "@/components/ThemeToggle";
import { IconPicker } from "@/components/IconPicker";
import { BlockMetricsBadge } from "@/components/BlockMetricsBadge";
import { CampaignManager } from "@/components/CampaignManager";
import { CategoriesManager, type Category } from "@/components/CategoriesManager";
import { Combobox } from "@/components/Combobox";
import { TenantSelector } from "@/components/TenantSelector";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { BioTemplatePicker } from "@/components/BioTemplatePicker";
import { QRCodeDialog } from "@/components/QRCodeDialog";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Lock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

const KINDS = [
  { v: "instagram", l: "Instagram", icon: "Instagram" },
  { v: "site", l: "Site", icon: "Globe" },
  { v: "whatsapp", l: "WhatsApp", icon: "MessageCircle" },
  { v: "agenda", l: "Agenda", icon: "Calendar" },
  { v: "product", l: "Produto próprio", icon: "ShoppingBag" },
  { v: "ebook", l: "E-book", icon: "BookOpen" },
  { v: "service", l: "Serviço", icon: "Briefcase" },
  { v: "affiliate", l: "Afiliado", icon: "Tag" },
  { v: "partner", l: "Parceiro", icon: "Handshake" },
  { v: "cta_diagnostico", l: "CTA Diagnóstico", icon: "Sparkles" },
  { v: "cta_ferramenta", l: "CTA Ferramenta", icon: "Crown" },
  { v: "link", l: "Link genérico", icon: "Link2" },
];

const Admin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  useAdminLockedTheme();
  const { current: currentTenant, loading: tenantLoading } = useCurrentTenant();
  const [cfg, setCfg] = useState<BioConfig | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const activeBlocksCount = blocks.filter((b) => b.is_active).length;
  const plan = usePlanLimits(activeBlocksCount);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [cfgDirty, setCfgDirty] = useState(false);
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
    if (!authLoading && !tenantLoading && user) {
      void load();
    }
  }, [authLoading, tenantLoading, user, currentTenant?.id]);

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
    const nextPos = (blocks[blocks.length - 1]?.position ?? 0) + 1;
    const { data, error } = await supabase
      .from("bio_blocks")
      .insert({
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
    const nextPos = (blocks[blocks.length - 1]?.position ?? 0) + 1;
    const { data, error } = await supabase
      .from("bio_blocks")
      .insert({
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

  const uploadAvatar = async (file: File) => {
    if (!cfg) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB)");
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `bio/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
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

  const uploadCover = async (file: File) => {
    if (!cfg) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 8MB)");
      return;
    }
    setUploadingCover(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `bio/cover-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("bio-covers").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">painel</p>
            <h1 className="font-display text-2xl">Admin</h1>
          </div>
          <div className="flex items-center gap-2">
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
              <Link to="/admin/diagnostics" className="inline-flex h-10 items-center gap-2 rounded-sm border border-border bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-all hover:border-gold hover:text-primary">
                Diagnóstico
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
        </div>
      </header>

      {!currentTenant ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="font-display text-2xl">Nenhum tenant selecionado</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Entre novamente ou selecione um tenant para abrir o painel.
          </p>
        </div>
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
            hasHeadline={!!cfg.headline && cfg.headline.trim().length > 0 && cfg.headline !== "Bem-vindo à minha bio"}
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
          {/* Cabeçalho da bio */}
          <section id="admin-header-section" className="rounded-sm border-gold-gradient p-6">
            <h2 className="font-display text-2xl">Cabeçalho da <span className="text-gold italic">bio</span></h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Nome de exibição">
                <Input value={cfg.display_name} onChange={(e) => updateCfg({ display_name: e.target.value })} className="h-11 rounded-sm border-gold bg-input" />
              </Field>
              <Field label="Foto de perfil">
                <div className="flex items-center gap-3">
                  {cfg.avatar_url ? (
                    <img src={cfg.avatar_url} alt="avatar" className="h-11 w-11 shrink-0 rounded-full border border-gold object-cover" />
                  ) : (
                    <div className="h-11 w-11 shrink-0 rounded-full border border-dashed border-gold/50" />
                  )}
                  <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                    {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploadingAvatar ? "Enviando..." : "Enviar foto"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingAvatar}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadAvatar(f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
                <Input
                  value={cfg.avatar_url ?? ""}
                  onChange={(e) => updateCfg({ avatar_url: e.target.value })}
                  placeholder="ou cole uma URL https://..."
                  className="mt-2 h-9 rounded-sm border-gold/50 bg-input text-xs"
                />
              </Field>
              <Field label="Headline (frase principal)" full>
                <Textarea value={cfg.headline} onChange={(e) => updateCfg({ headline: e.target.value })} rows={3} className="rounded-sm border-gold bg-input" />
              </Field>
              <Field label="Sub-headline (linha pequena)">
                <Input value={cfg.sub_headline ?? ""} onChange={(e) => updateCfg({ sub_headline: e.target.value })} className="h-11 rounded-sm border-gold bg-input" />
              </Field>
              <Field label="Footer">
                <Combobox
                  value={cfg.footer_text ?? ""}
                  onChange={(v) => updateCfg({ footer_text: v })}
                  presets={[
                    "joandersonsilva.com.br",
                    "© 2026 Joanderson Silva",
                    "Feito com presença",
                    "Todos os direitos reservados",
                  ]}
                  placeholder="Texto do rodapé (opcional)"
                  customLabel="Usar texto personalizado"
                />
                {cfg.footer_text && (
                  <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    prévia: <span className="text-primary">{cfg.footer_text}</span>
                  </p>
                )}
              </Field>
              <Field label="Capa de fundo (opcional)" full>
                <div className="flex flex-col gap-3">
                  {cfg.cover_url ? (
                    <div className="relative h-32 w-full overflow-hidden rounded-sm border border-gold">
                      <img src={cfg.cover_url} alt="capa" className="h-full w-full object-cover" />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            "radial-gradient(ellipse at center, transparent 0%, transparent 30%, hsl(var(--background) / 0.65) 70%, hsl(var(--background) / 0.92) 100%)",
                        }}
                      />
                      <div className="absolute bottom-2 right-2 rounded-sm border border-gold bg-background/80 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-primary backdrop-blur">
                        prévia com vinheta
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center rounded-sm border border-dashed border-gold/40 bg-card/30">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        sem capa — fundo do tema
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
                      {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {uploadingCover ? "Enviando..." : cfg.cover_url ? "Trocar capa" : "Enviar capa"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingCover}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadCover(f);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                    {cfg.cover_url && (
                      <Button
                        type="button"
                        onClick={removeCover}
                        variant="ghost"
                        className="h-10 rounded-sm border border-border px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remover
                      </Button>
                    )}
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
                    aplicada como fundo fixo (parallax) com blur e vinheta. máx 8MB.
                  </p>
                </div>
              </Field>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={saveCfg} disabled={saving} className="btn-luxe h-11 rounded-sm px-6 text-xs uppercase tracking-[0.2em]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar cabeçalho</>}
              </Button>
            </div>
          </section>

          {/* Blocos */}
          <section id="admin-blocks-section">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl">Blocos da bio</h2>
              <div className="flex items-center gap-2">
                {blocks.length === 0 && plan.canAddBlock && (
                  <BioTemplatePicker variant="ghost" onApplied={() => void load()} />
                )}
                {plan.canAddBlock ? (
                  <Button onClick={addBlock} className="btn-luxe h-11 rounded-sm px-5 text-xs uppercase tracking-[0.2em]">
                    <Plus className="h-4 w-4" /> Novo bloco
                  </Button>
                ) : (
                  <UpgradeModal feature="blocks">
                    <Button type="button" className="h-11 rounded-sm border border-gold/40 bg-card/40 px-5 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:bg-gradient-gold-soft hover:text-primary">
                      <Lock className="h-3.5 w-3.5" /> Limite Free atingido ({plan.limits.max_blocks})
                    </Button>
                  </UpgradeModal>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={blocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {blocks.map((b, i) => (
                    <BlockEditor
                      key={b.id}
                      block={viewBlock(b)}
                      hasDraft={b.has_draft}
                      isPublishing={publishingId === b.id}
                      categories={categories}
                      isFirst={i === 0}
                      isLast={i === blocks.length - 1}
                      onChange={(p) => updateBlock(b.id, p)}
                      onSave={() => saveBlock(b)}
                      onPublish={() => publishBlock(viewBlock(b))}
                      onDiscardDraft={() => discardDraft(b)}
                      onDelete={() => deleteBlock(b.id)}
                      onDuplicate={() => duplicateBlock(viewBlock(b))}
                      onMoveUp={() => move(i, -1)}
                      onMoveDown={() => move(i, 1)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {blocks.length === 0 && (
                <div className="rounded-sm border-gold-gradient bg-card/30 p-10 text-center">
                  <p className="font-display text-xl">Comece com um <span className="text-gold italic">template</span></p>
                  <p className="mx-auto mt-2 max-w-md text-sm font-light text-muted-foreground">
                    Escolha um nicho e ganhe categorias + 5 blocos prontos. Você ajusta as URLs e ativa um por um.
                  </p>
                  <div className="mt-5 flex justify-center gap-2">
                    <BioTemplatePicker onApplied={() => void load()} />
                    <Button
                      onClick={addBlock}
                      type="button"
                      className="h-11 rounded-sm border border-gold/40 bg-card/40 px-5 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:border-gold hover:text-primary"
                    >
                      ou criar do zero
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <CategoriesManager />
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
    </div>
  );
};

const Field = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div className={full ? "md:col-span-2" : ""}>
    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</label>
    {children}
  </div>
);

const BlockEditor = ({
  block, hasDraft, isPublishing, categories, onChange, onSave, onPublish, onDiscardDraft, onDelete, onDuplicate, onMoveUp, onMoveDown, isFirst, isLast,
}: {
  block: Block;
  hasDraft: boolean;
  isPublishing: boolean;
  categories: Category[];
  onChange: (p: Partial<Block>) => void;
  onSave: () => void;
  onPublish: () => void;
  onDiscardDraft: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : "auto" as const,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`min-w-0 overflow-hidden rounded-sm border p-3 sm:p-4 transition-all ${
        hasDraft
          ? "border-yellow-500/70 bg-yellow-500/[0.04]"
          : block.is_active
            ? "border-gold bg-card/60"
            : "border-border bg-card/30 opacity-60"
      } ${isDragging ? "shadow-2xl" : ""}`}
    >
      {hasDraft && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-sm border border-yellow-500/40 bg-yellow-500/5 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-yellow-500">
            <FileEdit className="h-3 w-3" /> rascunho não publicado
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDiscardDraft}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border px-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
            >
              <Undo2 className="h-3 w-3" /> Descartar
            </button>
            <Button
              type="button"
              onClick={onPublish}
              disabled={isPublishing}
              className="btn-luxe h-8 rounded-sm px-3 text-[10px] uppercase tracking-[0.2em]"
            >
              {isPublishing ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Send className="h-3 w-3" /> Publicar</>}
            </Button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="hidden cursor-grab touch-none rounded-sm border border-border p-1.5 text-muted-foreground hover:text-primary active:cursor-grabbing md:inline-flex"
            title="Arraste para reordenar"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <button onClick={onMoveUp} disabled={isFirst} className="rounded-sm border border-border p-1.5 text-muted-foreground hover:text-primary disabled:opacity-30">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="rounded-sm border border-border p-1.5 text-muted-foreground hover:text-primary disabled:opacity-30">
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">#{block.position}</span>
          <div className="ml-auto sm:hidden">
            <BlockMetricsBadge blockId={block.id} />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-2 sm:justify-end">
          <div className="hidden sm:block">
            <BlockMetricsBadge blockId={block.id} />
          </div>
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {block.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <Switch checked={block.is_active} onCheckedChange={(v) => onChange({ is_active: v })} />
          </label>
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            destaque
            <Switch checked={block.highlight} onCheckedChange={(v) => onChange({ highlight: v })} />
          </label>
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            cor original
            <Switch checked={block.use_brand_color} onCheckedChange={(v) => onChange({ use_brand_color: v })} />
          </label>
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <Field label="Tipo">
          <Select
            value={block.kind}
            onValueChange={(v) => {
              const k = KINDS.find((x) => x.v === v);
              onChange({ kind: v, icon: block.icon || k?.icon || "Link2" });
            }}
          >
            <SelectTrigger className="h-9 rounded-sm border-gold bg-input"><SelectValue /></SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => <SelectItem key={k.v} value={k.v}>{k.l}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Ícone (lucide)">
          <IconPicker
            value={block.icon}
            onChange={(name) => onChange({ icon: name })}
            iconUrl={block.icon_url}
            onIconUrlChange={(url) => onChange({ icon_url: url })}
            blockId={block.id}
            generationsUsed={block.icon_generations_count ?? 0}
            onGenerationsUsedChange={(n) => onChange({ icon_generations_count: n })}
          />
        </Field>
        <Field label="Label">
          <Input value={block.label} onChange={(e) => onChange({ label: e.target.value })} className="h-9 rounded-sm border-gold bg-input" />
        </Field>
        <Field label="Badge (opcional)">
          <Combobox
            value={block.badge ?? ""}
            onChange={(v) => onChange({ badge: v || null })}
            presets={["NOVO", "OFERTA", "EM BREVE", "ESGOTADO", "POPULAR", "GRÁTIS", "LIMITADO", "EXCLUSIVO"]}
            placeholder="Sem badge"
            customLabel="Usar badge personalizada"
          />
          {block.badge && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-card/40 px-2 py-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">prévia:</span>
              <span className="rounded-sm border border-gold bg-background/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                {block.badge}
              </span>
            </div>
          )}
        </Field>
        <Field label="Categoria">
          <Select
            value={block.category_id ?? "__none__"}
            onValueChange={(v) => onChange({ category_id: v === "__none__" ? null : v })}
          >
            <SelectTrigger className="h-9 rounded-sm border-gold bg-input"><SelectValue placeholder="Sem categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sem categoria</SelectItem>
              {categories.filter((c) => c.is_active).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Não está aqui?{" "}
            <a href="#categorias" className="text-primary underline-offset-2 hover:underline">
              Gerencie a lista no card Categorias
            </a>
            .
          </p>
        </Field>
        <Field label="URL" full>
          <Input value={block.url} onChange={(e) => onChange({ url: e.target.value })} placeholder="https:// ou /rota interna" className="h-9 rounded-sm border-gold bg-input" />
        </Field>
        <Field label="Descrição (opcional)" full>
          <Input value={block.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} className="h-9 rounded-sm border-gold bg-input" />
        </Field>
      </div>

      <div className="mt-3 flex justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onDelete} className="inline-flex h-9 items-center gap-2 rounded-sm border border-destructive/40 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-destructive hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </button>
          <button onClick={onDuplicate} className="inline-flex h-9 items-center gap-2 rounded-sm border border-gold/40 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:border-gold hover:text-primary">
            <Copy className="h-3.5 w-3.5" /> Duplicar
          </button>
        </div>
        <Button onClick={onSave} className="btn-luxe h-9 rounded-sm px-5 text-[11px] font-semibold uppercase tracking-[0.18em]">
          <Save className="h-3.5 w-3.5" /> Salvar bloco
        </Button>
      </div>
      <CampaignManager blockId={block.id} blockLabel={block.label} />
    </div>
  );
};

export default Admin;