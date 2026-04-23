---
name: Email auth templates
description: Branding gold-noir PT-BR aplicado a todos os 6 templates de auth
type: feature
---

Os 6 templates em `supabase/functions/_shared/email-templates/` (signup, recovery, magic-link, invite, email-change, reauthentication) seguem o mesmo padrão:

- Idioma: `lang="pt-BR"`, todo o copy em português
- Marca: `AXTOR` em caps com letter-spacing 0.4em, cor `#c9a84c`
- Heading: Cormorant Garamond serif, 34px, com palavra-chave em italic dourado
- Body: Helvetica Neue, 15px, cor `#3d3d3d`, peso 300
- Botão: fundo `#0d0d0d`, texto `#c9a84c`, border `1px solid #c9a84c`, uppercase, letter-spacing 0.2em
- Container: max 520px, border `1px solid #e5d9b8`, padding 40px 32px
- Footer: `axtor.space — sua bio inteligente` em uppercase 10px

Após editar QUALQUER template, redeploy obrigatório: `supabase--deploy_edge_functions(["auth-email-hook"])`.

Site name: "Axtor" (não usar `siteName` prop como "link-essence-suite"). Sender: `notify.axtor.space`.

## Templates transacionais (separados dos auth)

`partner-invite.tsx` e `tester-invite.tsx` em `_shared/transactional-email-templates/` são os emails de convite REAIS (enviados via `send-transactional-email`). Os templates `invite.tsx` em `_shared/email-templates/` são do Supabase Auth e o app NÃO usa.

Ambos templates de invite recebem props opcionais do convidador via `templateData`:
- `inviterName` · `inviterSlug` · `inviterAvatarUrl` · `inviterHeadline`

`AdminInvites.sendInviteEmail` busca esses dados do tenant + bio_config do criador antes de invocar a edge function. Templates têm fallback gracioso quando ausentes.

**NUNCA passar `name` nem `note` no `templateData` dos invites** — a nota é interna (controle do admin) e não deve aparecer no email. Foi um bug: `name: inv.note` injetava a nota como saudação ("Olá {nota}") e `note` renderizava um box dourado expondo essa informação interna.

Visual: bloco "convidada por" no topo + mockup ilustrado de bio (avatar circular + 2 botões dourados + ghost button) antes do CTA. Após editar qualquer um, redeploy: `supabase--deploy_edge_functions(["send-transactional-email"])`.

## Logos no storage (`email-assets` bucket público)
- `axtor-logo-light.png` — logo clara, usar em fundo escuro (templates de invite têm container preto)
- `axtor-logo.png` — versão antiga com fundo, **não usar mais**