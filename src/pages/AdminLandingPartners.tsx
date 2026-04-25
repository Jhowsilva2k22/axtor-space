import { useEffect, useState, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle, useAdminLockedTheme } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, ChevronUp, Copy, Loader2, Plus, Save, Trash2 } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type PartnerRow = {
  id: string;
  tenant_id: string;
  utm_source: string;
  note: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  bio_url: string | null;
  instagram_handle: string | null;
  whatsapp_number: string | null;
  whatsapp_message: string | null;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
  tenants?: { slug: string; display_name: string } | null;
};

type TenantOpt = { id: string; slug: string; display_name: string };

const ORIGIN = typeof window !== "undefined" ? window.location.origin : "https://axtor.space";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);

const AdminLandingPartners = () => {
  useAdminLockedTheme();
  const { isAdmin, loading: authLoading } = useAuth();

  const [items, setItems] = useState<PartnerRow[]>([]);
  const [tenants, setTenants] = useState<TenantOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: rows }, { data: ts }] = await Promise.all([
      (supabase as any)
        .from("landing_partners")
        .select("id,tenant_id,utm_source,note,priority,is_active,created_at,bio_url,instagram_handle,whatsapp_number,whatsapp_message,secondary_cta_label,secondary_cta_url,tenants:tenants(slug,display_name)")
        .order("created_at", { ascending: false }),
      supabase.from("tenants").select("id,slug,display_name").eq("status", "active").order("display_name"),
    ]);
    setItems((rows as PartnerRow[] | null) ?? []);
    setTenants((ts as TenantOpt[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    void load();
  }, [authLoading, isAdmin]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/admin" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenantId || !utmSource.trim()) {
      toast.error("escolha o tenant e defina o UTM source");
      return;
    }
    const utm = slugify(utmSource);
    if (!utm) {
      toast.error("UTM inválido — use só letras, números e hífen");
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).from("landing_partners").insert({
      tenant_id: tenantId,
      utm_source: utm,
      note: note.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") toast.error("esse utm_source já existe");
      else toast.error(error.message);
      return;
    }
    toast.success("parceiro adicionado");
    setTenantId("");
    setUtmSource("");
    setNote("");
    void load();
  };

  const toggleActive = async (id: string, next: boolean) => {
    const { error } = await (supabase as any)
      .from("landing_partners").update({ is_active: next }).eq("id", id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: next } : p)));
  };

  const remove = async (id: string) => {
    if (!confirm("remover esse parceiro? leads novos com esse UTM voltam pro tenant default.")) return;
    const { error } = await (supabase as any).from("landing_partners").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast.success("parceiro removido");
  };

  const copyLink = async (utm: string) => {
    const url = `${ORIGIN}/?utm_source=${encodeURIComponent(utm)}&utm_medium=instagram`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("link copiado");
    } catch {
      toast.error("copie manualmente");
    }
  };

  const saveCtas = async (id: string, patch: Partial<PartnerRow>): Promise<void> => {
    const { error } = await (supabase as any).from("landing_partners").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    toast.success("destinos salvos");
  };

  return (
    <div className="relative min-h-screen grain overflow-x-hidden">
      <div className="aurora-a" />
      <div className="aurora-b" />
      <ThemeToggle className="absolute right-5 top-5 z-20" />
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-10">
        <Link to="/admin" className="inline-flex h-10 items-center gap-2 rounded-full border border-gold/20 bg-card/40 px-5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-all hover:bg-gold/10 hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> voltar
        </Link>
        <h1 className="font-display text-3xl">
          Parceiros da <span className="text-gold italic text-shadow-gold">landing</span>
        </h1>
        <div className="w-24" />
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 pb-16">
        <section className="rounded-sm border-gold-gradient p-6">
          <p className="text-sm text-muted-foreground">
            Cada parceiro recebe um <span className="text-primary">utm_source</span> único. Quando alguém acessa{" "}
            <span className="font-mono text-primary">{ORIGIN}/?utm_source=...</span>, o lead vai pro tenant do parceiro.
            Sem UTM (ou UTM desconhecido) = lead vai pro tenant principal.
          </p>
        </section>

        <section className="relative z-10 rounded-[32px] border border-gold/20 bg-card/40 p-8 backdrop-blur-xl shadow-2xl">
          <h2 className="font-display text-xl">Novo parceiro</h2>
          <form onSubmit={submit} className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">Tenant Proprietário</label>
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger className="h-12 rounded-full border-gold/20 bg-card/30 px-5 transition-all focus:border-gold/50">
                  <SelectValue placeholder="escolha o tenant" />
                </SelectTrigger>
                <SelectContent className="rounded-[24px] border-gold/20 bg-card/90 backdrop-blur-xl">
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.display_name} <span className="text-muted-foreground/60 text-[10px]">/ {t.slug}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">Código UTM source</label>
              <Input
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                placeholder="ex: stefany"
                className="h-12 rounded-full border-gold/20 bg-card/30 px-5 font-light transition-all focus:border-gold/50"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">Identificação Interna</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ex: Campanha Instagram"
                className="h-12 rounded-full border-gold/20 bg-card/30 px-5 font-light transition-all focus:border-gold/50"
              />
            </div>
            <div className="md:col-span-3 pt-2">
              <Button type="submit" disabled={submitting} className="btn-luxe h-12 w-full md:w-auto rounded-full px-10 text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-gold/10">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Cadastrar Parceiro
              </Button>
            </div>
          </form>
        </section>

        <section className="relative z-10 rounded-[32px] border border-gold/20 bg-card/40 p-8 backdrop-blur-xl shadow-2xl">
          <h2 className="font-display text-xl">Parceiros ativos</h2>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">nenhum parceiro cadastrado ainda.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {items.map((p) => (
                <PartnerRowItem
                  key={p.id}
                  partner={p}
                  onToggleActive={toggleActive}
                  onCopy={copyLink}
                  onRemove={remove}
                  onSaveCtas={saveCtas}
                />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminLandingPartners;

type RowItemProps = {
  partner: PartnerRow;
  onToggleActive: (id: string, next: boolean) => void;
  onCopy: (utm: string) => void;
  onRemove: (id: string) => void;
  onSaveCtas: (id: string, patch: Partial<PartnerRow>) => Promise<void>;
};

const PartnerRowItem = ({ partner: p, onToggleActive, onCopy, onRemove, onSaveCtas }: RowItemProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bio_url: p.bio_url ?? "",
    instagram_handle: (p.instagram_handle ?? "").replace(/^@+/, ""),
    whatsapp_number: p.whatsapp_number ?? "",
    whatsapp_message: p.whatsapp_message ?? "",
    secondary_cta_label: p.secondary_cta_label ?? "",
    secondary_cta_url: p.secondary_cta_url ?? "",
  });

  const captureUrl = `${ORIGIN}/?utm_source=${encodeURIComponent(p.utm_source)}&utm_medium=instagram`;
  const hasCtas =
    !!(p.bio_url || p.instagram_handle || p.whatsapp_number || p.secondary_cta_url);

  const save = async () => {
    setSaving(true);
    await onSaveCtas(p.id, {
      bio_url: form.bio_url.trim() || null,
      instagram_handle: form.instagram_handle.trim().replace(/^@+/, "") || null,
      whatsapp_number: form.whatsapp_number.replace(/\D/g, "") || null,
      whatsapp_message: form.whatsapp_message.trim() || null,
      secondary_cta_label: form.secondary_cta_label.trim() || null,
      secondary_cta_url: form.secondary_cta_url.trim() || null,
    });
    setSaving(false);
  };

  return (
    <li className="overflow-hidden rounded-[24px] border border-gold/20 bg-card/20 transition-all hover:bg-card/30">
      <div className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg">
              {p.tenants?.display_name ?? "(tenant)"}{" "}
              <span className="text-xs text-muted-foreground/60">/ {p.tenants?.slug}</span>
            </span>
            <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold">
              {p.utm_source}
            </span>
            {hasCtas && (
              <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                Configurado
              </span>
            )}
          </div>
          <div className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{captureUrl}</div>
          {p.note && <div className="mt-1 text-[11px] text-muted-foreground">{p.note}</div>}
           <div className="flex shrink-0 flex-wrap items-center gap-3 mt-4">
          <div className="flex items-center gap-3 rounded-full bg-white/5 px-4 py-2 transition-all hover:bg-white/10">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Ativo</span>
            <Switch checked={p.is_active} onCheckedChange={(v) => onToggleActive(p.id, v)} />
          </div>
          <Button variant="outline" size="sm" className="h-10 rounded-full border-gold/20 px-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-gold/10 hover:text-gold" onClick={() => setOpen((o) => !o)}>
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />} Destinos
          </Button>
          <Button variant="outline" size="sm" className="h-10 rounded-full border-gold/20 px-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-gold/10" onClick={() => onCopy(p.utm_source)}>
            <Copy className="h-3.5 w-3.5" /> copiar
          </Button>
          <Button variant="outline" size="sm" className="h-10 rounded-full border-destructive/20 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-destructive hover:bg-destructive/10" onClick={() => onRemove(p.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        </div>
      </div>

      {open && (
        <div className="space-y-6 border-t border-gold/10 bg-gold/5 p-8 backdrop-blur-md mt-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-gold" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Configuração dos Destinos do Lead</p>
          </div>
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            Personalize para onde o lead será enviado após o diagnóstico. Se deixar vazio, usaremos os dados padrão da sua Bio.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">URL da Bio / Site Principal</label>
              <Input
                value={form.bio_url}
                onChange={(e) => setForm((f) => ({ ...f, bio_url: e.target.value }))}
                placeholder={`${ORIGIN}/${p.tenants?.slug ?? ""}`}
                className="h-12 rounded-full border-gold/20 bg-background/40 px-5 font-light focus:border-gold/50"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">@ Instagram</label>
              <Input
                value={form.instagram_handle}
                onChange={(e) => setForm((f) => ({ ...f, instagram_handle: e.target.value }))}
                placeholder="usuario"
                className="h-12 rounded-full border-gold/20 bg-background/40 px-5 font-light focus:border-gold/50"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">WhatsApp (DDI+DDD+Número)</label>
              <Input
                value={form.whatsapp_number}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp_number: e.target.value }))}
                placeholder="5511999999999"
                className="h-12 rounded-full border-gold/20 bg-background/40 px-5 font-light focus:border-gold/50"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Mensagem Inicial do WhatsApp</label>
              <Textarea
                value={form.whatsapp_message}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp_message: e.target.value }))}
                rows={2}
                className="rounded-2xl border-gold/20 bg-background/40 p-4 font-light focus:border-gold/50"
                placeholder="Olá! Acabei de fazer o diagnóstico..."
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gold/80">Botão Extra (Título)</label>
              <Input
                value={form.secondary_cta_label}
                onChange={(e) => setForm((f) => ({ ...f, secondary_cta_label: e.target.value }))}
                placeholder="Ex: Agendar Call de Diagnóstico"
                className="h-12 rounded-full border-gold/30 bg-gold/5 px-5 font-bold focus:border-gold"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gold/80">Botão Extra (URL/Link)</label>
              <Input
                value={form.secondary_cta_url}
                onChange={(e) => setForm((f) => ({ ...f, secondary_cta_url: e.target.value }))}
                placeholder="https://calendly.com/sua-agenda"
                className="h-12 rounded-full border-gold/30 bg-gold/5 px-5 font-bold focus:border-gold"
              />
            </div>
            <div className="md:col-span-2 flex justify-end pt-4">
              <Button onClick={save} disabled={saving} className="btn-luxe h-12 w-full md:w-auto rounded-full px-10 text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-gold/10">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
};