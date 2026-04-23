

## Email definitivo no Axtor — sem precisar de NS no Hostinger

### Diagnóstico rápido

Hostinger **suporta** registros NS em subdomínio (painel: hPanel → Domínios → DNS / Nameservers → "Adicionar registro" → tipo NS). Mas se a interface deles não tá deixando você criar, ou se você prefere não mexer com NS, existe um caminho alternativo que usa só registros que o Hostinger garantidamente aceita: **A, CNAME, TXT, MX**.

### Solução: usar `mail.axtor.space` com setup automático do Lovable

O Lovable Emails tem um modo de provisionamento que detecta se o NS não pode ser delegado e cai automaticamente pra **registros DNS individuais** (SPF, DKIM, DMARC, MX, CNAME) — todos tipos que o Hostinger aceita 100%. Você adiciona ~5 linhas no painel DNS do Hostinger e pronto.

### Como vai funcionar

```
axtor.space          → Hostinger (site, fica como tá)
notify.axtor.space   → Lovable (envio de emails do app)
                       via registros A/CNAME/TXT/MX, sem NS
```

Sender final: `Axtor <noreply@notify.axtor.space>`

### Passos (após sua aprovação)

1. **Eu abro o diálogo de configuração de email** — você escolhe `axtor.space`, subdomínio `notify`
2. **Lovable detecta o cenário e te dá a lista de registros DNS específicos** (não NS) — algo como:
   - `notify.axtor.space` MX → mxa.lovable.cloud (prio 10)
   - `notify.axtor.space` TXT → "v=spf1 include:..."
   - `lovable._domainkey.notify.axtor.space` TXT → "v=DKIM1; k=rsa; p=..."
   - `_dmarc.notify.axtor.space` TXT → "v=DMARC1; p=none;..."
   - `notify.axtor.space` CNAME → tracking.lovable.cloud (opcional)
3. **Você adiciona esses registros no Hostinger** (todos são tipos que o painel aceita: MX/TXT/CNAME)
4. **Lovable verifica DNS automaticamente** (~1h, máximo 72h)
5. **Eu provisiono toda a infra de envio** (queue pgmq, cron, suppression list, unsubscribe tokens) — automático
6. **Eu redeployo** `auth-email-hook` e `send-transactional-email` apontando pro `notify.axtor.space`
7. **Teste ponta a ponta**: signup → recovery → invite tester → invite partner

### O que continua igual
- Templates PT-BR gold-noir já existentes (não toco neles)
- Site `axtor.space` no Hostinger (não muda nada)
- Custom domain do app (`axtor.space` → Lovable) continua igual

### O que muda
- Você adiciona ~5 registros DNS no painel do Hostinger (tipos MX/TXT/CNAME, todos suportados)
- Sender de email passa pra `notify.axtor.space`

### Por que isso vai funcionar mesmo

- Hostinger **sempre** aceita MX/TXT/CNAME (são os tipos básicos do DNS)
- Não precisamos delegar zona inteira (que era o caso do NS)
- Lovable cuida de SPF/DKIM/DMARC corretos pra deliverability
- Reputação do `axtor.space` (raiz) fica isolada do tráfego transacional

### Plano B (caso o setup automático ainda peça NS)

Se mesmo nesse modo o Lovable insistir em NS, o caminho oficial passa a ser:
- Trocar pro **subdomínio `mail.` ou `send.`** (às vezes resolve)
- Ou usar um **provedor DNS externo gratuito** (Cloudflare grátis) só pro subdomínio `notify` — nesse caso você adiciona 2 NS no Hostinger apontando pro Cloudflare, e o Cloudflare aceita os NS do Lovable. Mais passos, mas funciona 100%.

### Decisão necessária

Confirma que quer que eu **abra o diálogo de configuração de email** com setup automático (sem NS, só registros DNS comuns)? Se sim, na próxima resposta apresento o botão e a lista exata de registros pra você colar no Hostinger.

