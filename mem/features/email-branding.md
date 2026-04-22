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