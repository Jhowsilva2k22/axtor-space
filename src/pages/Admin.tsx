import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, ArrowUp, ArrowDown, LogOut, ExternalLink, Eye, EyeOff, BarChart3, GripVertical } from "lucide-react";
import { Upload } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IconPicker } from "@/components/IconPicker";
import { BlockMetricsBadge } from "@/components/BlockMetricsBadge";
import { CampaignManager } from "@/components/CampaignManager";
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
  const [cfg, setCfg] = useState<BioConfig | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cfgDirty, setCfgDirty] = useState(false);
  const [dirtyBlocks, setDirtyBlocks] = useState<Set<string>>(new Set());
  const [savingAll, setSavingAll] = useState(false);

  const load = async () => {
    const [{ data: c }, { data: b }] = await Promise.all([
      supabase.from("bio_config").select("*").eq("singleton", true).maybeSingle(),
      supabase.from("bio_blocks").select("*").order("position", { ascending: true }),
    ]);
    setCfg(c as any);
    setBlocks((b as any) ?? []);
    setCfgDirty(false);
    setDirtyBlocks(new Set());
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center grain">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;

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

  const updateBlock = (id: string, patch: Partial<Block>) => {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    setDirtyBlocks((s) => {
      const n = new Set(s);
      n.add(id);
      return n;
    });
  };

  const saveBlock = async (b: Block) => {
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
      })
      .eq("id", b.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Bloco salvo");
      setDirtyBlocks((s) => {
        const n = new Set(s);
        n.delete(b.id);
        return n;
      });
    }
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
          })
          .eq("id", cfg.id),
      );
    }
    const dirtyList = blocks.filter((b) => dirtyBlocks.has(b.id));
    for (const b of dirtyList) {
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
          })
          .eq("id", b.id),
      );
    }
    const results = await Promise.all(tasks);
    setSavingAll(false);
    const failed = results.filter((r: any) => r?.error).length;
    if (failed > 0) {
      toast.error(`${failed} alteração(ões) falharam`);
    } else {
      toast.success(`Tudo salvo (${tasks.length} alteração${tasks.length === 1 ? "" : "ões"})`);
      setCfgDirty(false);
      setDirtyBlocks(new Set());
    }
  };

  const totalDirty = (cfgDirty ? 1 : 0) + dirtyBlocks.size;

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
            <ThemeToggle />
            <Link to="/admin/analytics" className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
              Analytics <BarChart3 className="h-3.5 w-3.5" />
            </Link>
            <Link to="/bio" target="_blank" className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft">
              Ver bio <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button onClick={signOut} className="inline-flex h-10 items-center gap-2 rounded-sm border border-border bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
              Sair <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {loading || !cfg ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <main className="mx-auto max-w-5xl space-y-12 px-6 py-10">
          {/* Cabeçalho da bio */}
          <section className="rounded-sm border-gold-gradient p-6">
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
                <Input value={cfg.footer_text ?? ""} onChange={(e) => updateCfg({ footer_text: e.target.value })} className="h-11 rounded-sm border-gold bg-input" />
              </Field>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={saveCfg} disabled={saving} className="btn-luxe h-11 rounded-sm px-6 text-xs uppercase tracking-[0.2em]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar cabeçalho</>}
              </Button>
            </div>
          </section>

          {/* Blocos */}
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl">Blocos da bio</h2>
              <Button onClick={addBlock} className="btn-luxe h-11 rounded-sm px-5 text-xs uppercase tracking-[0.2em]">
                <Plus className="h-4 w-4" /> Novo bloco
              </Button>
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
                      block={b}
                      isFirst={i === 0}
                      isLast={i === blocks.length - 1}
                      onChange={(p) => updateBlock(b.id, p)}
                      onSave={() => saveBlock(b)}
                      onDelete={() => deleteBlock(b.id)}
                      onMoveUp={() => move(i, -1)}
                      onMoveDown={() => move(i, 1)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {blocks.length === 0 && (
                <p className="rounded-sm border-gold-gradient p-8 text-center text-sm text-muted-foreground">
                  Nenhum bloco ainda. Clique em "Novo bloco" pra começar.
                </p>
              )}
            </div>
          </section>
        </main>
      )}

      {totalDirty > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-6">
          <div className="pointer-events-auto flex items-center gap-4 rounded-sm border-gold-gradient bg-background/95 px-5 py-3 shadow-2xl backdrop-blur">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {totalDirty} alteração{totalDirty === 1 ? "" : "ões"} pendente{totalDirty === 1 ? "" : "s"}
            </span>
            <Button
              onClick={saveAll}
              disabled={savingAll}
              className="btn-luxe h-10 rounded-sm px-5 text-[11px] uppercase tracking-[0.2em]"
            >
              {savingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar tudo</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div className={full ? "md:col-span-2" : ""}>
    <label className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</label>
    {children}
  </div>
);

const BlockEditor = ({
  block, onChange, onSave, onDelete, onMoveUp, onMoveDown, isFirst, isLast,
}: {
  block: Block;
  onChange: (p: Partial<Block>) => void;
  onSave: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  return (
    <div className={`rounded-sm border p-5 transition-all ${block.is_active ? "border-gold bg-card/60" : "border-border bg-card/30 opacity-60"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={onMoveUp} disabled={isFirst} className="rounded-sm border border-border p-1.5 text-muted-foreground hover:text-primary disabled:opacity-30">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="rounded-sm border border-border p-1.5 text-muted-foreground hover:text-primary disabled:opacity-30">
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <span className="ml-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">#{block.position}</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <BlockMetricsBadge blockId={block.id} />
          <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {block.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <Switch checked={block.is_active} onCheckedChange={(v) => onChange({ is_active: v })} />
          </label>
          <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            destaque
            <Switch checked={block.highlight} onCheckedChange={(v) => onChange({ highlight: v })} />
          </label>
          <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            cor original
            <Switch checked={block.use_brand_color} onCheckedChange={(v) => onChange({ use_brand_color: v })} />
          </label>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="Tipo">
          <Select
            value={block.kind}
            onValueChange={(v) => {
              const k = KINDS.find((x) => x.v === v);
              onChange({ kind: v, icon: block.icon || k?.icon || "Link2" });
            }}
          >
            <SelectTrigger className="h-11 rounded-sm border-gold bg-input"><SelectValue /></SelectTrigger>
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
          <Input value={block.label} onChange={(e) => onChange({ label: e.target.value })} className="h-11 rounded-sm border-gold bg-input" />
        </Field>
        <Field label="Badge (opcional)">
          <Input value={block.badge ?? ""} onChange={(e) => onChange({ badge: e.target.value })} placeholder="novo, popular, afiliado..." className="h-11 rounded-sm border-gold bg-input" />
        </Field>
        <Field label="URL" full>
          <Input value={block.url} onChange={(e) => onChange({ url: e.target.value })} placeholder="https:// ou /rota interna" className="h-11 rounded-sm border-gold bg-input" />
        </Field>
        <Field label="Descrição (opcional)" full>
          <Input value={block.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} className="h-11 rounded-sm border-gold bg-input" />
        </Field>
      </div>

      <div className="mt-5 flex justify-between">
        <button onClick={onDelete} className="inline-flex h-10 items-center gap-2 rounded-sm border border-destructive/40 px-4 text-[10px] uppercase tracking-[0.2em] text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5" /> Excluir
        </button>
        <Button onClick={onSave} className="btn-luxe h-10 rounded-sm px-5 text-[10px] uppercase tracking-[0.2em]">
          <Save className="h-3.5 w-3.5" /> Salvar bloco
        </Button>
      </div>
      <CampaignManager blockId={block.id} />
    </div>
  );
};

export default Admin;