

## Deixar o gerenciador de Categorias auto-explicativo

### 1. Trocar o campo de ícone (texto cru) por um seletor visual
Hoje você vê "Share2", "MessageCircle" como texto e tem que adivinhar. Vou trocar pelo mesmo **IconPicker** que já existe nos blocos (`src/components/IconPicker.tsx`) — abre um popover com os ícones desenhados, você clica no que quer.

### 2. Mostrar o ícone renderizado ao lado do nome
Em cada linha de categoria vai aparecer o **ícone real** (não o texto "Share2") na frente do nome, igual aparece nos blocos. Assim você bate o olho e entende.

### 3. Tornar o "risco" autoexplicativo
Em vez de só riscar o botão das prontas, vou:
- Deixar com aparência de "✓ já adicionada" (check verde + texto normal, sem risco)
- Tooltip explícito: "Já está na sua lista"
- Manter desabilitado pra não duplicar

### 4. Mini-explicação no topo do card
Adicionar 1 linha curta de ajuda no topo do card Categorias:
> *"Categorias agrupam seus blocos na /bio. Crie aqui e depois escolha em cada bloco no campo Categoria."*

E no dropdown "Categoria" dentro do bloco, um texto auxiliar pequeno:
> *"Gerencie a lista no card Categorias abaixo"* (com link âncora rolando até lá)

### 5. Esconder o slug atrás de um "avançado"
O campo `slug` (redes-sociais, contato…) é técnico — usuário final não precisa ver. Vou colocar atrás de um botão "⚙ avançado" que expande. O slug continua sendo gerado automático a partir do nome.

---

### Arquivos afetados
- `src/components/CategoriesManager.tsx` — IconPicker, ícone renderizado, slug avançado, texto de ajuda, tooltip nas prontas
- `src/pages/Admin.tsx` — texto auxiliar no dropdown Categoria do bloco + âncora pro card

### Resultado final
Cada categoria vai aparecer assim:
```text
[↑ ↓]  🔗 Redes sociais            [ATIVA ●]  [🗑]
       ⚙ avançado
```
E as prontas:
```text
[+ Produtos]  [+ Serviços]  [✓ Redes sociais (já adicionada)]
```

Sem precisar saber o que é "Share2" nem o que é "slug".

