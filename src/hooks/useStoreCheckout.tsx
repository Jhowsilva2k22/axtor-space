import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Onda 4 Fase 6 — chama a Edge Function `asaas-create-payment` pra gerar
 * cobrança Pix. Retorna QR Code + URL de fatura pra renderizar no modal.
 *
 * Apontamento configurável via env: por default usa o Supabase do projeto atual,
 * mas pode forçar uma URL específica se precisar (ex: testar em staging com
 * front em prod). A URL fallback é o Supabase URL ativo.
 */

export type CreatePaymentResult = {
  paymentId: string;
  invoiceUrl: string;
  qrCode: string | null; // base64 image
  qrCodeText: string | null; // copia-e-cola Pix
  expirationDate: string | null;
  valor: number;
  descricao: string;
};

export type CreatePaymentInput = {
  tenantId: string;
  planSlug?: string;
  addonSlug?: string;
  customerName?: string;
  customerEmail?: string;
  customerCpf?: string;
};

const FUNCTIONS_BASE = (() => {
  const supabaseUrl =
    (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
    "https://bdxkcfngskagriaapepo.supabase.co";
  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
})();

export const useStoreCheckout = () => {
  return useMutation({
    mutationFn: async (input: CreatePaymentInput): Promise<CreatePaymentResult> => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Sessão expirada — faça login novamente");

      const res = await fetch(`${FUNCTIONS_BASE}/asaas-create-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenant_id: input.tenantId,
          plan_slug: input.planSlug,
          addon_slug: input.addonSlug,
          customer_name: input.customerName,
          customer_email: input.customerEmail,
          customer_cpf: input.customerCpf,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "Falha ao criar cobrança");
      }
      return json as CreatePaymentResult;
    },
  });
};
