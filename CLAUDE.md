# Regras do projeto — axtor-space

## Idioma
- Sempre responder em português brasileiro
- Código e comandos de terminal ficam em inglês (sintaxe técnica)
- Comentários no código em PT-BR

## Git
- Nunca fazer push direto para `main` — sempre criar branch e abrir PR
- Nomenclatura de branch: `feat/`, `fix/`, `chore/` + descrição curta

## Comunicação
- Avisar quando terminar cada tarefa antes de seguir para a próxima
- Se travar em qualquer comando, parar imediatamente e mostrar o erro — sem workaround sem checar com o usuário

## Documentação (sempre manter em dia)
- Ao concluir algo importante (fix em produção, migration, deploy, feature, decisão de arquitetura), ATUALIZAR os documentos do sistema no mesmo fluxo, antes de encerrar a tarefa.
- Documentos: `MEMORY.md` (raiz, estado vivo), `docs/CHECKPOINT-*.md` (milestone), `docs/AUDITORIA-*.md` (marcar achados RESOLVIDO com nº do PR), `mem/index.md` (ponteiros).
- Registrar sempre o nº do PR/commit que fechou o item.
