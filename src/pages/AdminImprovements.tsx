import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useAdminLockedTheme } from "@/components/ThemeToggle";
import { TenantSelector } from "@/components/TenantSelector";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

type Recommendation = {
  id: string;
  title: string;
  summary: string;
  rationale: string | null;
  category: string;
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  priority_score: number;
  evidence: Array<{ source: string; detail: string }>;
  action_type: string | null;
  status: "new" | "in_progress" | "applied" | "dismissed";
  created_at: string;
};

type Feedback = {
  id: string;
  category: string;
  message: string;
  email: string | null;
  page_path: string | null;
  device: string | null;
  status: string;
  created_at: string;
};

type Run = {
  id: string;
  status: string;
  ai_summary: string | null;
  recommendations_count: number;
  created_at: string;
  completed_at: string | null;
};

const impactColor = (v: string) =>
  v === "high"
    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
    : v === "medium"
    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
    : "bg-muted text-muted-foreground border-border";

const effortColor = (v: string) =>
  v === "low"
    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
    : v === "medium"
    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
    : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";

export default function AdminImprovements() {
  const { user, loading: authLoading } = useAuth();
  useAdminLockedTheme();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("active");

  useEffect(() => {
    if (!user) return;
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const load = async () => {
    setLoading(true);
    const [r, f, rn] = await Promise.all([
      supabase
        .from("improvement_recommendations")
        .select("*")
        .order("priority_score", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("improvement_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    if (r.data) setRecs(r.data as unknown as Recommendation[]);
    if (f.data) setFeedback(f.data as Feedback[]);
    if (rn.data) setRuns(rn.data as Run[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-improvements");
      if (error) throw error;
      toast.success(`Análise concluída: ${data?.count ?? 0} sugestões geradas.`);
      await load();
    } catch (e: any) {
      console.error(e);
      const msg = e?.message ?? "Falha ao gerar análise";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (id: string, status: Recommendation["status"]) => {
    const { error } = await supabase
      .from("improvement_recommendations")
      .update({
        status,
        applied_at: status === "applied" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar");
      return;
    }
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const removeRec = async (id: string) => {
    const { error } = await supabase.from("improvement_recommendations").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    setRecs((prev) => prev.filter((r) => r.id !== id));
  };

  const filtered = useMemo(() => {
    if (statusFilter === "all") return recs;
    if (statusFilter === "active") return recs.filter((r) => r.status === "new" || r.status === "in_progress");
    return recs.filter((r) => r.status === statusFilter);
  }, [recs, statusFilter]);

  const lastRun = runs[0];

  if (authLoading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (isAdmin === false) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">
                <ArrowLeft className="mr-1 h-4 w-4" /> Admin
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">Sugestões Inteligentes</h1>
          </div>
          <div className="flex items-center gap-2">
          <TenantSelector />
          <Button onClick={generate} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Gerar análise com IA
              </>
            )}
          </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {lastRun?.ai_summary && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" /> Resumo da última análise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="leading-relaxed text-foreground">{lastRun.ai_summary}</p>
              <p className="text-xs">
                {new Date(lastRun.created_at).toLocaleString("pt-BR")} · {lastRun.recommendations_count} sugestões
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="recs">
          <TabsList>
            <TabsTrigger value="recs">
              Recomendações ({recs.filter((r) => r.status === "new" || r.status === "in_progress").length})
            </TabsTrigger>
            <TabsTrigger value="feedback">
              Feedback dos usuários ({feedback.length})
            </TabsTrigger>
            <TabsTrigger value="history">Histórico ({runs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="recs" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { v: "active", l: "Ativas" },
                { v: "new", l: "Novas" },
                { v: "in_progress", l: "Em andamento" },
                { v: "applied", l: "Aplicadas" },
                { v: "dismissed", l: "Descartadas" },
                { v: "all", l: "Todas" },
              ].map((f) => (
                <Button
                  key={f.v}
                  size="sm"
                  variant={statusFilter === f.v ? "default" : "outline"}
                  onClick={() => setStatusFilter(f.v)}
                >
                  {f.l}
                </Button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Nenhuma recomendação ainda. Clique em <strong>Gerar análise com IA</strong> para começar.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filtered.map((r) => (
                  <Card key={r.id} className={r.status === "applied" ? "opacity-60" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {r.category}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${impactColor(r.impact)}`}>
                              Impacto: {r.impact}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${effortColor(r.effort)}`}>
                              Esforço: {r.effort}
                            </Badge>
                            {r.status !== "new" && (
                              <Badge variant="secondary" className="text-xs">
                                {r.status === "in_progress"
                                  ? "Em andamento"
                                  : r.status === "applied"
                                  ? "Aplicada"
                                  : "Descartada"}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-base leading-snug">{r.title}</CardTitle>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeRec(r.id)}
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p className="text-foreground">{r.summary}</p>
                      {r.rationale && (
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Por quê: </span>
                          {r.rationale}
                        </p>
                      )}
                      {r.evidence?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Evidências
                          </p>
                          <ul className="space-y-1 text-xs text-muted-foreground">
                            {r.evidence.map((ev, i) => (
                              <li key={i} className="flex gap-2">
                                <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                                  {ev.source}
                                </Badge>
                                <span>{ev.detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {r.status !== "applied" && (
                          <Button size="sm" onClick={() => updateStatus(r.id, "applied")}>
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Marcar como aplicada
                          </Button>
                        )}
                        {r.status !== "in_progress" && r.status !== "applied" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "in_progress")}>
                            <Clock className="mr-1 h-4 w-4" /> Em andamento
                          </Button>
                        )}
                        {r.status !== "dismissed" && r.status !== "applied" && (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(r.id, "dismissed")}>
                            <XCircle className="mr-1 h-4 w-4" /> Descartar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-3">
            {feedback.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum feedback recebido ainda.
                </CardContent>
              </Card>
            ) : (
              feedback.map((f) => (
                <Card key={f.id}>
                  <CardContent className="space-y-2 py-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="capitalize">
                        {f.category}
                      </Badge>
                      {f.device && <span>{f.device}</span>}
                      {f.page_path && <span>· {f.page_path}</span>}
                      <span>· {new Date(f.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                    <p className="text-foreground"><MessageSquare className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />{f.message}</p>
                    {f.email && <p className="text-xs text-muted-foreground">Contato: {f.email}</p>}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            {runs.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Nenhuma análise executada ainda.
                </CardContent>
              </Card>
            ) : (
              runs.map((r) => (
                <Card key={r.id}>
                  <CardContent className="space-y-1 py-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("pt-BR")}
                      </span>
                      <Badge variant={r.status === "completed" ? "default" : r.status === "failed" ? "destructive" : "secondary"}>
                        {r.status}
                      </Badge>
                    </div>
                    <p className="text-foreground">
                      {r.recommendations_count} recomendações geradas
                    </p>
                    {r.ai_summary && (
                      <p className="text-xs text-muted-foreground">{r.ai_summary}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}