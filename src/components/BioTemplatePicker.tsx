import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Sparkles, Check } from "lucide-react";
import { BIO_TEMPLATES, type BioTemplate } from "@/lib/bioTemplates";

type Props = {
  tenantId: string;
  /** Variante visual do trigger. */
  variant?: "primary" | "ghost";
  /** Chamado após aplicar com sucesso, pra recarregar Admin. */
  onApplied?: () => void;
};

export const BioTemplatePicker = ({ tenantId, variant = "primary", onApplied }: Props) => {
  const [open, setOpen] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);

  const apply = async (tpl: BioTemplate) => {
    if (
      !confirm(
        `Aplicar template "${tpl.name}"?\n\nIsso vai criar ${tpl.categories.length} categorias e ${tpl.blocks.length} blocos no seu painel. Os blocos virão como rascunho (não publicados) — você revisa as URLs e ativa um por um.`,
      )
    )
      return;

    setApplying(tpl.id);
    try {
      // 1. Atualiza headline da bio (somente se vazia/padrão? — sempre atualiza pra dar consistência)
      await supabase
        .from("bio_config")
        .update({
          headline: tpl.headline,
          sub_headline: tpl.sub_headline ?? null,
        })
        .eq("singleton", true);

      // 2. Cria categorias e mapeia slug → id
      const slugToId: Record<string, string> = {};
      for (let i = 0; i < tpl.categories.length; i++) {
        const c = tpl.categories[i];
        const { data, error } = await supabase
          .from("bio_categories")
          .insert({
            tenant_id: tenantId,
            name: c.name,
            slug: `${c.slug}-${Date.now().toString(36).slice(-4)}`,
            icon: c.icon ?? null,
            position: i,
            is_active: true,
          })
          .select("id")
          .single();
        if (error) throw error;
        slugToId[c.slug] = (data as { id: string }).id;
      }

      // 3. Cria blocos como rascunho (is_active: false) pra usuário revisar URLs
      for (let i = 0; i < tpl.blocks.length; i++) {
        const b = tpl.blocks[i];
        const { error } = await supabase.from("bio_blocks").insert({
          tenant_id: tenantId,
          kind: b.kind,
          label: b.label,
          description: b.description ?? null,
          url: b.url,
          icon: b.icon,
          badge: b.badge ?? null,
          highlight: b.highlight ?? false,
          use_brand_color: b.use_brand_color ?? false,
          category_id: b.category_slug ? slugToId[b.category_slug] ?? null : null,
          position: i,
          is_active: false,
        });
        if (error) throw error;
      }

      toast.success(`Template "${tpl.name}" aplicado · revise as URLs e ative os blocos`);
      setOpen(false);
      onApplied?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível aplicar o template");
    } finally {
      setApplying(null);
    }
  };

  const triggerClass =
    variant === "primary"
      ? "btn-luxe h-11 rounded-sm px-5 text-xs uppercase tracking-[0.2em]"
      : "h-9 rounded-sm border border-gold/40 bg-card/40 px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:border-gold hover:text-primary";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className={triggerClass}>
          <Sparkles className="h-4 w-4" /> Usar template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto rounded-sm border-gold bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Escolha um <span className="text-gold italic">template</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Cria categorias + blocos prontos. Os blocos virão como rascunho — você ajusta URLs e ativa.
          </p>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {BIO_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-sm border-gold-gradient bg-background/30 p-5 transition hover:border-gold"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl">{tpl.emoji}</p>
                  <h3 className="mt-1 font-display text-lg">{tpl.name}</h3>
                </div>
                <span className="rounded-sm border border-gold/40 bg-gradient-gold-soft px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                  {tpl.blocks.length} blocos
                </span>
              </div>
              <p className="mb-4 text-xs font-light text-muted-foreground">{tpl.description}</p>
              <ul className="mb-4 space-y-1">
                {tpl.categories.map((c) => (
                  <li key={c.slug} className="flex items-center gap-2 text-[11px] text-muted-foreground/80">
                    <Check className="h-3 w-3 text-primary" /> {c.name}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                disabled={applying !== null}
                onClick={() => apply(tpl)}
                className="btn-luxe h-9 w-full rounded-sm text-[11px] uppercase tracking-[0.2em]"
              >
                {applying === tpl.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>Aplicar template</>
                )}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BioTemplatePicker;