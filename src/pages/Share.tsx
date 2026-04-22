import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

const PROXY = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image?url=`;
const proxied = (url?: string) => (url ? PROXY + encodeURIComponent(url) : "");

const SharePage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    (async () => {
      const { data: diag, error } = await supabase
        .from("diagnostics")
        .select("instagram_handle, profile_data, scores, insights, ai_summary, status")
        .eq("id", id)
        .maybeSingle();
      if (error || !diag || diag.status !== "completed") {
        setNotFound(true);
      } else {
        setData(diag);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center grain">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center grain">
        <h1 className="font-display text-4xl">Diagnóstico não encontrado</h1>
        <p className="text-muted-foreground">Esse link expirou ou nunca existiu.</p>
        <Link to="/" className="btn-luxe inline-flex h-12 items-center gap-2 rounded-sm px-8 text-sm font-semibold uppercase tracking-[0.15em]">
          Fazer meu diagnóstico <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const profile = (data.profile_data ?? {}) as any;
  const insights = (data.insights ?? {}) as any;
  const score = insights.score_geral ?? 0;

  return (
    <div className="relative min-h-screen overflow-hidden grain">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <main className="relative z-10 mx-auto max-w-2xl px-6 py-16 text-center">
        <span className="sheen inline-flex items-center gap-2 rounded-sm border border-gold bg-gradient-gold-soft px-5 py-2 text-xs uppercase tracking-[0.3em] text-primary">
          <Sparkles className="h-3 w-3" />
          <span>diagnóstico compartilhado</span>
        </span>

        <div className="mt-10 flex flex-col items-center gap-4">
          {profile.profilePicUrl && (
            <img
              src={proxied(profile.profilePicUrl)}
              alt={profile.username}
              className="h-20 w-20 rounded-full border border-primary/40 object-cover"
              onError={(e) => ((e.currentTarget.style.display = "none"))}
            />
          )}
          <h1 className="font-display text-3xl">@{data.instagram_handle}</h1>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-sm border-gold-gradient p-10 shadow-deep">
          <div className="pointer-events-none absolute inset-0 bg-gradient-gold-soft opacity-60" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">nota geral</p>
            <div className="mt-4 font-display text-8xl text-gold sm:text-9xl">{score}</div>
            <p className="text-sm text-muted-foreground">de 100</p>
            {data.ai_summary && (
              <p className="mx-auto mt-6 max-w-xl text-base italic text-foreground/90">
                "{data.ai_summary}"
              </p>
            )}
          </div>
        </div>

        <div className="mt-12 rounded-sm border-gold-gradient p-8">
          <h2 className="font-display text-3xl">
            Quer ver <span className="text-gold italic">o seu</span>?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Cole seu @ e receba um diagnóstico real do seu Instagram em 30 segundos. Grátis.
          </p>
          <Link
            to="/"
            className="btn-luxe mt-6 inline-flex h-12 items-center gap-2 rounded-sm px-8 text-sm font-semibold uppercase tracking-[0.15em]"
          >
            Analisar meu perfil <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
};

export default SharePage;
