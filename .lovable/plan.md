

## Personalizar CTAs do diagnóstico inicial por parceiro

### Problema
Quando alguém entra em `axtor.space/?utm_source=stefany`:
- ✅ O lead é atribuído à Stefany (já funciona)
- ❌ Mas no fim do diagnóstico, os botões mandam pra **/bio do Joanderson**, **@eusoujoanderson1**, e WhatsApp genérico

A Stefany não tem onde configurar pra onde os leads dela vão depois do diagnóstico.

### Solução
Quando há um `utm_source` válido na URL, resolver o tenant parceiro e usar os links **dele** nos CTAs finais. Sem UTM, mantém os links do tenant principal (você).

---

### Onde a Stefany configura

Novo card no admin dela: **"Onde mandar meus leads do diagnóstico"** dentro do `MyLinksCard.tsx` (ou seção própria perto). Campos:

1. **URL da minha bio** — auto-preenchido com `axtor.space/{slug-dela}`, mas editável (pode apontar pro IG dela, link próprio, etc.)
2. **Meu Instagram** — `@usuario` (ex: `stefanymello`)
3. **Meu WhatsApp** — número com DDI (ex: `5511999999999`) + mensagem padrão opcional
4. **Botão de upsell secundário** (opcional) — label + URL livre, ex: "Agende uma call" → calendly dela

Tudo opcional: se ela não preencher, cai num fallback (a própria bio dela em `axtor.space/{slug}`).

---

### Implementação técnica

**1. Schema (migration)**

Adicionar colunas em `landing_partners`:
```sql
ALTER TABLE landing_partners ADD COLUMN bio_url text;
ALTER TABLE landing_partners ADD COLUMN instagram_handle text;
ALTER TABLE landing_partners ADD COLUMN whatsapp_number text;
ALTER TABLE landing_partners ADD COLUMN whatsapp_message text;
ALTER TABLE landing_partners ADD COLUMN secondary_cta_label text;
ALTER TABLE landing_partners ADD COLUMN secondary_cta_url text;
```

Permitir que **tenant owner edite o próprio registro** (não só admin):
```sql
CREATE POLICY "Tenant owners update own landing partner" ON landing_partners
FOR UPDATE TO authenticated
USING (is_tenant_owner(tenant_id))
WITH CHECK (is_tenant_owner(tenant_id));
```

**2. Resolução pública na landing**

Nova RPC `get_landing_partner_ctas(_utm_source text)` retorna `{ slug, display_name, bio_url, instagram_handle, whatsapp_number, whatsapp_message, secondary_cta_label, secondary_cta_url }` — security definer, pública (qualquer um pode ler quando entra com UTM, pra renderizar os CTAs corretos).

**3. `src/pages/Index.tsx`**

- No `useEffect` de mount, ler `utm_source` da URL
- Se existir, chamar `get_landing_partner_ctas` e guardar em estado `partnerCtas`
- No componente Result (linhas 635-697), substituir os links hardcoded:
  - "Ver bio do Joanderson" → `partnerCtas?.bio_url ?? "/bio"`, label dinâmico (`Ver bio do {display_name}`)
  - "Seguir" Instagram → `instagram.com/{partnerCtas?.instagram_handle ?? "eusoujoanderson1"}`
  - WhatsApp → `wa.me/{partnerCtas?.whatsapp_number}?text={whatsapp_message}` (esconde se sem número)
  - Botão secundário extra se `secondary_cta_url` existir

Sem UTM ou UTM desconhecido = comportamento atual (seus links).

**4. UI no admin do parceiro (`MyLinksCard.tsx` ou nova seção)**

Adicionar um bloco "Configurar destinos do diagnóstico" — só aparece se o tenant tem registro em `landing_partners`. Form simples com os 4-6 campos e botão "salvar". Mensagem de ajuda: *"Esses são os links que aparecem pro lead no fim do diagnóstico que ele fez vindo do seu UTM."*

**5. UI no admin do super-admin (`AdminLandingPartners.tsx`)**

Editor inline expandível por linha pra preencher/editar os mesmos campos em nome do parceiro (caso ela não saiba mexer).

---

### Fluxo final

```text
Usuário acessa axtor.space/?utm_source=stefany
   ↓
Index.tsx lê utm → chama get_landing_partner_ctas("stefany")
   ↓
Lead criado no tenant da Stefany ✅
   ↓
Diagnóstico exibido
   ↓
Botões finais apontam pra:
  • bio.stefany.com  (ou axtor.space/stefanymello)
  • @stefanymello no IG
  • WhatsApp da Stefany
  • CTA extra (se ela configurou)
```

### Arquivos afetados
- **Migration nova**: 6 colunas + policy + RPC
- **Editar**: `src/pages/Index.tsx`, `src/components/MyLinksCard.tsx`, `src/pages/AdminLandingPartners.tsx`
- **Tipos**: `src/integrations/supabase/types.ts` (auto-regenerado)

### Pergunta antes de implementar
Quer que o **botão "Quero um link-in-bio assim"** continue sempre apontando pra `/bio` (sua), ou também vire configurável pelo parceiro? Faz sentido ser fixo seu — é o CTA de venda da plataforma e a Stefany é parceira sua, não concorrente.

