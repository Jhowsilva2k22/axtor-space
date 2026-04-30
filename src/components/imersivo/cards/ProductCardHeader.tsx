import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DeleteIconButton } from "@/components/imersivo/atomic/DeleteIconButton";

type ProductCardHeaderProps = {
  index: number;
  painTag: string;
  isActive: boolean;
  name: string;
  onActiveChange: (active: boolean) => void;
  onDelete: () => void;
};

export const ProductCardHeader = ({
  index,
  painTag,
  isActive,
  name,
  onActiveChange,
  onDelete,
}: ProductCardHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Badge variant="outline">Produto {index + 1}</Badge>
        <Badge variant={isActive ? "default" : "secondary"}>{painTag}</Badge>
        {!isActive && (
          <span className="truncate text-sm text-muted-foreground">— {name || "(sem nome)"} (desativado)</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Ativo</span>
          <Switch checked={isActive} onCheckedChange={onActiveChange} />
        </div>
        <DeleteIconButton
          onClick={onDelete}
          ariaLabel="Excluir produto"
          iconClassName="text-destructive"
        />
      </div>
    </div>
  );
};
