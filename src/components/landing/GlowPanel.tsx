import type { CSSProperties, ElementType, ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Casca padrão das telas externas (login, signup, recuperar senha, loja-convidado, 404…).
 * Card azul-copa: borda gold, blur, sombra e o glow que segue o mouse (`data-glow`).
 *
 * Fonte ÚNICA de verdade — mudou aqui, mudou em todas as telas. Antes essa string
 * estava copiada em ~9 lugares; qualquer card novo dependia de copiar certo.
 *
 * - Renderiza <div> por padrão. Telas com formulário usam `as="form"` (o `onSubmit`
 *   e demais props são repassados normalmente).
 * - `className` é mesclado via tailwind-merge, então dá pra sobrescrever (ex.: `p-8`,
 *   `text-center`) sem conflito com as classes base.
 */
const BASE =
  "relative z-10 w-full max-w-sm rounded-[32px] border border-gold/20 bg-card/40 p-10 shadow-2xl backdrop-blur-xl";

type GlowPanelProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "style">;

export function GlowPanel<T extends ElementType = "div">({
  as,
  className,
  ...rest
}: GlowPanelProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      data-glow
      style={{ ["--glow-radius" as string]: "32" } as CSSProperties}
      className={cn(BASE, className)}
      {...rest}
    />
  );
}
