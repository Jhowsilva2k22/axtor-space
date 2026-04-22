import { ReactNode, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Mail } from "lucide-react";

const UPGRADE_EMAIL = "contato@axtor.space";
const UPGRADE_WHATSAPP = "5500000000000"; // placeholder — trocar quando o usuário informar

const FEATURES: Record<string, { title: string; desc: string }> = {
  analytics: { title: "Analytics avançado", desc: "Veja cliques, dispositivos, fontes de tráfego e funis em tempo real." },
  campaigns: { title: "Campanhas com UTM", desc: "Crie links rastreáveis com UTM e meça ROI por canal." },
  improvements: { title: "Sugestões com IA", desc: "Receba recomendações automáticas para aumentar conversão." },
  themes: { title: "Temas customizados", desc: "Personalize cores, fontes e estilo da sua bio." },
  blocks: { title: "Blocos ilimitados", desc: "Adicione quantos blocos quiser, sem o limite de 3." },
  badge: { title: "Remover selo", desc: "Esconda o selo 'feito com axtor' do rodapé da sua bio." },
};

const ALL_PRO = ["Blocos ilimitados", "Analytics completo", "Campanhas com UTM", "Sugestões com IA", "Temas premium", "Sem selo"];

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
          <div className="space-y-2">
            <Button
              asChild
              className="btn-luxe h-11 w-full rounded-sm text-xs uppercase tracking-[0.2em]"
            >
              <a
                href={`https://wa.me/${UPGRADE_WHATSAPP}?text=${encodeURIComponent("Quero fazer upgrade pro plano Pro do axtor")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar no WhatsApp
              </a>
            </Button>
            <a
              href={`mailto:${UPGRADE_EMAIL}?subject=${encodeURIComponent("Upgrade plano axtor")}`}
              className="inline-flex h-9 w-full items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
            >
              <Mail className="h-3 w-3" /> {UPGRADE_EMAIL}
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};