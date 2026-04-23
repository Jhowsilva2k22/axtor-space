

## Plano: corrigir vazamento de categorias entre tenants + onboarding melhor

### Problema 1 (crítico — bug de isolamento)
`CategoriesManager.tsx` lê `bio_categories` sem filtrar por tenant. Como você é admin, vê categorias de outros tenants misturadas no painel da Stefany. Já o Select do bloco lê corretamente do `currentTenant`, então não bate com a lista exibida → confusão total.

### Problema 2 (UX)
Tenant novo nasce sem nenhuma categoria. O Select do bloco fica só com "Sem categoria" e o usuário não entende o que fazer.

### O que vou fazer

**1. Isolar `CategoriesManager` por tenant (corrigir bug)**
- Receber `tenantId` via prop (vindo de `Admin.tsx`, que já tem `currentTenant.id`)
- Filtrar `select`, `insert`, `update`, `delete` e `move` por `tenant_id`
- Passar `tenant_id` explícito nos `insert` (não confiar no DEFAULT da coluna, que aponta pro seu tenant antigo `175f97c6-...`)
- Atualizar `Admin.tsx` para passar `<CategoriesManager tenantId={currentTenant.id} />`

**2. Categoria padrão automática para novo tenant**
- Migration: alterar a função `create_tenant_for_user` para inserir 1 categoria inicial chamada **"Meus links"** (slug `meus-links`, ícone `Link2`, position 0, ativa) junto com o `bio_config` — assim o primeiro bloco já encontra uma opção pra escolher
- Tenants já existentes que estão sem categoria (Stefany, etc.) recebem essa categoria via `INSERT ... WHERE NOT EXISTS`

**3. Microcópia mais clara no card Categorias**
- Trocar texto explicativo para deixar claro o propósito: "Categorias agrupam seus blocos em seções na sua bio pública (ex: Redes sociais, Produtos, Cursos). Cada bloco pode pertencer a uma categoria — ou ficar avulso."
- Manter o resto do componente igual

### Arquivos afetados
- `src/components/CategoriesManager.tsx` — aceitar prop `tenantId`, filtrar todas queries, microcópia
- `src/pages/Admin.tsx` — passar `tenantId` ao componente
- Nova migration SQL — atualizar `create_tenant_for_user` + backfill de categoria "Meus links" pra tenants sem nenhuma

### O que NÃO vou mexer
- RLS (já está correta — `is_tenant_owner` protege; o vazamento é só visual no admin global)
- Estrutura da tabela `bio_categories`
- Lógica do Select do bloco (já está certa)

### Resultado esperado
- No `/admin` da Stefany: card "Categorias" mostra **só as categorias dela** (começando com "Meus links"). Select do bloco oferece "Meus links" como opção. Tudo bate.
- Você (admin) ao trocar de tenant via `TenantSelector` vê só as categorias do tenant ativo.
- Novos tenants nascem com 1 categoria pronta — primeira experiência sem estado vazio.

