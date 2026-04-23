import { useEffect, useState, FormEvent } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { ThemeToggle, useAdminLockedTheme } from "@/components/ThemeToggle";
import { toast } from "sonner";
import {
  Loader2, Plus, Copy, Mail, Link2, Trash2, ArrowLeft, Crown, FlaskConical, Send,
  RefreshCw,
} from "lucide-react";

type InviteRow = {
  id: string;
  code: string;
  type: "partner" | "tester";
  mode: "link" | "email";
  target_email: string | null;
  note: string | null;
  used_at: string | null;
  used_by_user_id: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  email_sent_at: string | null;
  created_at: string;
};

const generateCode = (type: "partner" | "tester") => {
  const prefix = type === "partner" ? "P" : "T";
  const rand = Array.from({ length: 8 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
  ).join("");
  return `${prefix}-${rand}`;
};

const AdminInvites = () => {
  useAdminLockedTheme();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [items, setItems] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "partner" | "tester">("all");
  const [open, setOpen] = useState(false);

  // form state
  const [type, setType] = useState<"partner" | "tester">("partner");
  const [mode, setMode] = useState<"link" | "email">("link");
  const [targetEmail, setTargetEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("invite_codes" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) { toast.error("erro ao carregar convites"); return; }
    setItems((data ?? []) as any);
  };

  useEffect(() => {
    if (!authLoading && user && isAdmin) void load();
  }, [authLoading, user, isAdmin]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center grain">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === "email" && !targetEmail.trim()) {
      toast.error("informe o email do convidado");
      return;
    }
    setSubmitting(true);
    const code = generateCode(type);
    const recipient = mode === "email" ? targetEmail.trim().toLowerCase() : null;

    // Idempotência: se for invite por email, revoga pendentes anteriores pro mesmo email+tipo.
    // Evita ter dois códigos válidos circulando pra mesma pessoa.
    let revokedCount = 0;
    if (recipient) {
      const { data: pendings } = await supabase
        .from("invite_codes" as any)
        .select("id")
        .eq("target_email", recipient)
        .eq("type", type)
        .is("used_at", null)
        .is("revoked_at", null);
      const ids = ((pendings ?? []) as unknown as { id: string }[]).map((p) => p.id);
      if (ids.length > 0) {
        await supabase
          .from("invite_codes" as any)
          .update({
            revoked_at: new Date().toISOString(),
            note: `superseded → ${code}`,
          } as any)
          .in("id", ids);
        revokedCount = ids.length;
      }
    }

    const { data: inserted, error } = await supabase
      .from("invite_codes" as any)
      .insert({
      code,
      type,
      mode,
        target_email: recipient,
      note: note.trim() || null,
      created_by: user.id,
      } as any)
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast.error("erro: " + error.message);
      return;
    }
    toast.success(
      revokedCount > 0
        ? `convite criado · ${revokedCount} pendente${revokedCount === 1 ? "" : "s"} revogado${revokedCount === 1 ? "" : "s"}`
        : "convite criado",
    );
    setOpen(false);
    setTargetEmail(""); setNote(""); setMode("link"); setType("partner");
    await load();

    // Auto-envio se modo email
    if (recipient && inserted) {
      void sendInviteEmail({ ...(inserted as any), code, type, target_email: recipient } as InviteRow);
    }
  };

  const sendInviteEmail = async (inv: InviteRow) => {
    if (!inv.target_email) return;
    const inviteUrl = buildLink(inv);
    const templateName = inv.type === "partner" ? "partner-invite" : "tester-invite";

    // Busca dados do convidador (tenant do admin que criou o convite)
    let inviterData: {
      inviterName?: string;
      inviterSlug?: string;
      inviterAvatarUrl?: string;
      inviterHeadline?: string;
    } = {};
    try {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("slug, display_name, id")
        .eq("owner_user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (tenant) {
        inviterData.inviterName = tenant.display_name;
        inviterData.inviterSlug = tenant.slug;
        const { data: cfg } = await supabase
          .from("bio_config")
          .select("avatar_url, headline")
          .eq("tenant_id", tenant.id)
          .maybeSingle();
        if (cfg) {
          inviterData.inviterAvatarUrl = cfg.avatar_url ?? undefined;
          inviterData.inviterHeadline = cfg.headline ?? undefined;
        }
      }
    } catch {
      // segue sem dados do convidador — template tem fallback
    }

    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName,
        recipientEmail: inv.target_email,
        idempotencyKey: `invite-${inv.code}`,
        templateData: {
          inviteUrl,
          ...inviterData,
        },
      },
    });
    if (error) {
      toast.error("convite criado, mas falhou ao enviar email: " + error.message);
      return;
    }
    await supabase
      .from("invite_codes" as any)
      .update({ email_sent_at: new Date().toISOString() } as any)
      .eq("id", inv.id);
    toast.success(`email enviado pra ${inv.target_email}`);
    await load();
  };

  const resendEmail = async (inv: InviteRow) => {
    toast.loading("enviando email...", { id: `resend-${inv.id}` });
    await sendInviteEmail(inv);
    toast.dismiss(`resend-${inv.id}`);
  };

  // Rotaciona o código: revoga o atual e cria um novo (mesmo tipo/modo/email/nota).
  // Se o convite foi por email, dispara o novo automaticamente.
  const rotateInvite = async (inv: InviteRow) => {
    if (!confirm("gerar novo código? o link/código atual será invalidado imediatamente.")) return;
    const newCode = generateCode(inv.type);
    // 1. revoga o antigo com nota apontando pro novo
    const rotateNote = `rotated → ${newCode}${inv.note ? ` · ${inv.note}` : ""}`;
    const { error: revErr } = await supabase
      .from("invite_codes" as any)
      .update({ revoked_at: new Date().toISOString(), note: rotateNote } as any)
      .eq("id", inv.id);
    if (revErr) { toast.error("erro ao revogar antigo: " + revErr.message); return; }
    // 2. cria o novo
    const { data: inserted, error: insErr } = await supabase
      .from("invite_codes" as any)
      .insert({
        code: newCode,
        type: inv.type,
        mode: inv.mode,
        target_email: inv.target_email,
        note: inv.note,
        created_by: user.id,
      } as any)
      .select()
      .single();
    if (insErr || !inserted) { toast.error("erro ao criar novo: " + (insErr?.message ?? "")); return; }
    const newInv = { ...(inserted as any), code: newCode } as InviteRow;
    // 3. copia link novo
    const newLink = buildLink(newInv);
    await navigator.clipboard.writeText(newLink);
    toast.success("novo código gerado e copiado");
    // 4. dispara email se for modo email
    if (newInv.mode === "email" && newInv.target_email) {
      void sendInviteEmail(newInv);
    } else {
      await load();
    }
  };

  const revoke = async (id: string) => {
    if (!confirm("revogar este convite? não poderá mais ser usado.")) return;
    const { error } = await supabase
      .from("invite_codes" as any)
      .update({ revoked_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) { toast.error("erro ao revogar"); return; }
    toast.success("convite revogado");
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("excluir convite permanentemente?")) return;
    const { error } = await supabase.from("invite_codes" as any).delete().eq("id", id);
    if (error) { toast.error("erro ao excluir"); return; }
    toast.success("excluído");
    await load();
  };

  const buildLink = (inv: InviteRow) => {
    const base = `${window.location.origin}/signup?invite=${inv.code}`;
    return inv.mode === "email" && inv.target_email
      ? `${base}&email=${encodeURIComponent(inv.target_email)}`
      : base;
  };

  const copyLink = (inv: InviteRow) => {
    navigator.clipboard.writeText(buildLink(inv));
    toast.success("link copiado");
  };

  const statusBadge = (inv: InviteRow) => {
    if (inv.revoked_at) return <span className="rounded-sm border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-destructive">revogado</span>;
    if (inv.used_at) return <span className="rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-500">usado</span>;
    if (inv.expires_at && new Date(inv.expires_at) < new Date()) return <span className="rounded-sm border border-muted-foreground/40 bg-muted/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">expirado</span>;
    return <span className="rounded-sm border border-gold/40 bg-gradient-gold-soft px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">pendente</span>;
  };

  const filtered = items.filter(i => filter === "all" ? true : i.type === filter);

  return (
    <div className="relative min-h-screen px-6 py-10 grain">
      <div className="aurora-a" />
      <ThemeToggle className="absolute right-5 top-5 z-20" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link to="/admin" className="mb-3 inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-3 w-3" /> voltar
            </Link>
            <h1 className="font-display text-4xl">Convites <span className="text-gold italic">premium</span></h1>
            <p className="mt-2 text-sm text-muted-foreground">libere acesso completo grátis pra sócios e beta-testers.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="btn-luxe h-11 rounded-sm text-xs uppercase tracking-[0.2em]">
                <Plus className="h-3.5 w-3.5" /> Novo convite
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-sm border-gold bg-card">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Novo <span className="text-gold italic">convite</span></DialogTitle>
              </DialogHeader>
              <form onSubmit={create} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setType("partner")}
                      className={`flex items-center justify-center gap-2 rounded-sm border px-3 py-3 text-xs uppercase tracking-wider transition ${type === "partner" ? "border-gold bg-gradient-gold-soft text-primary" : "border-border bg-card/40 text-muted-foreground hover:border-gold/50"}`}>
                      <Crown className="h-4 w-4" /> Sócio
                    </button>
                    <button type="button" onClick={() => setType("tester")}
                      className={`flex items-center justify-center gap-2 rounded-sm border px-3 py-3 text-xs uppercase tracking-wider transition ${type === "tester" ? "border-gold bg-gradient-gold-soft text-primary" : "border-border bg-card/40 text-muted-foreground hover:border-gold/50"}`}>
                      <FlaskConical className="h-4 w-4" /> Tester
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Modo de envio</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setMode("link")}
                      className={`flex items-center justify-center gap-2 rounded-sm border px-3 py-3 text-xs uppercase tracking-wider transition ${mode === "link" ? "border-gold bg-gradient-gold-soft text-primary" : "border-border bg-card/40 text-muted-foreground hover:border-gold/50"}`}>
                      <Link2 className="h-4 w-4" /> Link aberto
                    </button>
                    <button type="button" onClick={() => setMode("email")}
                      className={`flex items-center justify-center gap-2 rounded-sm border px-3 py-3 text-xs uppercase tracking-wider transition ${mode === "email" ? "border-gold bg-gradient-gold-soft text-primary" : "border-border bg-card/40 text-muted-foreground hover:border-gold/50"}`}>
                      <Mail className="h-4 w-4" /> Por email
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {mode === "link"
                      ? "qualquer pessoa com o link pode usar (uma vez só)"
                      : "amarrado ao email — só essa pessoa consegue usar"}
                  </p>
                </div>

                {mode === "email" && (
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Email do convidado</label>
                    <Input type="email" required value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      placeholder="stefany@email.com"
                      className="h-11 rounded-sm border-gold bg-input" />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Nota interna (opcional)</label>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)}
                    maxLength={200}
                    placeholder="ex: stefany mello — sócia"
                    className="rounded-sm border-gold bg-input" />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={submitting}
                    className="btn-luxe h-11 w-full rounded-sm text-xs uppercase tracking-[0.2em]">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar convite"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-5 flex gap-2">
          {(["all", "partner", "tester"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-sm border px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition ${filter === f ? "border-gold bg-gradient-gold-soft text-primary" : "border-border bg-card/40 text-muted-foreground hover:border-gold/50"}`}>
              {f === "all" ? "todos" : f === "partner" ? "sócios" : "testers"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-sm border border-dashed border-gold/40 bg-card/30 p-12 text-center">
            <p className="text-sm text-muted-foreground">nenhum convite ainda. clique em "novo convite" pra começar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(inv => (
              <div key={inv.id} className="rounded-sm border-gold-gradient bg-card/60 p-5 backdrop-blur">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <code className="rounded-sm border border-gold bg-gradient-gold-soft px-2.5 py-1 font-mono text-sm text-primary">
                        {inv.code}
                      </code>
                      <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-wider ${inv.type === "partner" ? "border-gold bg-gradient-gold-soft text-primary" : "border-muted-foreground/40 bg-muted/30 text-muted-foreground"}`}>
                        {inv.type === "partner" ? <Crown className="h-3 w-3" /> : <FlaskConical className="h-3 w-3" />}
                        {inv.type}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {inv.mode === "email" ? <Mail className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                        {inv.mode}
                      </span>
                      {statusBadge(inv)}
                    </div>
                    {inv.target_email && (
                      <p className="text-xs text-muted-foreground"><span className="text-primary/80">para:</span> {inv.target_email}</p>
                    )}
                    {inv.note && (
                      <p className="mt-1 text-xs italic text-muted-foreground">"{inv.note}"</p>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground/70">
                      criado em {new Date(inv.created_at).toLocaleString("pt-BR")}
                      {inv.used_at && ` · usado em ${new Date(inv.used_at).toLocaleString("pt-BR")}`}
                      {inv.email_sent_at && ` · email enviado em ${new Date(inv.email_sent_at).toLocaleString("pt-BR")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!inv.used_at && !inv.revoked_at && (
                      <>
                        <button onClick={() => copyLink(inv)}
                          title="copiar link atual"
                          className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-gold/60 bg-card/40 px-3 text-[11px] uppercase tracking-wider text-primary/80 hover:bg-gradient-gold-soft">
                          <Copy className="h-3 w-3" /> copiar
                        </button>
                        <button onClick={() => rotateInvite(inv)}
                          title="gerar novo código (invalida o atual)"
                          className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-gold bg-gradient-gold-soft px-3 text-[11px] uppercase tracking-wider text-primary hover:opacity-90">
                          <RefreshCw className="h-3 w-3" /> novo link
                        </button>
                        {inv.mode === "email" && inv.target_email && (
                          <button onClick={() => resendEmail(inv)}
                            title="reenviar email"
                            className="inline-flex h-9 items-center justify-center rounded-sm border border-gold/60 bg-card/40 px-3 text-primary/80 hover:bg-gradient-gold-soft">
                            <Mail className="h-3 w-3" />
                          </button>
                        )}
                      </>
                    )}
                    {!inv.used_at && !inv.revoked_at && (
                      <button onClick={() => revoke(inv.id)}
                        title="revogar"
                        className="inline-flex h-9 items-center justify-center rounded-sm border border-destructive/40 bg-card/40 px-3 text-destructive hover:bg-destructive/10">
                        <Send className="h-3 w-3 rotate-180" />
                      </button>
                    )}
                    <button onClick={() => remove(inv.id)}
                      title="excluir"
                      className="inline-flex h-9 items-center justify-center rounded-sm border border-border bg-card/40 px-3 text-muted-foreground hover:border-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInvites;