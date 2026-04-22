---
name: QR Code da bio
description: Botão no /admin gera QR PNG/SVG com logo Axtor centralizada
type: feature
---

`src/components/QRCodeDialog.tsx` — Dialog com preview + download PNG (1024px) e SVG.
- Lib: `qrcode` (npm) com `errorCorrectionLevel: "H"` pra suportar logo central.
- Logo: badge dourada gradient + letra "A" Playfair Display centralizada (sem dep de imagem).
- PNG: canvas + overlay manual via `drawLogo(ctx, size)`.
- SVG: `QRCode.toString({type:"svg"})` + injeção de `<defs>` + `<g>` com `<circle>` e `<text>` antes do `</svg>`.
- Filename: `axtor-{slug}-qr.{png|svg}`.

Integrado em `src/pages/Admin.tsx` no header (entre "Convites" e "Ver bio"), só renderiza se `currentTenant` existe.
URL: `${window.location.origin}/${currentTenant.slug}` — usa o origin atual (axtor.space em prod, preview em dev).
