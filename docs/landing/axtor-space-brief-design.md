# Brief de Design & Build — Landing `/planos` · Axtor Space

> Documento de handoff. Tudo que o designer/dev precisa pra entregar a página
> de planos/vendas do Axtor Space. Self-contained: copy + visual + técnico.

---

## 1. Contexto do produto

**Axtor Space** — SaaS multi-tenant: link na bio + página de captura +
diagnóstico imersivo por IA. Organização **separada** de Habithus e Pai
Presente. Voz **neutra/SaaS, profissional, anti-hype**. Sem moralismo, sem
emoji em UI.

**Promessa central:** transformar a bio (que só lista links) num funil que
**capta e qualifica leads sozinho**.

**Objetivo da página:** converter visitante em cadastro (Free) ou assinatura
(Pro/Premium). Métrica principal: cadastros + início de assinatura.

---

## 2. Público (ICP) e consciência

- Criadores, infoprodutores, coaches e prestadores de serviço que usam link
  na bio e querem **capturar e qualificar** quem chega (não só listar links).
- Tráfego **misto**: morno (já seguem) + frio (anúncios). Calibrar pra ambos:
  dor + contexto antes da oferta, mas oferta acessível e clara.

---

## 3. Modelo de preços (créditos — não "ilimitado")

Você paga só pelo uso de IA (créditos). Bio, páginas e captura são ilimitadas.

**Consumo:** Diagnóstico de Instagram = 1 crédito · Conclusão de funil = 1
crédito · Gerar/editar funil = 6 créditos.

| Plano | Preço/mês | Créditos/mês | Margem-alvo |
|---|---|---|---|
| Free | R$ 0 | 15 | aquisição |
| **Pro** | **R$ 47** | 75 | ~76% |
| Premium | R$ 127 | 200 | ~76% |

**Pacotes avulsos** (valem 12 meses): 50/R$ 39 · 150/R$ 99 · 400/R$ 249.
**Margem mínima travada:** 75% (modelo em `axtor-custo-por-cliente.xlsx`).

---

## 4. Estrutura da página (ordem das seções + copy v3)

> Copy completa em `axtor-space-copy-lp.md`. Abaixo, o essencial por seção.

**0. Header (sticky):** logo "axtor.space" · link "entrar" → /admin/login ·
botão "criar grátis" → /signup.

**1. HERO**
- Eyebrow: "Link na bio com diagnóstico por IA"
- H1 (animado letra-a-letra): **"Sua bio que captura, qualifica e _converte._"**
  ("converte." em dourado)
- Sub: "Reúna seus links, capture leads e qualifique cada visitante com
  diagnóstico por IA — numa página só, no seu domínio."
- CTA primário (glass): "Criar minha página grátis" → /signup
- CTA secundário: "Ver planos" (âncora #planos)
- Micro: "Grátis pra sempre · Sem cartão · No ar em minutos"

**2. BENTO — "Tudo numa página. A IA faz o resto."**
4 cards: Diagnóstico de Instagram (2 col) · Link-in-bio · Diagnóstico
imersivo · Leads+Analytics (2 col). Tags de crédito por card.

**3. PLANOS (#planos)** — componente Pricing (switch mensal/anual + confetti
+ números animados + entrada 3D). Free / **Pro (destaque)** / Premium. Linha
de pacotes avulsos abaixo. CTAs: Free → /signup; Pro/Premium → /loja.

**4. CONFIANÇA (lançamento, sem depoimento ainda)**
Provas reais: sem cartão · LGPD · no ar em minutos · Pix. Ângulo "seja um dos
primeiros". (Trocar por depoimentos reais quando houver — ver pendências.)

**5. COMPARATIVO** — tabela Free/Pro/Premium (Pro em destaque).

**6. FAQ** — 6 perguntas (acordeão).

**7. CTA final + PS** — "Sua bio pode trabalhar por você hoje." → /signup.

**Garantia:** Free sem cartão + reembolso **7 dias** nos pagos.
**Urgência:** preço de lançamento sobe em `[DATA A DEFINIR]`.

---

## 5. Direção visual (gold-noir Axtor)

- **Fundo:** noir `#0a0a0b` (token `--background`, ~hsl(0 0% 5%)).
- **Dourado (primary):** `#c9a84c`; glow `#e6c976` (`--primary-glow`).
- **Texto:** off-white quente `hsl(40 30% 95%)`; muted `hsl(40 10% 65%)`.
- **Fontes:** display **Cormorant Garamond** (já no app) OU sans forte
  (Manrope 800) no hero — a v4 usou sans forte pra um look mais moderno.
  Corpo: **Manrope**.
- **Raio:** 24px (`--radius: 1.5rem`).
- **Estilo:** escuro, sofisticado, com **profundidade** (glass/blur, sombra
  dourada suave). Evitar peso excessivo: bastante respiro, dourado como
  acento, não como preenchimento.

> Referência de impacto aprovada pelo dono: preview `axtor-precos-v4-combo.html`.

---

## 6. Componentes (já escolhidos pelo dono)

1. **DottedSurface** — fundo de ondas de pontos 3D (Three.js), dourado,
   ambiente atrás de tudo. **Sempre anima** (decisão do dono). Guards: menos
   pontos no mobile, pausa quando aba sai de foco, pixel ratio limitado.
2. **HeroPaths** — título animado letra-a-letra + botão "glass" (framer-motion).
3. **BentoGrid** — grid de capacidades (conteúdo Axtor, ícones dourados).
4. **Pricing** — cards de plano com switch mensal/anual, **confetti** ao trocar,
   **números animados** (NumberFlow) e **entrada 3D** (cards laterais inclinados,
   Pro elevado).

---

## 7. Movimento & performance

- Movimento é parte da proposta — fundo sempre ondulando, hero anima na entrada,
  cards entram com tilt 3D no scroll, confetti no toggle anual.
- **Mobile-first** (83% do tráfego). Reduzir densidade do fundo no mobile,
  cards sem 3D no mobile. Three.js carrega só nesta rota (lazy) — ~150KB.

---

## 8. Stack & integrações (técnico)

- **React 18 + TypeScript + Vite 8 + Tailwind + shadcn/ui + Supabase.**
- Rota: **`/planos`** (`src/pages/Landing.tsx`).
- Deps novas já adicionadas: `three`, `@types/three`, `canvas-confetti`,
  `@types/canvas-confetti`, `@number-flow/react`.
- Componentes em `src/components/landing/`.
- **CTAs:** "criar grátis"/Free → `/signup`; "Assinar" Pro/Premium → `/loja`
  (checkout **Pix via Asaas** já existente, controlado por `plan_features`).
- Tokens de cor/fonte já existem em `src/index.css` + `tailwind.config`
  (`primary`, `primary-glow`, `--radius`, etc.).
- Sem push direto no `main` — branch + PR. Deploy = Vercel (auto do main).

---

## 9. Estado atual (já implementado — local, sem commit)

✅ Implementado localmente em `C:\…\axtor-space`:
- `package.json` (+5 deps), `src/hooks/use-media-query.ts`,
  `DottedSurface.tsx`, `HeroPaths.tsx`, `BentoGrid.tsx`, `Pricing.tsx`,
  `Landing.tsx` reescrita.
- Testado em `localhost:8080/planos` — funcionando, fundo animando.

⏳ Pendente:
- Trocar os textos atuais pela **copy v3** final (alguns blocos já batem).
- `npm install` + teste em aba anônima → ok → **commit (branch + PR)**.

---

## 10. Assets necessários (do dono)

- **Logo** AXTOR SPACE (já existe dourado transparente em `public/email/`).
- **Screenshots reais** do produto (bio + diagnóstico imersivo) pra trocar o
  mockup desenhado — deixa a página "de verdade".
- **Depoimentos reais** (quando houver) — perfis: coach/infoprodutor,
  prestador de serviço, quem roda tráfego pago.

---

## 11. Itens em aberto (decisões do dono)

1. **Data** em que o preço de lançamento sobe (pro bloco de urgência).
2. **Preço anual** real (hoje está como exemplo -20%).
3. Confirmar nichos exatos pra afiar a copy (coach? prestador? ambos?).

---

## 12. Critérios de aceite ("pronto")

- [ ] `/planos` renderiza os 4 componentes, mobile e desktop.
- [ ] Fundo de pontos animando; cards com entrada 3D no desktop; confetti no toggle.
- [ ] Copy v3 aplicada em todas as seções.
- [ ] CTAs levam a `/signup` e `/loja` corretamente.
- [ ] Sem depoimento fictício; bloco de confiança na versão de lançamento.
- [ ] LGPD: consentimento no formulário de captura + link p/ Política.
- [ ] Build verde (`npm run build`) e sem erro de tipo.
- [ ] Preço de lançamento só publicado com data real.

---

## 13. Anexos (arquivos de referência)

- `axtor-space-copy-lp.md` — copy completa (v3, 15 blocos).
- `axtor-precos-v4-combo.html` — preview visual aprovado.
- `axtor-custo-por-cliente.xlsx` — modelo de custo/margem/MRR.
