import { useEffect, useState } from "react";
import { Download, ChevronLeft, ChevronRight, Loader2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeads, type LeadsFilters } from "@/hooks/useLeads";

const STATUS_LABELS: Record<string, string> = {
  completed: "Concluído",
  pending: "Pendente",
  failed: "Com erro",
};

const PAIN_LABELS: Record<string, string> = {
  gestao: "Gestão",
  marketing: "Marketing",
  vendas: "Vendas",
  financeiro: "Financeiro",
  operacoes: "Operações",
};

export const LeadsTable = ({ tenantId }: { tenantId: string }) => {
  const { leads, total, loading, page, setPage, totalPages, filters, applyFilters, exportCsv } =
    useLeads(tenantId);

  const [draft, setDraft] = useState<LeadsFilters>(filters);
  const [clearKey, setClearKey] = useState(0);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const handleApply = () => applyFilters(draft);
  const handleClear = () => {
    const empty: LeadsFilters = { status: "", dateFrom: "", dateTo: "" };
    setClearKey((k) => k + 1);
    setDraft(empty);
    applyFilters(empty);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              value={draft.status || "_all"}
              onValueChange={(v) => setDraft({ ...draft, status: v === "_all" ? "" : v })}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="failed">Com erro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">De</Label>
            <Input
              key={`from-${clearKey}`}
              type="date"
              className="h-8 w-36 text-xs"
              value={draft.dateFrom}
              onChange={(e) => setDraft({ ...draft, dateFrom: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Até</Label>
            <Input
              key={`to-${clearKey}`}
              type="date"
              className="h-8 w-36 text-xs"
              value={draft.dateTo}
              onChange={(e) => setDraft({ ...draft, dateTo: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <Button size="sm" className="h-8" onClick={handleApply}>
              Filtrar
            </Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={handleClear}>
              Limpar
            </Button>
          </div>

          <div className="ml-auto">
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabela */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Users className="mb-4 h-10 w-10 text-muted-foreground/40" />
            <p className="font-display text-lg">Nenhum lead ainda</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Os leads capturados pelo funil de diagnóstico aparecerão aqui.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-mail</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Telefone</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Instagram</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Dor</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <tr
                      key={lead.id}
                      className={`border-b border-border/40 transition-colors hover:bg-muted/20 ${
                        i % 2 === 0 ? "" : "bg-muted/10"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">{lead.lead_name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.lead_email ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.lead_phone ?? "—"}</td>
                      <td className="px-4 py-3">
                        {lead.instagram_handle ? (
                          <span className="font-mono text-xs">@{lead.instagram_handle}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {lead.pain_detected ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            {PAIN_LABELS[lead.pain_detected] ?? lead.pain_detected}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(lead.created_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {total} lead{total !== 1 ? "s" : ""} · página {page + 1} de {Math.max(totalPages, 1)}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string | null }) => {
  if (!status) return <span className="text-muted-foreground">—</span>;

  const colorMap: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    failed: "bg-destructive/10 text-destructive",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${colorMap[status] ?? "bg-muted/50 text-muted-foreground"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
};
