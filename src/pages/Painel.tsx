import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantSelector } from "@/components/TenantSelector";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { useCanAccessTab } from "@/hooks/useCanAccessTab";
import { CaptureConfigForm } from "@/components/CaptureConfigForm";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  partner: "Sócio",
  tester: "Tester",
  owner: "Dono",
};

export default function Painel() {
  const [activeTab, setActiveTab] = useState("captura");
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { current, loading: tenantLoading } = useCurrentTenant();

  // Guards de tier — uma chamada por aba (cacheado via React Query, sem N round-trips reais).
  const accessCaptura = useCanAccessTab("captura");
  const accessBio = useCanAccessTab("bio");
  const accessImersivo = useCanAccessTab("imersivo");
  const accessImagens = useCanAccessTab("imagens");
  const accessMetricas = useCanAccessTab("metricas");
  const accessIntegracoes = useCanAccessTab("integracoes");

  if (authLoading || tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <Card className="max-w-md p-8 text-center">
          <h2 className="mb-3 font-display text-2xl">Nenhum tenant encontrado</h2>
          <p className="text-sm text-muted-foreground">
            Você não tem nenhum tenant configurado nesta conta. Crie um para começar.
          </p>
        </Card>
      </div>
    );
  }

  const planLabel = isAdmin ? "Dono" : PLAN_LABELS[current.plan] ?? current.plan;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Painel do tenant
            </p>
            <h1 className="mt-1 font-display text-3xl">{current.display_name}</h1>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">/{current.slug}</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="rounded-full border border-gold/40 bg-gold/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
                {planLabel}
              </span>
            </div>
          </div>
          <TenantSelector />
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5">
            <TabsTriggerGuarded value="captura" label="Captura" canAccess={accessCaptura.canAccess} />
            <TabsTriggerGuarded value="bio" label="Link na Bio" canAccess={accessBio.canAccess} />
            <TabsTriggerGuarded value="imersivo" label="Diagnóstico Imersivo" canAccess={accessImersivo.canAccess} />
            <TabsTriggerGuarded value="imagens" label="Imagens" canAccess={accessImagens.canAccess} />
            <TabsTriggerGuarded value="metricas" label="Métricas" canAccess={accessMetricas.canAccess} />
          </TabsList>

          {/* Aba 1 — Captura (BUILD AGORA) com sub-bloco Integrações (ESTRUTURA AGORA) pendurado embaixo */}
          <TabsContent value="captura" className="mt-6 space-y-4">
            {accessCaptura.canAccess ? (
              <CaptureConfigForm tenantId={current.id} />
            ) : (
              <UpgradeBlock title="Captura" />
            )}

            {accessIntegracoes.canAccess ? (
              <PlaceholderTab
                title="Integrações"
                description="Conexão com agentes externos: WhatsApp Business, OpenAI, n8n, Zapier, ManyChat, CRMs. Schema do banco já reservado; UI dos formulários entra em ondas futuras."
                etiqueta="estrutura"
              />
            ) : (
              <UpgradeBlock title="Integrações" subtitle="Recurso exclusivo do plano Pro." />
            )}
          </TabsContent>

          <TabsContent value="bio" className="mt-6">
            {accessBio.canAccess ? (
              <PlaceholderTab
                title="Link na Bio"
                description="Personalização do link-in-bio: blocos, ordem, cores, foto, links. Em breve: tudo que já existe hoje organizado aqui."
              />
            ) : (
              <UpgradeBlock title="Link na Bio" />
            )}
          </TabsContent>

          <TabsContent value="imersivo" className="mt-6">
            {accessImersivo.canAccess ? (
              <PlaceholderTab
                title="Diagnóstico Imersivo"
                description="Funil profundo: perguntas, produtos, pain_tags, CTAs. Em breve: editor completo."
              />
            ) : (
              <UpgradeBlock title="Diagnóstico Imersivo" />
            )}
          </TabsContent>

          <TabsContent value="imagens" className="mt-6">
            {accessImagens.canAccess ? (
              <PlaceholderTab
                title="Imagens"
                description="Banco de imagens do tenant. Em breve: upload, organização, escolha por peça."
              />
            ) : (
              <UpgradeBlock title="Imagens" />
            )}
          </TabsContent>

          {/* Aba 5 — Métricas (ESTRUTURA AGORA): vai entrar com 1-2 números-chave; funil etapa-por-etapa fica pra v2 do produto */}
          <TabsContent value="metricas" className="mt-6">
            {accessMetricas.canAccess ? (
              <PlaceholderTab
                title="Métricas"
                description="Resumo de leads e clientes do tenant. Versão MVP entra com 1–2 números-chave (total leads, total clientes); funil etapa-por-etapa vem na v2 do produto."
                etiqueta="estrutura"
              />
            ) : (
              <UpgradeBlock title="Métricas" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// =============================================================================
// Componentes locais
// =============================================================================

const TabsTriggerGuarded = ({
  value,
  label,
  canAccess,
}: {
  value: string;
  label: string;
  canAccess: boolean;
}) => (
  <TabsTrigger
    value={value}
    disabled={!canAccess}
    className="data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
  >
    <span className="flex items-center gap-1.5">
      {!canAccess && <Lock className="h-3 w-3" aria-hidden />}
      {label}
    </span>
  </TabsTrigger>
);

type Etiqueta = "estrutura" | "referencia";

const ETIQUETA_LABEL: Record<Etiqueta, string> = {
  estrutura: "Estrutura agora · UI depois",
  referencia: "Referência · futuro",
};

const PlaceholderTab = ({
  title,
  description,
  etiqueta,
}: {
  title: string;
  description: string;
  etiqueta?: Etiqueta;
}) => (
  <Card className="p-12 text-center">
    {etiqueta && (
      <span className="mb-4 inline-block rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-[10px] uppercase tracking-widest text-gold">
        {ETIQUETA_LABEL[etiqueta]}
      </span>
    )}
    <h2 className="mb-3 font-display text-2xl">{title}</h2>
    <p className="mx-auto max-w-lg text-sm text-muted-foreground">{description}</p>
    <p className="mt-6 text-[10px] uppercase tracking-widest text-muted-foreground/60">
      Conteúdo em construção · Fase 1 do roadmap
    </p>
  </Card>
);

const UpgradeBlock = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <Card className="p-12 text-center">
    <Lock className="mx-auto mb-4 h-8 w-8 text-muted-foreground" aria-hidden />
    <h2 className="mb-3 font-display text-2xl">{title}</h2>
    <p className="mx-auto max-w-lg text-sm text-muted-foreground">
      {subtitle ?? "Esse recurso está disponível a partir do plano Pro."}
    </p>
    <p className="mt-6 text-[10px] uppercase tracking-widest text-gold">
      Upgrade em breve
    </p>
  </Card>
);
