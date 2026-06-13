import { useEffect, useRef, useState } from "react";
import { Download, ChevronLeft, ChevronRight, Loader2, Users, Trash2, Eye, EyeOff, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeads, type LeadsFilters } from "@/hooks/useLeads";

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  quente: "Quente",
  cliente: "Cliente",
  descartado: "Descartado",
};

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  imersivo: "Imersivo",
  landing_diagnostico: "Diagnóstico",
  diagnostico: "Diagnóstico",
};

// Campo de data próprio (Popover + Calendar). Substitui o <input type="date">
// nativo, que no iOS ignora a largura e estoura a tela. value/onChange usam
// string "yyyy-MM-dd" (mesmo formato que o filtro já espera).
const DateField = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) => {
  const date = value ? new Date(`${value}T00:00:00`) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 w-full justify-start rounded-xl border-gold/20 px-3 text-xs font-normal sm:h-8 sm:w-36",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
          {date ? format(date, "dd/MM/yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export const LeadsTable = ({ tenantId }: { tenantId: string }) => {
  const {
    leads,
    total,
    loading,
    page,
    setPage,
    totalPages,
    filters,
    applyFilters,
    exportCsv,
    deleteLeads,
    refresh,
    pageSize,
    setPageSize,
  } = useLeads(tenantId);

  const [draft, setDraft] = useState<LeadsFilters>(filters);
  const [clearKey, setClearKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    password: "",
    loading: false,
    error: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const hidePasswordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setDraft(filters); }, [filters]);
  useEffect(() => { setSelectedIds(new Set()); }, [page]);

  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleApply = () => applyFilters(draft);
  const handleClear = () => {
    const empty: LeadsFilters = { status: "", dateFrom: "", dateTo: "" };
    setClearKey((k) => k + 1);
    setDraft(empty);
    applyFilters(empty);
  };

  const handleExportSelected = () => {
    const selected = leads.filter((l) => selectedIds.has(l.id));
    if (selected.length === 0) return;

    const headers = ["ID", "Nome", "E-mail", "Telefone", "Instagram", "Origem", "Diagnósticos", "Status", "Última atividade"];
    const rows = selected.map((r) => [
      r.id,
      r.lead_name ?? "",
      r.lead_email ?? "",
      r.lead_phone ?? "",
      r.instagram_handle ?? "",
      r.source ?? "",
      String(r.diagnostics_count ?? 0),
      r.status ?? "",
      new Date(r.last_activity_at ?? r.created_at).toLocaleString("pt-BR"),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-selecionados-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialog((d) => ({ ...d, loading: true, error: "" }));
    const result = await deleteLeads([...selectedIds], deleteDialog.password);
    if (result.error) {
      setDeleteDialog((d) => ({ ...d, loading: false, error: result.error! }));
    } else {
      setSelectedIds(new Set());
      setDeleteDialog({ open: false, password: "", loading: false, error: "" });
      refresh();
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="rounded-2xl border-gold/20 p-4">
        <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap sm:gap-4">
          <div className="col-span-2 space-y-1.5 sm:col-auto">
            <Label className="text-xs">Status</Label>
            <Select
              key={`status-${clearKey}`}
              value={draft.status || "_all"}
              onValueChange={(v) => setDraft({ ...draft, status: v === "_all" ? "" : v })}
            >
              <SelectTrigger className="h-9 w-full rounded-xl border-gold/20 text-xs sm:h-8 sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="quente">Quente</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="descartado">Descartado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 min-w-0 flex flex-col gap-1.5 sm:col-auto">
            <Label className="text-xs">De</Label>
            <DateField
              value={draft.dateFrom}
              onChange={(v) => setDraft({ ...draft, dateFrom: v })}
              placeholder="dd/mm/aaaa"
            />
          </div>

          <div className="col-span-2 min-w-0 flex flex-col gap-1.5 sm:col-auto">
            <Label className="text-xs">Até</Label>
            <DateField
              value={draft.dateTo}
              onChange={(v) => setDraft({ ...draft, dateTo: v })}
              placeholder="dd/mm/aaaa"
            />
          </div>

          <div className="col-span-2 flex gap-2 sm:col-auto">
            <Button size="sm" className="h-9 rounded-xl max-sm:flex-1 sm:h-8" onClick={handleApply}>
              Filtrar
            </Button>
            <Button size="sm" variant="outline" className="h-9 rounded-xl border-gold/20 text-muted-foreground max-sm:flex-1 sm:h-8" onClick={handleClear}>
              Limpar
            </Button>
          </div>

          <div className="col-span-2 sm:col-auto sm:ml-auto">
            <Button size="sm" variant="outline" className="h-9 w-full gap-1.5 rounded-xl border-gold/20 sm:h-8 sm:w-auto" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Barra de ações em massa */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/20 bg-muted/30 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selectedIds.size} {selectedIds.size === 1 ? "selecionado" : "selecionados"}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 rounded-xl border-gold/20 text-xs"
            onClick={handleExportSelected}
          >
            <Download className="h-3.5 w-3.5" />
            Exportar selecionados
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-7 gap-1.5 rounded-xl text-xs"
            onClick={() => setDeleteDialog((d) => ({ ...d, open: true }))}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Deletar selecionados
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-7 rounded-xl text-xs"
            onClick={() => setSelectedIds(new Set())}
          >
            Cancelar seleção
          </Button>
        </div>
      )}

      {/* Tabela */}
      <Card className="overflow-hidden rounded-2xl border-gold/20">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center sm:p-16">
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
                    <th className="w-10 px-4 py-3">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Selecionar todos"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-mail</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Telefone</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Instagram</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Origem</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Diag.</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Última atividade</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <tr
                      key={lead.id}
                      className={`border-b border-border/40 transition-colors hover:bg-muted/20 ${
                        selectedIds.has(lead.id)
                          ? "bg-primary/5"
                          : i % 2 === 0
                          ? ""
                          : "bg-muted/10"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.has(lead.id)}
                          onCheckedChange={() => toggleOne(lead.id)}
                          aria-label={`Selecionar ${lead.lead_name ?? "lead"}`}
                        />
                      </td>
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
                        {lead.source ? (
                          <span className="rounded-xl bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                            {SOURCE_LABELS[lead.source] ?? lead.source}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {lead.diagnostics_count ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(lead.last_activity_at ?? lead.created_at).toLocaleString("pt-BR", {
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
                {total} lead{total !== 1 ? "s" : ""} · página {page + 1} de{" "}
                {Math.max(totalPages, 1)}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">por página</span>
                  <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                    <SelectTrigger className="h-7 w-[64px] rounded-xl border-gold/20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-xl"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-xl"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!deleteDialog.loading) {
            setDeleteDialog({ open, password: "", loading: false, error: "" });
            setShowPassword(false);
            if (hidePasswordTimer.current) clearTimeout(hidePasswordTimer.current);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Você está prestes a excluir{" "}
              <strong>
                {selectedIds.size} lead{selectedIds.size !== 1 ? "s" : ""}
              </strong>{" "}
              permanentemente. Esta ação não pode ser desfeita.
              <br />
              <br />
              Digite sua senha para confirmar:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                value={deleteDialog.password}
                onChange={(e) => setDeleteDialog((d) => ({ ...d, password: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && deleteDialog.password && !deleteDialog.loading) {
                    handleDeleteConfirm();
                  }
                }}
                className="rounded-2xl pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  if (showPassword) {
                    if (hidePasswordTimer.current) clearTimeout(hidePasswordTimer.current);
                    setShowPassword(false);
                  } else {
                    setShowPassword(true);
                    hidePasswordTimer.current = setTimeout(() => setShowPassword(false), 3000);
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {deleteDialog.error && (
              <p className="text-xs text-destructive">{deleteDialog.error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteDialog({ open: false, password: "", loading: false, error: "" });
                setShowPassword(false);
                if (hidePasswordTimer.current) clearTimeout(hidePasswordTimer.current);
              }}
              disabled={deleteDialog.loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteDialog.loading || !deleteDialog.password}
            >
              {deleteDialog.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Excluir definitivamente"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string | null }) => {
  if (!status) return <span className="text-muted-foreground">—</span>;

  const colorMap: Record<string, string> = {
    quente: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    cliente: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    descartado: "bg-destructive/10 text-destructive",
    novo: "bg-muted/50 text-muted-foreground",
  };

  return (
    <span
      className={`rounded-xl px-2 py-0.5 text-xs ${colorMap[status] ?? "bg-muted/50 text-muted-foreground"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
};
