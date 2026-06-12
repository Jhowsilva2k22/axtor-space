import { motion } from "framer-motion";
import { Plus, ExternalLink, Trash2, FileEdit } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DeepFunnel } from "@/hooks/useDeepDiagnostic";

export type FunnelListViewProps = {
  funnels: DeepFunnel[];
  onNew: () => void;
  onEdit: (funnelId: string) => void;
  onEditBriefing: (funnelId: string) => void;
  onDelete: (funnelId: string, funnelName: string) => void;
};

export const FunnelListView = ({ funnels, onNew, onEdit, onEditBriefing, onDelete }: FunnelListViewProps) => {
  return (
    <motion.div
      key="list"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl sm:text-3xl">Seus funis</h1>
        <Button onClick={onNew} className="btn-luxe animate-pulse-soft h-11 rounded-2xl gap-2 px-5 text-xs uppercase tracking-[0.2em] max-sm:w-full">
          <Plus className="h-4 w-4" /> Novo funil
        </Button>
      </div>

      {funnels.length === 0 && (
        <Card className="rounded-2xl border-gold/20 p-6 text-center sm:p-8">
          <p className="text-muted-foreground">
            Você ainda não criou nenhum funil. Comece pelo briefing.
          </p>
          <Button className="mt-4 rounded-2xl" onClick={onNew}>
            Criar meu primeiro funil
          </Button>
        </Card>
      )}

      {funnels.map((f, i) => (
        <motion.div
          key={f.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 + i * 0.04, duration: 0.25 }}
        >
          <Card className="flex flex-col gap-3 rounded-2xl border-gold/20 p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-medium">{f.name}</h3>
                {f.is_published ? (
                  <Badge variant="default" className="rounded-xl">Publicado</Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-xl">Rascunho</Badge>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">/d/funnel/{f.slug}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {f.is_published && (
                <Button variant="outline" size="sm" className="rounded-xl border-gold/20" asChild>
                  <a
                    href={`/d/funnel/${f.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> Ver
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditBriefing(f.id)}
                className="gap-1 rounded-xl border-gold/20"
              >
                <FileEdit className="h-3 w-3" /> Briefing
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(f.id, f.name)}
                aria-label={`Excluir funil ${f.name}`}
                className="rounded-xl"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button size="sm" className="rounded-xl" onClick={() => onEdit(f.id)}>
                Editar
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};
