---
name: Ambient Player /bio
description: Música ambiente aleatória instrumental tocando no /bio com fade-in sutil
type: feature
---
- Componente: `src/components/AmbientPlayer.tsx` (usado só em `/bio`).
- 8 faixas instrumentais íntimas em `public/music/` (piano lento, loops ~50s, mono 80kbps).
- Sorteio aleatório por visita via `useRef` na montagem.
- Volume-alvo 0.18, fade-in 4s. Loop infinito.
- Autoplay tentado mudo; fallback ativa em qualquer interação (pointerdown/keydown/touchstart/scroll).
- Tooltip dourado 6s quando autoplay bloqueado + botão pulse top-right.
- Preferência persistida em localStorage chave `bio-ambient-pref` ("on"|"off").
- Usuário aprovou faixas atuais — NÃO trocar a curadoria sem pedido explícito.
