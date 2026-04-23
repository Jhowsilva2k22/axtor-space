# Habilitar/Desabilitar e Adicionar Produtos no Editor

## O que muda pro usuário

No editor do Diagnóstico Profundo, cada um dos 5 produtos vai ter um **switch "Ativo"** no topo do bloco. Se o dono só vende 1 produto, ele desativa os outros 4 — o card fica colapsado mostrando só o nome + switch desligado, e o produto não aparece pro lead no resultado nem entra na recomendação da IA.

Também ganha um botão **"+ Adicionar produto"** no fim da lista, que cria um bloco novo igual aos outros (com todos os campos: nome, descrição, pra quem é, como funciona, benefícios, urgência, CTAs, checkout, WhatsApp, tela de obrigado). O bloco novo já vem **ativo** por padrão e pré-preenchido com a mesma estrutura visual dos demais, só com campos vazios pro dono escrever.

E ganha botão **lixeira** pra deletar produtos que ele não quer mais.

## Mudanças técnicas

### 1. Migration — coluna `is_active` em `deep_funnel_products`
```sql
ALTER TABLE public.deep_funnel_products
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
```

### 2. `DeepDiagnosticEditor.tsx`
- Cada bloco de produto: header com **Switch "Ativo"** + lixeira. Quando inativo, colapsa o conteúdo (mostra só nome em cinza + switch).
- Botão **"+ Adicionar produto"** no fim do `Card` de produtos: faz `insert` em `deep_funnel_products` com `funnel_id`, `position` = próximo, `name` = "Novo produto", `pain_tag` = "vendas", `is_active = true`, `benefits = []`, demais campos vazios. Recarrega a lista.
- Botão lixeira: confirm + `delete` no Supabase + remove do estado local.
- `saveAll`: incluir `is_active` e `position` no update.

### 3. `analyze-deep/index.ts` (edge function)
- Ao buscar produtos do funil, filtrar `.eq("is_active", true)`. Se sobrar só 1 produto, a IA usa esse como `recommended_product_id` e retorna `alternative_product_ids: []`.
- Atualizar prompt: "Trabalhe APENAS com os produtos da lista abaixo. Se houver só 1, recomende esse mesmo. Não invente produtos."

### 4. `DeepFunnelPublic.tsx`
- Filtrar `products.filter(p => p.is_active !== false)` antes de renderizar o resultado e antes de mandar o ID do recomendado/alternativos.
- Se sobrar 1 produto: mostra só o card principal "Recomendado pra você", esconde a seção "Você também pode gostar".

### 5. `generate-deep-funnel/index.ts`
- Inserir produtos novos sempre com `is_active: true` (default da coluna já cobre, mas explícito por clareza).

## Arquivos a editar
- Nova migration SQL (`is_active` column)
- `src/pages/DeepDiagnosticEditor.tsx`
- `src/pages/DeepFunnelPublic.tsx`
- `supabase/functions/analyze-deep/index.ts`
- `supabase/functions/generate-deep-funnel/index.ts`
