import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { Building2, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const TenantSelector = () => {
  const { tenants, current, loading, setCurrentId } = useCurrentTenant();

  if (loading) {
    return (
      <div className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold/40 bg-card/40 px-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        carregando…
      </div>
    );
  }

  if (tenants.length === 0) return null;

  // Único tenant: mostra como label estática
  if (tenants.length === 1 && current) {
    return (
      <div className="inline-flex h-10 items-center gap-2 rounded-sm border border-gold/40 bg-card/40 px-3 text-[11px] uppercase tracking-[0.2em] text-primary">
        <Building2 className="h-3.5 w-3.5" />
        {current.display_name}
      </div>
    );
  }

  // Múltiplos tenants (super admin ou owner de vários): seletor
  return (
    <Select value={current?.id ?? ""} onValueChange={setCurrentId}>
      <SelectTrigger className="h-10 w-[200px] rounded-sm border-gold bg-card/40 text-[11px] uppercase tracking-[0.2em] text-primary">
        <span className="flex items-center gap-2 mt-[3px]">
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <SelectValue placeholder="Tenant…" />
        </span>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {tenants.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            <span className="flex items-center gap-2">
              <span className="font-medium">{t.display_name}</span>
              <span className="text-muted-foreground text-[10px] uppercase tracking-[0.15em]">
                {t.slug}
              </span>
              {t.status !== "active" && (
                <span className="rounded-sm bg-amber-500/20 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-amber-500">
                  {t.status}
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
