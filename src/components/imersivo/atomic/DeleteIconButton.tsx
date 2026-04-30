import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DeleteIconButtonProps = {
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
  iconClassName?: string;
};

export const DeleteIconButton = ({
  onClick,
  ariaLabel,
  className,
  iconClassName,
}: DeleteIconButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={ariaLabel}
      className={className}
    >
      <Trash2 className={cn("h-4 w-4", iconClassName)} />
    </Button>
  );
};
