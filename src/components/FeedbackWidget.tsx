import { useState } from "react";
import { MessageSquarePlus, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Props = {
  pagePath?: string;
};

const CATEGORIES = [
  { v: "improvement", l: "Sugestão de melhoria" },
  { v: "bug", l: "Algo não está funcionando" },
  { v: "content", l: "Sugestão de conteúdo" },
  { v: "design", l: "Design / visual" },
  { v: "compliment", l: "Elogio" },
  { v: "other", l: "Outro" },
];

const getDevice = () => {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

const getSessionId = () => {
  if (typeof window === "undefined") return "anon";
  const KEY = "fb_session_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
};

export function FeedbackWidget({ pagePath }: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("improvement");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      toast.error("Escreva pelo menos algumas palavras.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("user_feedback").insert({
      category,
      message: trimmed,
      email: email.trim() || null,
      page_path: pagePath ?? (typeof window !== "undefined" ? window.location.pathname : null),
      session_id: getSessionId(),
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      device: getDevice(),
    });
    setLoading(false);
    if (error) {
      console.error(error);
      toast.error("Não foi possível enviar. Tente novamente.");
      return;
    }
    toast.success("Obrigado! Sua sugestão foi recebida.");
    setMessage("");
    setEmail("");
    setCategory("improvement");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          aria-label="Enviar sugestão"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105 hover:shadow-primary/50"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="text-sm font-medium">Sugerir</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mande sua sugestão</DialogTitle>
          <DialogDescription>
            O que poderíamos melhorar aqui? Suas ideias são lidas e analisadas com IA pra evoluir o site.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="fb-cat">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="fb-cat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.v} value={c.v}>
                    {c.l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fb-msg">Sua mensagem</Label>
            <Textarea
              id="fb-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Gostaria de ver mais conteúdos sobre... / O botão X poderia..."
              rows={5}
              maxLength={2000}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fb-email">E-mail (opcional)</Label>
            <Input
              id="fb-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="se quiser receber retorno"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FeedbackWidget;