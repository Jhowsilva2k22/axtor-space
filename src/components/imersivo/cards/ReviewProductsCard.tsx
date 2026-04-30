import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewSectionCard } from "@/components/imersivo/atomic/ReviewSectionCard";
import { ProductCardHeader } from "./ProductCardHeader";
import { ProductMainFields } from "./ProductMainFields";
import { ExclusiveOfferBlock } from "./ExclusiveOfferBlock";
import { CheckoutPostSaleBlock } from "./CheckoutPostSaleBlock";

type ReviewProductsCardProps = {
  products: any[];
  funnelSlug?: string;
  onUpdate: (idx: number, patch: Record<string, any>) => void;
  onAdd: () => void;
  onDelete: (idx: number) => void;
};

export const ReviewProductsCard = ({
  products,
  funnelSlug,
  onUpdate,
  onAdd,
  onDelete,
}: ReviewProductsCardProps) => {
  return (
    <ReviewSectionCard title={`Produtos (${products.length})`}>
      {products.map((p, idx) => (
        <motion.div
          key={p.id ?? idx}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`space-y-3 rounded-md border p-4 transition-opacity ${
            p.is_active === false ? "border-border/40 bg-muted/30 opacity-70" : "border-border/60"
          }`}
        >
          <ProductCardHeader
            index={idx}
            painTag={p.pain_tag}
            isActive={p.is_active !== false}
            name={p.name}
            onActiveChange={(v) => onUpdate(idx, { is_active: v })}
            onDelete={() => onDelete(idx)}
          />
          {p.is_active !== false && (
            <>
              <ProductMainFields
                name={p.name}
                description={p.description}
                priceHint={p.price_hint}
                sessionDuration={p.session_duration}
                planDuration={p.plan_duration}
                whatsappTemplate={p.whatsapp_template}
                resultMediaUrl={p.result_media_url}
                onChange={(patch) => onUpdate(idx, patch)}
              />
              <ExclusiveOfferBlock
                benefits={p.benefits}
                onChange={(patch) => onUpdate(idx, patch)}
              />
              <CheckoutPostSaleBlock
                ctaMode={p.cta_mode}
                checkoutUrl={p.checkout_url}
                thankyouText={p.thankyou_text}
                thankyouMediaUrl={p.thankyou_media_url}
                thankyouMediaType={p.thankyou_media_type}
                thankyouWhatsappTemplate={p.thankyou_whatsapp_template}
                funnelSlug={funnelSlug}
                productId={p.id}
                onChange={(patch) => onUpdate(idx, patch)}
              />
            </>
          )}
        </motion.div>
      ))}
      <Button variant="outline" onClick={onAdd} className="w-full gap-2">
        <Plus className="h-4 w-4" /> Adicionar produto
      </Button>
    </ReviewSectionCard>
  );
};
