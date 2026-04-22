import { Link } from "react-router-dom";
import { Sparkles, Check, ArrowRight, Zap, BarChart3, Palette } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Landing = () => {
  return (
    <div className="relative min-h-screen overflow-hidden grain">
      <div className="aurora-a" />
      <div className="aurora-b" />

      <ThemeToggle className="absolute right-5 top-5 z-20" />

      <header className="relative z-10 mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="font-display text-2xl">
            <span className="text-gold italic">axtor</span>
          </div>
          <Link
            to="/admin/login"
            className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
          >
            entrar
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="mx-auto max-w-3xl px-6 pb-16 pt-12 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-sm border border-gold bg-gradient-gold-soft">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] sm:text-6xl">
            Sua bio profissional <br />
            <span className="text-gold italic">em 30 segundos</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base font-light leading-relaxed text-muted-foreground">
            Centralize seus links, redes sociais, contatos e ofertas em uma página única —
            elegante, rápida e pronta pra converter.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="btn-luxe inline-flex h-12 items-center gap-2 rounded-sm px-7 text-sm font-semibold uppercase tracking-[0.15em]"
            >
              criar grátis <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#planos"
              className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
            >
              ver planos
            </a>
          </div>
          <p className="mt-4 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60">
            sem cartão · seu link no ar agora
          </p>
        </section>

        {/* FEATURES */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-6 sm:grid-cols-3">
            <Feature icon={<Zap className="h-5 w-5 text-primary" />} title="Rápido" desc="Sua bio publicada em axtor.space/seu-nome em segundos." />
            <Feature icon={<Palette className="h-5 w-5 text-primary" />} title="Elegante" desc="Design refinado, cores das marcas, ícones gerados com IA." />
            <Feature icon={<BarChart3 className="h-5 w-5 text-primary" />} title="Mensurável" desc="Analytics de cliques, dispositivos e canais (plano Pro)." />
          </div>
        </section>

        {/* PLANOS */}
        <section id="planos" className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-center font-display text-3xl">Planos</h2>
          <p className="mt-2 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
            comece grátis · evolua quando precisar
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <PlanCard
              name="Free"
              price="R$ 0"
              tagline="pra começar"
              features={[
                "Até 3 blocos ativos",
                "URL personalizada",
                "Ícones automáticos",
                "Selo 'feito com axtor'",
              ]}
              cta={
                <Link to="/signup" className="btn-luxe inline-flex h-11 w-full items-center justify-center rounded-sm text-xs uppercase tracking-[0.2em]">
                  começar grátis
                </Link>
              }
            />
            <PlanCard
              name="Pro"
              price="sob consulta"
              tagline="pra quem quer escalar"
              highlight
              features={[
                "Blocos ilimitados",
                "Analytics completo",
                "Campanhas com UTM",
                "Sugestões com IA",
                "Temas premium",
                "Sem selo",
              ]}
              cta={
                <a
                  href="mailto:contato@axtor.space?subject=Plano%20Pro%20axtor"
                  className="inline-flex h-11 w-full items-center justify-center rounded-sm border border-gold bg-card/40 px-4 text-xs uppercase tracking-[0.2em] text-primary hover:bg-gradient-gold-soft"
                >
                  falar com vendas
                </a>
              }
            />
          </div>
        </section>

        <footer className="mx-auto max-w-5xl px-6 py-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
            © {new Date().getFullYear()} axtor · sua bio profissional
          </p>
        </footer>
      </main>
    </div>
  );
};

const Feature = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="rounded-sm border border-gold/40 bg-card/40 p-6 text-center">
    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-sm border border-gold bg-gradient-gold-soft">
      {icon}
    </div>
    <h3 className="mt-4 font-display text-xl">{title}</h3>
    <p className="mt-2 text-sm font-light text-muted-foreground">{desc}</p>
  </div>
);

const PlanCard = ({
  name, price, tagline, features, cta, highlight,
}: { name: string; price: string; tagline: string; features: string[]; cta: React.ReactNode; highlight?: boolean }) => (
  <div className={`rounded-sm p-6 ${highlight ? "border-gold-gradient bg-gradient-gold-soft shadow-gold" : "border border-gold/40 bg-card/40"}`}>
    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{tagline}</p>
    <h3 className="mt-2 font-display text-3xl">{name}</h3>
    <p className="mt-2 text-2xl font-light text-primary">{price}</p>
    <ul className="mt-6 space-y-2">
      {features.map((f) => (
        <li key={f} className="flex items-center gap-2 text-sm text-foreground">
          <Check className="h-3.5 w-3.5 text-primary" /> {f}
        </li>
      ))}
    </ul>
    <div className="mt-6">{cta}</div>
  </div>
);

export default Landing;