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

const items: BentoItem[] = [
  {
    title: "Diagnóstico de Instagram",
    meta: "tempo real",
    description:
      "O visitante digita o @ e recebe uma análise do perfil na hora — você captura um lead já qualificado.",
    icon: FileSearch,
    status: "por IA",
    tags: ["1 crédito", "captura", "qualificação"],
    colSpan: 2,
  },
  {
    title: "Link-in-bio",
    description: "Blocos, botões, páginas e links sem limite. Custo zero.",
    icon: Link2,
    status: "ilimitado",
    tags: ["bio", "páginas"],
  },
  {
    title: "Diagnóstico imersivo",
    description:
      "Um funil que conduz o lead até um veredito personalizado por IA.",
    icon: CheckCircle2,
    status: "por lead",
    tags: ["1 crédito/conclusão"],
  },
  {
    title: "Leads + Analytics",
    meta: "exportável",
    description:
      "Veja quem chegou, de onde veio e o que converteu. Exporte em CSV e leve pro seu CRM.",
    icon: BarChart3,
    status: "Pro+",
    tags: ["captura", "métricas", "Pix/Asaas"],
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
