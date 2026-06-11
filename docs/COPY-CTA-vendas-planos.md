# Copy + CTA por dobra — Vendas (`/`) e Preços (`/planos`)

> Spec pronto pro dev. Objetivo: matar o loop das duas telas idênticas, dar
> função distinta a cada página e posicionar CTA em toda dobra (+ barra fixa mobile).
> Marca: azul-copa (navy + amarelo). Voz SaaS neutra. Sem promessa furada.
> Prova social: placeholders `[INSERIR DEPOIMENTO]` (lançamento, capturar depois).

---

## Regras de CTA (valem pras duas páginas)

1. CTA principal **acima da dobra** (visível sem rolar no 1º print).
2. Um CTA a cada **~1,5 dobra**, sempre após um pico de persuasão.
3. **Ação primária única e repetida.** Vendas = `Criar minha página grátis` (→ /signup). Preços = escolher plano.
4. No máximo **uma** ação secundária (`Ver planos`).
5. **Barra fixa de CTA no rodapé (mobile)** em ambas — botão sempre visível, acompanha o scroll.

---

## PÁGINA `/` — VENDAS (estágio: desejo)

**Cor:** navy profundo dominante, imersivo. Amarelo só no CTA principal.
**Função:** fazer querer. Manda pra **ativação** (`/signup`). Não fala de preço como protagonista.

### Dobra 1 — Hero `[acima da dobra]`
- Badge: `Link na bio com diagnóstico por IA`
- H1 (A/B):
  - A — mecanismo: **"Sua bio vira funil. Não vitrine."**
  - B — posicionamento: **"Transforme atenção em leads — direto da sua bio."**
  - C — benefício: **"Cada visitante conduzido ao próximo passo."**
- Subheadline: "Um diagnóstico inteligente que captura, qualifica e direciona cada visitante — no seu nicho, do seu jeito. Sua bio trabalhando por você."
- **CTA primário (amarelo):** `Criar minha página grátis →` → **/signup**
  - microcopy: "Grátis em minutos · Sem cartão"
- **CTA secundário (contorno):** `Ver planos` → **/planos**

### Dobra 2 — Dor
"Sua bio hoje é uma lista de links parada."
- Visitante entra, olha e sai — sem virar contato.
- Você não sabe quem clicou nem o que a pessoa queria.
- Todo conteúdo joga gente pra um link que não conduz a nada.
- A atenção que você conquista evapora todo dia.

### Dobra 3 — Mecanismo (a virada)
"O diagnóstico é o coração. Em vez de uma lista, o visitante faz um diagnóstico rápido — e sai dele já qualificado e direcionado pro próximo passo certo. Você captura quem antes só passava."
- **CTA:** `Criar minha página grátis` → **/signup**

### Dobra 4 — Prova social
`[INSERIR 2-3 DEPOIMENTOS — print WhatsApp, foco em resultado: "captei X contatos na 1ª semana"]`
- **CTA:** `Criar minha página grátis` → **/signup**

### Dobra 5 — Como funciona (3 passos)
1. Crie sua página e seu diagnóstico (sem código).
2. Coloque o link na bio.
3. Cada visitante é captado, qualificado e direcionado.
- **CTA:** `Criar minha página grátis` → **/signup**

### Dobra 6 — Faixa de escassez
"Preço de lançamento. O valor sobe **+30%** ao batermos **1.000 assinantes**."
- **CTA:** `Ver planos` → **/planos**

### Dobra 7 — CTA final (rodapé)
- H2: "Sua bio pode trabalhar por você hoje."
- Sub: "Crie grátis em minutos. Sem cartão."
- **CTA:** `Criar minha página grátis` → **/signup**  *(hoje aponta errado pra /planos)*

### Barra fixa (mobile)
- Botão: `Criar minha página grátis` → **/signup** (sempre visível)

---

## PÁGINA `/planos` — PREÇOS (estágio: decisão)

**Cor:** navy mais claro, mais respiro/contraste. Amarelo no plano **Pro** (recomendado) e nos botões "Assinar".
**Função:** fazer decidir. Manda pro **checkout** (`/loja?plan=`). **Não revende a ideia.**

### Dobra 1 — Hero (decisão) `[acima da dobra]`
- Badge: `Planos Axtor Space`
- H1 (A/B):
  - A — decisão: **"Escolha seu plano e comece hoje."**
  - B — escada: **"Comece grátis. Escale quando fizer sentido."**
  - C — estágio: **"Um plano pra cada estágio do seu funil."**
- Subheadline: "Sem fidelidade. Cancele quando quiser. Preço de lançamento enquanto durar."
- **CTA visível:** rola pros planos / destaca o Pro

### Dobra 2 — Cards (núcleo)
- **Free** — "Pra testar a ideia." → `Começar grátis` → **/signup**
- **Pro** ⭐ *recomendado* (destaque amarelo) — "Pra quem já capta e quer escalar." → `Assinar agora` → **/loja?plan=pro**
- **Premium** — "Pra volume e mais poder de captação." → `Assinar agora` → **/loja?plan=premium**

### Dobra 3 — Garantia (reversão de risco)
"7 dias de garantia. Se ver que não faz sentido pro seu perfil, devolvo — sem burocracia. E sem fidelidade: cancela quando quiser."

### Dobra 4 — Escassez (real)
"Preço de lançamento. O valor sobe **+30%** ao batermos **1.000 assinantes**. Quem entra agora trava o preço de hoje."
- **CTA:** `Assinar o Pro` → **/loja?plan=pro**

### Dobra 5 — FAQ de compra
- "Tem fidelidade?" → Não. Cancela quando quiser.
- "E se não funcionar pro meu perfil?" → 7 dias de garantia, devolvo sem perguntas.
- "Preciso de cartão pra começar?" → Não. O Free é grátis e sem cartão.
- "Como pago?" → Pix ou cartão, no checkout seguro.
- "Posso mudar de plano depois?" → Sim, quando quiser.

### Dobra 6 — CTA final
- H2: "Trave o preço de lançamento."
- **CTA:** `Assinar o Pro` → **/loja?plan=pro**  ·  secundário `Começar grátis` → **/signup**

### Barra fixa (mobile)
- Botão: `Assinar o Pro` → **/loja?plan=pro**

---

## Mudanças de rota (o que o dev altera no código)

| Arquivo:linha | Botão | Hoje → | Vira → |
|---|---|---|---|
| Vendas.tsx:213-216 | "Criar meu diagnóstico" (hero) | /planos | **/signup** (relabel `Criar minha página grátis`) |
| Vendas.tsx:218-220 | "Ver exemplo funcionando" | /joanderson | manter |
| Vendas.tsx (hero) | — | — | **adicionar** secundário `Ver planos` → /planos |
| Vendas.tsx:412-415 | "Quero meu diagnóstico…" | /planos | **/signup** |
| Vendas.tsx:444-446 | "Criar meu diagnóstico" (rodapé) | /planos | **/signup** (relabel `Criar minha página grátis`) |
| Landing.tsx:168-171 | Hero H1 | (igual ao da /) | **trocar** pela headline de decisão |
| Landing.tsx | — | — | **adicionar** blocos Garantia + Escassez |
| Ambas | — | — | **adicionar** barra fixa de CTA (mobile) |

## Notas
- Prova social: placeholders até capturar os depoimentos do WhatsApp.
- Escassez é real (preço de lançamento +30% aos 1.000 assinantes). Não inventar urgência além dessa.
- Voz neutra SaaS. Sem "garantido/viraliza/fórmula/transformação em X dias".
- Aplicar 1 problema por edit, com diff antes (regra do projeto).
