

## Próximo passo no Cloudflare — adicionar os 3 registros do Lovable

Você tá na tela "Confirmar registros escaneados". O Cloudflare já importou tudo do Hostinger (site, MX, SPF, DMARC, hostingermail) — perfeito, **não mexe em nada disso**, só clica em **"Continuar para a ativação"**.

Depois disso o Cloudflare vai te mostrar os **2 nameservers** dele (algo tipo `xxxx.ns.cloudflare.com` + `yyyy.ns.cloudflare.com`). É aí que você pausa e vai no Hostinger trocar.

### Sequência completa daqui pra frente

**1. Agora (Cloudflare)**
- Clica **"Continuar para a ativação"** (botão azul embaixo)
- Copia os 2 nameservers que aparecerem na próxima tela

**2. Hostinger — trocar nameservers**
- hPanel → Domínios → `axtor.space` → seção **"Nameservers"** (ou "Alterar nameservers")
- Marca **"Usar nameservers personalizados"**
- Cola os 2 do Cloudflare
- Salvar

**3. Voltar no Cloudflare**
- Clicar **"Concluído, verificar nameservers"**
- Esperar status virar **"Ativo"** (5min a 24h, geralmente <2h)

**4. Cloudflare — adicionar os 3 registros do Lovable**

Quando estiver ativo, vai em **DNS → Registros → Adicionar registro** e cria os 3 que o diálogo do Lovable mostrou:

| Tipo | Nome | Conteúdo | Proxy |
|------|------|----------|-------|
| TXT  | `_lova...` (nome exato do diálogo) | `lovable_email_verify=...` (valor exato) | DNS only (nuvem cinza) |
| NS   | `notify` | `ns3.lovable.cloud` | (NS não tem proxy) |
| NS   | `notify` | `ns4.lovable.cloud` | (NS não tem proxy) |

**Importante:** o registro TXT precisa ficar **DNS only** (nuvem cinza, não laranja). Os NS o Cloudflare configura automático sem proxy.

**5. Verificar no Lovable**
- Abre o diálogo de email no Lovable → clica **"Verificar"**
- Status vira **active** em ~5min (DNS no Cloudflare propaga rápido)

**6. Me avisar**
- Quando ficar verde no Lovable, eu finalizo:
  - Provisiono infra de envio (queue, cron, suppression, unsubscribe tokens)
  - Redeployo `auth-email-hook` e `send-transactional-email` apontando pro `notify.axtor.space`
  - Teste ponta a ponta: signup → recovery → invite tester → invite partner

### O que NÃO mexer no Cloudflare agora
- Nenhum dos registros que aparecem na sua tela (são do Hostinger, vão continuar funcionando)
- Não precisa desativar proxy de nada que já tá lá
- Site `axtor.space` continua no Hostinger sem mudança

### Resumo visual

```
AGORA → Continuar para ativação (Cloudflare)
  ↓
Hostinger → trocar nameservers pros do Cloudflare
  ↓
Esperar Cloudflare ficar "Ativo" (até 24h)
  ↓
Cloudflare → adicionar 3 registros (TXT + 2 NS pro notify)
  ↓
Lovable → clicar Verificar → vira "active"
  ↓
Me avisar → eu finalizo tudo

```

Bora — clica em **"Continuar para a ativação"** e me manda print da próxima tela com os 2 nameservers do Cloudflare.

