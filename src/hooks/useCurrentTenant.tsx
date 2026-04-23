import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AdminTenant = {
  id: string;
  slug: string;
  display_name: string;
  plan: string;
  status: string;
};

type Ctx = {
  tenants: AdminTenant[];
  current: AdminTenant | null;
  loading: boolean;
  setCurrentId: (id: string) => void;
  refresh: () => Promise<void>;
};

const C = createContext<Ctx>({
  tenants: [],
  current: null,
  loading: true,
  setCurrentId: () => {},
  refresh: async () => {},
});

const SELECTED_KEY = "admin-tenant-id-v1";

const readSelectedTenantId = () => {
  try {
    return sessionStorage.getItem(SELECTED_KEY);
  } catch {
    return null;
  }
};

const writeSelectedTenantId = (id: string | null) => {
  try {
    if (id) sessionStorage.setItem(SELECTED_KEY, id);
    else sessionStorage.removeItem(SELECTED_KEY);
  } catch {
    // ignore storage failures
  }
};

export const CurrentTenantProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [currentId, setCurrentIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setTenants([]);
      setCurrentIdState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let rows: AdminTenant[] = [];

    console.log("[tenant] load() start, isAdmin:", isAdmin);
    try {
      if (isAdmin) {
        // Super admin enxerga todos os tenants ativos
        const { data, error } = await supabase
          .from("tenants")
          .select("id,slug,display_name,plan,status")
          .order("display_name", { ascending: true });
        if (error) console.error("[useCurrentTenant] admin tenants query failed:", error);
        rows = (data as AdminTenant[] | null) ?? [];
      } else {
        // Tenant owner enxerga só os tenants dele
        const { data, error } = await supabase
          .from("tenants")
          .select("id,slug,display_name,plan,status")
          .eq("owner_user_id", user.id)
          .order("display_name", { ascending: true });
        if (error) console.error("[useCurrentTenant] owner tenants query failed:", error);
        rows = (data as AdminTenant[] | null) ?? [];
      }

      setTenants(rows);
      console.log("[tenant] load() got", rows.length, "tenants");

      // Resolve tenant atual: sessionStorage > primeiro disponível
      const stored = readSelectedTenantId();
      const valid = stored && rows.some((t) => t.id === stored) ? stored : rows[0]?.id ?? null;
      setCurrentIdState(valid);
      writeSelectedTenantId(valid);
    } catch (err) {
      console.error("[useCurrentTenant] load failed:", err);
      setTenants([]);
      setCurrentIdState(null);
    } finally {
      // CRÍTICO: sempre liberar loading, senão Admin.tsx trava em spinner.
      console.log("[tenant] load() done → loading=false");
      setLoading(false);
    }
  }, [user, isAdmin]);

  // Só recarrega quando user.id muda de verdade (login/logout). Mudanças de
  // referência do objeto user (por exemplo TOKEN_REFRESHED) NÃO devem
  // disparar reload — isso causava perda de estado/scroll ao voltar de
  // outra aba e em alguns casos parecia "deslogar".
  const userId = user?.id ?? null;
  useEffect(() => {
    if (authLoading) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, userId, isAdmin]);

  const setCurrentId = useCallback((id: string) => {
    setCurrentIdState(id);
    writeSelectedTenantId(id);
  }, []);

  const current = tenants.find((t) => t.id === currentId) ?? null;

  return (
    <C.Provider value={{ tenants, current, loading, setCurrentId, refresh: load }}>
      {children}
    </C.Provider>
  );
};

export const useCurrentTenant = () => useContext(C);
