import { useEffect, useState, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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

  return (
    <div className="min-h-screen">
      <ThemeToggle className="absolute right-5 top-5 z-20" />
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/admin" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3 w-3" /> voltar
        </Link>
        <h1 className="font-display text-2xl">
          Parceiros da <span className="text-gold italic">landing</span>
        </h1>
        <div className="w-10" />
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 pb-16">
        <section className="rounded-sm border-gold-gradient p-6">
          <p className="text-sm text-muted-foreground">
            Cada parceiro recebe um <span className="text-primary">utm_source</span> único. Quando alguém acessa{" "}
            <span className="font-mono text-primary">{ORIGIN}/?utm_source=...</span>, o lead vai pro tenant do parceiro.
            Sem UTM (ou UTM desconhecido) = lead vai pro tenant principal.
          </p>
        </section>

        <section className="rounded-sm border-gold p-6">
          <h2 className="font-display text-lg">Adicionar parceiro</h2>
          <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Tenant</label>
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger className="mt-1 h-11 rounded-sm border-gold bg-input">
                  <SelectValue placeholder="escolha o tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.display_name} <span className="text-muted-foreground">/ {t.slug}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">UTM source</label>
              <Input
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                placeholder="ex: stefany"
                className="mt-1 h-11 rounded-sm border-gold bg-input"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Nota (interna)</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ex: divulga no instagram dela"
                className="mt-1 h-11 rounded-sm border-gold bg-input"
              />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={submitting} className="btn-luxe h-11 rounded-sm">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} adicionar
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-sm border-gold p-6">
          <h2 className="font-display text-lg">Parceiros ativos</h2>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">nenhum parceiro cadastrado ainda.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {items.map((p) => {
                const captureUrl = `${ORIGIN}/?utm_source=${encodeURIComponent(p.utm_source)}&utm_medium=instagram`;
                return (
                  <li key={p.id} className="flex flex-col gap-3 rounded-sm border border-gold/30 bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base">
                          {p.tenants?.display_name ?? "(tenant)"}{" "}
                          <span className="text-xs text-muted-foreground">/ {p.tenants?.slug}</span>
                        </span>
                        <span className="rounded-sm border border-gold/40 bg-gradient-gold-soft px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                          {p.utm_source}
                        </span>
                      </div>
                      <div className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{captureUrl}</div>
                      {p.note && <div className="mt-1 text-[11px] text-muted-foreground">{p.note}</div>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="flex items-center gap-2 pr-2">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">ativo</span>
                        <Switch checked={p.is_active} onCheckedChange={(v) => toggleActive(p.id, v)} />
                      </div>
                      <Button variant="outline" size="sm" className="h-9 rounded-sm border-gold/50 text-[10px] uppercase tracking-[0.2em]" onClick={() => copyLink(p.utm_source)}>
                        <Copy className="h-3 w-3" /> copiar
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 rounded-sm border-destructive/40 text-[10px] uppercase tracking-[0.2em] text-destructive hover:bg-destructive/10" onClick={() => remove(p.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminLandingPartners;