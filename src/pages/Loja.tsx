import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const Loja = () => {
  const { user, loading: authLoading } = useAuth();
  const { current, loading: tenantLoading } = useCurrentTenant();
  const checkout = useStoreCheckout();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [proPlan, setProPlan] = useState<PlanFeature | null>(null);
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
          .eq("plan_slug", "pro")
          .maybeSingle(),
      ]);
      setAddons((addonsData as Addon[] | null) ?? []);
      setProPlan(planData as PlanFeature | null);
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

  if (!user) return <Navigate to="/admin/login" replace />;
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-10">
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
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Plano Pro */}
            <Card className="relative overflow-hidden p-8">
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-gold bg-gradient-gold-soft px-3 py-1 text-[9px] uppercase tracking-widest text-primary">
                <Sparkles className="h-3 w-3" /> Recomendado
              </span>
              <h2 className="font-display text-3xl">Plano Pro</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tudo do Free + recursos avançados.
              </p>
              <p className="mt-6 font-display text-5xl text-primary">
                {(proPlan?.price_monthly ?? 47).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
                <span className="ml-1 text-sm font-normal text-muted-foreground">/mês</span>
              </p>

              <ul className="mt-6 space-y-2 text-sm">
                {[
                  "Blocos ilimitados na bio",
                  "Diagnóstico Imersivo",
                  "Banco de mídia organizado",
                  "Métricas completas",
                  "Tema visual customizado",
                  "Sem selo Axtor na bio",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-gold" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-8 w-full btn-luxe"
                disabled={isAlreadyPro || checkout.isPending}
                onClick={() => buy({ planSlug: "pro" })}
              >
                {isAlreadyPro
                  ? "Você já é Pro"
                  : checkout.isPending
                    ? "Gerando Pix…"
                    : "Comprar com Pix"}
              </Button>
            </Card>

            {/* Addons */}
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-2xl">Addons</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recursos premium avulsos.
                </p>
              </div>

              {addons.length === 0 ? (
                <Card className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum addon disponível no momento.
                </Card>
              ) : (
                addons.map((addon) => {
                  const needsUpgradeFirst = addon.requires_plan === "pro" && !isAlreadyPro;
                  return (
                    <Card key={addon.slug} className="p-6">
                      <h3 className="font-display text-xl">{addon.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {addon.description}
                      </p>
                      <p className="mt-3 font-display text-2xl text-primary">
                        {addon.price_brl.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                      <Button
                        className="mt-4 w-full"
                        variant="outline"
                        disabled={checkout.isPending}
                        onClick={() => {
                          if (needsUpgradeFirst) {
                            if (
                              confirm(
                                `${addon.name} precisa do plano Pro mensal. Comprar Pro + Addon juntos?`,
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
                    </Card>
                  );
                })
              )}
            </div>
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
