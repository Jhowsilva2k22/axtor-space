

## Documentação técnica completa + teste end-to-end

Vou criar a planta técnica completa do sistema (manual técnico, fluxos, lógica, utilidades) e rodar o teste end-to-end de email pra confirmar que tudo tá funcionando antes de seguir.

### 1. Verificação de status do email (pré-teste)

Antes de testar, confirmar que `notify.axtor.space` saiu de `awaiting_dns` pra `active`:
- Chamar `email_domain--check_email_domain_status` e registrar o resultado no doc.
- Se `active`: rodar os 3 testes ponta a ponta abaixo.
- Se ainda `awaiting_dns`: documentar tudo mesmo assim e deixar o teste de envio pendente até o DNS verificar.

### 2. Testes end-to-end de email (3 fluxos)

| # | Fluxo | Como testar | Esperado |
|---|-------|-------------|----------|
| 1 | **Signup** | Criar conta nova em `/signup` com email real | Email "Confirmar email" gold-noir PT-BR cai na caixa |
| 2 | **Recovery** | `/forgot-password` → digitar email da conta admin | Email "Redefinir senha" cai, link abre `/reset-password` |
| 3 | **Invite** | `/admin/invites` → criar invite tester | Email "Convite Axtor" cai com código |

Pra cada um: olhar `email_send_log` (status `sent`), olhar logs do `auth-email-hook` e `process-email-queue`, validar se chegou e se o link funciona.

### 3. Documento `docs/MANUAL-TECNICO-2026-04-23.md`

Estrutura:

**Parte 1 — Visão geral**
- O que o sistema faz (link-in-bio multi-tenant + diagnóstico IG + admin)
- Stack: React 18 + Vite + Tailwind + Supabase (Lovable Cloud) + Edge Functions Deno
- Domínios: `axtor.space` (app) + `notify.axtor.space` (email sender, NS delegado pro Cloudflare→Lovable)

**Parte 2 — Arquitetura (planta)**
- Diagrama ASCII do fluxo: Browser → React → Supabase Auth/DB/Storage → Edge Functions → APIs externas (Apify, Lovable AI, Email)
- Roteamento (`App.tsx`): tabela rota → componente → acesso (público/admin)
- Camadas: pages, components, hooks, lib, integrations

**Parte 3 — Banco de dados (linha por linha)**
- Toda tabela do schema atual: nome, colunas-chave, RLS, quem lê/escreve, propósito
- Funções SECURITY DEFINER (`has_role`, `get_diagnostic_public`, `enqueue_email`, etc)
- Triggers e validações
- Storage buckets: `avatars`, `email-assets` (se existir)

**Parte 4 — Autenticação e sessão**
- Fluxo `useAuth.tsx`: getSession → onAuthStateChange → sessionResolved
- Regra absoluta: hard refresh nunca desloga (memo `mem://preferences/auth-session`)
- Roles em `user_roles` separado (anti privilege-escalation)
- Recovery: `/forgot-password` → email → `/reset-password`

**Parte 5 — Multi-tenant**
- Como `useCurrentTenant` resolve tenant ativo
- Convites idempotentes (`AdminInvites` revoga pendentes mesmo email)
- Plan limits (`usePlanLimits`)

**Parte 6 — Bio (link-in-bio)**
- `Bio.tsx`: render público
- `Admin.tsx`: CRUD cabeçalho + blocos + categorias
- Templates prontos (`bioTemplates.ts` — coach, artist, ecommerce, infoproduct)
- QR Code, ambient player, métricas por bloco
- Themes: noir-gold default + ivory-gold (toggle persistido)

**Parte 7 — Diagnóstico Instagram**
- Funil: Landing → form → `analyze-instagram` edge function
- Apify scrape + Lovable AI (Gemini/GPT) + cache 12h + rate limit 3/sem
- Resultado em `/share/:id` via RPC pública `get_diagnostic_public`
- Persona IA: estrategista de mercado

**Parte 8 — Sistema de Email (a peça nova)**
- **Infra**: pgmq queues (`auth_emails` + `transactional_emails`) + cron 5s + DLQ + suppression list
- **Templates auth (6)** em PT-BR gold-noir: signup, recovery, invite, magic-link, email-change, reauthentication
- **Templates transacionais (3)**: partner-invite, tester-invite, welcome-tenant
- **Edge functions**: `auth-email-hook` (enqueue), `send-transactional-email`, `process-email-queue` (drainer), `handle-email-suppression`, `handle-email-unsubscribe`, `preview-transactional-email`
- **DNS**: Hostinger nameservers → Cloudflare → axtor.space; subdomain `notify` delegado via NS para `ns3/ns4.lovable.cloud`
- **Sender**: `notify.axtor.space`, From: `link-essence-suite <noreply@notify.axtor.space>`
- **Throughput**: ~120 emails/min (configurável via `email_send_state`)

**Parte 9 — Edge Functions (uma por uma)**
Pra cada função: propósito, trigger, input/output, auth (jwt on/off), dependências externas, secrets necessários.

**Parte 10 — Páginas admin**
- `/admin` (CRUD bio + onboarding)
- `/admin/analytics` (RPC `get_tenant_analytics`)
- `/admin/invites` (idempotência)
- `/admin/templates` (gestão presets)
- `/admin/diagnostics` (leads + diagnósticos)
- `/admin/improvements`, `/admin/block-metrics`

**Parte 11 — Segurança**
- RLS em todas as tabelas sensíveis
- Roles em tabela separada
- Storage com prefixo restrito
- Validação de upload (5MB, content-type)
- Webhook signature verification (`@lovable.dev/webhooks-js`)
- Suppression list bloqueia bounces/complaints

**Parte 12 — Memórias e regras do projeto**
Listar tudo de `mem://`: core rules, design rules, auth rules, features memorizadas.

**Parte 13 — Resultado do teste end-to-end**
Print/log de cada um dos 3 fluxos (signup/recovery/invite) com status do `email_send_log`.

**Parte 14 — Próximos passos sugeridos**
- Domínio publicado no Lovable apontando pra `axtor.space` (já tá ativo? confirmar)
- Code-splitting (chunk principal grande)
- Cron de resumos semanais por tenant
- SEO dinâmico por tenant
- Diagnóstico paterno como produto pago

### 4. Atualização de memória

- Atualizar `mem://index.md` adicionando referência ao manual.
- Criar `mem://features/email-infra` consolidando: queue, sender domain, NS delegação Cloudflare, templates PT-BR.

### 5. Entregáveis

- `docs/MANUAL-TECNICO-2026-04-23.md` (manual técnico completo)
- `docs/CHECKPOINT-2026-04-23.md` (checkpoint do dia: o que mudou na sessão de email + DNS)
- Memo `mem://features/email-infra`
- Resultado do teste end-to-end no manual

Após aprovação, executo tudo numa única passada: check status → testar 3 fluxos → escrever os 2 docs → atualizar memo → te dar o resumo do que tá pronto e o que falta antes do próximo passo (que sugiro ser: code-splitting + verificar domínio `axtor.space` apontado no Lovable).

