# QA Funcional — Axtor Space

Runbook para validar os fluxos de ponta a ponta (o que a auditoria de segurança
de 2026-06-09 NÃO cobriu). Produção: `pybgqassjzcynzaakzhz` / https://axtor.space.

Como usar: rode em **aba anônima** (sessão limpa). Marque [x] no que passar.
Abra o **DevTools > Console e Network** e observe erros 401/403/500 inesperados.
Teste também no **celular** (o produto é mobile-first).

Legenda de prioridade: **P0** = bloqueia lançamento/dinheiro/dados; **P1** =
importante; **P2** = polish.

---

## P0 — Críticos

### 1. Autenticação + email (valida também o A4 — logo novo)
- [ ] Signup com email novo → chega email de confirmação. **Logo carrega** (vem de axtor.space/email/axtor-logo.png).
- [ ] Confirmar email → cai logado, sem erro.
- [ ] Login com a conta criada.
- [ ] `/forgot-password` → chega email de reset com logo → link abre `/reset-password` → troca senha → loga.
- [ ] Botão "Voltar" em telas de auth NÃO desloga.
- [ ] Checkbox de termos: ícone visível no fundo dourado.
Esperado: nenhum email cai em DLQ; logo aparece em todos.

### 2. Onboarding / provisionamento de tenant
- [ ] Usuário novo sem tenant → vê tela de boas-vindas com mockup da capture page.
- [ ] Após confirmar email, o tenant é auto-provisionado (cai no painel).
- [ ] Se o provisionamento falhar, aparece card com botão "Tentar novamente".

### 3. Página de captura (lead in)
- [ ] Abrir a capture page por slug (ex: `axtor.space/?utm_source={slug}` ou domínio do tenant).
- [ ] Foto/headline/tagline do tenant corretos (não o de outro tenant).
- [ ] Preencher e enviar o formulário → sucesso.
- [ ] O lead aparece no Painel > Leads do tenant dono (e NÃO no de outro tenant).

### 4. Diagnóstico imersivo (Deep Funnel)
- [ ] Abrir um funil publicado → boas-vindas → responder as perguntas até o fim.
- [ ] Resultado gera (IA), com produto recomendado coerente + CTA (WhatsApp/checkout) clicável.
- [ ] Tela de obrigado aparece.
- [ ] O diagnóstico/lead é salvo (conferir no painel).
- [ ] Testar funil com **1 produto** (só o recomendado, sem "você também pode gostar") e com **vários**.
- [ ] Refazer o diagnóstico do zero: o cache do lead anterior é limpo.
Observação: a RLS de UPDATE de deep_diagnostics foi escopada hoje (PR #144) —
confirmar que concluir/atualizar o diagnóstico ainda funciona normal.

### 5. Loja / pagamento Pix (Asaas) — dinheiro
- [ ] Abrir `/loja`: planos e addons carregam.
- [ ] Sócio/tester/owner vê "Incluído no seu plano" (não botão de compra) nos addons Pro.
- [ ] Iniciar checkout: modal de dados (LGPD) aparece e valida.
- [ ] Gera cobrança Pix (QR + copia-e-cola).
- [ ] Pagar em **sandbox** → webhook Asaas confirma → ativa o plano (tela BemVindo / ActivationBanner).
- [ ] Reenviar o mesmo webhook NÃO duplica ativação (idempotência).

### 6. Isolamento multi-tenant (segurança, valida o que a auditoria checou)
- [ ] Logado como Tenant A: em Leads/Métricas/Config só aparecem dados do A.
- [ ] Tentar abrir dados/URL de outro tenant → bloqueado/vazio.
- [ ] Acessar `/admin` sem ser admin → redireciona/bloqueia.

---

## P1 — Importantes

### 7. Painel do tenant
- [ ] Bio: editar blocos, reordenar, salvar; tema ao vivo aplica.
- [ ] Capa da bio: upload + crop salva e aparece.
- [ ] **IconPicker: confirmar que só existe a aba "Biblioteca"** (abas IA/Hist/Galeria foram removidas hoje — PR #146).
- [ ] Leads: paginação, seleção, exportar CSV (abre arquivo válido), deletar selecionados.
- [ ] Métricas: dashboard carrega números reais sem erro.
- [ ] Mídia: upload comprime; galeria por tipo; gate Pro+ funciona.
- [ ] Configurações: editar perfil, validar slug em tempo real, ver assinatura, gerenciar convites.
- [ ] Editor do Diagnóstico: editar briefing pré-populado; ativar/desativar e salvar produtos.

### 8. Admin Hub
- [ ] Convites: criar convite; criar de novo pro mesmo email auto-revoga o pendente (idempotência).
- [ ] **Melhorias por IA: rodar → gera recomendações** (agora via Anthropic, PR #145). Confirmar que conclui sem erro.
- [ ] Analytics escopado por tenant; landing partners; templates.

### 9. Emails transacionais
- [ ] Convite (partner/tester) e welcome-tenant chegam com **logo** (axtor.space).
- [ ] Link de unsubscribe funciona.

---

## P2 — Polish / cross-cutting

- [ ] Mobile: navegação, formulários e tipografia ok no celular.
- [ ] URLs com maiúscula são normalizadas; rotas reservadas não caem no tenant default errado.
- [ ] Após um novo deploy, abas antigas se auto-recarregam em vez de quebrar (chunk load error).
- [ ] Console sem erros vermelhos; Network sem 401/403/500 inesperados nos fluxos acima.
- [ ] Performance: tempo de carga aceitável (há chunks >500kB — candidato a code-splitting depois).

---

## Fora do escopo de QA funcional (acompanhar à parte)

- **M2**: ativar leaked password protection no painel Supabase Auth.
- **LGPD**: DPO designado, política de retenção, portal de direitos do titular (ver regras do projeto).
- **Resíduo**: 2 avatares de SAMPLE_DATA de preview ainda apontam pro projeto antigo (não afeta envio real).

---

## Como reportar

Para cada falha: fluxo + passo + o que esperava + o que aconteceu + print do
Console/Network. Abrir como item em `docs/AUDITORIA-*` ou issue, com prioridade.
