import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, Sparkles, CheckCircle2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function DeepFunnelThankYou() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const productId = params.get("p");
  const leadName = params.get("name") ?? "";

  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!slug) return setLoading(false);
      const { data: f } = await supabase
        .from("deep_funnels")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (!f) return setLoading(false);

      const [{ data: p }, { data: t }] = await Promise.all([
        productId
          ? supabase.from("deep_funnel_products").select("*").eq("id", productId).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from("tenants").select("display_name, whatsapp_number").eq("id", f.tenant_id).maybeSingle(),
      ]);
      setFunnel(f);
      setProduct(p);
      setTenant(t);
      setLoading(false);
    })();
  }, [slug, productId]);

  const text = product?.thankyou_text ?? funnel?.thankyou_text;
  const mediaUrl = product?.thankyou_media_url ?? funnel?.thankyou_media_url;
  const mediaType = product?.thankyou_media_type ?? funnel?.thankyou_media_type;
  const mediaCaption = product?.thankyou_media_caption ?? funnel?.thankyou_media_caption;

  const whatsappUrl = useMemo(() => {
    if (!tenant?.whatsapp_number) return null;
    const tpl: string =
      product?.thankyou_whatsapp_template ??
      `Oi! Acabei de comprar ${product?.name ?? "um produto"} e quero saber o próximo passo.`;
    const msg = tpl.replace(/\{\{nome\}\}/gi, leadName);
    const number = (tenant.whatsapp_number ?? "").replace(/\D/g, "");
    if (!number) return null;
    return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
  }, [tenant, product, leadName]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!funnel) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="space-y-3 p-8 text-center">
          <p className="text-muted-foreground">Página não encontrada.</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="space-y-6 border-primary/40 bg-gradient-to-br from-background to-primary/5 p-8">
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 180 }}
              className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/15"
            >
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </motion.div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" /> Compra confirmada
              </div>
              <h1 className="font-display text-3xl leading-tight md:text-4xl">
                {leadName ? `Bem-vindo, ${leadName}!` : "Bem-vindo!"}
              </h1>
              {product && (
                <p className="text-lg text-muted-foreground">
                  Você acabou de garantir <span className="font-medium text-foreground">{product.name}</span>.
                </p>
              )}
            </div>

            {mediaUrl && (
              <motion.div
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="space-y-1"
              >
                {mediaCaption && <p className="text-xs text-muted-foreground">{mediaCaption}</p>}
                <div className="overflow-hidden rounded-md border">
                  {mediaType === "video" && <video src={mediaUrl} controls autoPlay className="w-full" />}
                  {mediaType === "audio" && <audio src={mediaUrl} controls autoPlay className="w-full" />}
                  {mediaType === "image" && <img src={mediaUrl} alt="" className="w-full" />}
                </div>
              </motion.div>
            )}

            {text && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="rounded-md border border-border/60 bg-card/50 p-4"
              >
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {text.replace(/\{\{nome\}\}/gi, leadName)}
                </p>
              </motion.div>
            )}

            {!text && !mediaUrl && (
              <p className="text-sm text-muted-foreground">
                Em alguns minutos você recebe o acesso por e-mail. Qualquer dúvida, fale com a gente no WhatsApp.
              </p>
            )}
          </Card>
        </motion.div>

        {whatsappUrl && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-4"
          >
            <Button
              size="lg"
              className="w-full gap-2 transition-transform hover:scale-[1.01] animate-[pulse_2.5s_ease-in-out_infinite]"
              asChild
            >
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp agora
              </a>
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
