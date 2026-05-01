import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { readPendingSignup, clearPendingSignup } from "@/lib/pendingSignup";

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

  const fetchTenants = useCallback(async (): Promise<AdminTenant[]> => {
    if (!user) return [];
    if (isAdmin) {
      const { data, error } = await supabase
        .from("tenants")
        .select("id,slug,display_name,plan,status")
        .order("display_name", { ascending: true });
      if (error) console.error("[useCurrentTenant] admin tenants query failed:", error);
      return (data as AdminTenant[] | null) ?? [];
    } else {
      const { data, error } = await supabase
        .from("tenants")
        .select("id,slug,display_name,plan,status")
        .eq("owner_user_id", user.id)
        .order("display_name", { ascending: true });
      if (error) console.error("[useCurrentTenant] owner tenants query failed:", error);
      return (data as AdminTenant[] | null) ?? [];
    }
  }, [user, isAdmin]);

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
      rows = await fetchTenants();
      console.log("[tenant] load() got", rows.length, "tenants");

      // Pós email-confirm: se user logou pela 1ª vez e ainda não tem tenant,
      // tenta finalizar o onboarding salvo em localStorage durante /signup.
      // Isso fecha o gap quando "Confirm email" está ON e o signUp não retorna sessão.
      if (rows.length === 0 && !isAdmin) {
        const pending = readPendingSignup();
        if (pending) {
          console.log("[tenant] pending signup detectado — criando tenant pós email-confirm");
          try {
            const { data: tdata, error: terr } = await supabase.rpc(
              "create_tenant_for_user" as any,
              {
                _slug: pending.slug,
                _display_name: pending.displayName,
                _invite_code: pending.inviteCode || null,
              } as any,
            );
            if (terr) {
              console.error("[tenant] create_tenant_for_user falhou:", terr);
            } else {
              console.log("[tenant] tenant criado via pending signup", tdata);
              clearPendingSignup();
              // Dispara welcome email (não bloqueia se falhar)
              try {
                const result = tdata as any;
                await supabase.functions.invoke("send-transactional-email", {
                  body: {
                    templateName: "welcome-tenant",
                    recipientEmail: pending.email,
                    idempotencyKey: `welcome-${result?.tenant_id}`,
                    templateData: {
                      name: pending.displayName,
                      bioUrl: result?.url,
                      adminUrl: `${window.location.origin}/admin`,
                      slug: result?.slug,
                      plan: result?.plan ?? "free",
                    },
                  },
                });
              } catch (welcomeErr) {
                console.error("welcome email failed:", welcomeErr);
              }
              // Re-query pra pegar o tenant recém-criado
              rows = await fetchTenants();
              console.log("[tenant] após create + refetch:", rows.length, "tenants");
            }
          } catch (e) {
            console.error("[tenant] erro ao processar pending signup:", e);
          }
        }
      }

      setTenants(rows);

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
      console.log("[tenant] load() done → loading=false");
      setLoading(false);
    }
  }, [user, isAdmin, fetchTenants]);

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
