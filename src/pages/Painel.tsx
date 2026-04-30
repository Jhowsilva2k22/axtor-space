import { useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantSelector } from "@/components/TenantSelector";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { useCanAccessTab } from "@/hooks/useCanAccessTab";
import { useDeepDiagnostic } from "@/hooks/useDeepDiagnostic";
import { CaptureConfigForm } from "@/components/CaptureConfigForm";
import { PainelHeaderActions } from "@/components/PainelHeaderActions";
import { BioHeaderEditorStandalone } from "@/components/bio/BioHeaderEditorStandalone";
import { BioBlocksManagerStandalone } from "@/components/bio/BioBlocksManagerStandalone";
import { CategoriesManager } from "@/components/CategoriesManager";
import { BioFullPreview } from "@/components/bio/BioFullPreview";
import { BioThemePickerStandalone } from "@/components/bio/BioThemePickerStandalone";
import { MediaGallery } from "@/components/bio/MediaGallery";
import { MetricsDashboard } from "@/components/bio/MetricsDashboard";
import { ActivationBanner } from "@/components/ActivationBanner";
import { FunnelListView } from "@/components/imersivo/FunnelListView";
import { DeepDiagnosticReviewView } from "@/pages/DeepDiagnosticReviewView";
import { BriefingWizard } from "@/components/imersivo/BriefingWizard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
          <div className="flex flex-wrap items-center gap-3">
            <PainelHeaderActions slug={current.slug} />
            <TenantSelector />
          </div>
        </header>

        {/* Banner que aparece quando o user chega após pagar (?activated=true).
            Botão "Ir agora" troca a aba ativa pro produto comprado. */}
        <ActivationBanner onAction={(tab) => setActiveTab(tab)} />

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
              <BioTabPanel tenantId={current.id} slug={current.slug} displayName={current.display_name} />
            ) : (
              <UpgradeBlock title="Link na Bio" />
            )}
          </TabsContent>

          <TabsContent value="imersivo" className="mt-6">
            {accessImersivo.canAccess ? (
              <DeepDiagnosticTabPanel />
            ) : (
              <UpgradeBlock title="Diagnóstico Imersivo" />
            )}
          </TabsContent>

          <TabsContent value="imagens" className="mt-6">
            {accessImagens.canAccess ? (
              <MediaGallery tenantId={current.id} />
            ) : (
              <UpgradeBlock title="Imagens" />
            )}
          </TabsContent>

          {/* Aba 5 — Métricas (Onda 3 v2 Fase 6): MVP com números-chave; funil etapa-por-etapa pra v2 */}
          <TabsContent value="metricas" className="mt-6">
            {accessMetricas.canAccess ? (
              <MetricsDashboard tenantId={current.id} />
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

/**
 * Painel da aba Bio — orquestra editor (Header, Blocks, Categorias) + Preview ao vivo.
 * State live (cfg + blocks) é levantado aqui pra o preview refletir mudanças
 * antes mesmo do user salvar.
 */
const BioTabPanel = ({
  tenantId,
  slug,
  displayName,
}: {
  tenantId: string;
  slug: string;
  displayName: string;
}) => {
  const [liveCfg, setLiveCfg] = useState<{
    display_name?: string | null;
    headline?: string | null;
    sub_headline?: string | null;
    avatar_url?: string | null;
    cover_url?: string | null;
  } | null>(null);
  const [liveBlocks, setLiveBlocks] = useState<
    | Array<{
        id: string;
        label: string;
        url: string;
        icon: string | null;
        badge: string | null;
        is_active: boolean;
        position: number;
        highlight: boolean;
        category_id: string | null;
      }>
    | null
  >(null);

  const handleCfgChange = useCallback(
    (cfg: {
      display_name: string;
      headline: string;
      sub_headline: string | null;
      avatar_url: string | null;
      cover_url: string | null;
    }) => {
      setLiveCfg({
        display_name: cfg.display_name,
        headline: cfg.headline,
        sub_headline: cfg.sub_headline,
        avatar_url: cfg.avatar_url,
        cover_url: cfg.cover_url,
      });
    },
    [],
  );

  // Aceita Block[] do bio/types — subset (label/url/icon/badge/etc) já presente.
  // Cast pra desacoplar tipos. Painel só precisa dos campos visuais pro preview.
  const handleBlocksChange = useCallback((blocks: any[]) => {
    setLiveBlocks(
      blocks.map((b) => ({
        id: b.id,
        label: b.label,
        url: b.url,
        icon: b.icon,
        badge: b.badge,
        is_active: b.is_active,
        position: b.position,
        highlight: b.highlight,
        category_id: b.category_id,
      })),
    );
  }, []);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0 space-y-6">
        <BioHeaderEditorStandalone
          tenantId={tenantId}
          slug={slug}
          displayName={displayName}
          onCfgChange={handleCfgChange}
        />
        <BioBlocksManagerStandalone
          tenantId={tenantId}
          onBlocksChange={handleBlocksChange}
        />
        <CategoriesManager tenantId={tenantId} />
        <BioThemePickerStandalone tenantId={tenantId} />
      </div>
      <aside className="xl:sticky xl:top-6 xl:self-start">
        <BioFullPreview
          tenantId={tenantId}
          slug={slug}
          liveConfig={liveCfg ?? undefined}
          liveBlocks={liveBlocks ?? undefined}
        />
      </aside>
    </div>
  );
};

/**
 * Aba Bio — informativo das seções ainda em consolidação.
 * Cabeçalho, Blocos e Categorias já foram consolidados. Tema visual entra
 * no próximo PR da Onda 3.5 (refactor de AdminTemplates).
 */
const BioRemainingSectionsCard = () => (
  <Card className="p-8">
    <span className="mb-3 inline-block rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-[10px] uppercase tracking-widest text-gold">
      Em consolidação · próximo PR
    </span>
    <h3 className="font-display text-lg">Tema visual / templates da bio</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      Pro+ vai poder escolher entre templates visuais (Gold Noir, etc) e personalizar
      tipografia da marca. Estamos extraindo do painel anterior em PR dedicado.
    </p>
  </Card>
);

/**
 * Container da aba Diagnóstico Imersivo: carrega os funis via useDeepDiagnostic
 * e delega o render pro FunnelListView (presentacional puro). Navegação pro
 * editor é por query param (?funnelId=xxx) — Opção B.
 */
const DeepDiagnosticTabPanel = () => {
  const { funnels, loading, tenantId, refresh } = useDeepDiagnostic();
  const [view, setView] = useState<"list" | "briefing" | "review">("list");
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null);

  const handleDelete = async (funnelId: string, funnelName: string) => {
    if (!confirm(`Excluir o funil "${funnelName}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await supabase.from("deep_funnel_questions").delete().eq("funnel_id", funnelId);
      await supabase.from("deep_funnel_products").delete().eq("funnel_id", funnelId);
      const { error } = await supabase.from("deep_funnels").delete().eq("id", funnelId);
      if (error) throw error;
      toast({ title: "Funil excluído", description: `"${funnelName}" foi removido.` });
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Erro ao excluir",
        description: e?.message ?? "Tente novamente",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </Card>
    );
  }

  if (view === "briefing" && tenantId) {
    return (
      <BriefingWizard
        tenantId={tenantId}
        onCancel={() => setView("list")}
        onGenerated={(funnelId) => {
          setActiveFunnelId(funnelId);
          setView("review");
        }}
      />
    );
  }

  if (view === "review" && activeFunnelId) {
    return (
      <DeepDiagnosticReviewView
        funnelId={activeFunnelId}
        onBack={() => { setView("list"); setActiveFunnelId(null); }}
      />
    );
  }

  return (
    <FunnelListView
      funnels={funnels}
      onNew={() => setView("briefing")}
      onEdit={(funnelId) => { setActiveFunnelId(funnelId); setView("review"); }}
      onDelete={handleDelete}
    />
  );
};
