import { useEffect, useState } from "react";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import { Loader2, ArrowLeft, Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BGPattern } from "@/components/BGPattern";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { supabase } from "@/integrations/supabase/client";
import {
  useStoreCheckout,
  type CreatePaymentResult,
} from "@/hooks/useStoreCheckout";
import { PixCheckoutModal } from "@/components/store/PixCheckoutModal";
import {
  PaymentDataModal,
  type PaymentSubmitData,
} from "@/components/store/PaymentDataModal";

/**
 * Onda 4 Fase 6 — Loja do tenant.
 *
 * Mostra:
 *  - Plano Pro mensal (R$ 47/mês)
 *  - Addons disponíveis (Diagnóstico Profundo R$ 197 etc)
 *  - Botão "Comprar com Pix" → abre modal com QR Code
 *  - Webhook do Asaas confirma → status do plano vira ativo no banco
 *
 * Acesso: qualquer user autenticado dono de um tenant.
 */

type Addon = {
  slug: string;
  name: string;
  description: string | null;
  price_brl: number;
  requires_plan: string | null;
};

type PlanFeature = {
  plan_slug: string;
  price_monthly: number | null;
};

// Metadados de exibição dos planos pagos (preço é confirmado no servidor).
const PLAN_META = {
  pro: {
    name: "Plano Pro",
    short: "Pro",
    sub: "Tudo do Free + recursos avançados.",
    price: 47,
    features: [
      "Tudo do Free",
      "75 créditos de IA / mês",
      "Diagnóstico imersivo (1 funil)",
      "Exportar leads (CSV)",
      'Marca "Axtor" removida',
    ],
  },
  premium: {
    name: "Plano Premium",
    short: "Premium",
    sub: "Tudo do Pro + volume e prioridade.",
    price: 127,
    features: [
      "Tudo do Pro",
      "200 créditos de IA / mês",
      "Diagnóstico imersivo (5 funis)",
      "Domínio próprio + Analytics+",
      "Suporte prioritário",
    ],
  },
} as const;

const Loja = () => {
  const { user, loading: authLoading } = useAuth();
  const { current, loading: tenantLoading } = useCurrentTenant();
  const checkout = useStoreCheckout();
  const [searchParams] = useSearchParams();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [proPlan, setProPlan] = useState<PlanFeature | null>(null);
  const [premiumPlan, setPremiumPlan] = useState<PlanFeature | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<CreatePaymentResult | null>(null);
  // Modal de coleta de dados (nome/CPF/email/consent) — abre antes do checkout
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<{
    planSlug?: string;
    addonSlug?: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: addonsData }, { data: planData }] = await Promise.all([
        supabase
          .from("addons_catalog")
          .select("slug, name, description, price_brl, requires_plan")
          .eq("is_active", true)
          .order("price_brl"),
        supabase
          .from("plan_features")
          .select("plan_slug, price_monthly")
          .in("plan_slug", ["pro", "premium"]),
      ]);
      const planRows = (planData as PlanFeature[] | null) ?? [];
      setAddons((addonsData as Addon[] | null) ?? []);
      setProPlan(planRows.find((p) => p.plan_slug === "pro") ?? null);
      setPremiumPlan(planRows.find((p) => p.plan_slug === "premium") ?? null);
      setLoading(false);
    })();
  }, []);

  if (authLoading || tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const qs = searchParams.toString();
    const back = "/loja" + (qs ? `?${qs}` : "");
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(back)}`} replace />;
  }
  if (!current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <Card className="max-w-md p-8 text-center">
          <h2 className="mb-3 font-display text-2xl">Sem tenant ativo</h2>
          <p className="text-sm text-muted-foreground">
            Você precisa de um tenant configurado pra acessar a loja.
          </p>
        </Card>
      </div>
    );
  }

  const isAlreadyPro =
    current.plan === "pro" ||
    current.plan === "partner" ||
    current.plan === "tester" ||
    current.plan === "owner";

  // Plano em destaque vem do ?plan= (default: pro). Preço real é do servidor.
  const selectedPlan: "pro" | "premium" =
    searchParams.get("plan") === "premium" ? "premium" : "pro";
  const hasPlanParam =
    searchParams.get("plan") === "pro" || searchParams.get("plan") === "premium";
  const internalPlans = ["partner", "tester", "owner"];

  // Click no botão "Comprar" — só registra a intenção e abre o modal de dados.
  // O checkout em si é disparado depois que o user submete o form com nome/CPF.
  const buy = (input: { planSlug?: string; addonSlug?: string }) => {
    setPendingPurchase(input);
    setDataModalOpen(true);
  };

  // Submissão do PaymentDataModal: aqui sim chama a Edge Function de checkout.
  const handlePaymentSubmit = async (data: PaymentSubmitData) => {
    if (!pendingPurchase || !current) return;
    setDataModalOpen(false);
    setModalOpen(true);
    setPaymentData(null);
    try {
      const result = await checkout.mutateAsync({
        tenantId: current.id,
        planSlug: pendingPurchase.planSlug,
        addonSlug: pendingPurchase.addonSlug,
        customerName: data.customerName,
        customerCpf: data.customerCpf,
        customerEmail: data.customerEmail || user.email || undefined,
      });
      setPaymentData(result);
    } catch (e) {
      setModalOpen(false);
      alert(`Erro: ${(e as Error).message}`);
    } finally {
      setPendingPurchase(null);
    }
  };

  return (
    <div className="relative isolate min-h-screen bg-background">
      <BGPattern />
      <div className="relative mx-auto max-w-5xl px-6 py-10">
        <Link
          to="/painel"
          className="mb-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" /> voltar ao painel
        </Link>

        <header className="mb-8">
          <h1 className="font-display text-4xl">Loja</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Faça upgrade do plano e adicione recursos avançados pra sua bio + funis.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Planos disponíveis — mostra Pro e Premium; destaca o do ?plan= */}
            <section>
              <h2 className="font-display text-2xl">Planos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Escolha o plano que combina com seu momento. Você só usa crédito quando aciona a IA.
              </p>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                {(["pro", "premium"] as const).map((p) => {
                  const meta = PLAN_META[p];
                  const data = p === "premium" ? premiumPlan : proPlan;
                  const already =
                    p === "premium"
                      ? current.plan === "premium" || internalPlans.includes(current.plan ?? "")
                      : ["pro", "premium", ...internalPlans].includes(current.plan ?? "");
                  const highlighted = p === selectedPlan;
                  return (
                    <Card
                      key={p}
                      data-glow
                      style={{ ["--glow-radius" as string]: "24" } as React.CSSProperties}
                      className={`relative overflow-hidden p-8 ${highlighted ? "border-2 border-gold shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.4)]" : ""}`}
                    >
                      {highlighted && (
                        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-gold bg-gradient-gold-soft px-3 py-1 text-[9px] uppercase tracking-widest text-primary">
                          <Sparkles className="h-3 w-3" /> {hasPlanParam ? "Escolhido" : "Recomendado"}
                        </span>
                      )}
                      <h3 className="font-display text-3xl">{meta.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{meta.sub}</p>
                      <p className="mt-6 font-display text-5xl text-primary">
                        {(data?.price_monthly ?? meta.price).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">/mês</span>
                      </p>

                      <ul className="mt-6 space-y-2 text-sm">
                        {meta.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 shrink-0 text-gold" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="mt-8 w-full btn-luxe"
                        disabled={already || checkout.isPending}
                        onClick={() => buy({ planSlug: p })}
                      >
                        {already
                          ? `Você já tem o ${meta.short}`
                          : checkout.isPending
                            ? "Gerando Pix…"
                            : `Assinar ${meta.short}`}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Pacotes avulsos — recarga de créditos */}
            <section>
              <h2 className="font-display text-2xl">Pacotes avulsos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Recarga de créditos pra quando a cota do mês acabar. Valem 12 meses.
              </p>
              {addons.length === 0 ? (
                <Card className="mt-5 p-6 text-center text-sm text-muted-foreground">
                  Nenhum pacote disponível no momento.
                </Card>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {addons.map((addon) => {
                    const needsUpgradeFirst = addon.requires_plan === "pro" && !isAlreadyPro;
                    const includedInPlan = addon.requires_plan === "pro" && isAlreadyPro;
                    return (
                      <Card
                        key={addon.slug}
                        data-glow
                        style={{ ["--glow-radius" as string]: "24" } as React.CSSProperties}
                        className="relative p-6"
                      >
                        <h3 className="font-display text-xl">{addon.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{addon.description}</p>
                        <p className="mt-3 font-display text-2xl text-primary">
                          {addon.price_brl.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                        {includedInPlan ? (
                          <p className="mt-4 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Incluído no seu plano
                          </p>
                        ) : (
                          <Button
                            className="mt-4 w-full"
                            variant="outline"
                            disabled={checkout.isPending}
                            onClick={() => {
                              if (needsUpgradeFirst) {
                                if (
                                  confirm(
                                    `${addon.name} precisa do plano Pro mensal. Comprar Pro + pacote juntos?`,
                                  )
                                ) {
                                  buy({ planSlug: "pro", addonSlug: addon.slug });
                                }
                              } else {
                                buy({ addonSlug: addon.slug });
                              }
                            }}
                          >
                            {checkout.isPending
                              ? "Gerando…"
                              : needsUpgradeFirst
                                ? "Comprar com Pro"
                                : "Comprar com Pix"}
                          </Button>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <PaymentDataModal
        open={dataModalOpen}
        onOpenChange={(v) => {
          setDataModalOpen(v);
          if (!v) setPendingPurchase(null);
        }}
        defaultName={current.display_name ?? ""}
        defaultEmail={user.email ?? ""}
        loading={checkout.isPending}
        onSubmit={handlePaymentSubmit}
      />

      <PixCheckoutModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        data={paymentData}
        loading={checkout.isPending && !paymentData}
      />
    </div>
  );
};

export default Loja;
