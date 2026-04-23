import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (uid: string | undefined) => {
    if (!uid) return false;

    const timeoutPromise = new Promise<boolean>((resolve) => {
      window.setTimeout(() => resolve(false), 2500);
    });

    const rolePromise = (async () => {
      try {
        const { data, error } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
        if (error) return false;
        return !!data;
      } catch {
        return false;
      }
    })();

    return Promise.race<boolean>([rolePromise, timeoutPromise]);
  };

  useEffect(() => {
    let unmounted = false;
    let hydrated = false;
    // Guarda o último uid resolvido. Eventos como TOKEN_REFRESHED disparam
    // onAuthStateChange com o mesmo user — não devemos re-checar role nem
    // re-renderizar consumidores (evita "voltar pra home" e "deslogar" ao
    // minimizar/trocar de aba e voltar).
    let lastUid: string | null = null;
    let lastAdminUid: string | null = null;

    const applySession = (s: Session | null) => {
      if (unmounted) return;
      setSession(s);
      setUser(s?.user ?? null);
    };

    const syncAdmin = async (uid: string | undefined) => {
      if (!uid) {
        if (!unmounted) setIsAdmin(false);
        lastAdminUid = null;
        return;
      }
      // Só refaz a checagem se o uid mudou. TOKEN_REFRESHED não muda usuário.
      if (lastAdminUid === uid) return;
      const admin = await checkAdmin(uid);
      if (unmounted) return;
      lastAdminUid = uid;
      setIsAdmin(admin);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((evt, s) => {
      const uid = s?.user?.id ?? null;
      console.log("[auth] onAuthStateChange", evt, "user:", s?.user?.email ?? null);

      // TOKEN_REFRESHED / USER_UPDATED com mesmo uid: só atualiza session
      // silenciosamente, sem re-render em cascata. Isso protege de logout
      // fantasma quando a aba volta do background.
      if ((evt === "TOKEN_REFRESHED" || evt === "USER_UPDATED") && uid && uid === lastUid) {
        if (!unmounted) setSession(s);
        return;
      }

      lastUid = uid;
      applySession(s);
      void syncAdmin(uid ?? undefined);
      if (hydrated && !unmounted) setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(async ({ data: { session: s } }) => {
        console.log("[auth] getSession resolved, user:", s?.user?.email ?? null);
        lastUid = s?.user?.id ?? null;
        applySession(s);
        await syncAdmin(s?.user?.id);
      })
      .catch(() => {
        console.warn("[auth] getSession failed");
        if (unmounted) return;
        setSession(null);
        setUser(null);
        setIsAdmin(false);
      })
      .finally(() => {
        hydrated = true;
        console.log("[auth] hydrated → loading=false");
        if (!unmounted) setLoading(false);
      });

    return () => {
      unmounted = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return (
    <Ctx.Provider value={{ user, session, isAdmin, loading, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth deve estar dentro de AuthProvider");
  return v;
};