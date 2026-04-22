

# Sistema de convites — sócios e testers (acesso completo grátis)

## Objetivo

Você (super-admin) gera convites no painel pra liberar acesso completo grátis pra **sócios** (`partner`) ou **beta-testers** (`tester`). Dois modos: link aberto ou email direcionado. Ambos queimam após 1 uso bem-sucedido.

## Como vai funcionar

### Dois tipos de acesso especial
- **`partner`** — sócio, vitalício, isento de cobrança pra sempre
- **`tester`** — beta-tester, acesso completo, marcado separado pra você filtrar nos relatórios ("quem é sócio, quem é tester")

Ambos recebem `plan_limits` igual ao Pro: blocos ilimitados, analytics, campanhas, improvements, temas, sem badge "feito com axtor".

### Dois modos de convite (você escolhe na hora de gerar)

**Modo A — Link aberto:**
- Você gera código → copia link `axtor.space/signup?invite=ABC123` → manda por onde quiser
- Quem abrir primeiro e completar o cadastro queima o código
- Útil pra distribuir você mesma rapidinho

**Modo B — Email direcionado (recomendado pra Stefany):**
- Você digita o email da pessoa no painel + tipo (partner/tester) + nota opcional
- Sistema gera código **amarrado àquele email específico**
- Sistema dispara automaticamente um email branded "axtor" convidando ela com botão "Criar minha conta" → link já com `?invite=XXX&email=stefany@...`
- Só aquele email consegue usar o código (se outra pessoa tentar com email diferente → bloqueado)
- Queima após primeiro uso bem-sucedido

### Painel super-admin (nova aba `/admin/invites`)
- Visível só pra você (`isAdmin`)
- Botão **"novo convite"** → modal:
  - Tipo: `partner` ou `tester` (radio)
  - Modo: link aberto OU email direcionado
  - Email do convidado (só se modo email)
  - Nota interna (ex: "stefany mello — sócia")
  - Expiração opcional (default: nunca)
- **Lista de convites** com filtros (tipo, status):
  - Código · tipo (badge dourado pra partner, prata pra tester) · email alvo · status (pendente / usado por X em Y / expirado / revogado) · botão **copiar link** · botão **revogar** (só se ainda não usado) · botão **reenviar email** (modo B)

### Fluxo do convidado
1. Recebe link (manual no WhatsApp ou email automático)
2. Abre `/signup?invite=XXX` → campo "código de convite" já preenchido (collapsed por padrão; expandido se tiver `?invite=` na URL)
3. Vê badge verde "✨ acesso parceiro liberado" ou "✨ acesso beta-tester liberado" embaixo do campo
4. Preenche nome, senha, slug normal
5. Tenant nasce com plano `partner`/`tester`, tudo desbloqueado, sem badge

## Arquivos afetados

**Banco — 1 migration:**
- Tabela `invite_codes`: `code` (text único), `type` (`partner`|`tester`), `mode` (`link`|`email`), `target_email` (nullable), `note`, `created_by`, `used_by_user_id`, `used_at`, `expires_at`, `revoked_at`, `created_at`
- RLS: só admin lê/cria/atualiza. Validação anônima via RPC (não lê tabela direto)
- Função `validate_invite_code(_code, _email)` — valida formato, expiração, não-usado, não-revogado, e (se modo email) confere email
- Atualizar `create_tenant_for_user(_slug, _display_name, _invite_code)` — se código válido, cria tenant com plano e plan_limits do convite e marca código como usado atomicamente

**Email transacional — infra Lovable nativa:**
- Setup da infra de email (cobre primeira ativação)
- Template `partner-invite` e template `tester-invite` (React Email, branded axtor — gold-noir)
- Edge function `send-transactional-email` invocada quando convite é criado em modo email

**Frontend:**
- Novo: `src/pages/AdminInvites.tsx` (lista + modal de criar)
- Novo: `src/components/InviteCard.tsx` (item da lista)
- Editado: `src/pages/Signup.tsx` — campo código (auto-preenche via `?invite=`), validação real-time, badge de acesso liberado
- Editado: `src/pages/Admin.tsx` ou sidebar admin — link "Convites" visível só pra `isAdmin`
- Editado: `src/App.tsx` — rota `/admin/invites`
- Editado: `src/hooks/usePlanLimits.tsx` — reconhecer `partner` e `tester` (mesmo limite do Pro)

## Pré-requisito de email (1 passo extra)

Pra mandar email automático (modo B), precisamos configurar o **domínio de envio** em `axtor.space` (subdomínio tipo `notify.axtor.space`). É um passo guiado — você clica num botão, segue o wizard, ele te dá os registros DNS pra adicionar no provedor do domínio. Depois disso o sistema manda emails branded automaticamente, sem custo, sem API key externa.

Se você quiser começar **só pelo modo A (link)** agora e ativar email depois, dá perfeitamente — o sistema já fica pronto, só não dispara email automático até o domínio estar verificado.

## Fora de escopo (próximas fases)
- Stripe / cobrança real → Fase 5 (planos `partner` e `tester` continuam isentos)
- Múltiplos usos por código (ex: código de equipe com 10 usos) → futuro

