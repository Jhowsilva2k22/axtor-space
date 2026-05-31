import { Check, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  userEmail?: string;
  userName?: string;
};

export const WelcomeOnboarding = ({ userEmail, userName }: Props) => {
  const rawName = userName || userEmail?.split("@")[0] || "você";
  const firstName = rawName.split(/[\s._-]/)[0];
  const initial = firstName[0]?.toUpperCase() ?? "A";

  return (
    <div className="min-h-screen bg-background">
      {/* Topo */}
      <div className="border-b border-border/40 px-6 py-4">
        <p className="font-display text-lg tracking-tight">axtor space</p>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-14">
        {/* Saudação */}
        <div className="mb-14 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 font-display text-2xl text-gold">
            {initial}
          </div>
          <h1 className="font-display text-4xl leading-tight">
            Bem-vindo à Axtor Space
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Olá, <span className="font-medium text-foreground">{firstName}</span>. Vamos colocar sua presença digital profissional no ar.
          </p>
        </div>

        {/* Conteúdo em duas colunas */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          {/* Coluna esquerda — descrição */}
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1.5 text-[10px] uppercase tracking-widest text-gold">
              <Sparkles className="h-3 w-3" />
              Página de Captura
            </div>

            <h2 className="font-display text-3xl leading-tight">
              Sua landing page de{" "}
              <span className="text-gold italic">diagnóstico profissional</span>
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Uma página elegante que apresenta quem você é, qual transformação você entrega e convida seu público a dar o próximo passo — tudo em um link.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                "Headline e bio personalizadas por você",
                "Botão CTA com estilo e texto editável",
                "Captura de lead direta na página",
                "Link único para compartilhar no Instagram",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
                    <Check className="h-3 w-3 text-gold" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <Button asChild className="mt-8 h-12 w-full sm:w-auto sm:min-w-[200px]">
              <a href="/signup">Criar minha bio agora</a>
            </Button>

            <p className="mt-3 text-center text-[11px] text-muted-foreground sm:text-left">
              Leva menos de 3 minutos · Gratuito para começar
            </p>
          </div>

          {/* Coluna direita — mockup da página de captura */}
          <div className="flex justify-center">
            <div className="w-full max-w-[300px] overflow-hidden rounded-2xl border border-border bg-zinc-950 shadow-2xl shadow-black/40">
              {/* Barra de navegador */}
              <div className="flex items-center gap-1.5 border-b border-white/5 bg-zinc-900 px-3 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="ml-2 flex-1 rounded-sm bg-zinc-800 px-2 py-0.5 text-[9px] text-zinc-500">
                  axtor.space/seu-nome
                </span>
              </div>

              {/* Conteúdo simulado da capture page */}
              <div className="space-y-4 p-5">
                {/* Avatar + nome */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-800">
                    <User className="h-5 w-5 text-zinc-500" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-24 rounded-full bg-zinc-700" />
                    <div className="h-2 w-16 rounded-full bg-zinc-800" />
                  </div>
                </div>

                {/* Headline */}
                <div className="space-y-1.5">
                  <div className="h-3 w-full rounded-full bg-zinc-700" />
                  <div className="h-3 w-4/5 rounded-full bg-zinc-700" />
                  <div className="h-3 w-3/5 rounded-full bg-zinc-800" />
                </div>

                {/* Sub-headline */}
                <div className="space-y-1">
                  <div className="h-2 w-full rounded-full bg-zinc-800" />
                  <div className="h-2 w-5/6 rounded-full bg-zinc-800" />
                  <div className="h-2 w-4/6 rounded-full bg-zinc-800" />
                </div>

                {/* Tagline em itálico */}
                <div className="rounded-md border border-white/5 bg-white/[0.03] px-3 py-2">
                  <div className="h-2 w-5/6 rounded-full bg-zinc-700/60" />
                  <div className="mt-1.5 h-2 w-3/6 rounded-full bg-zinc-700/40" />
                </div>

                {/* Botão CTA dourado */}
                <div className="relative overflow-hidden rounded-md bg-gradient-to-r from-amber-600 to-yellow-500 px-4 py-3 text-center">
                  <div className="h-2.5 w-36 mx-auto rounded-full bg-amber-900/40" />
                  {/* Shimmer simulado */}
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                {/* Campo de nome */}
                <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2">
                  <div className="h-2 w-20 rounded-full bg-zinc-700" />
                </div>

                {/* Campo de email */}
                <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2">
                  <div className="h-2 w-28 rounded-full bg-zinc-700" />
                </div>

                {/* Botão de envio */}
                <div className="rounded-md bg-zinc-800 px-4 py-3 text-center">
                  <div className="h-2.5 w-28 mx-auto rounded-full bg-zinc-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé de contexto */}
        <div className="mt-16 grid grid-cols-1 gap-6 border-t border-border/40 pt-10 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Crie sua bio",
              desc: "Escolha seu @slug e configure nome, avatar e headline.",
            },
            {
              step: "02",
              title: "Personalize a captura",
              desc: "Edite textos, botão e onde os leads chegam.",
            },
            {
              step: "03",
              title: "Compartilhe",
              desc: "Um link no Instagram já começa a trazer leads.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4">
              <span className="shrink-0 font-display text-2xl text-gold/40">{step}</span>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
