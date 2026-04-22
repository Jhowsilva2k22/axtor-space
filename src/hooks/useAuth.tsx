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

    const rolePromise = supabase
      .rpc("has_role", { _user_id: uid, _role: "admin" })
      .then(({ data, error }) => {
        if (error) return false;
        return !!data;
      })
      .catch(() => false);

    return Promise.race([rolePromise, timeoutPromise]);
  };

  useEffect(() => {
    let unmounted = false;
    let authCheckVersion = 0;

    const syncAuthState = (s: Session | null) => {
      const currentVersion = ++authCheckVersion;

      setSession(s);
      setUser(s?.user ?? null);

      window.setTimeout(() => {
        void checkAdmin(s?.user?.id).then((admin) => {
          if (unmounted || currentVersion !== authCheckVersion) return;
          setIsAdmin(admin);
          setLoading(false);
        });
      }, 0);
    };

    // Listener primeiro (síncrono). Roda também no INITIAL_SESSION.
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (unmounted) return;
      syncAuthState(s);
    });

    // Fallback: se por algum motivo o auth não responder rápido, libera o app
    // (assim a página não fica eternamente em "loading" após hard refresh).
    const safety = setTimeout(() => {
      if (!unmounted) setLoading(false);
    }, 4000);

    // Garante que pegamos a sessão mesmo se o evento já passou
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (unmounted) return;
      syncAuthState(s);
    }).catch(() => {
      if (unmounted) return;
      setIsAdmin(false);
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