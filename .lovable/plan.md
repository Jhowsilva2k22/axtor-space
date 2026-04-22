

## Auditoria das 10 ideias × o que já existe no app

| # | Ideia | Status atual | Veredito |
|---|---|---|---|
| 1 | **Drag-and-drop dos blocos** | ✅ **JÁ EXISTE.** `Admin.tsx` usa `@dnd-kit` (`DndContext`, `SortableContext`, `handleDragEnd`) e salva posição automaticamente no Supabase. | ❌ **NÃO FAZER** — duplicado. Se está confuso, posso só melhorar a affordance visual do "agarrador". |
| 2 | **Templates de designer (cores/fontes/estilos prontos)** | ❌ Não existe. Hoje só tem dark/light via `ThemeToggle`. | ✅ **FAZER** — é a Fase 6 já planejada. Útil de verdade. |
| 3 | **Tamanho variável por card (sm/md/lg)** | ⚠️ **JÁ EXISTE** (campo `size` no schema, render em `Bio.tsx` com 3 escalas). **MAS você acabou de dizer que NÃO quer isso** ("devem ficar todos sempre o mesmo tamanho"). | ✅ **FAZER O OPOSTO**: **remover** o seletor de tamanho do admin, fixar tudo em `md`, e migrar `size='md'` em todos os blocos. Mantém estética consistente. |
| 4 | **Revisar warnings do linter Supabase** | ❓ Não verificado. RLS está sólido (todas as tabelas têm policies com `has_role`). Pode haver warnings menores (search_path em funções, etc). | ✅ **FAZER** — rodar `supabase--linter` e corrigir o que aparecer. Rápido e importante. |
| 5 | **Filtros de período (24h/7d/30d) nas métricas** | ⚠️ **PARCIAL.** `AdminAnalytics` tem 7/30/90d ✅. `AdminBlockMetrics` tem 7/30/90d ✅. **Mas falta 24h** e os KPIs do bloco já mostram 24h/7d/30d estáticos. | ✅ **FAZER PEQUENO AJUSTE** — adicionar opção "24h" no seletor de ambas as páginas. |
| 6 | **Duplicar blocos com tudo configurado** | ❌ Não existe. Só tem "Novo bloco" em branco. | ✅ **FAZER** — botão "Duplicar" copia tudo (label+" (cópia)", url, ícone, badge, UTMs etc) com `is_active=false` por padrão. Muito útil. |
| 7 | **Validar utm_campaign como slug** | ❌ Não existe. Combobox aceita qualquer string. | ✅ **FAZER** — auto-slugify no blur + ícone de aviso quando contém espaço/maiúscula/acento. Evita "Stories Lançamento" virar UTM quebrada. |
| 8 | **Combobox: placeholders/textos específicos por campo** | ⚠️ Hoje os placeholders já são parametrizados (`placeholder` prop), mas o texto "Buscar ou digitar novo..." e "Personalizado" são fixos. | ⚠️ **MARGINAL** — pequena melhoria de UX. Faço junto, sem virar tarefa separada. |
| 9 | **Combobox: modo "só presets" (sem digitação)** | ❌ Hoje sempre permite custom. | ⚠️ **OPCIONAL** — a prop `allowCustom` já existe no componente! Falta só usar `allowCustom={false}` em algum campo. Não tem uso óbvio agora — pulo. |
| 10 | **Pré-visualizador de badge/footer no admin** | ❌ Não existe. Admin é form puro, sem preview. | ✅ **FAZER PEQUENO** — mini-preview ao vivo do badge dentro do card no editor + footer renderizado abaixo do input. Sem abrir /bio. |

---

## Plano de execução (ordem por impacto)

### A. Limpeza & padronização (rápido, alto impacto)
1. **Remover seletor de tamanho** do `BlockEditor` em `Admin.tsx`. Migration SQL: `UPDATE bio_blocks SET size='md'` + remover usos da prop em `Bio.tsx` (fixar tamanho médio único).
2. **Rodar `supabase--linter`** e corrigir warnings (provável: `search_path` em funções, OTP expiry, etc).

### B. Produtividade no editor
3. **Botão "Duplicar"** ao lado de "Excluir" em cada bloco. Insere cópia com `is_active=false`, `position = max+1`, todos os outros campos copiados. Toast "Bloco duplicado — revise e ative".
4. **Pré-visualização ao vivo** do badge e footer:
   - Badge: mini-card flutuante no topo do `BlockEditor` mostrando label + badge no estilo da `/bio`.
   - Footer: linha discreta abaixo do `Combobox` mostrando como vai aparecer.

### C. Métricas
5. **Adicionar "24h"** no Select de período em `AdminAnalytics.tsx` e `AdminBlockMetrics.tsx`. Backend já suporta (`get_analytics_summary` e `get_block_analytics` recebem `_days`, basta passar `1`). Filtro vira `24h / 7d / 30d / 90d`.

### D. Qualidade dos UTMs
6. **Auto-slugify de `utm_campaign`**: ao confirmar valor no Combobox, normaliza (lowercase, sem acento, espaços→hifens). Mostra ícone de aviso âmbar abaixo do campo se o valor original era diferente, com tooltip "Normalizado para formato seguro".
7. **Melhorar textos do Combobox**: aceitar prop `customLabel` (ex: "Usar badge personalizada", "Usar campanha personalizada") em vez do "Personalizado" genérico.

### E. Adiar (futuro, escopo grande)
8. **Sistema de Templates de Designer** (item 2) — fica pra próxima rodada. Precisa migration de `theme_presets`, painel separado, tokens dinâmicos de CSS. Plano dedicado depois.

### Itens que NÃO vou fazer
- ❌ Drag-and-drop (já existe)
- ❌ Tamanho variável por card (você mesmo descartou — vou remover o que existe)
- ❌ Combobox "só presets" (sem caso de uso claro hoje)

---

## Arquivos afetados
- `src/pages/Admin.tsx` — remover size selector, botão Duplicar, preview de badge/footer
- `src/pages/Bio.tsx` — remover lógica de size, fixar tamanho `md`
- `src/pages/AdminAnalytics.tsx` — adicionar 24h no range
- `src/pages/AdminBlockMetrics.tsx` — adicionar 24h no range
- `src/components/Combobox.tsx` — props `customLabel`, validação slug opcional
- `src/components/CampaignManager.tsx` — usar slug-validator no `utm_campaign`
- Migration SQL: `UPDATE bio_blocks SET size='md'` (mantém coluna por compat, só não exposta no UI)
- Linter: correções pontuais (provável `ALTER FUNCTION ... SET search_path = public`)

