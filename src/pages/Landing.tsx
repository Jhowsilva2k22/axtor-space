import { Link } from "react-router-dom";
import { DottedSurface } from "@/components/landing/DottedSurface";
import { HeroPaths } from "@/components/landing/HeroPaths";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { Pricing, type PricingPlan } from "@/components/landing/Pricing";
import { GlowCard } from "@/components/landing/GlowCard";

const plans: PricingPlan[] = [
  {
    name: "Free",
    price: "0",
    yearlyPrice: "0",
    period: "mês",
    features: [
      "Link-in-bio (até 3 blocos)",
      "Sua página no ar em minutos",
      "Captura de leads",
      "Diagnóstico de Instagram",
      "5 créditos de IA / mês",
    ],
    description: "Pra colocar sua bio no ar hoje.",
    buttonText: "Começar grátis",
    href: "/signup",
    isPopular: false,
  },
  {
    name: "Pro",
    price: "47",
    yearlyPrice: "38",
    period: "mês",
    features: [
      "Tudo do Free",
      "75 créditos de IA / mês",
      "Diagnóstico imersivo (1 funil)",
      "Exportar leads (CSV)",
      'Marca "Axtor" removida',
    ],
    description: "Pra quem já capta e quer qualificar.",
    buttonText: "Assinar agora",
    href: "/loja?plan=pro",
    isPopular: true,
  },
  {
    name: "Premium",
    price: "127",
    yearlyPrice: "102",
    period: "mês",
    features: [
      "Tudo do Pro",
      "200 créditos de IA / mês",
      "Diagnóstico imersivo (5 funis)",
      "Domínio próprio · Analytics+",
      "Suporte prioritário",
    ],
    description: "Pra quem trabalha com volume.",
    buttonText: "Assinar agora",
    href: "/loja?plan=premium",
    isPopular: false,
  },
];

const comparison: Array<{
  label: string;
  free: string;
  pro: string;
  premium: string;
}> = [
  { label: "Créditos de IA / mês", free: "5", pro: "75", premium: "200" },
  {
    label: "Link-in-bio (blocos e botões)",
    free: "Até 3 blocos",
    pro: "Ilimitado",
    premium: "Ilimitado",
  },
  { label: "Captura de leads", free: "Sim", pro: "Sim", premium: "Sim" },
  { label: "Exportar leads (CSV)", free: "—", pro: "Sim", premium: "Sim" },
  { label: "Diagnóstico imersivo", free: "—", pro: "Sim", premium: "Sim" },
  { label: "Funis imersivos ativos", free: "—", pro: "1", premium: "5" },
  { label: "Domínio próprio", free: "—", pro: "—", premium: "Sim" },
  {
    label: "Suporte",
    free: "Comunidade",
    pro: "E-mail",
    premium: "Prioritário",
  },
];

const dores: string[] = [
  "Entra gente na bio o tempo todo e você não sabe quem é.",
  "O seguidor clica, olha e vai embora sem deixar nada.",
  "Bio cheia de botão, nenhuma forma de capturar quem chegou.",
  'Você responde "oi, como funciona?" o dia inteiro, um por um.',
  "Tráfego pago rodando e nenhum retorno que dê pra medir.",
];

const confianca: Array<{ titulo: string; texto: string }> = [
  { titulo: "Comece sem cartão", texto: "O Free é grátis pra sempre." },
  {
    titulo: "Seus dados protegidos",
    texto: "Tratados conforme a LGPD, com Política e Termos.",
  },
  { titulo: "No ar em minutos", texto: "Publica e já compartilha o link." },
  {
    titulo: "Feito pra vender no Brasil",
    texto: "Receba por Pix direto na página.",
  },
];

const faq: Array<{ q: string; a: string }> = [
  {
    q: "Preciso saber programar ou ter site?",
    a: "Não. Cria, escreve e publica. A página já sobe no seu link/domínio.",
  },
  {
    q: "Serve pra quem tá começando?",
    a: "Sim. O Free já entrega bio, captura e diagnóstico de Instagram, de graça.",
  },
  {
    q: "Como funcionam os créditos?",
    a: "Cada ação de IA gasta crédito. Bio e captura são ilimitadas. A cota renova todo mês; crédito avulso vale 12 meses.",
  },
  {
    q: "E se eu não gostar?",
    a: "No Free não tem risco: grátis e sem cartão. Nos pagos, reembolso em até 7 dias.",
  },
  {
    q: "Posso receber pagamento na página?",
    a: "Sim, por Pix, a partir do plano Pro.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Sem fidelidade, sem multa.",
  },
];

const Landing = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <DottedSurface />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_30%,transparent_40%,hsl(var(--background)/0.55)_100%)]" />

      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/55 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="text-lg font-extrabold tracking-tight">
            axtor<span className="text-primary">.</span>
            <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              space
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/admin/login"
              className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-primary"
            >
              entrar
            </Link>
            <Link
              to="/signup"
              className="inline-flex h-10 items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow px-4 text-xs font-bold text-primary-foreground"
            >
              criar grátis
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <HeroPaths
          title="Tenha seu próprio diagnóstico de captura "
          accent="para qualquer nicho."
          subtitle="Um diagnóstico inteligente que captura e qualifica cada visitante, com o seu link na bio como hub. Escolha seu plano e comece hoje."
        />

        {/* DOR */}
        <section className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-center text-lg text-muted-foreground">
            Você posta, manda o lead pro link… e no fim do mês não tem um lead
            na mão.
          </p>
          <ul className="mx-auto mt-6 max-w-xl space-y-2">
            {dores.map((d, i) => (
              <li key={i} className="flex gap-3 text-muted-foreground">
                <span className="text-primary">—</span>
                {d}
              </li>
            ))}
          </ul>
        </section>

        {/* BENTO */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Da visita{" "}
              <span className="bg-gradient-to-r from-primary-glow to-primary bg-clip-text text-transparent">
                ao lead qualificado.
              </span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Seu link na bio é a entrada, o diagnóstico qualifica e o lead cai
              na sua mão. Você só usa crédito quando aciona a IA.
            </p>
          </div>
          <BentoGrid />
        </section>

        {/* PLANOS */}
        <section id="planos" className="mx-auto max-w-6xl px-6 py-16">
          <Pricing plans={plans} />
          <p className="mt-7 text-center text-sm text-muted-foreground">
            Estourou a cota? Créditos avulsos: 50 por R$ 39 · 150 por R$ 99 ·
            400 por R$ 249 (valem 12 meses).
          </p>
          <p className="mt-3 text-center text-xs text-muted-foreground/70">
            Garantia de 7 dias nos planos pagos · preços de lançamento
          </p>
        </section>

        {/* CONFIANÇA */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <GlowCard className="p-8 text-center md:p-12">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Em lançamento
            </div>
            <h3 className="mx-auto mt-5 max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
              Seja um dos{" "}
              <span className="bg-gradient-to-r from-primary-glow to-primary bg-clip-text text-transparent">
                primeiros
              </span>{" "}
              a usar.
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Sem promessa, sem letra miúda. Só o que já é real hoje:
            </p>
            <div className="mx-auto mt-8 grid max-w-3xl gap-5 text-left sm:grid-cols-2 md:grid-cols-4">
              {confianca.map((c, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="h-4 w-4 flex-shrink-0 stroke-primary">
                      <path strokeLinecap="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="font-semibold">{c.titulo}</p>
                  </div>
                  <p className="mt-1 pl-6 text-sm text-foreground/70">{c.texto}</p>
                </div>
              ))}
            </div>
          </GlowCard>
        </section>

        {/* COMPARATIVO */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-10 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Compare os planos
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="bg-secondary/60">
                  <th className="p-4 text-left font-semibold uppercase tracking-wide">
                    Recurso
                  </th>
                  <th className="p-4 font-semibold uppercase tracking-wide">
                    Free
                  </th>
                  <th className="bg-primary/[0.06] p-4 font-semibold uppercase tracking-wide">
                    Pro
                  </th>
                  <th className="p-4 font-semibold uppercase tracking-wide">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={i} className="border-t border-border transition-colors hover:bg-primary/[0.08]">
                    <td className="p-4 text-left">{row.label}</td>
                    <td className="p-4 text-center text-muted-foreground">
                      {row.free}
                    </td>
                    <td className="bg-primary/[0.06] p-4 text-center font-medium text-primary">
                      {row.pro}
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      {row.premium}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="mb-10 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Perguntas frequentes
          </h2>
          <div className="space-y-3">
            {faq.map((item, i) => (
              <details
                key={i}
                data-glow
                className="group rounded-2xl border border-border bg-card/70"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold">
                  {item.q}
                  <span className="text-2xl text-primary transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-6 py-10">
          <div data-glow style={{ ["--glow-radius" as string]: "24" } as React.CSSProperties} className="rounded-3xl border border-border p-14 text-center backdrop-blur [background:radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_70%),hsl(var(--card)/0.7)]">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Sua bio pode trabalhar{" "}
              <span className="bg-gradient-to-r from-primary-glow to-primary bg-clip-text text-transparent">
                por você
              </span>{" "}
              hoje.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Crie grátis em minutos. Sem cartão.
            </p>
            <Link
              to="/signup"
              className="mt-7 inline-flex h-12 items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow px-7 text-sm font-bold text-primary-foreground"
            >
              Criar minha página grátis
            </Link>
          </div>
        </section>

        <footer className="mx-auto max-w-5xl px-6 py-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground/60">
            © {new Date().getFullYear()} axtor space ·{" "}
            <Link to="/termos" className="hover:text-primary">
              Termos
            </Link>{" "}
            ·{" "}
            <Link to="/privacidade" className="hover:text-primary">
              Privacidade
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Landing;
