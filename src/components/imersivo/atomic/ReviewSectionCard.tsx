import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ReviewSectionCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
};

export const ReviewSectionCard = ({
  title,
  children,
  className,
  titleClassName,
}: ReviewSectionCardProps) => {
  return (
    <Card className={cn("space-y-4 p-6", className)}>
      <h2 className={cn("font-display text-lg", titleClassName)}>{title}</h2>
      {children}
    </Card>
  );
};
