import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle2, MessageCircle, Lock } from "lucide-react";
import { trackFunnel } from "@/lib/analytics";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type DemoQuestion = {
  text: string;
  subtitle?: string;
  options: { label: string; pain: string }[];
};

const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    text: "Qual frase mais combina com seu momento atual?",
    subtitle: "Seja honesto, é só pra calibrar o diagnóstico.",
    options: [
      { label: "Tenho audiência mas não converto em vendas", pain: "vendas" },
      { label: "Não sei o que postar todo dia", pain: "marketing" },
      { label: "Estou sobrecarregado, faço tudo sozinho", pain: "gestao" },
      { label: "Quero usar IA mas não sei por onde começar", pain: "ia" },
    ],
  },
  {
    text: "Quando alguém te pergunta 'o que você faz?', você...",
    options: [
      { label: "Travo, não consigo explicar em uma frase", pain: "marketing" },
      { label: "Falo, mas a pessoa não entende o valor", pain: "marketing" },
      { label: "Explico bem, mas ninguém compra mesmo assim", pain: "vendas" },
      { label: "Tenho clareza mas falta tempo pra divulgar", pain: "gestao" },
    ],
  },
  {
    text: "Quanto tempo você gasta por dia operando tarefas que não geram dinheiro?",
    options: [
      { label: "Menos de 1h", pain: "estrutura" },
      { label: "Entre 1h e 3h", pain: "gestao" },
      { label: "Mais de 3h, perco o dia inteiro", pain: "gestao" },
      { label: "Não sei dizer, está tudo embolado", pain: "estrutura" },
    ],
  },
  {
    text: "Sobre seu processo de vendas hoje:",
    options: [
      { label: "Não tenho processo, é tudo no improviso", pain: "vendas" },
      { label: "Tenho processo mas ninguém segue", pain: "estrutura" },
      { label: "Faço chamada e fecho na hora", pain: "vendas" },
      { label: "WhatsApp lotado, perco lead toda hora", pain: "vendas" },
    ],
  },
  {
    text: "O que mais te impede de escalar agora?",
    options: [
      { label: "Falta de método", pain: "marketing" },
      { label: "Falta de tempo", pain: "gestao" },
      { label: "Falta de gente boa", pain: "estrutura" },
      { label: "Falta de tecnologia/automação", pain: "ia" },
    ],
  },
  {
    text: "Quantos leads quentes você perde por mês por falta de follow-up?",
    options: [
      { label: "Quase nenhum", pain: "estrutura" },
      { label: "Uns 5-10", pain: "vendas" },
      { label: "Mais de 20", pain: "vendas" },
      { label: "Nem sei contar", pain: "vendas" },
    ],
  },
  {
    text: "Sobre seu posicionamento no Instagram:",
    options: [
      { label: "Já tenho identidade clara", pain: "ia" },
      { label: "Mudo de tema toda semana", pain: "marketing" },
      { label: "Sigo modinha, copio o que dá certo", pain: "marketing" },
      { label: "Posto sem estratégia, no piloto automático", pain: "marketing" },
    ],
  },
  {
    text: "Se eu te entregasse hoje um diagnóstico personalizado da sua conta, você...",
    options: [
      { label: "Aplicaria amanhã mesmo", pain: "vendas" },
      { label: "Quero, mas não tenho braço pra executar", pain: "estrutura" },
      { label: "Quero, mas tenho medo de errar", pain: "marketing" },
      { label: "Já tive vários diagnósticos, nenhum funcionou", pain: "vendas" },
    ],
  },
];

export default function DeepDiagnosticDemo() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"intro" | "quiz" | "result">("intro");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (step === "intro") trackFunnel("diag_landing_view" as any, { meta: { kind: "deep_demo" } });
  }, [step]);

  const dominantPain = useMemo(() => {
    const scores: Record<string, number> = {};
    Object.values(answers).forEach((p) => {
      scores[p] = (scores[p] ?? 0) + 1;
    });
    let best = "vendas";
    let max = -1;
    for (const [k, v] of Object.entries(scores)) {
      if (v > max) { max = v; best = k; }
    }
    return best;
  }, [answers]);

  const handleAnswer = (pain: string) => {
    const next = { ...answers, [current]: pain };
    setAnswers(next);
    if (current < DEMO_QUESTIONS.length - 1) {
      setTimeout(() => setCurrent(current + 1), 280);
    } else {
      setTimeout(() => setStep("result"), 280);
    }
  };

  const progress = ((current + (step === "result" ? 1 : 0)) / DEMO_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/admin"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
          </Button>
          <span className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Demo
          </span>
        </div>

        {step === "intro" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="space-y-6 p-8">
            <div className="space-y-3">
              <h1 className="font-display text-3xl tracking-tight md:text-4xl">
                Veja o Diagnóstico Profundo na pele do seu lead
              </h1>
              <p className="text-muted-foreground">
                Responda 8 perguntas como se fosse o lead. No final, você recebe a recomendação e
                entende exatamente como esse funil vende sozinho.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { t: "8 perguntas", d: "menos de 2 minutos" },
                { t: "IA detecta dor", d: "5 categorias" },
                { t: "Match de produto", d: "WhatsApp pronto" },
              ].map((b, i) => (
                <motion.div
                  key={b.t}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
                  className="rounded-md border border-border/60 p-3"
                >
                  <p className="text-sm font-medium">{b.t}</p>
                  <p className="text-xs text-muted-foreground">{b.d}</p>
                </motion.div>
              ))}
            </div>
            <Button size="lg" className="w-full gap-2 transition-transform hover:scale-[1.01]" onClick={() => setStep("quiz")}>
              Começar a demo <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
          </motion.div>
        )}

        {step === "quiz" && (
          <Card className="space-y-6 p-6 md:p-8 overflow-hidden">
            <div className="space-y-2">
              <Progress value={progress} className="h-1" />
              <p className="text-xs text-muted-foreground">
                Pergunta {current + 1} de {DEMO_QUESTIONS.length}
              </p>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <h2 className="font-display text-2xl leading-tight">{DEMO_QUESTIONS[current].text}</h2>
                  {DEMO_QUESTIONS[current].subtitle && (
                    <p className="text-sm text-muted-foreground">{DEMO_QUESTIONS[current].subtitle}</p>
                  )}
                </div>
                <div className="space-y-2">
                  {DEMO_QUESTIONS[current].options.map((o, oi) => (
                    <motion.button
                      key={o.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + oi * 0.06, duration: 0.25 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(o.pain)}
                      className="w-full rounded-md border border-border bg-card p-4 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      {o.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>
        )}

        {step === "result" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
            <Card className="space-y-4 border-primary/40 bg-gradient-to-br from-background to-primary/5 p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-wider text-primary">
                <CheckCircle2 className="h-3 w-3" /> Sua dor dominante: {dominantPain}
              </div>
              <h2 className="font-display text-3xl leading-tight">
                Imagine isso entregando leads qualificados pra você 24/7.
              </h2>
              <p className="text-muted-foreground">
                Agora pensa: o seu lead respondendo 12 perguntas inteligentes sobre o nicho dele, com seus
                vídeos de quebra de objeção embutidos, recebendo o seu produto certo + sua mensagem de
                WhatsApp pronta. É isso que o Diagnóstico Profundo faz.
              </p>
            </Card>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-2">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}>
              <Card className="space-y-3 p-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Pagamento único</p>
                <p className="font-display text-3xl">R$ 297</p>
                <p className="text-xs text-muted-foreground">1 funil ativo, vitalício</p>
                <Button className="w-full gap-2" disabled>
                  <Lock className="h-3 w-3" /> Em breve
                </Button>
              </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4 }}>
              <Card className="space-y-3 border-primary/40 p-6">
                <p className="text-xs uppercase tracking-wider text-primary">Mensal</p>
                <p className="font-display text-3xl">R$ 47<span className="text-base text-muted-foreground">/mês</span></p>
                <p className="text-xs text-muted-foreground">Funis ilimitados + regenerações</p>
                <Button className="w-full gap-2" disabled>
                  <Lock className="h-3 w-3" /> Em breve
                </Button>
              </Card>
              </motion.div>
            </div>

            <Card className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium">Ainda tem dúvidas?</p>
                <p className="text-xs text-muted-foreground">Fale direto com o time pelo WhatsApp.</p>
              </div>
              <Button variant="outline" className="gap-2" asChild>
                <a href="https://wa.me/" target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </Button>
            </Card>

            <Button variant="ghost" className="w-full" onClick={() => { setStep("intro"); setCurrent(0); setAnswers({}); }}>
              Refazer demo
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}