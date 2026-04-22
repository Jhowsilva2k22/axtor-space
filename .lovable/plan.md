

# Decisão de arquitetura: como rotear clientes em escala

A Lovable não suporta wildcard nem API de domínios. Cada subdomínio que você adicionar exige cadastro manual + 2FA da Hostinger + espera de SSL — inviável acima de 5-10 clientes. Precisamos decidir o modelo de roteamento **agora**, antes de você ficar preso.

## Opções

**A) Path-based (`axtor.space/joanderson`)** — recomendado
- Onboarding instantâneo, sem 2FA, sem painel manual
- Modelo do Bento, Carrd, Linktree
- Já está parcialmente pronto no código (rota `/bio` existe)
- Custom domain por cliente vira upsell de plano premium (caso a caso)

**B) Continuar com subdomínio + cadastro manual**
- Mantém `joanderson.axtor.space`
- Você autentica 2FA manualmente pra cada cliente novo
- Funciona enquanto você tiver poucos clientes (<10)
- Migra pra Cloudflare for SaaS quando escalar (Fase 6)

**C) Híbrido**
- Path-based como padrão (`axtor.space/cliente`)
- Subdomínio só pra plano premium (manual, vira diferencial)
- Custom domain (`cliente.com.br`) no plano top

## O que muda no código (se escolher A ou C)

1. `useTenant` passa a resolver pelo **primeiro segmento da URL** (`/joanderson`) em vez do subdomínio
2. Rotas viram `/:slug` (público) e `/:slug/admin` ou `/admin` (admin único)
3. Mantém compat com subdomínio caso já tenha clientes nele (cai no mesmo tenant)
4. `/bio` continua existindo como atalho legado

## Pergunta de decisão

Qual modelo seguir? (A é o mais escalável e indolor; B é o que está hoje; C é o premium)

