import React from "react";
import { cn } from "@/lib/utils";

// Fundo de padrão ESTÁTICO (CSS puro, sem animação) — custo ~zero.
// Use como textura sutil atrás do conteúdo. Padrão da marca: dots + fade-center.

type BGVariantType =
  | "dots"
  | "diagonal-stripes"
  | "grid"
  | "horizontal-lines"
  | "vertical-lines"
  | "checkerboard";

type BGMaskType =
  | "fade-center"
  | "fade-edges"
  | "fade-top"
  | "fade-bottom"
  | "fade-left"
  | "fade-right"
  | "fade-x"
  | "fade-y"
  | "none";

type BGPatternProps = React.ComponentProps<"div"> & {
  variant?: BGVariantType;
  mask?: BGMaskType;
  size?: number;
  fill?: string;
  /** Brilho radial (orb) dourado por cima da grade. */
  glow?: boolean;
};

// A máscara usa só o canal ALPHA: #000 = opaco (mostra), transparent = esconde.
// (Não usar var(--background) aqui — neste projeto é HSL cru, não cor válida.)
const maskClasses: Record<BGMaskType, string> = {
  "fade-edges": "[mask-image:radial-gradient(ellipse_at_center,#000,transparent)]",
  "fade-center": "[mask-image:radial-gradient(ellipse_at_center,transparent,#000)]",
  "fade-top": "[mask-image:linear-gradient(to_bottom,transparent,#000)]",
  "fade-bottom": "[mask-image:linear-gradient(to_bottom,#000,transparent)]",
  "fade-left": "[mask-image:linear-gradient(to_right,transparent,#000)]",
  "fade-right": "[mask-image:linear-gradient(to_right,#000,transparent)]",
  "fade-x": "[mask-image:linear-gradient(to_right,transparent,#000,transparent)]",
  "fade-y": "[mask-image:linear-gradient(to_bottom,transparent,#000,transparent)]",
  none: "",
};

function getBgImage(variant: BGVariantType, fill: string, size: number) {
  switch (variant) {
    case "dots":
      return `radial-gradient(${fill} 1px, transparent 1px)`;
    case "grid":
      return `linear-gradient(to right, ${fill} 1px, transparent 1px), linear-gradient(to bottom, ${fill} 1px, transparent 1px)`;
    case "diagonal-stripes":
      return `repeating-linear-gradient(45deg, ${fill}, ${fill} 1px, transparent 1px, transparent ${size}px)`;
    case "horizontal-lines":
      return `linear-gradient(to bottom, ${fill} 1px, transparent 1px)`;
    case "vertical-lines":
      return `linear-gradient(to right, ${fill} 1px, transparent 1px)`;
    case "checkerboard":
      return `linear-gradient(45deg, ${fill} 25%, transparent 25%), linear-gradient(-45deg, ${fill} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${fill} 75%), linear-gradient(-45deg, transparent 75%, ${fill} 75%)`;
    default:
      return undefined;
  }
}

const BGPattern = ({
  variant = "dots",
  mask = "none",
  size = 26,
  // Dourado da marca, claramente visível no escuro (dots são pequenos, precisam
  // de mais opacidade que linhas).
  fill = "hsl(var(--primary) / 0.35)",
  glow = true,
  className,
  style,
  ...props
}: BGPatternProps) => {
  const bgSize = `${size}px ${size}px`;
  const backgroundImage = getBgImage(variant, fill, size);
  return (
    <>
      {/* Grade */}
      <div
        className={cn("pointer-events-none absolute inset-0 -z-10 size-full", maskClasses[mask], className)}
        style={{ backgroundImage, backgroundSize: bgSize, ...style }}
        {...props}
      />
      {/* Orb — brilho radial dourado (estrutura do ref, cor da marca) */}
      {glow && (
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 50% 60%, hsl(var(--primary) / 0.14) 0%, hsl(var(--primary) / 0.05) 40%, transparent 70%)",
          }}
        />
      )}
    </>
  );
};

BGPattern.displayName = "BGPattern";

export { BGPattern };
