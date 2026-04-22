import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type State =
  | { kind: "loading" }
  | { kind: "valid" }
  | { kind: "already" }
  | { kind: "invalid"; message: string }
  | { kind: "submitting" }
  | { kind: "done" };

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid", message: "Link de descadastro inválido." });
      return;
    }
    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: anon } },
        );
        const data = await res.json();
        if (data.valid) setState({ kind: "valid" });
        else if (data.reason === "already_unsubscribed") setState({ kind: "already" });
        else setState({ kind: "invalid", message: data.error || "Token inválido ou expirado." });
      } catch {
        setState({ kind: "invalid", message: "Erro ao validar o link." });
      }
    };
    validate();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState({ kind: "submitting" });
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    if (error) {
      setState({ kind: "invalid", message: "Não foi possível concluir o descadastro." });
      return;
    }
    if (data?.success || data?.reason === "already_unsubscribed") {
      setState({ kind: "done" });
    } else {
      setState({ kind: "invalid", message: data?.error || "Erro ao processar." });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-background">
      <Card className="w-full max-w-md p-8 space-y-6 text-center border-border/40">
        <h1 className="font-display text-3xl text-primary">axtor</h1>

        {state.kind === "loading" && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Validando seu link…</p>
          </div>
        )}

        {state.kind === "valid" && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl text-foreground">Quer mesmo se descadastrar?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Você não vai receber mais emails da axtor neste endereço.
            </p>
            <Button onClick={confirm} className="w-full" size="lg">
              Confirmar descadastro
            </Button>
          </div>
        )}

        {state.kind === "submitting" && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Processando…</p>
          </div>
        )}

        {state.kind === "done" && (
          <div className="space-y-3">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
            <h2 className="font-display text-2xl text-foreground">Pronto.</h2>
            <p className="text-sm text-muted-foreground">
              Você foi descadastrada com sucesso. Não enviaremos mais emails.
            </p>
          </div>
        )}

        {state.kind === "already" && (
          <div className="space-y-3">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
            <h2 className="font-display text-2xl text-foreground">Já descadastrada</h2>
            <p className="text-sm text-muted-foreground">
              Esse email já estava removido da nossa lista.
            </p>
          </div>
        )}

        {state.kind === "invalid" && (
          <div className="space-y-3">
            <XCircle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="font-display text-2xl text-foreground">Link inválido</h2>
            <p className="text-sm text-muted-foreground">{state.message}</p>
          </div>
        )}
      </Card>
    </main>
  );
};

export default Unsubscribe;