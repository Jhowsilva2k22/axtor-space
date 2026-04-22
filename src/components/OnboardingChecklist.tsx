import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Circle, ChevronDown, ChevronUp, ExternalLink, Sparkles } from "lucide-react";

type Step = {
  id: string;
  label: string;
  hint: string;
  done: boolean;
  cta?: { label: string; onClick?: () => void; href?: string; external?: boolean };
};

type Props = {
  hasAvatar: boolean;
  hasHeadline: boolean;
  hasActiveBlock: boolean;
  bioUrl: string;
  onFocusHeader?: () => void;
  onFocusBlocks?: () => void;
};

const STORAGE_KEY = "axtor.onboarding.dismissed";

export const OnboardingChecklist = ({
  hasAvatar,
  hasHeadline,
  hasActiveBlock,
  bioUrl,
  onFocusHeader,
  onFocusBlocks,
}: Props) => {
  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const steps: Step[] = useMemo(
    () => [
      {
        id: "avatar",
        label: "Adicionar foto de perfil",
        hint: "Bios com foto convertem 3× mais",
        done: hasAvatar,
        cta: { label: "Adicionar foto", onClick: onFocusHeader },
      },
      {
        id: "headline",
        label: "Escrever sua headline",
        hint: "A frase que diz quem você é em 1 linha",
        done: hasHeadline,
        cta: { label: "Editar headline", onClick: onFocusHeader },
      },
      {
        id: "block",
        label: "Criar seu primeiro bloco ativo",
        hint: "WhatsApp, Instagram, site, agenda — pelo menos um",
        done: hasActiveBlock,
        cta: { label: "Adicionar bloco", onClick: onFocusBlocks },
      },
      {
        id: "view",
        label: "Ver sua bio publicada",
        hint: "Confira como ficou pra quem acessa",
        done: hasAvatar && hasHeadline && hasActiveBlock,
        cta: { label: "Abrir bio", href: bioUrl, external: true },
      },
    ],
    [hasAvatar, hasHeadline, hasActiveBlock, bioUrl, onFocusHeader, onFocusBlocks],
  );

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const allDone = completed === total;

  if (hidden) return null;

  // Auto-esconde quando 100% completo (sem alarde)
  if (allDone) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // noop
    }
    setHidden(true);
  };

  return (
    <section className="rounded-sm border-gold-gradient bg-gradient-gold-soft p-5 shadow-deep">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-gold bg-background/40">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg leading-none">
              Configure sua <span className="text-gold italic">bio</span>
            </h3>
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {completed} de {total} passos concluídos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-background/60 md:block">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="inline-flex h-8 items-center gap-1 rounded-sm border border-gold/40 bg-background/30 px-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
            aria-label={collapsed ? "Expandir" : "Recolher"}
          >
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="hidden h-8 items-center rounded-sm border border-border/40 bg-background/30 px-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive sm:inline-flex"
          >
            dispensar
          </button>
        </div>
      </header>

      {!collapsed && (
        <ul className="mt-5 space-y-2">
          {steps.map((s) => (
            <li
              key={s.id}
              className={`flex items-center justify-between gap-3 rounded-sm border px-3 py-3 transition-all ${
                s.done
                  ? "border-gold/30 bg-background/20 opacity-70"
                  : "border-gold/50 bg-background/40 hover:border-gold"
              }`}
            >
              <div className="flex items-center gap-3">
                {s.done ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gold bg-gradient-gold-soft">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
                )}
                <div>
                  <p
                    className={`text-sm font-light ${
                      s.done ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {s.label}
                  </p>
                  {!s.done && (
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                      {s.hint}
                    </p>
                  )}
                </div>
              </div>
              {!s.done && s.cta && (
                s.cta.href ? (
                  s.cta.external ? (
                    <a
                      href={s.cta.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-sm border border-gold bg-background/40 px-3 text-[10px] uppercase tracking-[0.2em] text-primary hover:bg-gradient-gold-soft"
                    >
                      {s.cta.label} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <Link
                      to={s.cta.href}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-sm border border-gold bg-background/40 px-3 text-[10px] uppercase tracking-[0.2em] text-primary hover:bg-gradient-gold-soft"
                    >
                      {s.cta.label}
                    </Link>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={s.cta.onClick}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-sm border border-gold bg-background/40 px-3 text-[10px] uppercase tracking-[0.2em] text-primary hover:bg-gradient-gold-soft"
                  >
                    {s.cta.label}
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default OnboardingChecklist;