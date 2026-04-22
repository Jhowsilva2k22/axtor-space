import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight, Sparkles, Lock, CheckCircle2, AlertTriangle, Loader2, Instagram, TrendingUp, Target, Zap } from "lucide-react";

const PROXY = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image?url=`;
const proxied = (url?: string) => (url ? PROXY + encodeURIComponent(url) : "");

type Step = "handle" | "lead" | "loading" | "result" | "private";

interface DiagnosisData {
  status: string;
  handle?: string;
  message?: string;
  profile?: any;
  profile_preview?: any;
  diagnosis?: {
    score_geral: number;
    scores: Record<string, number>;
    pontos_fortes: string[];
    gaps_criticos: string[];
    plano_acao: string[];
    veredicto: string;
  };
  error?: string;
}

const LOADING_STEPS = [
  "Conectando com o Instagram...",
  "Analisando sua bio e posicionamento...",
  "Calculando taxa de engajamento real...",
  "Comparando com perfis do seu nicho...",
  "Identificando pontos de conversão perdidos...",
  "Gerando seu plano de ação personalizado...",
];

const Index = () => {
  const [step, setStep] = useState<Step>("handle");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(LOADING_STEPS[0]);
  const [data, setData] = useState<DiagnosisData | null>(null);

  const handleSubmitHandle = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = handle.trim().replace(/^@+/, "");
    if (cleaned.length < 1) {
      toast.error("Digite seu @ do Instagram");
      return;
    }
    setHandle(cleaned);
    setStep("lead");
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) {
      toast.error("Informe email ou telefone para receber o diagnóstico");
      return;
    }
    setStep("loading");

    // Anima as mensagens de loading
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_STEPS.length;
      setLoadingMsg(LOADING_STEPS[i]);
    }, 2200);

    try {
      const { data: result, error } = await supabase.functions.invoke("analyze-instagram", {
        body: {
          handle,
          email: email || null,
          phone: phone || null,
          full_name: name || null,
        },
      });

      clearInterval(interval);

      if (error) throw error;
      if (!result) throw new Error("Sem resposta do servidor");

      setData(result);
      if (result.status === "private_profile") {
        setStep("private");
      } else if (result.status === "completed") {
        setStep("result");
      } else {
        toast.error(result.error || "Não conseguimos analisar esse perfil agora.");
        setStep("handle");
      }
    } catch (err) {
      clearInterval(interval);
      toast.error(err instanceof Error ? err.message : "Erro ao gerar diagnóstico");
      setStep("lead");
    }
  };

  const reset = () => {
    setStep("handle");
    setData(null);
    setHandle("");
    setEmail("");
    setPhone("");
    setName("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden grain">
      {/* Glow ambient */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-sm bg-gradient-to-br from-primary to-primary-glow" />
          <span className="font-display text-xl tracking-wide">Diagnóstico Premium</span>
        </div>
        <span className="hidden text-xs uppercase tracking-[0.3em] text-muted-foreground sm:block">
          análise real · 30 segundos
        </span>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 pb-24 pt-12 sm:pt-20 py-[40px]">
        {step === "handle" && <HandleStep handle={handle} setHandle={setHandle} onSubmit={handleSubmitHandle} />}
        {step === "lead" && (
          <LeadStep
            handle={handle}
            email={email} setEmail={setEmail}
            phone={phone} setPhone={setPhone}
            name={name} setName={setName}
            onSubmit={handleSubmitLead}
            onBack={() => setStep("handle")}
          />
        )}
        {step === "loading" && <LoadingStep message={loadingMsg} handle={handle} />}
        {step === "private" && data && <PrivateStep data={data} onRetry={reset} />}
        {step === "result" && data && <ResultStep data={data} onRestart={reset} />}
      </main>

      <footer className="relative z-10 border-t border-gold/30 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground py-[20px]">
        Diagnóstico Premium · feito para quem leva o digital a sério
      </footer>
    </div>
  );
};

/* ---------- STEPS ---------- */

const HandleStep = ({ handle, setHandle, onSubmit }: any) => (
  <div className="animate-fade-up text-center">
    <span className="sheen inline-flex items-center gap-2 rounded-sm border border-gold bg-gradient-gold-soft px-5 py-2 text-xs uppercase tracking-[0.3em] text-primary backdrop-blur">
      <Sparkles className="h-3 w-3" />
      <span>análise real · não é vitrine</span>
    </span>
    <h1 className="mt-8 font-display text-5xl leading-[1.05] sm:text-7xl">
      Descubra <span className="text-gold italic">exatamente</span><br />o que está travando<br />seu Instagram.
    </h1>
    <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
      Informe seu @ e nosso sistema te entregará um diagnóstico real do seu perfil, comparado com o seu nicho, em 30 segundos.
    </p>

    <form onSubmit={onSubmit} className="mx-auto mt-12 max-w-xl">
      <div className="group relative flex items-center overflow-hidden rounded-sm border-gold-gradient backdrop-blur transition-all focus-within:shadow-gold-lg">
        <span className="pl-5 text-2xl font-display text-primary">@</span>
        <Input
          value={handle}
          onChange={(e) => setHandle(e.target.value.replace(/^@+/, ""))}
          placeholder="seu_perfil"
          className="h-14 border-0 bg-transparent text-base font-light placeholder:text-muted-foreground/40 focus-visible:ring-0"
          autoFocus
        />
        <Button type="submit" size="lg" className="btn-luxe m-1.5 h-11 shrink-0 gap-1.5 rounded-sm px-4 text-xs font-semibold uppercase tracking-[0.1em] sm:px-6 sm:text-sm sm:tracking-[0.15em]">
          Analisar <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        100% gratuito · não pedimos sua senha · seu perfil precisa estar público
      </p>
    </form>

    <div className="mt-20 grid gap-4 sm:grid-cols-3">
      {[
        { icon: Target, title: "Posicionamento", desc: "Seu @ está atraindo o público certo?" },
        { icon: TrendingUp, title: "Conversão", desc: "Quanto você está deixando na mesa." },
        { icon: Zap, title: "Plano de ação", desc: "5 movimentos prioritários para você." },
      ].map((it) => (
        <div key={it.title} className="group rounded-sm border-gold-gradient p-6 text-left backdrop-blur transition-all hover:-translate-y-1 hover:shadow-gold">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-gradient-gold-soft">
            <it.icon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mt-4 font-display text-2xl">{it.title}</h3>
          <p className="mt-2 text-sm font-light text-muted-foreground">{it.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const LeadStep = ({ handle, email, setEmail, phone, setPhone, name, setName, onSubmit, onBack }: any) => (
  <div className="animate-fade-up mx-auto max-w-lg">
    <button onClick={onBack} className="mb-6 text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-primary">
      ← Voltar
    </button>
    <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary">
      <Instagram className="h-3 w-3" /> @{handle}
    </span>
    <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
      Onde você quer<br />receber seu <span className="text-gold italic">diagnóstico</span>?
    </h2>
    <p className="mt-4 text-muted-foreground">
      Vamos enviar o relatório completo e seu plano de ação. Sem spam — palavra.
    </p>

    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Seu nome</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como te chamamos?" className="h-11 rounded-sm border-gold bg-input font-light" />
      </div>
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" className="h-11 rounded-sm border-gold bg-input font-light" />
      </div>
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">WhatsApp <span className="opacity-50">(opcional, mas recomendado)</span></label>
        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="h-11 rounded-sm border-gold bg-input font-light" />
      </div>

      <Button type="submit" size="lg" className="btn-luxe h-12 w-full gap-2 rounded-sm text-sm font-semibold uppercase tracking-[0.15em]">
        Gerar meu diagnóstico agora <ArrowRight className="h-4 w-4" />
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Ao continuar você concorda em receber seu relatório por email/WhatsApp.
      </p>
    </form>
  </div>
);

const LoadingStep = ({ message, handle }: { message: string; handle: string }) => (
  <div className="animate-fade-up flex min-h-[60vh] flex-col items-center justify-center text-center">
    <div className="relative">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <div className="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-2xl" />
    </div>
    <p className="mt-8 text-xs uppercase tracking-[0.3em] text-muted-foreground">Analisando @{handle}</p>
    <p className="mt-4 min-h-[2rem] font-display text-2xl text-gold transition-all sm:text-3xl">
      {message}
    </p>
    <div className="mt-8 h-[2px] w-64 overflow-hidden rounded-full bg-muted">
      <div className="h-full animate-shimmer" />
    </div>
  </div>
);

const PrivateStep = ({ data, onRetry }: { data: DiagnosisData; onRetry: () => void }) => (
  <div className="animate-fade-up mx-auto max-w-xl text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-card">
      <Lock className="h-7 w-7 text-primary" />
    </div>
    <h2 className="mt-6 font-display text-4xl">Seu perfil está <span className="text-gold italic">privado</span></h2>
    <p className="mt-4 text-muted-foreground">
      Já salvamos seus dados — vamos te avisar assim que rodarmos a análise. Para gerar o diagnóstico real <strong>agora</strong>, abra seu perfil temporariamente:
    </p>
    <div className="mt-8 rounded-sm border-gold-gradient p-6 text-left text-sm font-light">
      <ol className="space-y-3 text-muted-foreground">
        <li><span className="text-primary">1.</span> Abra o app do Instagram → Configurações</li>
        <li><span className="text-primary">2.</span> Privacidade → desmarque "Conta privada"</li>
        <li><span className="text-primary">3.</span> Volte aqui e clique em <strong className="text-foreground">Tentar de novo</strong></li>
        <li><span className="text-primary">4.</span> Depois é só voltar para privado, se preferir</li>
      </ol>
    </div>
    <Button onClick={onRetry} size="lg" className="btn-luxe mt-8 h-12 gap-2 rounded-sm px-8 text-sm font-semibold uppercase tracking-[0.15em]">
      Tentar de novo <ArrowRight className="h-4 w-4" />
    </Button>
  </div>
);

const ResultStep = ({ data, onRestart }: { data: DiagnosisData; onRestart: () => void }) => {
  const d = data.diagnosis!;
  const p = data.profile!;
  const score = d.score_geral ?? 0;

  return (
    <div className="animate-fade-up space-y-12">
      {/* Header perfil */}
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:gap-8 sm:text-left">
        {p.profilePicUrl && (
          <div className="relative shrink-0">
            <img
              src={proxied(p.profilePicUrl)}
              alt={p.username}
              className="h-24 w-24 rounded-full border border-primary/40 object-cover"
              onError={(e) => ((e.currentTarget.style.display = "none"))}
            />
            <div className="absolute -inset-1 -z-10 rounded-full bg-primary/20 blur-xl" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">diagnóstico de</p>
          <h2 className="mt-1 break-all font-display text-3xl leading-none sm:text-4xl">
            @{p.username}
          </h2>
          {p.fullName && <p className="mt-2 text-sm text-muted-foreground">{p.fullName}</p>}
        </div>
        <div className="flex shrink-0 gap-8 text-center sm:text-right">
          <Stat label="Seguidores" value={fmt(p.followersCount)} />
          <Stat label="Posts" value={fmt(p.postsCount)} />
        </div>
      </div>

      {/* Score hero */}
      <div className="relative overflow-hidden rounded-sm border-gold-gradient p-10 text-center shadow-deep">
        <div className="pointer-events-none absolute inset-0 bg-gradient-gold-soft opacity-60" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Sua nota geral</p>
        <div className="mt-4 font-display text-8xl text-gold sm:text-9xl">{score}</div>
        <p className="text-sm text-muted-foreground">de 100</p>
        <p className="mx-auto mt-6 max-w-2xl text-base italic text-foreground/90 sm:text-lg">
          "{d.veredicto}"
        </p>
        </div>
      </div>

      {/* Scores breakdown */}
      <div>
        <h3 className="font-display text-2xl">Análise por dimensão</h3>
        <div className="mt-6 space-y-4">
          {Object.entries(d.scores ?? {}).map(([key, val]) => (
            <ScoreBar key={key} label={labelFor(key)} value={val} />
          ))}
        </div>
      </div>

      {/* Pontos fortes / gaps */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="O que está funcionando" icon={CheckCircle2} items={d.pontos_fortes} accent="text-primary" />
        <Card title="Onde você está perdendo dinheiro" icon={AlertTriangle} items={d.gaps_criticos} accent="text-destructive" />
      </div>

      {/* Plano de ação */}
      <div className="rounded-sm border-gold-gradient p-8">
        <h3 className="font-display text-2xl">Seu plano de ação <span className="text-gold">priorizado</span></h3>
        <ol className="mt-6 space-y-4">
          {d.plano_acao?.map((step, i) => (
            <li key={i} className="flex gap-4 border-b border-border/50 pb-4 last:border-0">
              <span className="font-display text-3xl text-primary">{String(i + 1).padStart(2, "0")}</span>
              <p className="flex-1 pt-2 text-foreground/90">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* CTA final */}
      <div className="relative overflow-hidden rounded-sm border-gold-gradient p-10 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gradient-gold-soft" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-sm border border-gold bg-background/40 px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] text-primary">
            <Sparkles className="h-3 w-3" /> próximo passo
          </span>
          <h3 className="mt-5 font-display text-3xl sm:text-5xl">
            Pare de <span className="text-gold italic">analisar</span>.<br />Comece a <span className="text-gold italic">executar</span>.
          </h3>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Veja como ficou minha bio inteligente — e monte a sua em minutos. Link in bio, captura de leads, analytics e agenda, tudo num lugar só.
          </p>
          <a
            href="https://joanderson-links.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-luxe mt-7 inline-flex h-12 items-center gap-2 rounded-sm px-8 text-sm font-semibold uppercase tracking-[0.15em]"
          >
            Ver bio do Joanderson e criar a minha <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            disponível agora · cadastro em 1 minuto
          </p>

          <div className="mx-auto mt-8 flex max-w-md items-center gap-4 rounded-sm border border-gold/40 bg-card/40 p-4 text-left">
            <Instagram className="h-6 w-6 shrink-0 text-primary" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-foreground">Curtiu o diagnóstico?</p>
              <p className="text-xs font-light text-muted-foreground">Me segue no Instagram pra mais análises e estratégias.</p>
            </div>
            <a
              href="https://instagram.com/eusoujoanderson"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm border border-gold bg-background/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary transition-all hover:bg-gradient-gold-soft"
            >
              Seguir
            </a>
          </div>

          <button onClick={onRestart} className="mt-6 text-xs uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-primary">
            ou analisar outro perfil →
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- helpers ---------- */

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="font-display text-2xl text-primary">{value}</div>
    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
  </div>
);

const ScoreBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="mb-1 flex justify-between text-sm">
      <span className="text-foreground/80">{label}</span>
      <span className="font-display text-primary">{value}/100</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-1000"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  </div>
);

const Card = ({ title, icon: Icon, items, accent }: any) => (
  <div className="rounded-sm border border-gold bg-card/60 p-6">
    <div className="flex items-center gap-2">
      <Icon className={`h-5 w-5 ${accent}`} />
      <h3 className="font-display text-xl">{title}</h3>
    </div>
    <ul className="mt-4 space-y-3">
      {items?.map((it: string, i: number) => (
        <li key={i} className="flex gap-3 text-sm text-foreground/85">
          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${accent.replace("text-", "bg-")}`} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  </div>
);

const fmt = (n: number | undefined) => {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
};

const labelFor = (key: string) => {
  const map: Record<string, string> = {
    posicionamento: "Posicionamento",
    bio_e_cta: "Bio e CTA",
    consistencia: "Consistência",
    engajamento: "Engajamento",
    conversao: "Conversão",
  };
  return map[key] ?? key;
};

export default Index;
