# CHECKPOINT 2026-06-12 — Desempenho mobile de /vendas e /planos

> Milestone: investigação a fundo do PageSpeed mobile (~60) das páginas públicas.
> Resultado: ENCERRADO com decisão. Ganhos reais entregues; nota é teto da stack.

## Ponto de partida

- PageSpeed mobile ~60 em /vendas e /planos (desktop 93–96, ótimo).
- Hipótese inicial (do checkpoint anterior): "só prerender resolve".

## O que foi testado (medido, não suposto)

1. **Prerender com Chromium (#176).** Gera HTML pronto no build.
   - Local (Lighthouse mobile): /vendas **60 → ~72**. Funciona.
   - Produção (Vercel): **NÃO roda** — o build da Vercel não tem o Chromium
     (`libnss3.so` ausente). `@sparticuz/chromium` também falhou no ambiente de
     build. Prerender pulado em silêncio → produção ficou sem ganho.
   - Efeito colateral: erros de hidratação (#418) por causa das animações.
   - **Revertido no #177** (peso morto + ruído).

2. **Cortar o three.js (fundo 3D) no mobile.** Testado: **não muda a nota** — o
   three.js já era carregado lazy (pós-pintura), então não estava no caminho
   crítico. (Bateria/dados melhoram, mas a métrica não.) Não foi adiante.

3. **Bundle (o que realmente pesa no caminho crítico) — #178.** Causa medida:
   `Bio.tsx` (eager) fazia `import * as LucideIcons`, puxando a biblioteca
   inteira de ícones (vendor-ui = 582 kB) em TODA rota. Correção: `Bio` lazy +
   tirar lucide do manualChunk. `vendor-ui` 582 → 52 kB; ícones (530 kB) só na
   bio/editor. **Mesmo assim a nota subiu pouco** (FCP/LCP seguem presos por CSS
   render-blocking + fonte do título).

4. **Título do hero instantâneo no mobile — #178.** O `<h1>` era o elemento de
   LCP e animava de opacity:0; passou a pintar na hora no celular (desktop
   mantém a animação). Ajudou LCP marginalmente; não destrava a faixa verde.

## Decisão final

A nota mobile de laboratório é **teto desta stack** (SPA React pesado: o conteúdo
só aparece depois do JS baixar/rodar sob throttle; some CSS render-blocking e LCP
de fonte). O único lever que move FCP/LCP de verdade é **SSR real** (HTML do
servidor), e isso aqui significa **migração de stack** (ex.: Next.js), não um
tweak — porque (a) o build da Vercel não roda navegador e (b) o app lê
`window`/`localStorage` no render e as animações brigam com SSR em Node.

**NÃO re-tentar prerender/SSR sem decisão explícita de migrar a stack.**

## O que ficou no ar (ganho real, sem pipeline)

- #178: ícones fora do caminho crítico, título instantâneo no mobile, fim do
  flash branco (fundo escuro desde o 1º byte).
- #179: copy de clareza na /vendas (direcionamento → produto/serviço/conteúdo
  certo pro resultado; "são dois diagnósticos, ative o que faz sentido").

São ganhos de **experiência real** (menos dados no celular, sem flash, conteúdo
na hora) e de bundle mais limpo — não de pontuação de laboratório.

## Pendências relacionadas (futuro, se a nota virar prioridade)

- Migrar páginas públicas para SSR (Next/Astro) — projeto à parte.
- CSS crítico inline / reduzir render-blocking — investigação separada.
