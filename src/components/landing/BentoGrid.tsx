import { cn } from "@/lib/utils";
import { GlowCard } from "@/components/landing/GlowCard";
import {
  FileSearch,
  Link2,
  CheckCircle2,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

interface BentoItem {
  title: string;
  meta?: string;
  description: string;
  icon: LucideIcon;
  status?: string;
  tags?: string[];
  colSpan?: number;
}

// Mesma grade/design — reordenada como uma jornada de 4 passos, com headline
// no RESULTADO do cliente (não no nome do recurso). Sem "ilimitado".
const items: BentoItem[] = [
  {
    title: "Todos entram num lugar só",
    meta: "link na bio",
    description:
      "Sua bio com blocos, botões e páginas, no seu domínio. Você monta à vontade e só gasta crédito quando aciona a IA.",
    icon: Link2,
    status: "1 · entrada",
    tags: ["bio", "seu domínio"],
    colSpan: 2,
  },
  {
    title: "Saiba quem é o lead antes de falar",
    meta: "diagnóstico de Instagram",
    description:
      "Ele digita o @ e recebe uma análise na hora. Você captura um lead já qualificado.",
    icon: FileSearch,
    status: "2 · diagnóstico",
    tags: ["tempo real", "1 crédito"],
  },
  {
    title: "Receba o lead com o veredito pronto",
    meta: "diagnóstico imersivo",
    description:
      "Um funil de perguntas conduz cada pessoa até um resultado personalizado, com o contexto junto.",
    icon: CheckCircle2,
    status: "3 · qualifica",
    tags: ["por conclusão", "1 crédito"],
  },
  {
    title: "O lead cai na sua mão",
    meta: "leads + analytics",
    description:
      "Veja quem chegou, de onde veio e o que converteu. Exporte em CSV e leve pro seu CRM.",
    icon: BarChart3,
    status: "4 · resultado",
    tags: ["captura", "métricas", "CSV/CRM"],
    colSpan: 2,
  },
];

export function BentoGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <GlowCard
            key={index}
            className={cn(
              "transition-transform duration-300 hover:-translate-y-1",
              item.colSpan === 2 ? "md:col-span-2" : "md:col-span-1",
            )}
          >
            <div className="flex flex-col">
              <div className="mb-3.5 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-primary/10">
                  <Icon className="h-[18px] w-[18px] text-primary" />
                </div>
                <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {item.status ?? "Ativo"}
                </span>
              </div>

              <h3 className="text-base font-bold">
                {item.title}
                {item.meta && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {item.meta}
                  </span>
                )}
              </h3>
              <p className="mt-1.5 text-sm leading-snug text-muted-foreground">
                {item.description}
              </p>

              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {item.tags?.map((tag, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </GlowCard>
        );
      })}
    </div>
  );
}
