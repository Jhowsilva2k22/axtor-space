import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantSelector } from "@/components/TenantSelector";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { usePlanLimits } from "@/hooks/usePlanLimits";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  partner: "Sócio",
  tester: "Tester",
};

export default function Painel() {
  const [activeTab, setActiveTab] = useState("captura");
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { current, loading: tenantLoading } = useCurrentTenant();
  const { plan } = usePlanLimits();

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

  const planLabel = isAdmin ? "Dono" : PLAN_LABELS[plan] ?? plan;

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
            <TabsTrigger value="captura">Captura</TabsTrigger>
            <TabsTrigger value="bio">Link na Bio</TabsTrigger>
            <TabsTrigger value="imersivo">Diagnóstico Imersivo</TabsTrigger>
            <TabsTrigger value="imagens">Imagens</TabsTrigger>
            <TabsTrigger value="metricas">Métricas</TabsTrigger>
          </TabsList>

          <TabsContent value="captura" className="mt-6">
            <PlaceholderTab
              title="Captura"
              description="Controle do diagnóstico inicial de Instagram. Em breve: nome dos botões, links de destino, estilo do CTA, destino dos leads."
            />
          </TabsContent>

          <TabsContent value="bio" className="mt-6">
            <PlaceholderTab
              title="Link na Bio"
              description="Personalização do link-in-bio: blocos, ordem, cores, foto, links. Em breve: tudo que já existe hoje organizado aqui."
            />
          </TabsContent>

          <TabsContent value="imersivo" className="mt-6">
            <PlaceholderTab
              title="Diagnóstico Imersivo"
              description="Funil profundo: perguntas, produtos, pain_tags, CTAs. Em breve: editor completo."
            />
          </TabsContent>

          <TabsContent value="imagens" className="mt-6">
            <PlaceholderTab
              title="Imagens"
              description="Banco de imagens do tenant. Em breve: upload, organização, escolha por peça."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const PlaceholderTab = ({ title, description }: { title: string; description: string }) => (
  <Card className="p-12 text-center">
    <h2 className="mb-3 font-display text-2xl">{title}</h2>
    <p className="mx-auto max-w-lg text-sm text-muted-foreground">{description}</p>
    <p className="mt-6 text-[10px] uppercase tracking-widest text-muted-foreground/60">
      Conteúdo em construção · Fase 1 do roadmap
    </p>
  </Card>
);
