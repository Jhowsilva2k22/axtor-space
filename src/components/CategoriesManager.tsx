import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, FolderOpen, ArrowUp, ArrowDown, Sparkles } from "lucide-react";

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

// Categorias prontas pra usar com 1 clique
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

export const CategoriesManager = () => {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("bio_categories")
      .select("*")
      .order("position", { ascending: true });
    if (error) toast.error(error.message);
    setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

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
      .insert({ name: "Nova categoria", slug, position: nextPos })
      .select()
      .single();
    setCreating(false);
    if (error) return toast.error(error.message);
    setItems((s) => [...s, data as any]);
  };

  const update = async (id: string, patch: Partial<Category>) => {
    setItems((s) => s.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const { error } = await supabase.from("bio_categories").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir essa categoria? Os blocos associados ficarão sem categoria.")) return;
    const { error } = await supabase.from("bio_categories").delete().eq("id", id);
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
      supabase.from("bio_categories").update({ position: b.position }).eq("id", a.id),
      supabase.from("bio_categories").update({ position: a.position }).eq("id", b.id),
    ]);
  };

  return (
    <section className="rounded-sm border-gold-gradient p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl">
          <FolderOpen className="mr-2 inline-block h-5 w-5 text-primary" />
          Categorias
        </h2>
        <Button onClick={create} disabled={creating} className="btn-luxe h-10 rounded-sm px-4 text-[10px] uppercase tracking-[0.2em]">
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> Nova</>}
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhuma categoria. Crie pelo menos uma para mostrar filtros na /bio.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((c, i) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-sm border border-gold/40 bg-card/40 p-3">
              <div className="flex items-center gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-sm border border-border p-1.5 text-muted-foreground hover:text-primary disabled:opacity-30">
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="rounded-sm border border-border p-1.5 text-muted-foreground hover:text-primary disabled:opacity-30">
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>
              <Input
                value={c.name}
                onChange={(e) => update(c.id, { name: e.target.value })}
                placeholder="Nome"
                className="h-9 flex-1 min-w-[160px] rounded-sm border-gold/40 bg-input text-sm"
              />
              <Input
                value={c.slug}
                onChange={(e) => update(c.id, { slug: slugify(e.target.value) || c.slug })}
                placeholder="slug"
                className="h-9 w-32 rounded-sm border-gold/40 bg-input font-mono text-xs"
              />
              <Input
                value={c.icon ?? ""}
                onChange={(e) => update(c.id, { icon: e.target.value || null })}
                placeholder="Ícone (lucide)"
                className="h-9 w-32 rounded-sm border-gold/40 bg-input text-xs"
              />
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                ativa
                <Switch checked={c.is_active} onCheckedChange={(v) => update(c.id, { is_active: v })} />
              </label>
              <button onClick={() => remove(c.id)} className="rounded-sm border border-destructive/40 p-2 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default CategoriesManager;