import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_PAGE_SIZE = 7;

export type LeadStatus = "pending" | "completed" | "failed" | string;

export type Lead = {
  id: string;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  instagram_handle: string | null;
  source: string | null;
  status: string | null;
  diagnostics_count: number | null;
  last_activity_at: string | null;
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
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadsFilters>(DEFAULT_FILTERS);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchLeads = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("leads")
      .select(
        "id, lead_name:full_name, lead_email:email, lead_phone:phone, instagram_handle, source, status, diagnostics_count, last_activity_at, created_at",
        { count: "exact" },
      )
      .eq("tenant_id", tenantId)
      .order("last_activity_at", { ascending: false, nullsFirst: false })
      .range(page * pageSize, page * pageSize + pageSize - 1);

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
  }, [tenantId, page, pageSize, filters, refreshKey]);

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
        .from("leads")
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
      .from("leads")
      .select(
        "id, lead_name:full_name, lead_email:email, lead_phone:phone, instagram_handle, source, status, diagnostics_count, last_activity_at, created_at",
      )
      .eq("tenant_id", tenantId)
      .order("last_activity_at", { ascending: false, nullsFirst: false });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
    if (filters.dateTo) {
      const endOfDay = new Date(filters.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte("created_at", endOfDay.toISOString());
    }

    const { data, error } = await query;
    if (error || !data) return;

    const headers = ["ID", "Nome", "E-mail", "Telefone", "Instagram", "Origem", "Diagnósticos", "Status", "Última atividade"];
    const rows = (data as Lead[]).map((r) => [
      r.id,
      r.lead_name ?? "",
      r.lead_email ?? "",
      r.lead_phone ?? "",
      r.instagram_handle ?? "",
      r.source ?? "",
      String(r.diagnostics_count ?? 0),
      r.status ?? "",
      new Date(r.last_activity_at ?? r.created_at).toLocaleString("pt-BR"),
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

  const setPageSize = useCallback((n: number) => {
    setPage(0);
    setPageSizeState(n);
  }, []);

  const totalPages = Math.ceil(total / pageSize);

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
    pageSize,
    setPageSize,
  };
}
