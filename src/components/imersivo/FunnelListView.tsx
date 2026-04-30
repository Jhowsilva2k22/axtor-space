import { motion } from "framer-motion";
import { Plus, ExternalLink, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DeepFunnel } from "@/hooks/useDeepDiagnostic";

export type FunnelListViewProps = {
  funnels: DeepFunnel[];
  onNew: () => void;
  onEdit: (funnelId: string) => void;
  onDelete: (funnelId: string, funnelName: string) => void;
};

export const FunnelListView = ({ funnels, onNew, onEdit, onDelete }: FunnelListViewProps) => {
  return (
    <motion.div
      key="list"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Seus funis</h1>
        <Button onClick={onNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo funil
        </Button>
      </div>

      {funnels.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Você ainda não criou nenhum funil. Comece pelo briefing.
          </p>
          <Button className="mt-4" onClick={onNew}>
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
          <Card className="flex items-center justify-between gap-4 p-5 transition-colors hover:border-primary/40">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium">{f.name}</h3>
                {f.is_published ? (
                  <Badge variant="default">Publicado</Badge>
                ) : (
                  <Badge variant="secondary">Rascunho</Badge>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">/d/funnel/{f.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              {f.is_published && (
                <Button variant="outline" size="sm" asChild>
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
                variant="ghost"
                size="sm"
                onClick={() => onDelete(f.id, f.name)}
                aria-label={`Excluir funil ${f.name}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button size="sm" onClick={() => onEdit(f.id)}>
                Editar
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};
