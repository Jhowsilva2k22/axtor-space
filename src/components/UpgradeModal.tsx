import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";

// Descrição por recurso bloqueado. Sem promessa de "ilimitado".
const FEATURES: Record<string, { title: string; desc: string }> = {
  analytics: { title: "Métricas e analytics", desc: "Veja cliques, dispositivos e fontes de tráfego da sua bio." },
  campaigns: { title: "Campanhas com UTM", desc: "Crie links rastreáveis com UTM e meça por canal." },
  improvements: { title: "Sugestões com IA", desc: "Recomendações automáticas pra aumentar a conversão." },
  themes: { title: "Temas customizados", desc: "Personalize cores, fontes e estilo da sua bio." },
  blocks: { title: "Mais blocos na bio", desc: "Vá além do limite de 3 blocos do Free." },
  badge: { title: "Remover selo", desc: "Esconda o selo 'feito com axtor' do rodapé da sua bio." },
};

// O que o Pro entrega — alinhado com a Loja (mesma lista, sem "ilimitado").
const ALL_PRO = [
  "75 créditos de IA por mês",
  "Diagnóstico imersivo (1 funil)",
  "Exportar leads (CSV)",
  "Bio sem o limite de 3 blocos",
  'Marca "Axtor" removida',
];

type Props = {
  feature: keyof typeof FEATURES | string;
  children: ReactNode;
};

export const UpgradeModal = ({ feature, children }: Props) => {
  const [open, setOpen] = useState(false);
  const f = FEATURES[feature] ?? FEATURES.blocks;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md rounded-sm border-gold-gradient bg-card/95 backdrop-blur">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-gold bg-gradient-gold-soft">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="mt-4 text-center font-display text-2xl">
            Disponível no <span className="text-gold italic">Pro</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-2 py-2 text-center">
          <div>
            <p className="font-medium text-foreground">{f.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
          <div className="rounded-sm border border-gold/40 bg-background/40 p-4 text-left">
            <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">o plano pro inclui</p>
            <ul className="space-y-1.5 text-sm">
              {ALL_PRO.map((item) => (
                <li key={item} className="flex items-center gap-2 text-foreground">
                  <Check className="h-3.5 w-3.5 text-primary" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <Button
            asChild
            className="btn-luxe h-11 w-full rounded-sm text-xs uppercase tracking-[0.2em]"
            onClick={() => setOpen(false)}
          >
            <Link to="/loja?plan=pro">Assinar o Pro</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
