# 🏁 Checkpoint — 22/Abr/2026

> Snapshot completo do projeto **Diagnóstico do IG + Link-in-bio (Joanderson Silva)** antes da publicação no domínio próprio.

---

## ✅ Status geral

| Área              | Status                       |
| ----------------- | ---------------------------- |
| Build (vite)      | ✅ OK (~315KB gzip)          |
| TypeScript        | ✅ 0 erros                   |
| Linter Supabase   | ✅ 0 warnings críticos       |
| Security scan     | ✅ Limpo (avisos justificados) |
| Auth              | ✅ Funcional                 |
| Edge functions    | ✅ analyze-instagram + proxy-image |
| Storage avatars   | ✅ Restrito a `bio/*`        |

---

## 🌐 Rotas

| Rota              | Acesso                       | O que é                                     |
| ----------------- | ---------------------------- | ------------------------------------------- |
| `/`               | público                      | Landing + funil do diagnóstico              |
| `/bio`            | público                      | Link-in-bio premium (noir & gold + ivory)   |
| `/share/:id`      | público (via RPC segura)     | Resultado compartilhável                    |
| `/admin/login`    | público                      | Tela de login                               |
| `/admin`          | admin                        | Painel CRUD (cabeçalho + blocos da bio)     |

---

## 🔐 Acesso admin

- **E-mail:** `contatojhow@icloud.com`
- **Senha:** `The13071994jhow.`
- Papel `admin` em `public.user_roles`

---

## 🗄️ Banco de dados

| Tabela        | RLS    | Lê                       | Escreve                                   |
| ------------- | ------ | ------------------------ | ----------------------------------------- |
| `bio_config`  | ✅     | público                  | admin                                     |
| `bio_blocks`  | ✅     | público (active=true)    | admin                                     |
| `user_roles`  | ✅     | admin                    | admin                                     |
| `leads`       | ✅     | admin                    | admin (UI) + service role (edge function) |
| `diagnostics` | ✅     | admin + RPC pública por id | admin (UI) + service role               |

### Funções
- `has_role(user_id, role)` SECURITY DEFINER
- `update_updated_at_column()` trigger genérico
- `get_diagnostic_public(id)` SECURITY DEFINER — leitura única para `/share/:id`

### Storage
- `avatars` (público) — SELECT só em prefixo `bio/`; writes só admin

---

## 🎨 Design system

- **Noir & Gold** (default): preto profundo + dourado `#c9a84c`
- **Ivory & Gold**: tema claro alternativo via classe `.theme-ivory` no `<html>`
- Tipografia: Cormorant Garamond (display) + Manrope (body)
- Toggle de tema persistido em `localStorage` (`app-theme`) — `/bio`, `/admin`, `/admin/login`
- Aurora dourada animada, halo no avatar, stagger e shimmer nos blocos

---

## 🧱 Bio — recursos

### Cabeçalho (editável)
Foto (upload ≤5MB ou URL), nome, headline, sub-headline, footer.

### Blocos (editáveis, ordenáveis, ativáveis)
- 12 tipos pré-prontos
- Ícone Lucide configurável
- Label, descrição, badge, URL
- Switches: **ativo**, **destaque**, **cor original** (renderiza com a cor real da marca — Instagram gradiente, WhatsApp verde, etc.)

### Painel admin — UX de gravação
- ✅ Botão **"Salvar bloco"** individual em cada bloco
- ✅ Botão **"Salvar cabeçalho"**
- ✅ **Barra flutuante "Salvar tudo"** (NOVO) — aparece só quando há alterações pendentes, mostra contador e dispara todos os updates em paralelo. Evita perder edição esquecida.

---

## 🔁 Funil — tela de resultado

CTA em 3 camadas:
1. **Ver bio do Joanderson** → `/bio`
2. **Quero um link-in-bio assim** → `/bio#blocks`
3. **Estratégia personalizada** → WhatsApp

---

## 🤖 Edge functions

| Função              | JWT  | Propósito                                         |
| ------------------- | ---- | ------------------------------------------------- |
| `analyze-instagram` | off  | Apify scrape + IA + cache 12h + 3/sem por @       |
| `proxy-image`       | off  | Proxy de imagens IG (CORS / hotlink)              |

Persona da IA: **Estrategista de mercado** — bandas qualitativas + verdict frase-bomba.

---

## 🔒 Segurança — postura

- Roles em tabela separada (`user_roles`)
- `has_role` SECURITY DEFINER (sem recursão)
- `leads` e `diagnostics` admin-only; `/share/:id` via RPC scoped
- Storage avatars sem listagem ampla
- Validação de upload (5MB, content-type)
- Avisos restantes do scanner = falsos positivos (anon nunca escreve direto)

---

## 📋 To-do antes de publicar no domínio

1. ☐ Apontar `joandersonsilva.com.br` no Lovable
2. ☐ Atualizar `redirectTo` de auth se necessário
3. ☐ Conferir bloco "Site oficial" da bio
4. ☐ Rodar 1 análise real após go-live (validar Apify)

---

## 💡 Próximos passos sugeridos

- a) Construtor de blocos com briefing assistido por IA
- b) Analytics de cliques por bloco
- c) Diagnóstico paterno como produto pago dentro da bio
- d) Follow-up multicanal magnético pós-diagnóstico
- e) Code-splitting (chunk principal ~1.38MB)

---

_Atualizado em 22/04/2026 após inclusão da barra "Salvar tudo" no painel._
