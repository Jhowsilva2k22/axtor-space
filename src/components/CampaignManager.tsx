import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Copy, Loader2, Plus, Trash2, Megaphone } from "lucide-react";

type Campaign = {
  id: string;
  block_id: string;
  slug: string;
  label: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  is_active: boolean;
  clicks_count: number;
};

function makeSlug(): string {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export const CampaignManager = ({ blockId }: { blockId: string }) => {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("bio_block_campaigns")
      .select("*")
      .eq("block_id", blockId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (open && loading) load();
  }, [open]);

  const create = async () => {
    setCreating(true);
    const slug = makeSlug();
    const { data, error } = await supabase
      .from("bio_block_campaigns")
      .insert({
        block_id: blockId,
        slug,
        label: "Nova campanha",
        utm_source: "",
        utm_medium: "",
        utm_campaign: "",
      })
      .select()
      .single();
    setCreating(false);
    if (error) return toast.error(error.message);
    setItems((s) => [data as any, ...s]);
  };

  const update = async (id: string, patch: Partial<Campaign>) => {
    setItems((s) => s.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const { error } = await supabase.from("bio_block_campaigns").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir essa campanha?")) return;
    const { error } = await supabase.from("bio_block_campaigns").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((s) => s.filter((c) => c.id !== id));
  };

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/r/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <div className="mt-5 rounded-sm border border-gold/30 bg-background/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-primary"
      >
        <span className="inline-flex items-center gap-2">
          <Megaphone className="h-3.5 w-3.5 text-primary" />
          Campanhas <span className="text-foreground">({items.length || (loading && open ? "…" : "0")})</span>
        </span>
        <span className="text-primary">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="border-t border-gold/20 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {items.length === 0 && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Nenhuma campanha. Crie uma para gerar links com UTMs próprias.
                </p>
              )}
              <div className="space-y-3">
                {items.map((c) => (
                  <div key={c.id} className="rounded-sm border border-gold/40 bg-card/40 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <code className="rounded-sm bg-background/60 px-2 py-0.5 text-[10px] text-primary">
                          /r/{c.slug}
                        </code>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {c.clicks_count} cliques
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          ativa
                          <Switch
                            checked={c.is_active}
                            onCheckedChange={(v) => update(c.id, { is_active: v })}
                          />
                        </label>
                        <button
                          onClick={() => copyLink(c.slug)}
                          className="inline-flex h-8 items-center gap-1 rounded-sm border border-gold/40 px-2 text-[10px] uppercase tracking-[0.2em] text-primary hover:bg-gradient-gold-soft"
                        >
                          <Copy className="h-3 w-3" /> copiar
                        </button>
                        <button
                          onClick={() => remove(c.id)}
                          className="inline-flex h-8 items-center justify-center rounded-sm border border-destructive/40 px-2 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <FieldSm label="Rótulo">
                        <Input
                          value={c.label}
                          onChange={(e) => update(c.id, { label: e.target.value })}
                          className="h-9 rounded-sm border-gold/40 bg-input text-xs"
                          placeholder="ex: Stories 22/04"
                        />
                      </FieldSm>
                      <FieldSm label="Slug">
                        <Input
                          value={c.slug}
                          onChange={(e) => update(c.id, { slug: slugify(e.target.value) || c.slug })}
                          className="h-9 rounded-sm border-gold/40 bg-input text-xs font-mono"
                        />
                      </FieldSm>
                      <FieldSm label="utm_source">
                        <Input
                          value={c.utm_source ?? ""}
                          onChange={(e) => update(c.id, { utm_source: e.target.value })}
                          className="h-9 rounded-sm border-gold/40 bg-input text-xs"
                          placeholder="instagram"
                        />
                      </FieldSm>
                      <FieldSm label="utm_medium">
                        <Input
                          value={c.utm_medium ?? ""}
                          onChange={(e) => update(c.id, { utm_medium: e.target.value })}
                          className="h-9 rounded-sm border-gold/40 bg-input text-xs"
                          placeholder="stories"
                        />
                      </FieldSm>
                      <FieldSm label="utm_campaign" full>
                        <Input
                          value={c.utm_campaign ?? ""}
                          onChange={(e) => update(c.id, { utm_campaign: e.target.value })}
                          className="h-9 rounded-sm border-gold/40 bg-input text-xs"
                          placeholder="lancamento-04"
                        />
                      </FieldSm>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  onClick={create}
                  disabled={creating}
                  className="btn-luxe h-9 rounded-sm px-4 text-[10px] uppercase tracking-[0.2em]"
                >
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> Nova campanha</>}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const FieldSm = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div className={full ? "md:col-span-2" : ""}>
    <label className="mb-1 block text-[9px] uppercase tracking-[0.25em] text-muted-foreground">{label}</label>
    {children}
  </div>
);

export default CampaignManager;