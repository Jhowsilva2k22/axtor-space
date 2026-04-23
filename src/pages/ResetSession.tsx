import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ResetSession = () => {
  useEffect(() => {
    (async () => {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignora
      }
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // noop
      }
      setTimeout(() => {
        window.location.replace("/admin/login");
      }, 300);
    })();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">limpando sessão…</p>
    </div>
  );
};

export default ResetSession;