import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Navigate, useNavigate, useParams, Link } from "react-router-dom";
import {
  Loader2,
  Lock,
  LayoutDashboard,
  Magnet,
  Link2,
  Sparkles,
  Image as ImageIcon,
  BarChart3,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PUBLIC_BASE_URL } from "@/lib/site";
import { TenantSelector } from "@/components/TenantSelector";
import { BGPattern } from "@/components/BGPattern";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { useCanAccessTab } from "@/hooks/useCanAccessTab";
import { useDeepDiagnostic } from "@/hooks/useDeepDiagnostic";
import { CaptureConfigForm } from "@/components/CaptureConfigForm";
import { PainelHeaderActions } from "@/components/PainelHeaderActions";
import { CreditsCard } from "@/components/CreditsCard";
import { BioHeaderEditorStandalone } from "@/components/bio/BioHeaderEditorStandalone";
import { BioBlocksManagerStandalone } from "@/components/bio/BioBlocksManagerStandalone";
import { CategoriesManager } from "@/components/CategoriesManager";
import { BioFullPreview } from "@/components/bio/BioFullPreview";
import { BioThemePickerStandalone } from "@/components/bio/BioThemePickerStandalone";
import { BioMusicPickerStandalone } from "@/components/bio/BioMusicPickerStandalone";
import { MediaGallery } from "@/components/bio/MediaGallery";
import { MetricsDashboard } from "@/components/bio/MetricsDashboard";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { ActivationBanner } from "@/components/ActivationBanner";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { MyLinksCard } from "@/components/MyLinksCard";
import { PartnerCtasEditor } from "@/components/PartnerCtasEditor";
import { FunnelListView } from "@/components/imersivo/FunnelListView";
import { WhatsAppNumbersManager } from "@/components/imersivo/WhatsAppNumbersManager";
import { DeepDiagnosticReviewView } from "@/pages/DeepDiagnosticReviewView";
import { BriefingWizard } from "@/components/imersivo/BriefingWizard";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { readPendingSignup, clearPendingSignup } from "@/lib/pendingSignup";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  premium: "Premium",
  partner: "Sócio",
  tester: "Tester",
  owner: "Dono",
};

export default function Painel() {
  const nav = useNavigate();
  const { section } = useParams<{ section?: string }>();
  const PAINEL_TABS = ["bio", "captura", "imersivo", "imagens", "metricas", "leads"];
  // Aba ativa vem da URL (/painel/secao/:section). Sem seção válida → Bio (entrada).
  const activeTab = section && PAINEL_TABS.includes(section) ? section : "bio";
  // Trocar de aba = navegar pra rota da seção (URL própria, back/forward funciona).
  const setActiveTab = (value: string) => nav(`/painel/secao/${value}`);
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { current, tenants, loading: tenantLoading, refresh } = useCurrentTenant();

  // Guards de tier — uma chamada por aba (cacheado via React Query, sem N round-trips reais).
  const accessCaptura = useCanAccessTab("captura");
  const accessBio = useCanAccessTab("bio");
  const accessImersivo = useCanAccessTab("imersivo");
  const accessImagens = useCanAccessTab("imagens");
  const accessMetricas = useCanAccessTab("metricas");
  const accessIntegracoes = useCanAccessTab("integracoes");
  const accessLeads = useCanAccessTab("leads");

  // Auto-provisioning para usuários que confirmaram email
  const hasPendingSignup = useMemo(() => readPendingSignup() !== null, []);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const provisionAttempted = useRef(false);

  useEffect(() => {
    if (authLoading || tenantLoading) return;
    if (!user || current || provisionAttempted.current) return;

    const pending = readPendingSignup();
    if (!pending) return;

    provisionAttempted.current = true;
    setProvisioning(true);

    const run = async () => {
      const { data, error } = await (supabase as any).rpc(
        "create_tenant_for_user",
        {
          _slug: pending.slug,
          _display_name: pending.displayName,
          _invite_code: pending.inviteCode ?? null,
        },
      );

      if (error) {
        setProvisionError(error.message);
        setProvisioning(false);
        return;
      }

      const result = data as any;
      clearPendingSignup();

      // Fire-and-forget — falha no email não bloqueia o acesso ao painel
      supabase.functions
        .invoke("send-transactional-email", {
          body: {
            templateName: "welcome-tenant",
            recipientEmail: pending.email,
            idempotencyKey: `welcome-${result.tenant_id}`,
            templateData: {
              name: pending.displayName,
              bioUrl: result.url,
              adminUrl: `${PUBLIC_BASE_URL}/painel`,
              slug: result.slug,
              plan: result.plan ?? "free",
            },
          },
        })
        .catch((err: unknown) =>
          console.error("[provision] welcome email failed:", err),
        );

      await refresh();
      setProvisioning(false);
    };

    void run();
  }, [authLoading, tenantLoading, user, current, refresh, retryKey]);

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
    if (provisioning || (hasPendingSignup && !provisionAttempted.current)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="font-display text-lg">Configurando sua conta…</p>
            <p className="mt-2 text-sm text-muted-foreground">Só um instante.</p>
          </div>
        </div>
      );
    }

    if (provisionError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
          <Card className="max-w-md p-8 text-center">
            <h2 className="mb-3 font-display text-2xl">Erro ao configurar conta</h2>
            <p className="mb-4 text-sm text-muted-foreground">{provisionError}</p>
            <p className="mb-6 text-xs text-muted-foreground">
              Suporte: axtormail@axtor.space
            </p>
            <Button
              className="mb-3 w-full"
              onClick={() => {
                provisionAttempted.current = false;
                setProvisionError(null);
                setRetryKey((k) => k + 1);
              }}
            >
              Tentar novamente
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { clearPendingSignup(); nav("/signup"); }}
            >
              Tentar com outra conta
            </Button>
          </Card>
        </div>
      );
    }

    return (
      <WelcomeOnboarding
        userEmail={user?.email}
        userName={user?.user_metadata?.full_name}
      />
    );
  }

  const planLabel = isAdmin ? "Dono" : PLAN_LABELS[current.plan] ?? current.plan;

  // Itens do bottom nav mobile — mesmos values do Tabs (estado compartilhado),
  // labels curtos pra caber 6 itens, lock preservado por seção.
  const mobileNavItems: MobileNavItem[] = [
    { value: "bio", label: "Bio", icon: Link2, canAccess: accessBio.canAccess },
    { value: "captura", label: "Captura", icon: Magnet, canAccess: accessCaptura.canAccess },
    { value: "imersivo", label: "Imersivo", icon: Sparkles, canAccess: accessImersivo.canAccess },
    { value: "imagens", label: "Imagens", icon: ImageIcon, canAccess: accessImagens.canAccess },
    { value: "metricas", label: "Métricas", icon: BarChart3, canAccess: accessMetricas.canAccess },
    { value: "leads", label: "Leads", icon: Users, canAccess: accessLeads.canAccess },
  ];

  return (
    <div className="relative isolate min-h-screen bg-background">
      <BGPattern />
      {/* pb extra no mobile pra nada ficar escondido atrás do bottom nav fixo */}
      <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-[calc(env(safe-area-inset-top)+1.5rem)] sm:px-6 sm:py-8">
        {/* Header desktop — layout original preservado (≥ sm) */}
        <header className="mb-8 hidden flex-wrap items-start justify-between gap-4 sm:flex">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Painel do tenant
            </p>
            <h1 className="mt-1 font-display text-3xl">{current.display_name}</h1>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">/{current.slug}</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="rounded-full border border-gold/40 bg-gold/5 px-2 py-0.5 text-[11px] uppercase tracking-widest text-gold">
                {planLabel}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <CreditsCard />
            <PainelHeaderActions slug={current.slug} />
            <TenantSelector />
            {isAdmin && (
              <Link
                to="/admin/hub"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-600 bg-zinc-900 px-3 text-[11px] uppercase tracking-[0.2em] text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white"
              >
                Hub <LayoutDashboard className="h-3 w-3" />
              </Link>
            )}
          </div>
        </header>

        {/* App bar mobile — densa, cara de app: nome+plano numa linha,
            créditos como chip, ações como ícones. Mesmo conteúdo do desktop. */}
        <header className="mb-6 sm:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-xl leading-tight">
                  {current.display_name}
                </h1>
                <span className="shrink-0 rounded-full border border-gold/40 bg-gold/5 px-2 py-0.5 text-[11px] uppercase tracking-widest text-gold">
                  {planLabel}
                </span>
              </div>
            </div>
            <CreditsCard compact />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <PainelHeaderActions slug={current.slug} compact />
            {isAdmin && (
              <Link
                to="/admin/hub"
                aria-label="Hub do admin"
                title="Hub do admin"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white"
              >
                <LayoutDashboard className="h-4 w-4" />
              </Link>
            )}
          </div>
          {/* Seletor só aparece quando há mais de um tenant (senão duplicaria o nome) */}
          {tenants.length > 1 && (
            <div className="mt-3">
              <TenantSelector />
            </div>
          )}
        </header>

        {/* Banner que aparece quando o user chega após pagar (?activated=true).
            Botão "Ir agora" troca a aba ativa pro produto comprado. */}
        <ActivationBanner onAction={(tab) => setActiveTab(tab)} />

        {/* Todos os links do tenant: bio, funil publicado, UTM parceiro, painel */}
        <div className="mb-6">
          <MyLinksCard slug={current.slug} tenantId={current.id} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Top tabs só no desktop — no mobile a navegação é o bottom nav fixo */}
          <TabsList className="hidden w-full grid-cols-6 sm:grid">
            <TabsTriggerGuarded value="bio" label="Link na Bio" canAccess={accessBio.canAccess} />
            <TabsTriggerGuarded value="captura" label="Captura" canAccess={accessCaptura.canAccess} />
            <TabsTriggerGuarded value="imersivo" label="Diagnóstico Imersivo" canAccess={accessImersivo.canAccess} />
            <TabsTriggerGuarded value="imagens" label="Imagens" canAccess={accessImagens.canAccess} />
            <TabsTriggerGuarded value="metricas" label="Métricas" canAccess={accessMetricas.canAccess} />
            <TabsTriggerGuarded value="leads" label="Leads" canAccess={accessLeads.canAccess} />
          </TabsList>

          {/* Aba 1 — Captura (BUILD AGORA) com sub-bloco Integrações (ESTRUTURA AGORA) pendurado embaixo */}
          <TabsContent value="captura" className="mt-6 space-y-4">
            {accessCaptura.canAccess ? (
              <>
                <CaptureConfigForm tenantId={current.id} />
                <WhatsAppNumbersManager tenantId={current.id} />
              </>
            ) : (
              <UpgradeBlock title="Captura" />
            )}

            {accessIntegracoes.canAccess ? (
              <PlaceholderTab
                title="Integrações"
                description="Em breve você conecta WhatsApp, IA e outras ferramentas aqui pra automatizar seus funis."
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

          <TabsContent value="leads" className="mt-6">
            {accessLeads.canAccess ? (
              <LeadsTable tenantId={current.id} />
            ) : (
              <UpgradeBlock title="Leads" subtitle="Recurso exclusivo do plano Pro." />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom nav mobile — navegação fixa estilo app nativo (< sm) */}
      <MobileBottomNav
        items={mobileNavItems}
        active={activeTab}
        onSelect={setActiveTab}
      />
    </div>
  );
}

// =============================================================================
// Componentes locais
// =============================================================================

type MobileNavItem = {
  value: string;
  label: string;
  icon: LucideIcon;
  canAccess: boolean;
};

/**
 * Bottom nav mobile (< sm) — barra fixa no rodapé com as 6 seções do Painel.
 * - Mesmo estado do Tabs (activeTab/setActiveTab), só muda a apresentação.
 * - Seção bloqueada pelo plano fica desabilitada com cadeado (mesma regra
 *   do TabsTriggerGuarded do desktop).
 * - Respeita o safe-area do iPhone (home indicator) via env().
 */
const MobileBottomNav = ({
  items,
  active,
  onSelect,
}: {
  items: MobileNavItem[];
  active: string;
  onSelect: (value: string) => void;
}) => (
  <nav
    aria-label="Seções do painel"
    className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/20 bg-background/90 backdrop-blur-md sm:hidden"
  >
    <div className="flex items-stretch pb-[env(safe-area-inset-bottom)]">
      {items.map(({ value, label, icon: Icon, canAccess }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            disabled={!canAccess}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onSelect(value)}
            className={cn(
              "relative flex min-w-0 flex-1 flex-col items-center gap-1 pb-2.5 pt-3 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground",
              !canAccess && "cursor-not-allowed opacity-40",
            )}
          >
            {/* Indicador dourado da seção ativa */}
            {isActive && (
              <span
                className="absolute top-0 h-0.5 w-8 rounded-full bg-gradient-gold"
                aria-hidden
              />
            )}
            <span className="relative">
              <Icon className="h-6 w-6" aria-hidden />
              {!canAccess && (
                <Lock className="absolute -right-2 -top-1 h-3 w-3" aria-hidden />
              )}
            </span>
            <span className="max-w-full truncate px-0.5 text-xs leading-none">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);

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
  estrutura: "Em construção",
  referencia: "Em breve",
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
  <Card className="rounded-2xl border-gold/20 p-8 text-center sm:p-12">
    {etiqueta && (
      <span className="mb-4 inline-block rounded-xl border border-gold/40 bg-gold/5 px-3 py-1 text-[11px] uppercase tracking-widest text-gold">
        {ETIQUETA_LABEL[etiqueta]}
      </span>
    )}
    <h2 className="mb-3 font-display text-2xl">{title}</h2>
    <p className="mx-auto max-w-lg text-sm text-muted-foreground">{description}</p>
  </Card>
);

const UpgradeBlock = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <Card className="rounded-2xl border-gold/20 p-8 text-center sm:p-12">
    <Lock className="mx-auto mb-4 h-8 w-8 text-muted-foreground" aria-hidden />
    <h2 className="mb-3 font-display text-2xl">{title}</h2>
    <p className="mx-auto max-w-lg text-sm text-muted-foreground">
      {subtitle ?? "Esse recurso está disponível a partir do plano Pro."}
    </p>
    <p className="mt-6 text-[11px] uppercase tracking-widest text-gold">
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
  const headerRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef<HTMLDivElement>(null);

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

  const hasAvatar = !!(liveCfg?.avatar_url);
  const hasHeadline = !!(liveCfg?.headline);
  const hasActiveBlock = !!liveBlocks?.some((b) => b.is_active);
  const bioUrl = `${PUBLIC_BASE_URL}/${slug}`;

  return (
    <div className="space-y-6">
      <OnboardingChecklist
        hasAvatar={hasAvatar}
        hasHeadline={hasHeadline}
        hasActiveBlock={hasActiveBlock}
        bioUrl={bioUrl}
        onFocusHeader={() => headerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        onFocusBlocks={() => blocksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-6">
          <div ref={headerRef}>
            <BioHeaderEditorStandalone
              tenantId={tenantId}
              slug={slug}
              displayName={displayName}
              onCfgChange={handleCfgChange}
            />
          </div>
          <div ref={blocksRef}>
            <BioBlocksManagerStandalone
              tenantId={tenantId}
              onBlocksChange={handleBlocksChange}
            />
          </div>
          <CategoriesManager tenantId={tenantId} />
          <BioThemePickerStandalone tenantId={tenantId} />
          <BioMusicPickerStandalone tenantId={tenantId} />
          <PartnerCtasEditor tenantId={tenantId} slug={slug} />
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
    <span className="mb-3 inline-block rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-[11px] uppercase tracking-widest text-gold">
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
  const [editBriefingFunnel, setEditBriefingFunnel] = useState<import("@/hooks/useDeepDiagnostic").DeepFunnel | null>(null);

  const handleEditBriefing = (funnelId: string) => {
    const funnel = funnels.find((f) => f.id === funnelId);
    if (!funnel) return;
    setEditBriefingFunnel(funnel);
    setView("briefing");
  };

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
      <Card className="flex items-center justify-center rounded-2xl border-gold/20 p-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </Card>
    );
  }

  if (view === "briefing" && tenantId) {
    const { products: rawProducts, ...initialBriefingFields } = (editBriefingFunnel?.briefing as Record<string, any>) ?? {};
    return (
      <BriefingWizard
        tenantId={tenantId}
        initialBriefing={editBriefingFunnel ? (initialBriefingFields as Record<string, string>) : undefined}
        initialProducts={editBriefingFunnel ? (rawProducts as import("@/components/imersivo/BriefingWizard").BriefingProduct[]) : undefined}
        initialFunnelId={editBriefingFunnel?.id}
        onCancel={() => { setEditBriefingFunnel(null); setView("list"); }}
        onGenerated={(funnelId) => {
          setEditBriefingFunnel(null);
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
      onEditBriefing={handleEditBriefing}
      onDelete={handleDelete}
    />
  );
};
