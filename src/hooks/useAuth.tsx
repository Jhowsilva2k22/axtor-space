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
  // Marca quando já temos uma resposta definitiva da sessão (do getSession()).
  // Antes disso NUNCA devemos considerar o usuário como deslogado, senão um
  // hard refresh (Ctrl+Shift+R) joga o cara pra /admin/login indevidamente
  // só porque o listener ainda não rodou.
  const [sessionResolved, setSessionResolved] = useState(false);

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
    let authCheckVersion = 0;

    const syncAuthState = (s: Session | null, fromGetSession = false) => {
      const currentVersion = ++authCheckVersion;

      setSession(s);
      setUser(s?.user ?? null);
      if (fromGetSession) setSessionResolved(true);

      window.setTimeout(() => {
        void checkAdmin(s?.user?.id).then((admin) => {
          if (unmounted || currentVersion !== authCheckVersion) return;
          setIsAdmin(admin);
          // Só liberamos `loading` depois que o getSession() respondeu.
          // Caso contrário, eventos transitórios do listener podem nos
          // fazer renderizar a árvore com user=null e disparar redirect.
          if (fromGetSession) setLoading(false);
        });
      }, 0);
    };

    // Listener primeiro (síncrono). Roda também no INITIAL_SESSION.
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (unmounted) return;
      syncAuthState(s, false);
    });

    // Fallback de segurança: se o getSession() travar muito tempo,
    // libera o app SEM forçar logout (mantém user/session do listener).
    const safety = setTimeout(() => {
      if (!unmounted) {
        setSessionResolved(true);
        setLoading(false);
      }
    }, 8000);

    // Garante que pegamos a sessão mesmo se o evento já passou
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (unmounted) return;
      syncAuthState(s, true);
    }).catch(() => {
      if (unmounted) return;
      setIsAdmin(false);
      setSessionResolved(true);
      setLoading(false);
    });

    return () => {
      unmounted = true;
      clearTimeout(safety);
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