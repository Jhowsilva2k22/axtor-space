# Plano — Autonomia do diagnóstico (Trilha B)

> Dono cria/edita o próprio diagnóstico, com IA gerando o rascunho. Reestrutura o
> `BriefingWizard` existente (não é obra nova). Coerência pergunta → resultado →
> destino real é princípio inegociável. Regras de design: `docs/DESIGN-diagnosticos.md`.

## Base que já existe (reaproveitar)
- `src/components/imersivo/BriefingWizard.tsx`: entrevista do dono → `generate-deep-funnel`
  (IA) gera perguntas + mapeia produtos reais → tela de revisão/edição.
- Hoje: 12 perguntas FIXAS; "tom de voz" em texto livre; produtos com nome/preço/link.
- A IA já é instruída a NÃO inventar: usa só os produtos cadastrados.

## Ordem do wizard (fluxo)
1. **Objetivo** — o que tem que acontecer no fim: Vender produto · Aula/aulão ·
   Live · Grupo (WhatsApp) · Agendar. Enquadra a geração.
2. **Briefing** — contexto enxuto (leigo em 5 min): nicho (preset OU livre) +
   essencial (cliente, dor). Defaults; a IA infere o resto.
3. **Destino(s)** — 1 PRINCIPAL (obrigatório) + até 2 SECUNDÁRIOS (opcionais) = máx 3:
   - produto: nome, preço, link, capa
   - aula/live/grupo: nome, link (Zoom/WhatsApp), capa
   - capa = upload OPCIONAL mas recomendado (reusa infra de imagem da bio/avatar).
   - Sem o destino principal, não gera. A IA centra as perguntas no principal e
     roteia pros secundários quando o perfil do lead pede.
4. **Configuração** — quantidade de perguntas (5 / 8 / 12) + **cenário**.
5. **Gerar com IA** — usa objetivo + briefing + destinos + quantidade + cenário.
6. **Editar / Pré-visualizar / Publicar** — edição inline (perguntas, respostas,
   destinos), add/remover/reordenar.

A IA só gera quando 1–4 estiverem ok (com ≥1 destino).

## Os 3 cenários (tom + régua da nota)
1. **Educar** — acolhedor, notas mais generosas, ensina e mostra o caminho.
2. **Equilibrado** — honesto e direto, notas calibradas (padrão).
3. **Conversão (afiado)** — régua mais DURA mas HONESTA (expõe gaps reais),
   resultado puxa urgência + próximo passo. Nunca nota fabricada.

O cenário muda só tom/severidade/enquadramento — nunca a veracidade nem o destino.

## Coerência ponta a ponta (inegociável)
- A IA gera perguntas que levam logicamente aos destinos cadastrados.
- O resultado **roteia o lead pro destino (dos até 3) que mais combina** com as
  respostas; a capa do destino aparece no final.
- Recomendação sempre aponta pra destino REAL (produto/aula/live/grupo), com link.

## Nicho
- Híbrido: presets (reusa `bioTemplates.ts` — coach/mentor, artista/criador,
  e-commerce, infoprodutor... + acrescentar negócio local) + "outro / livre".

## Painel (UX — leigo entende em 5 min)
- Cards e botões grandes, 1 frase por opção, ZERO parágrafo de ajuda.
- Tudo já vem preenchido pela IA como ponto de partida; edição inline (clica e
  digita). Pré-visualizar antes de publicar. Botões "retangular sem quinas".

## Dados (alto nível)
- Config do diagnóstico: `objetivo`, `num_perguntas`, `cenario`.
- Destino: `tipo` (produto/aula/live/grupo/outro), `nome`, `link`, `preco?`,
  `imagem_url?`. 1–3 por diagnóstico.
- Produtos atuais viram caso particular de "destino".

## Implementação faseada (diff antes de cada)
1. **Banco:** campos `objetivo`, `num_perguntas`, `cenario`; estender modelo de
   destino (tipo + imagem); RLS.
2. **IA (`generate-deep-funnel`):** receber objetivo + quantidade + cenário +
   destinos; gerar no tom/severidade do cenário; roteamento resultado → destino.
3. **Painel:** o wizard de 6 passos, simples, com upload de capa e edição inline.

## Fora deste escopo (Trilha B, fases seguintes)
- Economia de créditos/IA (cache, custo).
- Envio do diagnóstico pro lead (email; depois WhatsApp).
