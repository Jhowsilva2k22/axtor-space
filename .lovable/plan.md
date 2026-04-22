

# Plano: 5 melhorias na ordem de prioridade + sistema de Temas/Designer

Vou implementar tudo em **5 fases independentes** (cada uma testável isoladamente, sem quebrar o que já existe) + uma fase extra para o sistema de design/templates que você pediu.

---

## Fase 1 — Métricas por card/CTA (drill-down)

**O que entrega:** mini-painel de cliques dentro de cada `BlockEditor` no admin + página `/admin/blocks/:id` com gráfico temporal.

**Mudanças:**
- Nova função SQL `get_block_analytics(_block_id uuid, _days int)` retornando JSON com: cliques 24h/7d/30d, série diária, breakdown por device/utm_source/utm_medium/utm_campaign, CTR (cliques ÷ page_views da `/bio` no período).
- Componente `<BlockMetricsBadge>` no `BlockEditor` (chip compacto com cliques 7d).
- Página `src/pages/AdminBlockMetrics.tsx` com Recharts (line chart + tabelas de breakdown).
- Rota `/admin/blocks/:id` no `App.tsx`.

**Risco de quebra:** zero — só leitura, dados já existem em `bio_clicks`.

---

## Fase 2 — Links de campanha por CTA (UTM tracking)

**O que entrega:** em cada bloco, aba "Campanhas" para gerar links curtos com UTMs próprias. Ao clicar, registra a campanha em `bio_clicks` e redireciona.

**Mudanças:**
- Nova tabela `bio_block_campaigns` (`id`, `block_id`, `slug` único, `label`, `utm_source`, `utm_medium`, `utm_campaign`, `clicks_count`, `created_at`). RLS: admin gerencia, anon lê para resolver slug.
- Nova rota pública `/r/:slug` em `App.tsx` → componente `RedirectCampaign.tsx` que: faz lookup, registra em `bio_clicks` (com utm_*), monta URL final com UTMs e `window.location.replace`.
- UI nova no `BlockEditor`: aba "Campanhas" com lista, botão "Nova campanha", botão "Copiar link" (`https://seu-dominio/r/abc123`), cliques por campanha.
- Coluna `campaign_slug` em `bio_clicks` (opcional, ajuda análise).

**Risco de quebra:** zero — rota nova, nada existente é modificado.

---

## Fase 3 — Drag-and-drop + tamanho do bloco

**O que entrega:** reordenação por arrastar (substitui ↑↓) e seletor de tamanho (compacto/normal/hero) por bloco.

**Mudanças:**
- Instalar `@dnd-kit/core` + `@dnd-kit/sortable`.
- Coluna `size` em `bio_blocks` (text default `'md'`, valores: `sm` | `md` | `lg`).
- Refator `BlockEditor` com handle de drag + atualização de `position` em batch ao soltar.
- Em `Bio.tsx`, usar `size` para variar padding/altura do `BlockCard` (mantendo o estilo dourado/serif).
- Setas ↑↓ ficam como fallback para mobile.

**Risco de quebra:** baixo — `position` continua sendo a fonte da verdade; `size` tem default que renderiza igual ao atual.

---

## Fase 4 — Categorias + busca + filtros

**O que entrega:** chips de categoria + campo de busca no topo da `/bio`.

**Mudanças:**
- Nova tabela `bio_categories` (`id`, `name`, `slug`, `icon`, `position`, `is_active`). RLS: admin gerencia, público lê ativas.
- Coluna `category_id` em `bio_blocks` (uuid nullable).
- No admin: gerenciador simples de categorias (CRUD) + select de categoria no `BlockEditor`.
- Em `Bio.tsx`: `<CategoryChips>` no topo + `<SearchBox>` (toggle por ícone de lupa para não poluir). Filtro client-side com fade transitions.
- Categoria "Todos" sempre presente. Se não houver categorias cadastradas, UI fica oculta (zero impacto).

**Risco de quebra:** zero quando não há categorias — UI condicional.

---

## Fase 5 — Rascunho/publicação

**O que entrega:** edita à vontade, publica quando quiser.

**Mudanças (abordagem leve):**
- Coluna `draft_data jsonb` em `bio_blocks` (snapshot completo dos campos editáveis) + flag `has_draft boolean`.
- No admin: ao editar, salva em `draft_data`. Botões: "Publicar" (copia draft → campos reais, limpa draft) e "Descartar".
- Indicador 🟡 no card + badge global "X rascunhos pendentes".
- `/bio` continua lendo só os campos publicados.
- O botão "Salvar tudo" atual passa a salvar como rascunho por padrão; toggle "Publicar imediatamente" para o fluxo antigo.

**Risco de quebra:** baixo — campos publicados nunca mudam sem ação explícita.

---

## Fase 6 — Sistema de Temas/Designer

**O que entrega:** usuário escolhe entre **Template "Editorial Dourado"** (atual, intacto) ou **"Personalizado"** com controles visuais.

**Mudanças:**
- Nova tabela `bio_themes` (`id`, `name`, `is_preset`, `tokens jsonb`). Seed com preset `"editorial-gold"` reproduzindo o look atual.
- Coluna `theme_id` em `bio_config` (default → preset atual).
- Campo `custom_tokens jsonb` em `bio_config` para overrides quando o usuário escolhe "Personalizado".
- Tokens cobertos no painel de personalização:
  - **Cores:** background, primary/gold, accent, card, border, text, muted (color picker hex + presets).
  - **Tipografia:** font heading (dropdown Google Fonts curado: Cormorant, Playfair, Instrument Serif, Inter, Manrope, Space Grotesk), font body (mesmo dropdown), tamanho base, peso, letter-spacing dos uppercase.
  - **Layout:** raio (0/2/4/8/16px), espaçamento entre blocos, largura máxima da coluna, alinhamento (centro/esquerda).
  - **Detalhes:** ativar/desativar grain, ativar/desativar aurora, intensidade da borda dourada, sombras (none/soft/strong).
- Página `src/pages/AdminTheme.tsx` com 3 abas: **Template** (cards com presets), **Personalizar** (controles agrupados), **Preview** (iframe da `/bio` ao vivo).
- Em `Bio.tsx` e `index.css`: aplicar tokens via CSS custom properties em `<style>` injetado no `<head>` da `/bio`.
- Fontes carregadas dinamicamente via `<link>` apenas quando selecionadas.

**Compatibilidade com `mem://design/rules.md`:** o preset `editorial-gold` é a regra atual e continua sendo o default. As regras só são "relaxadas" se o usuário escolher Personalizado conscientemente. Adiciono nota na memória explicando isso.

**Risco de quebra:** zero para quem mantém o template atual (default não muda nada). Personalizado é opt-in.

---

## Detalhes técnicos transversais

- **Migrations:** 1 migration por fase (6 no total), todas aditivas (sem `DROP`/`ALTER` destrutivo).
- **Types:** `src/integrations/supabase/types.ts` regenera automaticamente após cada migration.
- **Performance:** todas as queries novas usam índices; `get_block_analytics` adiciona `idx_bio_clicks_block_created (block_id, created_at)`.
- **Segurança:** todas as tabelas novas com RLS — admin gerencia, anon lê só o necessário (categorias ativas, campanhas para resolver slug).
- **Testes:** depois de cada fase, valido que (a) `/bio` continua renderizando idêntica, (b) admin funciona, (c) nenhum erro no console.

---

## Ordem de entrega e checkpoints

```text
Fase 1 (Métricas)        → testar no admin
Fase 2 (Campanhas + /r/) → criar 1 campanha, testar redirect
Fase 3 (DnD + tamanho)   → reordenar e mudar tamanho
Fase 4 (Categorias)      → criar 2 categorias, filtrar
Fase 5 (Rascunhos)       → editar bloco, publicar
Fase 6 (Temas)           → preset atual + criar custom
```

Posso pausar em qualquer checkpoint se você quiser validar antes de seguir. Começo pela Fase 1 assim que você aprovar.

