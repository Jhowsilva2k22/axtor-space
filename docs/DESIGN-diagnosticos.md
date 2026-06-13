# Padrão de design dos diagnósticos — Axtor Space

> Regras pra QUALQUER diagnóstico (Instagram, imersivo e futuros). Consistência =
> cara de produto sério. Aplicado primeiro no diagnóstico de Instagram (`Index.tsx`,
> PR #182). A aplicar no imersivo (`DeepFunnelPublic`, `DeepFunnelThankYou`).

## 1. Tema (cor do dono)

- A página SEMPRE adota o tema do tenant do funil: `applyTenantTheme(tenantId)`
  (em telas públicas, lead não logado). O lead vê a cor do dono em que caiu.
- NUNCA cor de marca fixa (o "dourado" é só o `--brand` padrão). Tudo usa tokens
  de tema (`text-primary`, `border-gold` etc. — que já resolvem por `--primary`).
- Verde, azul, etc. = tema do dono. Testar em ≥2 cores antes de fechar.

## 2. Botões e cantos

- Botões = "retangular sem quinas": `rounded-xl`. NUNCA `rounded-full` (pill).
- Cards = `rounded-2xl` / `rounded-[28-32px]`. Acentos de borda lateral sem raio.
- CTA primário pode ter brilho/pulse suave (`animate-gold-pulse`) — com moderação.

## 3. Tipografia

- Texto de leitura em caixa normal, peso normal/médio. Leitura confortável.
- UPPERCASE + `tracking` largo SÓ em rótulos curtos (eyebrows, labels), nunca em
  texto de leitura.
- Negrito SÓ em botão ou ênfase real (ex.: "2 minutos"). Não deixar tudo bold.
- Evitar fonte de leitura < 12px. Rótulos minúsculos (10px) ok, com parcimônia.

## 4. Copy

- Voz Axtor: neutra, profissional, direta. Alinhada ao posicionamento
  ("diagnóstico de captura", "link na bio que captura, qualifica e direciona").
- SEM travessão (—) na copy (cara de chat). Usar vírgula/ponto.
- Sem clichê de coach, sem promessa. NUNCA inventar nota, dado, depoimento.

## 5. Resultado (primeira dobra)

- Card principal: perfil + nota grande + "de N" + veredito (1 frase, sem empilhar).
- Sub-notas FLUTUANDO abaixo, como cards arredondados separados (não dentro do
  card principal).
- Abaixo, a entrega de valor (pontos, plano, CTAs) — não remover, é o que converte.

## 6. Upsell do Axtor (criar a própria bio)

- Aparece SÓ em conta `free` + conta(s) de divulgação (`axtor-labs`).
- Some em conta paga = funil white-label (não empurra o lead do cliente pra fora).
- Persona/mock fictício (ex.: Leandro Hucman), nunca dados de pessoa real fixos.

## 7. Comportamento (convenções leves)

- Todo diagnóstico aplica o tema do dono.
- Todo diagnóstico salva o lead no Painel do dono.
- Upsell sempre free-gated.

## FORA deste padrão (Trilha B — lógica, planejar à parte)

- Economia de créditos/IA (cache, custo, modelo).
- Autonomia: dono configurar perguntas, CTAs, destino do botão final.
- Envio do diagnóstico pro lead (email agora; WhatsApp depois).
- Mudanças de fluxo/etapas.
