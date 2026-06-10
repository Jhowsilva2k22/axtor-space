import { buttonVariants } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { GlowCard } from "@/components/landing/GlowCard";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Link } from "react-router-dom";
import NumberFlow from "@number-flow/react";

export interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function Pricing({
  plans,
  title = "Planos simples e transparentes",
  description = "Escolha o plano que combina com seu momento.\nVocê só usa crédito quando aciona a IA. Sem ilimitado falso.",
}: PricingProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className="py-8">
      <div className="mb-10 space-y-3 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          {title}
        </h2>
        <p className="whitespace-pre-line text-base text-muted-foreground">
          {description}
        </p>
      </div>

      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
        style={{ perspective: "1600px" }}
      >
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ y: 50, opacity: 0 }}
            whileInView={
              isDesktop
                ? {
                    y: plan.isPopular ? -20 : 0,
                    opacity: 1,
                    x: index === 2 ? -28 : index === 0 ? 28 : 0,
                    scale: plan.isPopular ? 1.02 : 0.95,
                    rotateY: index === 0 ? 9 : index === 2 ? -9 : 0,
                    z: plan.isPopular ? 0 : -50,
                  }
                : { y: 0, opacity: 1 }
            }
            viewport={{ once: true }}
            transition={{
              duration: 1.4,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: 0.3,
              opacity: { duration: 0.5 },
            }}
            className={cn(
              index === 0 && "origin-right",
              index === 2 && "origin-left",
            )}
          >
            <GlowCard
              className={cn(
                "flex h-full flex-col text-center",
                plan.isPopular &&
                  "border-2 border-primary shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.4)]",
              )}
            >
              {plan.isPopular && (
                <div className="absolute right-0 top-0 z-10 flex items-center rounded-bl-xl rounded-tr-[18px] bg-gradient-to-br from-primary to-primary-glow px-2.5 py-1">
                  <Star className="h-3.5 w-3.5 fill-current text-primary-foreground" />
                  <span className="ml-1 text-xs font-semibold text-primary-foreground">
                    Popular
                  </span>
                </div>
              )}

              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {plan.name}
              </p>

              <div className="mt-6 flex items-center justify-center gap-x-2">
                <span className="text-5xl font-extrabold tracking-tight text-foreground">
                  <NumberFlow
                    value={Number(plan.price)}
                    format={{
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }}
                    locales="pt-BR"
                    transformTiming={{ duration: 500, easing: "ease-out" }}
                    willChange
                    className="tabular-nums"
                  />
                </span>
                <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">
                  / {plan.period}
                </span>
              </div>

              <p className="text-xs leading-5 text-muted-foreground">
                cobrado mensalmente
              </p>

              <ul className="mt-5 flex flex-col gap-2 text-left">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <hr className="my-4 w-full border-border" />

              <Link
                to={plan.href}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "relative mt-auto w-full gap-2 text-base font-semibold tracking-tight",
                  "transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-1 hover:ring-offset-background",
                  plan.isPopular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-background text-foreground hover:bg-primary hover:text-primary-foreground",
                )}
              >
                {plan.buttonText}
              </Link>

              <p className="mt-6 text-xs leading-5 text-muted-foreground">
                {plan.description}
              </p>
            </GlowCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
