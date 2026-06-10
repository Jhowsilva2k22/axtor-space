import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DottedSurface } from "@/components/landing/DottedSurface";
import { PhoneMockup3 } from "@/components/landing/PhoneMockup3";
import { GlowCard } from "@/components/landing/GlowCard";

// As 3 peças do produto — deixa explícito o diagnóstico IG ativável/desativável
// e o link na bio como hub de entrada.
const mecanismo = [
  {
    tag: "O coração",
    titulo: "Diagnóstico imersivo",
    texto: "Você cria as perguntas. O visitante responde. A IA conduz cada pessoa ao próximo passo certo. Funciona em qualquer nicho.",
    destaque: true,
  },
  {
    tag: "Entrada opcional",
    titulo: "Diagnóstico de Instagram",
    texto: "A pessoa digita o @ e recebe uma análise na hora. Combina com o seu nicho? Ative. Se não, desative e trabalhe só com o imersivo.",
    destaque: false,
  },
  {
    tag: "Seu hub",
    titulo: "Link na bio",
    texto: "A sua entrada principal, que reúne links, ofertas e o diagnóstico num lugar só, no seu domínio.",
    destaque: false,
  },
];

const comoFunciona = [
  { n: "1", titulo: "Apresente", texto: "Mostre quem você é, o que faz e para quem serve." },
  { n: "2", titulo: "Diagnostique", texto: "Crie perguntas personalizadas para o seu nicho e entenda cada visitante." },
  { n: "3", titulo: "Direcione", texto: "Leve cada pessoa ao próximo passo certo: WhatsApp, agenda, conteúdo, produto ou oferta." },
  { n: "4", titulo: "Capture", texto: "Cada interação vira um lead qualificado, com contexto, na sua mão." },
];

const jornada = [
  { titulo: "Chega até você", texto: "A pessoa acessa pelo Instagram, WhatsApp, story, campanha ou QR Code." },
  { titulo: "Entende rápido o que você faz", texto: "Sua apresentação deixa claro quem você ajuda e qual caminho seguir." },
  { titulo: "Interage com o diagnóstico", texto: "Em vez de escolher no escuro, ela responde perguntas simples do seu nicho." },
  { titulo: "Vira um lead qualificado", texto: "É direcionada para WhatsApp, conteúdo, agenda, produto ou comunidade, e você recebe o contato com contexto." },
];

const etapas = [
  { titulo: "Apresentação", texto: "Quem você é, o que faz e para quem serve." },
  { titulo: "Diagnóstico", texto: "Perguntas simples, no seu nicho, para entender a intenção do visitante." },
  { titulo: "Direcionamento", texto: "Um próximo passo claro com base no perfil de cada pessoa." },
];

const segmentos = [
  { titulo: "Especialistas", texto: "Entenda o nível de consciência do lead e direcione para atendimento, conteúdo ou oferta." },
  { titulo: "Negócios locais", texto: "Identifique o interesse do cliente e leve para WhatsApp, agenda ou localização." },
  { titulo: "Comunidades", texto: "Qualifique quem chega e direcione para grupo, inscrição ou lista de espera." },
  { titulo: "Criadores de conteúdo", texto: "Organize conteúdos, produtos, links e recomendações em uma experiência só." },
  { titulo: "Mentores e consultores", texto: "Transforme perguntas simples em um caminho de decisão mais claro." },
  { titulo: "Infoprodutores", texto: "Capte e qualifique o lead antes de levá-lo para a sua oferta." },
];

const pontosEntrada = [
  "Bio do Instagram", "Stories", "WhatsApp", "QR Code", "Campanhas",
  "Eventos", "Cartão digital", "Comunidade", "Atendimento", "Lançamentos",
];

const bioComum = [
  "Mostra botões soltos",
  "Deixa o visitante escolher sozinho",
  "Não entende a intenção de quem acessa",
  "Não captura nem qualifica ninguém",
];
const axtorSpace = [
  "Apresenta sua marca com clareza",
  "Faz um diagnóstico no seu nicho",
  "Direciona cada pessoa para o próximo passo",
  "Captura o lead já qualificado",
];

const faq = [
  { q: "Dá para adaptar o diagnóstico ao meu nicho?", a: "Sim. As perguntas, o nicho e o objetivo do diagnóstico são seus. Você monta do seu jeito." },
  { q: "Posso desativar o diagnóstico de Instagram?", a: "Sim. Se não combinar com o seu nicho, desative e trabalhe apenas com o diagnóstico imersivo." },
  { q: "Preciso ter site?", a: "Não. O link na bio é a sua entrada principal, no seu domínio." },
  { q: "Posso usar no Instagram?", a: "Sim. Foi pensado para o link da bio, mas também funciona em stories, WhatsApp, QR Code e campanhas." },
  { q: "Serve para vender?", a: "Sim, sem venda agressiva. A proposta é conduzir o visitante até o próximo passo certo." },
];

// Título do hero, animado por PALAVRA (não quebra no meio da palavra).
const HEAD: { t: string; accent: boolean }[] = [
  { t: "Tenha seu próprio", accent: false },
  { t: "diagnóstico de captura", accent: true },
  { t: "para qualquer nicho.", accent: false },
];

function AnimatedTitle() {
  let i = 0;
  return (
    <h1 className="pb-[0.12em] text-5xl font-extrabold leading-[1.2] tracking-tight sm:text-6xl">
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
                        ? "inline-block pb-[0.16em] bg-gradient-to-r from-primary-glow to-primary bg-clip-text text-transparent"
                        : "inline-block pb-[0.16em] bg-gradient-to-b from-white to-white/85 bg-clip-text text-transparent"
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
    <div
      style={{
        // Tema "Brasil" (igual à /planos): fundo azul-marinho + brand amarelo.
        // Sobrescreve os tokens FINAIS no container (não os de superfície,
        // que já são resolvidos no :root e não recalculam num filho).
        ["--background" as string]: "223 68% 6%",
        ["--card" as string]: "223 68% 10%",
        ["--popover" as string]: "223 68% 8%",
        ["--secondary" as string]: "223 68% 14%",
        ["--muted" as string]: "223 68% 16%",
        ["--input" as string]: "223 68% 13%",
        ["--border" as string]: "52 25% 18%",
        ["--primary" as string]: "52 98% 52%",
        ["--primary-glow" as string]: "52 75% 68%",
        ["--primary-foreground" as string]: "223 68% 6%",
        ["--accent" as string]: "52 98% 52%",
        ["--accent-foreground" as string]: "223 68% 6%",
        ["--ring" as string]: "52 98% 52%",
      } as React.CSSProperties}
      className="relative min-h-screen overflow-hidden [&_h1]:[font-family:var(--font-body)] [&_h2]:[font-family:var(--font-body)] [&_h3]:[font-family:var(--font-body)]"
    >
      {/* Base azul-marinho (tema Brasil) ATRÁS da malha de pontos (-z-20) */}
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{ background: "radial-gradient(ellipse at top, hsl(223 68% 12%), hsl(223 68% 4%))" }}
      />
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
              Diagnóstico de captura · para qualquer nicho
            </motion.div>

            <AnimatedTitle />

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.7 }}
              className="mx-auto mt-5 max-w-xl text-xl text-foreground/80 md:mx-0">
              Crie um diagnóstico inteligente, adaptado ao seu nicho, que conduz cada visitante ao próximo passo, tudo a partir do seu link na bio.
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.85 }}
              className="mx-auto mt-4 max-w-xl text-base font-semibold text-foreground md:mx-0">
              O diagnóstico é o coração. O link na bio é o seu hub de entrada.
            </motion.p>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <div className="group inline-block rounded-2xl bg-gradient-to-b from-primary/50 to-primary/10 p-px backdrop-blur-lg transition-all duration-300 hover:shadow-[0_18px_50px_-14px_hsl(var(--primary)/0.6)]">
                <Link to="/planos" className="inline-flex items-center gap-3 rounded-[15px] border border-primary/20 bg-background/90 px-8 py-4 text-base font-bold transition-all duration-300 group-hover:bg-background">
                  Criar meu diagnóstico
                  <span className="opacity-70 transition-all duration-300 group-hover:translate-x-1.5 group-hover:opacity-100">→</span>
                </Link>
              </div>
              <Link to="/joanderson" className="inline-flex h-[58px] items-center rounded-2xl border border-border px-7 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary">
                Ver exemplo funcionando
              </Link>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.15 }}
              className="mx-auto mt-5 max-w-xl text-base text-foreground/75 md:mx-0">
              Para especialistas, negócios locais, comunidades, criadores e qualquer profissional que queira transformar atenção em leads qualificados.
            </motion.p>
          </div>

          <div className="order-2 flex justify-center md:justify-end">
            <PhoneMockup3 />
          </div>
        </section>

        {/* PROBLEMA */}
        <Reveal className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Seu link na bio recebe gente todo dia. A maioria sai sem deixar nada.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-foreground/80">
            A pessoa entra, vê vários botões, não sabe por onde começar e some, sem você saber quem era nem o que queria.
          </p>
          <p className="mt-6 text-xl font-medium text-primary">
            O problema não é ter poucos links. É não capturar nem qualificar quem chega.
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
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Com diagnóstico</p>
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
            Antes, sua bio mostrava caminhos. Agora, <span className="bg-gradient-to-r from-primary-glow to-primary bg-clip-text text-transparent">ela captura e qualifica.</span>
          </p>
        </Reveal>

        {/* MECANISMO — as 3 peças (diagnóstico imersivo / IG on-off / link hub) */}
        <Reveal className="mx-auto max-w-6xl px-6 py-16">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Você decide como cada peça trabalha.</h2>
            <p className="mt-3 text-lg text-foreground/80">O diagnóstico é o centro. O de Instagram você liga ou desliga. O link na bio segura tudo num lugar só.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {mecanismo.map((m) => (
              <Card key={m.titulo} className={m.destaque ? "border-primary/40 shadow-[0_24px_60px_-30px_hsl(var(--primary)/0.4)]" : ""}>
                <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${m.destaque ? "text-primary" : "text-muted-foreground"}`}>{m.tag}</p>
                <h3 className="text-xl font-bold">{m.titulo}</h3>
                <p className="mt-2 text-base text-foreground/75">{m.texto}</p>
              </Card>
            ))}
          </div>
        </Reveal>

        {/* COMO FUNCIONA */}
        <Reveal className="mx-auto max-w-6xl px-6 py-16">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Como o diagnóstico funciona</h2>
            <p className="mt-3 text-lg text-foreground/80">Apresentação, diagnóstico no seu nicho e direcionamento, numa experiência só, a partir do seu link na bio.</p>
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
            <p className="mt-3 text-lg text-foreground/80">Quem acessa o seu link não encontra botões soltos. Entende quem você é, responde ao diagnóstico e vira um lead qualificado.</p>
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
            <p className="mt-3 text-lg text-foreground/80">As perguntas se adaptam ao seu segmento, público e objetivo. Serve para qualquer nicho.</p>
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
            O diagnóstico não substitui seu funil. Ele melhora a entrada dele.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-foreground/80">
            Antes da pessoa chegar no WhatsApp, na agenda, no conteúdo ou na oferta, ela precisa entender qual caminho faz sentido. O diagnóstico cria essa ponte entre atenção e ação, e captura o contato no caminho.
          </p>
          <p className="mt-6 text-xl font-medium text-primary">
            Menos dispersão na entrada. Mais leads qualificados no próximo passo.
          </p>
        </Reveal>

        {/* PONTOS DE ENTRADA */}
        <Reveal className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Um único hub. Vários pontos de entrada.</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-foreground/80">Seu link na bio é a entrada principal, e leva o diagnóstico para onde você estiver.</p>
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
                Especialistas, negócios locais, prestadores de serviço, mentores, infoprodutores, criadores de conteúdo, comunidades, eventos, páginas de campanha e projetos digitais, de qualquer nicho.
              </p>
            </Card>
            <Card className="animate-pulse-glow-strong border-primary/40">
              <h3 className="text-3xl font-extrabold">Para quem não é</h3>
              <p className="mt-3 text-base leading-relaxed text-foreground/80">
                Não é para quem quer apenas uma página bonita cheia de botões. É para quem quer capturar e qualificar quem chega, transformando o link da bio em uma entrada estratégica.
              </p>
            </Card>
          </div>
        </Reveal>

        {/* STORYTELLING */}
        <Reveal className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-xl leading-relaxed text-foreground/80">
            Tudo começou com uma necessidade simples: uma bio mais clara, mais bonita e mais estratégica.
            <br className="hidden sm:block" />
            Depois ficou evidente que faltava algo maior: uma forma de entender e capturar quem chegava. Foi aí que o diagnóstico virou o centro de tudo, adaptável a qualquer nicho.
          </p>
          <div className="mt-10">
            <div className="group inline-block rounded-2xl bg-gradient-to-b from-primary/50 to-primary/10 p-px transition-all duration-300 hover:shadow-[0_18px_50px_-14px_hsl(var(--primary)/0.6)]">
              <Link to="/planos" className="inline-flex items-center gap-3 rounded-[15px] border border-primary/20 bg-background/90 px-8 py-4 text-base font-bold transition-all group-hover:bg-background">
                Quero meu diagnóstico de captura
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
              Tenha seu próprio <span className="bg-gradient-to-r from-primary-glow to-primary bg-clip-text text-transparent">diagnóstico de captura.</span>
            </h2>
            <p className="mt-3 text-lg text-foreground/80">Captura, qualifica e direciona no seu nicho, do seu jeito.</p>
            <div className="mt-7 flex justify-center">
              <Link to="/planos" className="inline-flex h-12 items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow px-7 text-sm font-bold text-primary-foreground">
                Criar meu diagnóstico
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
