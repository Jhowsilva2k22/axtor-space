import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Link2, LayoutDashboard, Sparkles, Megaphone, Settings2, Save, Loader2, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { QRCodeDialog } from "@/components/QRCodeDialog";
import { useDeepDiagnostic } from "@/hooks/useDeepDiagnostic";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  slug: string;
  tenantId: string;
};

type PartnerRow = { 
  id: string;
  utm_source: string; 
  is_active: boolean; 
  note?: string | null;
  bio_url: string | null;
  instagram_handle: string | null;
  whatsapp_number: string | null;
  whatsapp_message: string | null;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
};

const ORIGIN = typeof window !== "undefined" ? window.location.origin : "https://axtor.space";

const copy = async (label: string, value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado`);
  } catch {
    toast.error("não consegui copiar — copie manualmente");
  }
};

const Row = ({
  icon,
  title,
  url,
  hint,
  qrSlug,
  showQr = false,
  newTab = true,
}: {
  icon: React.ReactNode;
  title: string;
  url: string;
  hint?: string;
  qrSlug?: string;
  showQr?: boolean;
  newTab?: boolean;
}) => (
  <div className="flex flex-col gap-3 rounded-sm border border-gold/30 bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-gold/40 bg-gradient-gold-soft text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{title}</div>
        <div className="mt-0.5 break-all font-mono text-xs text-primary">{url}</div>
        {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-1 rounded-sm border-gold/50 text-[10px] uppercase tracking-[0.2em]"
        onClick={() => copy(title, url)}
      >
        <Copy className="h-3 w-3" /> copiar
      </Button>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-9 gap-1 rounded-sm border-gold/50 text-[10px] uppercase tracking-[0.2em]"
      >
        {newTab ? (
          <a href={url} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3 w-3" /> abrir
          </a>
        ) : (
          <Link to={url.replace(ORIGIN, "")}>
            <ExternalLink className="h-3 w-3" /> abrir
          </Link>
        )}
      </Button>
      {showQr && qrSlug && (
        <QRCodeDialog
          url={url}
          slug={qrSlug}
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1 rounded-sm border-gold/50 text-[10px] uppercase tracking-[0.2em]"
            >
              QR
            </Button>
          }
        />
      )}
    </div>
  </div>
);

export const MyLinksCard = ({ slug, tenantId }: Props) => {
  const { funnels } = useDeepDiagnostic();
  const { isAdmin } = useAuth();
  const [partners, setPartners] = useState<PartnerRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("landing_partners")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);
      if (!cancelled) setPartners((data as PartnerRow[] | null) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const bioUrl = `${ORIGIN}/${slug}`;
  const adminUrl = `${ORIGIN}/admin`;
  const publishedFunnel = funnels.find((f) => f.is_published);
  const funnelUrl = publishedFunnel ? `${ORIGIN}/d/funnel/${publishedFunnel.slug}` : null;
  const partnerUtm = partners[0]?.utm_source ?? null;
  const captureUrl = partnerUtm
    ? `${ORIGIN}/?utm_source=${encodeURIComponent(partnerUtm)}&utm_medium=instagram`
    : null;

  return (
    <Card className="relative overflow-hidden border-gold-gradient bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl tracking-tight">
              Seus <span className="text-gold italic">links</span>
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Estes são os links da sua conta. Copie, divulgue, gere QR.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <Row
            icon={<Link2 className="h-4 w-4" />}
            title="Sua bio pública"
            url={bioUrl}
            hint="Cole no Instagram, no story, no WhatsApp. Esse é o seu link in bio."
            qrSlug={slug}
            showQr
          />

          {funnelUrl && publishedFunnel && (
            <Row
              icon={<Sparkles className="h-4 w-4" />}
              title="Seu diagnóstico profundo"
              url={funnelUrl}
              hint={`Funil "${publishedFunnel.name}" — use como isca pra capturar leads qualificados.`}
              qrSlug={`d-${publishedFunnel.slug}`}
              showQr
            />
          )}

          {partners.map((p) => {
            const partnerUrl = `${ORIGIN}/?utm_source=${encodeURIComponent(p.utm_source)}&utm_medium=instagram`;
            const partnerName = p.note || p.utm_source;
            return (
              <div key={p.id} className="group flex flex-col gap-3 rounded-[24px] border border-gold/20 bg-card/40 p-5 transition-all hover:bg-card/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gradient-gold-soft text-primary">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground/60">Link de Captação / {partnerName}</div>
                      <div className="mt-1 break-all font-mono text-xs text-gold">{partnerUrl}</div>
                      <p className="mt-1 text-[11px] text-muted-foreground/80">Leads que entrarem por aqui são atribuídos automaticamente a você.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="h-10 rounded-full border-gold/20 px-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-gold/10" onClick={() => copy("Link de Captação", partnerUrl)}>
                    <Copy className="h-3.5 w-3.5" /> copiar
                  </Button>
                  
                  <PartnerSettingsDialog partner={p} onUpdate={(patch) => setPartners(prev => prev.map(item => item.id === p.id ? { ...item, ...patch } : item))} />

                  <QRCodeDialog
                    url={partnerUrl}
                    slug={`landing-${p.utm_source}`}
                    trigger={
                      <Button variant="outline" size="sm" className="h-10 rounded-full border-gold/20 px-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-gold/10">
                        QR Code
                      </Button>
                    }
                  />
                  <a href={partnerUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-gold/20 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-all hover:bg-gold/10 hover:text-gold">
                    <ExternalLink className="h-3.5 w-3.5" /> Abrir
                  </a>
                </div>
              </div>
            );
          })}

          {partners.length === 0 && (
            <div className="flex items-start gap-3 rounded-sm border border-dashed border-gold/30 bg-card/20 p-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-gold/30 bg-card/40 text-muted-foreground">
                <Megaphone className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Link de captação (landing parceiro)
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Você ainda não tem um link na landing principal axtor.space.{" "}
                  {isAdmin ? (
                    <>
                      Cadastre um UTM em{" "}
                      <Link to="/admin/landing-partners" className="text-primary underline-offset-2 hover:underline">
                        Parceiros landing
                      </Link>{" "}
                      pra ativar.
                    </>
                  ) : (
                    <>Fale com o admin pra liberar um UTM exclusivo seu.</>
                  )}
                </p>
              </div>
            </div>
          )}

          <Row
            icon={<LayoutDashboard className="h-4 w-4" />}
            title="Painel (este endereço)"
            url={adminUrl}
            hint="Salva esse link nos favoritos pra entrar rápido."
            newTab={false}
          />
        </div>
      </div>
    </Card>
  );
};

export default MyLinksCard;

const PartnerSettingsDialog = ({ partner, onUpdate }: { partner: PartnerRow; onUpdate: (patch: Partial<PartnerRow>) => void }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bio_url: partner.bio_url ?? "",
    instagram_handle: (partner.instagram_handle ?? "").replace(/^@+/, ""),
    whatsapp_number: partner.whatsapp_number ?? "",
    whatsapp_message: partner.whatsapp_message ?? "",
    secondary_cta_label: partner.secondary_cta_label ?? "",
    secondary_cta_url: partner.secondary_cta_url ?? "",
  });

  const save = async () => {
    setSaving(true);
    const patch = {
      bio_url: form.bio_url.trim() || null,
      instagram_handle: form.instagram_handle.trim().replace(/^@+/, "") || null,
      whatsapp_number: form.whatsapp_number.replace(/\D/g, "") || null,
      whatsapp_message: form.whatsapp_message.trim() || null,
      secondary_cta_label: form.secondary_cta_label.trim() || null,
      secondary_cta_url: form.secondary_cta_url.trim() || null,
    };
    
    const { error } = await supabase.from("landing_partners").update(patch).eq("id", partner.id);
    setSaving(false);
    
    if (error) {
      toast.error(error.message);
      return;
    }
    
    onUpdate(patch);
    toast.success("Estratégia de conversão atualizada!");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 rounded-full border-gold bg-gold/5 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold/10">
          <Settings2 className="h-3.5 w-3.5" /> Configurar Conversão
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-[32px] border-gold/20 bg-card/90 p-8 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Ajustar <span className="text-gold italic">Conversão</span></DialogTitle>
          <p className="text-sm text-muted-foreground">Personalize para onde os leads desse link serão enviados após o diagnóstico.</p>
        </DialogHeader>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2 space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Sua Bio / Site Principal</label>
            <p className="text-[10px] text-gold/60 italic font-light">Este link abre quando o lead clica em "Ver meus links" na página inicial.</p>
            <Input
              value={form.bio_url}
              onChange={(e) => setForm(f => ({ ...f, bio_url: e.target.value }))}
              placeholder="https://..."
              className="h-12 rounded-full border-gold/20 bg-background/40 px-5 font-light"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">WhatsApp (Número com DDD)</label>
            <p className="text-[10px] text-gold/60 italic font-light">Número que receberá as mensagens (Ex: 5511999999999).</p>
            <Input
              value={form.whatsapp_number}
              onChange={(e) => setForm(f => ({ ...f, whatsapp_number: e.target.value }))}
              placeholder="55..."
              className="h-12 rounded-full border-gold/20 bg-background/40 px-5 font-light"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">@ Instagram</label>
            <p className="text-[10px] text-gold/60 italic font-light">Seu usuário do Instagram para o ícone do rodapé.</p>
            <Input
              value={form.instagram_handle}
              onChange={(e) => setForm(f => ({ ...f, instagram_handle: e.target.value }))}
              placeholder="seu_perfil"
              className="h-12 rounded-full border-gold/20 bg-background/40 px-5 font-light"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">Mensagem do WhatsApp</label>
            <p className="text-[10px] text-gold/60 italic font-light">O lead já chegará com este texto pronto no WhatsApp dele para te enviar.</p>
            <Textarea
              value={form.whatsapp_message}
              onChange={(e) => setForm(f => ({ ...f, whatsapp_message: e.target.value }))}
              rows={2}
              className="rounded-2xl border-gold/20 bg-background/40 p-4 font-light"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gold/80 underline decoration-gold/30 underline-offset-4">Terceiro Botão (Título)</label>
            <p className="text-[10px] text-gold/60 italic font-light">Nome do 3º botão (Ex: Agendar Call). Aparecerá abaixo do WhatsApp.</p>
            <Input
              value={form.secondary_cta_label}
              onChange={(e) => setForm(f => ({ ...f, secondary_cta_label: e.target.value }))}
              placeholder="Ex: Agendar Mentoria"
              className="h-12 rounded-full border-gold/30 bg-gold/5 px-5 font-bold focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gold/80 underline decoration-gold/30 underline-offset-4">Terceiro Botão (Link)</label>
            <p className="text-[10px] text-gold/60 italic font-light">Destino do 3º botão (Ex: Link do Calendly ou Página de Vendas).</p>
            <Input
              value={form.secondary_cta_url}
              onChange={(e) => setForm(f => ({ ...f, secondary_cta_url: e.target.value }))}
              placeholder="https://..."
              className="h-12 rounded-full border-gold/30 bg-gold/5 px-5 font-bold focus:border-gold"
            />
          </div>

          <div className="md:col-span-2 flex justify-end pt-4">
            <Button onClick={save} disabled={saving} className="btn-luxe h-12 w-full md:w-auto rounded-full px-10 text-xs font-bold uppercase tracking-[0.2em]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar Minha Estratégia
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};