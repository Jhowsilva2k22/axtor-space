import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 20;

export type LeadStatus = "pending" | "completed" | "failed" | string;

export type Lead = {
  id: string;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  instagram_handle: string | null;
  pain_detected: string | null;
  status: string | null;
  created_at: string;
};

export type LeadsFilters = {
  status: string;
  dateFrom: string;
  dateTo: string;
};

const DEFAULT_FILTERS: LeadsFilters = {
  status: "",
  dateFrom: "",
  dateTo: "",
};

export function useLeads(tenantId: string) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadsFilters>(DEFAULT_FILTERS);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchLeads = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("deep_diagnostics")
      .select(
        "id, lead_name, lead_email, lead_phone, instagram_handle, pain_detected, status, created_at",
        { count: "exact" },
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
    if (filters.dateTo) {
      const endOfDay = new Date(filters.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte("created_at", endOfDay.toISOString());
    }

    const { data, count, error } = await query;

    if (!error) {
      setLeads((data as Lead[]) ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [tenantId, page, filters, refreshKey]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const applyFilters = useCallback((next: LeadsFilters) => {
    setPage(0);
    setFilters(next);
  }, []);

  // Força re-fetch voltando para página 0 (funciona mesmo que page já seja 0)
  const refresh = useCallback(() => {
    setPage(0);
    setRefreshKey((k) => k + 1);
  }, []);

  const deleteLeads = useCallback(
    async (ids: string[], password: string): Promise<{ error?: string }> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user?.email)
        return { error: "Sessão expirada. Faça login novamente." };

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (authError) return { error: "Senha incorreta. Tente novamente." };

      const { error: deleteError } = await supabase
        .from("deep_diagnostics")
        .delete()
        .in("id", ids)
        .eq("tenant_id", tenantId);

      if (deleteError) return { error: "Erro ao excluir os leads. Tente novamente." };

      return {};
    },
    [tenantId],
  );

  const exportCsv = useCallback(async () => {
    let query = supabase
      .from("deep_diagnostics")
      .select(
        "id, lead_name, lead_email, lead_phone, instagram_handle, pain_detected, status, created_at",
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
    if (filters.dateTo) {
      const endOfDay = new Date(filters.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte("created_at", endOfDay.toISOString());
    }

    const { data, error } = await query;
    if (error || !data) return;

    const headers = ["ID", "Nome", "E-mail", "Telefone", "Instagram", "Dor detectada", "Status", "Data"];
    const rows = (data as Lead[]).map((r) => [
      r.id,
      r.lead_name ?? "",
      r.lead_email ?? "",
      r.lead_phone ?? "",
      r.instagram_handle ?? "",
      r.pain_detected ?? "",
      r.status ?? "",
      new Date(r.created_at).toLocaleString("pt-BR"),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [tenantId, filters]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return {
    leads,
    total,
    loading,
    page,
    setPage,
    totalPages,
    filters,
    applyFilters,
    exportCsv,
    deleteLeads,
    refresh,
    pageSize: PAGE_SIZE,
  };
}
