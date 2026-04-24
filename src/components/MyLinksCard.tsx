import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Link2, LayoutDashboard, Sparkles, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { QRCodeDialog } from "@/components/QRCodeDialog";
import { useDeepDiagnostic } from "@/hooks/useDeepDiagnostic";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  slug: string;
  tenantId: string;
};

type PartnerRow = { utm_source: string; is_active: boolean };

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
        .select("utm_source,is_active,note")
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
  const funnelUrl = publishedFunnel ? `${ORIGIN}/d/${publishedFunnel.slug}` : null;
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
              <Row
                key={p.utm_source}
                icon={<Megaphone className="h-4 w-4" />}
                title={`Link do Parceiro: ${partnerName}`}
                url={partnerUrl}
                hint={`Leads que entrarem por este link (UTM: ${p.utm_source}) caem direto na sua conta.`}
                qrSlug={`landing-${p.utm_source}`}
                showQr
              />
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