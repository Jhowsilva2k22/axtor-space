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

    if (isAdmin) {
      // Super admin enxerga todos os tenants ativos
      const { data } = await supabase
        .from("tenants")
        .select("id,slug,display_name,plan,status")
        .order("display_name", { ascending: true });
      rows = (data as AdminTenant[] | null) ?? [];
    } else {
      // Tenant owner enxerga só os tenants dele
      const { data } = await supabase
        .from("tenants")
        .select("id,slug,display_name,plan,status")
        .eq("owner_user_id", user.id)
        .order("display_name", { ascending: true });
      rows = (data as AdminTenant[] | null) ?? [];
    }

    setTenants(rows);

    // Resolve tenant atual: sessionStorage > primeiro disponível
    const stored = sessionStorage.getItem(SELECTED_KEY);
    const valid = stored && rows.some((t) => t.id === stored) ? stored : rows[0]?.id ?? null;
    setCurrentIdState(valid);
    if (valid) sessionStorage.setItem(SELECTED_KEY, valid);
    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  const setCurrentId = useCallback((id: string) => {
    setCurrentIdState(id);
    sessionStorage.setItem(SELECTED_KEY, id);
  }, []);

  const current = tenants.find((t) => t.id === currentId) ?? null;

  return (
    <C.Provider value={{ tenants, current, loading, setCurrentId, refresh: load }}>
      {children}
    </C.Provider>
  );
};

export const useCurrentTenant = () => useContext(C);
