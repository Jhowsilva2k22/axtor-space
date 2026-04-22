# 🏁 Checkpoint — 22/Abr/2026

> Snapshot completo do projeto **Diagnóstico do IG + Link-in-bio (Joanderson Silva)** antes da publicação no domínio próprio.

---

## ✅ Status geral

| Área              | Status                       |
| ----------------- | ---------------------------- |
| Build (vite)      | ✅ OK (1.38MB / 315KB gzip)  |
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
- **Senha:** `The13071994jhow.` (com o ponto)
- Papel `admin` atribuído via `public.user_roles`

---

## 🗄️ Banco de dados

### Tabelas

| Tabela        | RLS    | Quem lê                | Quem escreve                              |
| ------------- | ------ | ---------------------- | ----------------------------------------- |
| `bio_config`  | ✅     | público                | admin                                     |
| `bio_blocks`  | ✅     | público (active=true)  | admin                                     |
| `user_roles`  | ✅     | admin                  | admin                                     |
| `leads`       | ✅     | admin                  | admin (UI) + service role (edge function) |
| `diagnostics` | ✅     | admin + RPC pública por id | admin (UI) + service role               |

### Funções

- `has_role(user_id, role)` — SECURITY DEFINER, evita recursão em RLS
- `update_updated_at_column()` — trigger genérico
- `get_diagnostic_public(id)` — SECURITY DEFINER, libera leitura de **um** diagnóstico no `/share/:id` sem expor a tabela

### Bucket de storage

- `avatars` (público) — SELECT restrito ao prefixo `bio/`; INSERT/UPDATE/DELETE só admin

---

## 🎨 Design system

- **Tema padrão (noir):** preto profundo + dourado (`#c9a84c`) + tipografia Cormorant Garamond / Manrope
- **Tema claro (ivory):** off-white + dourado escuro (`.theme-ivory` no `<html>`)
- Toggle persistido em `localStorage` (`app-theme`) — disponível em `/bio`, `/admin`, `/admin/login`
- Aurora dourada animada em todas as páginas premium (`.aurora-a`, `.aurora-b`)
- Halo pulsante atrás do avatar (`.avatar-halo`)
- Stagger de entrada nos blocos (`.stagger`)
- Shimmer dourado no hover dos blocos (`.block-shimmer`)

---

## 🧱 Bio — recursos atuais

### Cabeçalho (editável)
- Foto (upload direto até 5MB ou URL)
- Nome de exibição
- Headline (frase principal)
- Sub-headline (linha pequena em caps)
- Texto do rodapé

### Blocos (editáveis, ordenáveis, ativáveis)
- 12 tipos pré-prontos (Instagram, Site, WhatsApp, Agenda, Produto, E-book, Serviço, Afiliado, Parceiro, CTA Diagnóstico, CTA Ferramenta, Link genérico)
- Ícone (qualquer um da biblioteca Lucide — só digitar o nome)
- Label, descrição, badge, URL (externa ou rota interna)
- Switch **destaque** (card dourado luxuoso)
- Switch **cor original** (renderiza com a cor real da marca: Instagram gradiente, WhatsApp verde, etc.)
- Switch **ativo / inativo**

---

## 🔁 Funil — tela de resultado

CTA em **3 camadas** (topo → fundo de funil):
1. **"Ver bio do Joanderson"** → `/bio` (vivencia o funil completo)
2. **"Quero um link-in-bio assim"** → `/bio#blocks`
3. **"Quero estratégia personalizada"** → WhatsApp direto

Micro-pitch acima dos botões reforça que o diagnóstico **é em si uma demonstração do método**.

---

## 🤖 Edge functions

| Função              | JWT  | Propósito                                         |
| ------------------- | ---- | ------------------------------------------------- |
| `analyze-instagram` | off  | Apify scrape + análise IA + cache 12h + 3/sem    |
| `proxy-image`       | off  | Proxy de imagens do IG (CORS / hotlink)           |

Persona da IA: **Estrategista de mercado**. Detecta nicho, gera bandas qualitativas (Crítico / Alerta / Estável / Forte / Excepcional) + verdict tipo "frase-bomba".

---

## 🔒 Segurança — postura

- ✅ Senhas nunca trafegam em logs
- ✅ Roles em tabela separada (`user_roles`) — sem coluna em `profiles`
- ✅ Função `has_role` com `SECURITY DEFINER` evita recursão
- ✅ `leads` e `diagnostics` com leitura admin-only; `/share/:id` usa RPC scoped
- ✅ Storage avatars sem listagem ampla (só `bio/`)
- ✅ Validação de upload (tamanho 5MB, content-type)
- ⚠️ Avisos restantes do scanner são **falsos positivos** justificados (anon nunca escreve direto — só edge function com service role)

---

## 📋 To-do antes de publicar no domínio

1. ☐ Apontar domínio próprio (`joandersonsilva.com.br`) no Lovable
2. ☐ Atualizar `redirectTo` de auth se necessário
3. ☐ Conferir se o bloco "Site oficial" da bio aponta pro domínio final
4. ☐ Rodar `analyze-instagram` num @ real após go-live pra confirmar tokens Apify

---

## 💡 Próximos passos sugeridos (não bloqueiam o launch)

- a) Construtor visual de blocos novos com briefing assistido por IA
- b) Captura de cliques por bloco (analytics)
- c) Diagnóstico pessoal (paterno) como produto pago dentro da bio
- d) Follow-up multicanal magnético pós-diagnóstico
- e) Code-splitting (chunk principal em 1.38MB)

---

_Checkpoint salvo automaticamente. Bom descanso 🌙_
