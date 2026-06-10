import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DottedSurface } from "@/components/landing/DottedSurface";
import { PhoneMockup3 } from "@/components/landing/PhoneMockup3";
import { GlowCard } from "@/components/landing/GlowCard";

const comoFunciona = [
  { n: "1", titulo: "Apresente", texto: "Mostre quem você é, o que faz e para quem serve." },
  { n: "2", titulo: "Direcione", texto: "Organize os principais caminhos para o visitante não se perder." },
  { n: "3", titulo: "Diagnostique", texto: "Crie perguntas personalizadas para entender melhor cada pessoa." },
  { n: "4", titulo: "Conduza", texto: "Leve o visitante para a ação certa: WhatsApp, agenda, conteúdo, produto ou atendimento." },
];

const jornada = [
  { titulo: "Chega até você", texto: "A pessoa acessa pelo Instagram, WhatsApp, story, campanha ou QR Code." },
  { titulo: "Entende rápido o que você faz", texto: "Sua apresentação deixa claro quem você ajuda e qual caminho seguir." },
  { titulo: "Interage com o diagnóstico", texto: "Em vez de escolher no escuro, ela responde perguntas simples." },
  { titulo: "Recebe um próximo passo claro", texto: "Direciona para WhatsApp, conteúdo, agenda, produto, comunidade ou atendimento." },
];

const etapas = [
  { titulo: "Apresentação", texto: "Quem você é, o que faz e para quem serve." },
  { titulo: "Diagnóstico", texto: "Perguntas simples para entender a intenção do visitante." },
  { titulo: "Direcionamento", texto: "Um próximo passo claro com base no perfil da pessoa." },
];

const segmentos = [
  { titulo: "Especialistas", texto: "Entenda o nível de consciência do lead e direcione para atendimento, conteúdo ou oferta." },
  { titulo: "Negócios locais", texto: "Identifique o interesse do cliente e leve para WhatsApp, agenda ou localização." },
  { titulo: "Comunidades", texto: "Qualifique quem chega e direcione para grupo, inscrição ou lista de espera." },
  { titulo: "Criadores de conteúdo", texto: "Organize conteúdos, produtos, links e recomendações em uma experiência só." },
  { titulo: "Mentores e consultores", texto: "Transforme perguntas simples em um caminho de decisão mais claro." },
];

const pontosEntrada = [
  "Bio do Instagram", "Stories", "WhatsApp", "QR Code", "Campanhas",
  "Eventos", "Cartão digital", "Comunidade", "Atendimento", "Lançamentos",
];

const bioComum = [
  "Mostra botões soltos",
  "Deixa o visitante escolher sozinho",
  "Não entende a intenção de quem acessa",
  "Pode gerar dúvida e dispersão",
];
const axtorSpace = [
  "Apresenta sua marca com clareza",
  "Organiza os caminhos principais",
  "Permite diagnóstico personalizado",
  "Direciona o visitante para o próximo passo",
];

const faq = [
  { q: "O AXTOR SPACE é só um link na bio?", a: "Não. Ele funciona como uma central estratégica com apresentação, links organizados e diagnóstico personalizado." },
  { q: "Posso adaptar para o meu segmento?", a: "Sim. O diagnóstico pode ser construído de acordo com o seu público, nicho ou objetivo." },
  { q: "Preciso ter site?", a: "Não. O AXTOR SPACE pode ser a principal página de entrada do seu perfil." },
  { q: "Posso usar no Instagram?", a: "Sim. Foi pensado para o link da bio, mas também funciona em campanhas, stories, WhatsApp e atendimentos." },
  { q: "Serve para vender?", a: "Sim, sem venda agressiva. A proposta é conduzir melhor o visitante até o próximo passo." },
];

// Título do hero, animado por PALAVRA (não quebra no meio da palavra).
const HEAD: { t: string; accent: boolean }[] = [
  { t: "Transforme o link da sua bio em uma", accent: false },
  { t: "experiência inteligente", accent: true },
  { t: "para apresentar, direcionar e entender melhor seu público.", accent: false },
];

function AnimatedTitle() {
  let i = 0;
  return (
    <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
      {HEAD.flatMap((seg, s) =>
        seg.t.split(" ").filter(Boolean).map((word, wi) => (
          <span key={`${s}-${wi}`}>
            <span className="inline-block whitespace-nowrap">
              {Array.from(word).map((char) => {
                const idx = i++;
                return (
                  <motion.span
                    key={idx}
                    initial={{ y: "0.4em", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + idx * 0.012, type: "spring", stiffness: 150, damping: 25 }}
                    className={
                      seg.accent
                        ? "inline-block bg-gradient-to-r from-primary-glow to-primary bg-clip-text text-transparent"
                        : "inline-block bg-gradient-to-b from-white to-white/85 bg-clip-text text-transparent"
                    }
                  >
                    {char}
                  </motion.span>
                );
              })}
            </span>{" "}
          </span>
        )),
      )}
    </h1>
  );
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <GlowCard className={`transition-transform duration-300 hover:-translate-y-1 ${className}`}>
      {children}
    </GlowCard>
  );
}

function NumBadge({ n }: { n: number }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-primary/10 text-lg font-extrabold text-primary">
      {n}
    </div>
  );
}

const Vendas = () => {
  return (
    <div className="relative min-h-screen overflow-hidden [&_h1]:[font-family:var(--font-body)] [&_h2]:[font-family:var(--font-body)] [&_h3]:[font-family:var(--font-body)]">
      <DottedSurface />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_30%,transparent_40%,hsl(var(--background)/0.55)_100%)]" />

      <main className="relative z-10 pt-14">
        {/* HERO */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 md:grid-cols-2">
          <div className="order-1 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
              Link inteligente com diagnóstico guiado
            </motion.div>

            <AnimatedTitle />

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.7 }}
              className="mx-auto mt-5 max-w-xl text-xl text-foreground/80 md:mx-0">
              O AXTOR SPACE une uma página estratégica com diagnóstico personalizado para conduzir cada visitante ao próximo passo certo.
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.85 }}
              className="mx-auto mt-4 max-w-xl text-base font-semibold text-foreground md:mx-0">
              Não é link in bio. É uma central inteligente de apresentação, direção e diagnóstico.
            </motion.p>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <div className="group inline-block rounded-2xl bg-gradient-to-b from-primary/50 to-primary/10 p-px backdrop-blur-lg transition-all duration-300 hover:shadow-[0_18px_50px_-14px_hsl(var(--primary)/0.6)]">
                <Link to="/planos" className="inline-flex items-center gap-3 rounded-[15px] border border-primary/20 bg-background/90 px-8 py-4 text-base font-bold transition-all duration-300 group-hover:bg-background">
                  Quero testar meu AXTOR SPACE
                  <span className="opacity-70 transition-all duration-300 group-hover:translate-x-1.5 group-hover:opacity-100">→</span>
                </Link>
              </div>
              <Link to="/joanderson" className="inline-flex h-[58px] items-center rounded-2xl border border-border px-7 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary">
                Ver exemplo funcionando
              </Link>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.15 }}
              className="mx-auto mt-5 max-w-xl text-base text-foreground/75 md:mx-0">
              Para marcas pessoais, especialistas, negócios locais, comunidades e profissionais que querem transformar atenção em direção.
            </motion.p>
          </div>

          <div className="order-2 flex justify-center md:justify-end">
            <PhoneMockup3 />
          </div>
        </section>

        {/* PROBLEMA */}
        <Reveal className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            A maioria dos links na bio apenas mostra opções. Poucos conduzem decisões.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-foreground/80">
            A pessoa entra, vê vários botões, não sabe por onde começar e muitas vezes sai sem tomar nenhuma ação.
          </p>
          <p className="mt-6 text-xl font-medium text-primary">
            O problema não é ter poucos links. É não conduzir o visitante.
          </p>
        </Reveal>

        {/* CONTRASTE */}
        <Reveal className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Bio comum</p>
              <ul className="space-y-2.5">
                {bioComum.map((t) => (
                  <li key={t} className="flex gap-3 text-base text-foreground/80">
                    <span className="text-muted-foreground/50">—</span>{t}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="border-primary/40 shadow-[0_24px_60px_-30px_hsl(var(--primary)/0.4)]">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">AXTOR SPACE</p>
              <ul className="space-y-2.5">
                {axtorSpace.map((t) => (
                  <li key={t} className="flex gap-3 text-base text-foreground">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="mt-0.5 h-4 w-4 flex-shrink-0 stroke-primary"><path strokeLinecap="round" d="M5 13l4 4L19 7" /></svg>{t}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          <p className="mt-8 text-center text-3xl font-extrabold">
            Antes, sua bio mostrava caminhos. Agora, <span className="bg-gradient-to-r from-primary-glow to-primary bg-clip-text text-transparent">ela conduz decisões.</span>
          </p>
        </Reveal>

        {/* COMO FUNCIONA */}
        <Reveal className="mx-auto max-w-6xl px-6 py-16">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Como o AXTOR SPACE funciona</h2>
            <p className="mt-3 text-lg text-foreground/80">Apresentação estratégica, links organizados e diagnóstico guiado em uma única experiência.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {comoFunciona.map((b) => (
              <Card key={b.n}>
                <NumBadge n={Number(b.n)} />
                <h3 className="mt-4 text-xl font-bold">{b.titulo}</h3>
                <p className="mt-1.5 text-base text-foreground/75">{b.texto}</p>
              </Card>
            ))}
          </div>
        </Reveal>

        {/* JORNADA */}
        <Reveal className="mx-auto max-w-6xl px-6 py-16">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">O visitante não apenas clica. Ele percorre uma jornada.</h2>
            <p className="mt-3 text-lg text-foreground/80">Quando alguém acessa seu AXTOR SPACE, não encontra botões soltos. Entende quem você é, interage com uma experiência clara e encontra o próximo passo mais adequado.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {jornada.map((b, idx) => (
              <Card key={idx}>
                <NumBadge n={idx + 1} />
                <h3 className="mt-4 text-xl font-bold">{b.titulo}</h3>
                <p className="mt-1.5 text-base text-foreground/75">{b.texto}</p>
              </Card>
            ))}
          </div>
        </Reveal>

        {/* 3 ETAPAS */}
        <Reveal className="mx-auto max-w-5xl px-6 py-16">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Da primeira visita ao próximo passo</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {etapas.map((b, idx) => (
              <Card key={idx}>
                <NumBadge n={idx + 1} />
                <h3 className="mt-4 text-xl font-bold">{b.titulo}</h3>
                <p className="mt-1.5 text-base text-foreground/75">{b.texto}</p>
              </Card>
            ))}
          </div>
        </Reveal>

        {/* SEGMENTOS */}
        <Reveal className="mx-auto max-w-6xl px-6 py-16">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Um diagnóstico diferente para cada tipo de negócio.</h2>
            <p className="mt-3 text-lg text-foreground/80">O diagnóstico pode ser adaptado para diferentes segmentos, públicos e objetivos.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {segmentos.map((b, idx) => (
              <Card key={idx}>
                <h3 className="text-xl font-bold">{b.titulo}</h3>
                <p className="mt-1.5 text-base text-foreground/75">{b.texto}</p>
              </Card>
            ))}
          </div>
        </Reveal>

        {/* NÃO SUBSTITUI O FUNIL */}
        <Reveal className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            O AXTOR SPACE não substitui seu funil. Ele melhora a entrada dele.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-foreground/80">
            Antes da pessoa chegar no WhatsApp, na agenda, no conteúdo ou na oferta, ela precisa entender qual caminho faz sentido. O AXTOR SPACE cria essa ponte entre atenção e ação.
          </p>
          <p className="mt-6 text-xl font-medium text-primary">
            Menos dispersão na entrada. Mais clareza no próximo passo.
          </p>
        </Reveal>

        {/* PONTOS DE ENTRADA */}
        <Reveal className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Um único link. Vários pontos de entrada.</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-foreground/80">Use o AXTOR SPACE em diferentes pontos da sua presença digital.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {pontosEntrada.map((p) => (
              <span key={p} className="rounded-full border border-border bg-card/60 px-4 py-2 text-base text-foreground/85 backdrop-blur">
                {p}
              </span>
            ))}
          </div>
        </Reveal>

        {/* PARA QUEM É / NÃO É */}
        <Reveal className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <h3 className="text-3xl font-extrabold">Para quem é</h3>
              <p className="mt-3 text-base leading-relaxed text-foreground/80">
                Marcas pessoais, especialistas, negócios locais, prestadores de serviço, mentores, infoprodutores, criadores de conteúdo, comunidades, eventos, páginas de campanha e projetos digitais.
              </p>
            </Card>
            <Card>
              <h3 className="text-3xl font-extrabold">Para quem não é</h3>
              <p className="mt-3 text-base leading-relaxed text-foreground/80">
                Não é para quem quer apenas uma página bonita cheia de botões. É para quem quer transformar o link da bio em uma entrada estratégica para o negócio.
              </p>
            </Card>
          </div>
        </Reveal>

        {/* STORYTELLING */}
        <Reveal className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-xl leading-relaxed text-foreground/80">
            O AXTOR SPACE nasceu primeiro como uma ferramenta de uso pessoal: criar uma bio mais clara, mais bonita e mais estratégica.
            <br className="hidden sm:block" />
            Depois ficou evidente que muitos profissionais tinham o mesmo problema — muito valor para entregar, mas pouca estrutura para apresentar tudo de forma simples, organizada e direcionada.
          </p>
          <div className="mt-10">
            <div className="group inline-block rounded-2xl bg-gradient-to-b from-primary/50 to-primary/10 p-px transition-all duration-300 hover:shadow-[0_18px_50px_-14px_hsl(var(--primary)/0.6)]">
              <Link to="/planos" className="inline-flex items-center gap-3 rounded-[15px] border border-primary/20 bg-background/90 px-8 py-4 text-base font-bold transition-all group-hover:bg-background">
                Quero ver como ficaria no meu perfil
                <span className="opacity-70 transition-all duration-300 group-hover:translate-x-1.5 group-hover:opacity-100">→</span>
              </Link>
            </div>
          </div>
        </Reveal>

        {/* FAQ */}
        <Reveal className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="mb-10 text-center text-4xl font-extrabold tracking-tight sm:text-5xl">Perguntas frequentes</h2>
          <div className="space-y-3">
            {faq.map((item, idx) => (
              <details key={idx} data-glow className="group rounded-2xl border border-border bg-card/60">
                <summary className="flex cursor-pointer items-center justify-between p-5 text-lg font-semibold">
                  {item.q}
                  <span className="text-2xl text-primary transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-5 text-base text-foreground/75">{item.a}</p>
              </details>
            ))}
          </div>
        </Reveal>

        {/* CTA FINAL */}
        <Reveal className="mx-auto max-w-5xl px-6 py-10">
          <div data-glow style={{ ["--glow-radius" as string]: "24" } as React.CSSProperties} className="rounded-3xl border border-border p-14 text-center backdrop-blur [background:radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_70%),hsl(var(--card)/0.7)]">
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Transforme sua bio em uma <span className="bg-gradient-to-r from-primary-glow to-primary bg-clip-text text-transparent">experiência inteligente.</span>
            </h2>
            <p className="mt-3 text-lg text-foreground/80">Apresente, direcione e diagnostique — numa página só.</p>
            <div className="mt-7 flex justify-center">
              <Link to="/planos" className="inline-flex h-12 items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow px-7 text-sm font-bold text-primary-foreground">
                Quero transformar minha bio em uma experiência inteligente
              </Link>
            </div>
          </div>
        </Reveal>

        <footer className="mx-auto max-w-5xl px-6 py-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground/60">
            © {new Date().getFullYear()} axtor space ·{" "}
            <Link to="/termos" className="hover:text-primary">Termos</Link> ·{" "}
            <Link to="/privacidade" className="hover:text-primary">Privacidade</Link>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Vendas;
