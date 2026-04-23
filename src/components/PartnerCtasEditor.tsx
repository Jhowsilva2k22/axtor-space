import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Megaphone } from "lucide-react";
import { toast } from "sonner";

type PartnerRow = {
  id: string;
  utm_source: string;
  bio_url: string | null;
  instagram_handle: string | null;
  whatsapp_number: string | null;
  whatsapp_message: string | null;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
};

type Props = {
  tenantId: string;
  slug: string;
};

const ORIGIN = typeof window !== "undefined" ? window.location.origin : "https://axtor.space";

export const PartnerCtasEditor = ({ tenantId, slug }: Props) => {
  const [row, setRow] = useState<PartnerRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bio_url: "",
    instagram_handle: "",
    whatsapp_number: "",
    whatsapp_message: "",
    secondary_cta_label: "",
    secondary_cta_url: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("landing_partners")
        .select("id,utm_source,bio_url,instagram_handle,whatsapp_number,whatsapp_message,secondary_cta_label,secondary_cta_url")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setRow(data as PartnerRow);
        setForm({
          bio_url: data.bio_url ?? `${ORIGIN}/${slug}`,
          instagram_handle: (data.instagram_handle ?? "").replace(/^@+/, ""),
          whatsapp_number: data.whatsapp_number ?? "",
          whatsapp_message: data.whatsapp_message ?? "",
          secondary_cta_label: data.secondary_cta_label ?? "",
          secondary_cta_url: data.secondary_cta_url ?? "",
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId, slug]);

  if (loading) {
    return (
      <Card className="border-gold p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (!row) return null;

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("landing_partners")
      .update({
        bio_url: form.bio_url.trim() || null,
        instagram_handle: form.instagram_handle.trim().replace(/^@+/, "") || null,
        whatsapp_number: form.whatsapp_number.replace(/\D/g, "") || null,
        whatsapp_message: form.whatsapp_message.trim() || null,
        secondary_cta_label: form.secondary_cta_label.trim() || null,
        secondary_cta_url: form.secondary_cta_url.trim() || null,
      })
      .eq("id", row.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("destinos salvos");
  };

  return (
    <Card className="border-gold p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-gold/40 bg-gradient-gold-soft text-primary">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg">
            Onde mandar meus <span className="text-gold italic">leads</span> do diagnóstico
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Esses são os links que aparecem pro lead no fim do diagnóstico que ele fez vindo do seu UTM{" "}
            <span className="rounded-sm border border-gold/40 bg-gradient-gold-soft px-2 py-0.5 font-mono text-[10px] text-primary">
              {row.utm_source}
            </span>
            . Tudo opcional — sem preencher cai no padrão (sua bio).
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">URL da minha bio</label>
          <Input
            value={form.bio_url}
            onChange={(e) => setForm((f) => ({ ...f, bio_url: e.target.value }))}
            placeholder={`${ORIGIN}/${slug}`}
            className="mt-1 h-11 rounded-sm border-gold bg-input"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Meu @ do Instagram</label>
          <Input
            value={form.instagram_handle}
            onChange={(e) => setForm((f) => ({ ...f, instagram_handle: e.target.value }))}
            placeholder="seuusuario"
            className="mt-1 h-11 rounded-sm border-gold bg-input"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">WhatsApp (com DDI)</label>
          <Input
            value={form.whatsapp_number}
            onChange={(e) => setForm((f) => ({ ...f, whatsapp_number: e.target.value }))}
            placeholder="5511999999999"
            className="mt-1 h-11 rounded-sm border-gold bg-input"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Mensagem padrão do WhatsApp</label>
          <Textarea
            value={form.whatsapp_message}
            onChange={(e) => setForm((f) => ({ ...f, whatsapp_message: e.target.value }))}
            placeholder="Oi! Acabei de ver seu diagnóstico e quero entender melhor."
            rows={2}
            className="mt-1 rounded-sm border-gold bg-input"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Botão extra · Texto</label>
          <Input
            value={form.secondary_cta_label}
            onChange={(e) => setForm((f) => ({ ...f, secondary_cta_label: e.target.value }))}
            placeholder="Agende uma call"
            className="mt-1 h-11 rounded-sm border-gold bg-input"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Botão extra · URL</label>
          <Input
            value={form.secondary_cta_url}
            onChange={(e) => setForm((f) => ({ ...f, secondary_cta_url: e.target.value }))}
            placeholder="https://calendly.com/..."
            className="mt-1 h-11 rounded-sm border-gold bg-input"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button onClick={save} disabled={saving} className="btn-luxe h-11 rounded-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} salvar destinos
        </Button>
      </div>
    </Card>
  );
};

export default PartnerCtasEditor;