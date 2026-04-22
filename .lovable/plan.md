

# Configuração do domínio `axtor.space` (Hostinger) + ajustes no plano SaaS

## O que você faz na Hostinger (uma vez só)

A arquitetura SaaS exige **wildcard DNS** pra que `qualquersubdominio.axtor.space` funcione automaticamente sem você ter que cadastrar cada tester manualmente.

### Passo 1 — Trocar nameservers (recomendado) OU editar DNS direto

Na imagem, vejo que seu domínio está com nameservers `ns1.dns-parking.com` / `ns2.dns-parking.com` (parking padrão da Hostinger). Isso significa que ele NÃO está apontando pra lugar nenhum ainda.

**Opção A (recomendada — mais simples)**: Mantém os nameservers da Hostinger e edita os registros DNS direto no painel deles.

**Opção B**: Trocar nameservers pra um provedor que aceite wildcard mais facilmente (Cloudflare). Não precisa agora.

Vamos com a **Opção A**.

### Passo 2 — Adicionar registros DNS na Hostinger

No painel da Hostinger → seu domínio `axtor.space` → **DNS / Nameservers** → **Gerenciar registros DNS**, adicionar:

| Tipo | Nome | Valor | TTL |
|---|---|---|---|
| A | `@` | `185.158.133.1` | 14400 |
| A | `www` | `185.158.133.1` | 14400 |
| A | `*` | `185.158.133.1` | 14400 |
| TXT | `_lovable` | (valor que o Lovable vai gerar) | 14400 |

O registro `*` (wildcard) é o que faz `joana.axtor.space`, `pedro.axtor.space`, etc., funcionarem automaticamente.

### Passo 3 — Conectar no Lovable

Em **Project Settings → Domains** do Lovable:
1. **Connect Domain** → `axtor.space` (root)
2. **Connect Domain** → `www.axtor.space`
3. **Connect Domain** → `app.axtor.space` (sua landing + super-admin)
4. Wildcard: o Lovable atualmente requer cadastrar cada subdomínio individualmente em projetos normais. Para o nosso caso de SaaS multi-tenant, vou implementar a estratégia abaixo.

### Estratégia de subdomínio no Lovable (importante)

O Lovable hoje não aceita um único registro `*.axtor.space` no painel — cada subdomínio precisa ser conectado. Duas abordagens:

**Abordagem 1 — Cada novo tenant gera ticket pra você conectar manualmente no Lovable** (5 min seu por tenant). Funciona mas não é "100% automático".

**Abordagem 2 — Usar `app.axtor.space/t/{slug}` (path-based) em vez de subdomínio real, AGORA, e migrar pra subdomínio real quando o Lovable suportar wildcard nativamente OU quando você sair do Lovable hosting pra um Vercel/Cloudflare**. Funcionalmente idêntico pro tester, só que o link é `app.axtor.space/t/joana` em vez de `joana.axtor.space`.

Recomendação minha: **começar com Abordagem 2** (path-based, totalmente automático, zero fricção pro beta) e oferecer "promover pra subdomínio próprio" depois como upgrade. Já fica visualmente parecido com link-in-bio dos concorrentes (`linktr.ee/joana`).

## Como isso muda o plano original

### Domínio fixo agora: `axtor.space`

- `axtor.space` e `www.axtor.space` → landing comercial do SaaS + login
- `app.axtor.space` → super-admin (seu) + admin dos tenants
- `app.axtor.space/t/{slug}` → link-in-bio público do tester
- `app.axtor.space/t/{slug}/diagnostico` → funil de diagnóstico do tester
- `app.axtor.space/t/{slug}/admin` → admin do tester (login required)

### Onboarding atualizado

O passo "Seu link público" continua existindo, mas o preview muda:

```text
Seu link será:  axtor.space/t/[ joana ]
                              ↑ campo editável

✓ Disponível
```

Tudo o resto da política (dupla confirmação, troca paga, validação ao vivo, lista de bloqueados) continua idêntico. Só muda a forma do URL.

### Migração futura pra subdomínio próprio

Quando der o salto pra subdomínio real (`joana.axtor.space`), o slug do tester continua o mesmo — só muda a forma do link público. Sistema já fica preparado: `tenants.subdomain` é o slug, e o resolver lê o tenant tanto por path (`/t/joana`) quanto por subdomínio (`joana.axtor.space`) no futuro.

## O que entra na Fase 0 (antes do código)

1. Você adiciona os 4 registros DNS na Hostinger (A `@`, A `www`, A `*`, TXT `_lovable` — eu te passo o valor do TXT no momento certo)
2. Você conecta `axtor.space`, `www.axtor.space` e `app.axtor.space` no Lovable
3. Eu gero o backup SQL (`/mnt/documents/backup-pre-saas-2026-04-22.sql`)
4. Aguarda propagação DNS (até 24h, normalmente 15 min)

Depois disso eu sigo com Fases 1-6 do plano SaaS já aprovado, com a única alteração sendo: **roteamento path-based (`/t/{slug}`) no MVP** em vez de subdomínio real.

## Confirme:

- ✅ Usar `axtor.space` (path-based no MVP, subdomínio real depois)
- ✅ Você adiciona os DNS na Hostinger antes de eu começar
- ✅ Sigo com o plano SaaS multi-tenant já aprovado, ajustado pra essa estrutura de URL

Aprovando, começo pela geração do backup SQL e te entrego junto com o passo-a-passo exato dos DNS pra colar na Hostinger.

