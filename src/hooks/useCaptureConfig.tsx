import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Onda 3 v2 Fase 2 — config do botão CTA do diagnóstico de Instagram.
 * Lê e atualiza `tenant_capture_config`. 1 linha por tenant (UNIQUE).
 *
 * RLS: só owner do tenant ou admin lê/escreve.
 * Fallback defensivo: se a tabela ainda não existir no ambiente (rollout em ondas),
 * retorna defaults seguros e loga warning.
 */

export type ButtonStyle = "gold-pulse" | "green-pulse" | "flat";
export type LeadDestinationType = "crm" | "sheet" | "email" | "whatsapp";

export type CaptureConfig = {
  id?: string;
  tenant_id: string;
  button_label: string;
  button_style: ButtonStyle;
  lead_destination_type: LeadDestinationType;
  lead_destination_url: string | null;
  cta_redirect_url: string | null;
};

const DEFAULT_CONFIG = (tenantId: string): CaptureConfig => ({
  tenant_id: tenantId,
  button_label: "Quero meu diagnóstico gratuito",
  button_style: "gold-pulse",
  lead_destination_type: "email",
  lead_destination_url: null,
  cta_redirect_url: null,
});

export const useCaptureConfig = (tenantId: string | null) => {
  const queryClient = useQueryClient();

  const queryKey = ["captureConfig", tenantId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<CaptureConfig> => {
      if (!tenantId) return DEFAULT_CONFIG("");

      const { data, error } = await supabase
        .from("tenant_capture_config" as never)
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (error) {
        console.warn("[useCaptureConfig] erro ao ler tenant_capture_config, fallback:", error);
        return DEFAULT_CONFIG(tenantId);
      }

      return (data as unknown as CaptureConfig) ?? DEFAULT_CONFIG(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 30_000, // 30s
  });

  const save = useMutation({
    mutationFn: async (config: CaptureConfig): Promise<CaptureConfig> => {
      if (!tenantId) throw new Error("tenantId obrigatório pra salvar");

      // upsert por tenant_id (UNIQUE constraint)
      const { data, error } = await supabase
        .from("tenant_capture_config" as never)
        .upsert(
          {
            tenant_id: tenantId,
            button_label: config.button_label,
            button_style: config.button_style,
            lead_destination_type: config.lead_destination_type,
            lead_destination_url: config.lead_destination_url,
            cta_redirect_url: config.cta_redirect_url,
          } as never,
          { onConflict: "tenant_id" },
        )
        .select()
        .single();

      if (error) {
        console.error("[useCaptureConfig] erro ao salvar:", error);
        throw error;
      }

      return data as unknown as CaptureConfig;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKey, saved);
    },
  });

  return {
    config: query.data ?? (tenantId ? DEFAULT_CONFIG(tenantId) : null),
    loading: query.isLoading,
    error: query.error,
    save: save.mutateAsync,
    saving: save.isPending,
  };
};
