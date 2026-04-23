import { useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, FolderOpen, ArrowUp, ArrowDown, Sparkles, Settings2, Check } from "lucide-react";
import { IconPicker } from "@/components/IconPicker";

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  position: number;
  is_active: boolean;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

const PRESETS: { name: string; slug: string; icon: string }[] = [
  { name: "Redes sociais", slug: "redes-sociais", icon: "Share2" },
  { name: "Contato", slug: "contato", icon: "MessageCircle" },
  { name: "Produtos", slug: "produtos", icon: "ShoppingBag" },
  { name: "Serviços", slug: "servicos", icon: "Briefcase" },
  { name: "Cursos & E-books", slug: "cursos-ebooks", icon: "BookOpen" },
  { name: "Afiliados", slug: "afiliados", icon: "Tag" },
  { name: "Mídia & Imprensa", slug: "midia", icon: "Newspaper" },
  { name: "Portfólio", slug: "portfolio", icon: "Image" },
  { name: "Agenda", slug: "agenda", icon: "Calendar" },
  { name: "Comunidade", slug: "comunidade", icon: "Users" },
  { name: "Newsletter", slug: "newsletter", icon: "Mail" },
  { name: "Apoio / Pix", slug: "apoio", icon: "Heart" },
];

const PresetIcon = ({ name }: { name: string }) => {
  const Comp = (LucideIcons as any)[name] || LucideIcons.Link2;
  return <Comp className="h-3.5 w-3.5" />;
};

export const CategoriesManager = ({ tenantId }: { tenantId: string }) => {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState<Record<string, boolean>>({});

  const load = async () => {
    if (!tenantId) return;
    const { data, error } = await supabase
      .from("bio_categories")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("position", { ascending: true });
    if (error) toast.error(error.message);
    setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const create = async () => {
    setCreating(true);
    const nextPos = (items[items.length - 1]?.position ?? 0) + 1;
    const base = "categoria";
    let slug = base;
    let n = 1;
    while (items.some((i) => i.slug === slug)) {
      n += 1;
      slug = `${base}-${n}`;
    }
    const { data, error } = await supabase
      .from("bio_categories")
      .insert({ name: "Nova categoria", slug, position: nextPos, tenant_id: tenantId })
      .select()
      .single();
    setCreating(false);
    if (error) return toast.error(error.message);
    setItems((s) => [...s, data as any]);
  };

  const addPreset = async (preset: { name: string; slug: string; icon: string }) => {
    // Slug sempre único por timestamp curto — permite adicionar a mesma categoria
    // quantas vezes o dono quiser (ex: 2 categorias de "Contato" pra públicos diferentes).
    const exists = items.some((i) => i.slug === preset.slug || i.slug.startsWith(`${preset.slug}-`));
    const slug = exists ? `${preset.slug}-${Date.now().toString(36).slice(-4)}` : preset.slug;
    const nextPos = (items[items.length - 1]?.position ?? 0) + 1;
    const { data, error } = await supabase
      .from("bio_categories")
      .insert({ name: preset.name, slug, icon: preset.icon, position: nextPos, tenant_id: tenantId })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setItems((s) => [...s, data as any]);
    toast.success(`"${preset.name}" adicionada`);
  };

  const update = async (id: string, patch: Partial<Category>) => {
    setItems((s) => s.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const { error } = await supabase
      .from("bio_categories")
      .update(patch)
      .eq("id", id)
      .eq("tenant_id", tenantId);
    if (error) toast.error(error.message);
  };

  const updateName = async (id: string, name: string) => {
    const current = items.find((c) => c.id === id);
    if (!current) return;
    // Auto-regen slug se ainda for o slug autogerado (ou vazio)
    const autoSlug = slugify(name) || current.slug;
    const looksAuto = current.slug === slugify(current.name);
    const patch: Partial<Category> = { name };
    if (looksAuto && !items.some((i) => i.id !== id && i.slug === autoSlug)) {
      patch.slug = autoSlug;
    }
    await update(id, patch);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir essa categoria? Os blocos associados ficarão sem categoria.")) return;
    const { error } = await supabase
      .from("bio_categories")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);
    if (error) return toast.error(error.message);
    setItems((s) => s.filter((c) => c.id !== id));
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[idx], b = items[j];
    const reordered = [...items];
    reordered[idx] = { ...b, position: a.position };
    reordered[j] = { ...a, position: b.position };
    setItems(reordered);
    await Promise.all([
      supabase.from("bio_categories").update({ position: b.position }).eq("id", a.id).eq("tenant_id", tenantId),
      supabase.from("bio_categories").update({ position: a.position }).eq("id", b.id).eq("tenant_id", tenantId),
    ]);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <section id="categorias" className="rounded-sm border-gold-gradient p-6 scroll-mt-24">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-2xl">
            <FolderOpen className="mr-2 inline-block h-5 w-5 text-primary" />
            Categorias
          </h2>
          <Button onClick={create} disabled={creating} className="btn-luxe h-10 rounded-sm px-4 text-[10px] uppercase tracking-[0.2em]">
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> Nova</>}
          </Button>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Categorias agrupam seus blocos em seções na sua bio pública (ex: <span className="text-primary">Redes sociais</span>, <span className="text-primary">Produtos</span>, <span className="text-primary">Cursos</span>). Cada bloco pode pertencer a uma categoria — ou ficar avulso.
        </p>

        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhuma categoria. Adicione uma das prontas abaixo ou clique em "Nova".
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((c, i) => {
              const IconComp = (c.icon && (LucideIcons as any)[c.icon]) || LucideIcons.FolderOpen;
              const isAdv = !!advancedOpen[c.id];
              return (
                <div key={c.id} className="rounded-sm border border-gold/40 bg-card/40 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-sm border border-border p-1.5 text-muted-foreground hover:text-primary disabled:opacity-30">
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="rounded-sm border border-border p-1.5 text-muted-foreground hover:text-primary disabled:opacity-30">
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-gold/40 bg-background/40 text-primary">
                      <IconComp className="h-4 w-4" />
                    </div>

                    <Input
                      value={c.name}
                      onChange={(e) => updateName(c.id, e.target.value)}
                      placeholder="Nome da categoria"
                      className="h-9 flex-1 min-w-[160px] rounded-sm border-gold/40 bg-input text-sm"
                    />

                    <div className="w-[180px]">
                      <IconPicker
                        value={c.icon ?? null}
                        onChange={(name) => update(c.id, { icon: name })}
                      />
                    </div>

                    <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      ativa
                      <Switch checked={c.is_active} onCheckedChange={(v) => update(c.id, { is_active: v })} />
                    </label>

                    <button onClick={() => remove(c.id)} className="rounded-sm border border-destructive/40 p-2 text-destructive hover:bg-destructive/10" title="Excluir">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <Collapsible open={isAdv} onOpenChange={(v) => setAdvancedOpen((s) => ({ ...s, [c.id]: v }))}>
                    <CollapsibleTrigger className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
                      <Settings2 className="h-3 w-3" />
                      {isAdv ? "ocultar avançado" : "avançado"}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="rounded-sm border border-border/60 bg-background/30 p-2">
                        <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          slug (identificador técnico — gerado automaticamente)
                        </label>
                        <Input
                          value={c.slug}
                          onChange={(e) => update(c.id, { slug: slugify(e.target.value) || c.slug })}
                          placeholder="slug"
                          className="h-8 w-full max-w-xs rounded-sm border-gold/40 bg-input font-mono text-xs"
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        )}

        {/* Presets — adicione com 1 clique */}
        <div className="mt-6 rounded-sm border border-gold/30 bg-card/30 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Adicionar pronta — 1 clique
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const exists = items.some((i) => i.slug === p.slug || i.name.toLowerCase() === p.name.toLowerCase());
              const btn = (
                <button
                  key={p.slug}
                  onClick={() => !exists && addPreset(p)}
                  disabled={exists}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-sm border px-3 text-[10px] uppercase tracking-[0.2em] transition-all ${
                    exists
                      ? "cursor-not-allowed border-gold/30 bg-gradient-gold-soft/40 text-primary/70"
                      : "border-gold/40 bg-card/40 text-primary hover:border-gold hover:bg-gradient-gold-soft"
                  }`}
                >
                  {exists ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  <PresetIcon name={p.icon} />
                  {p.name}
                </button>
              );
              return (
                <Tooltip key={p.slug}>
                  <TooltipTrigger asChild>
                    <span>{btn}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {exists ? "Já está na sua lista" : `Adicionar "${p.name}"`}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
};

export default CategoriesManager;
