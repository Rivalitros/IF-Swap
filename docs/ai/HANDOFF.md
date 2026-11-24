# Handoff

## Agenda recíproca e calendário

As regras de interesse mútuo, janela de tempo e conflitos estão em `backend/src/repositories/agenda.js`; o calendário em `frontend/src/pages/Agenda.jsx`.

Verificação: Quatro testes integrados, dois unitários e build aprovados. Chat 795f70c enviado a origin/main.

Próximo passo: IF-07 · Alta · Entregar avaliação mútua e mural com respostas encadeadas.

## Chat local por Socket.IO

O React usa `frontend/src/pages/Chat.jsx` e `frontend/src/realtime.jsx`. A API e o contrato estão em `backend/src/realtime.js` e `docs/api.md`.

Verificação: Três testes integrados, dois unitários e build aprovados. Revisão acadêmica 3b25dc2 enviada a origin/main.

Próximo passo: IF-06 · Alta · Implementar agenda recíproca e notificações de transição.

A primeira versão do IF Swap roda localmente e conecta a comunidade do IFSP Campus Barretos. Confira a branch e o envio com `git status -sb` e `git log -1 --oneline`.

As sete referências de `README/` foram revisadas, incluindo 13 páginas do Figma visualizadas. A [matriz de revisão](../revisao-academica.md) identifica ajustes e os materiais que permanecem locais. O modelo lógico em TXT é compartilhável.

Checkpoint anterior da aplicação: `ce3e32d` em `main`, enviado a `origin/main`. Cadastro, login, perfil, habilidades, matching e criação do par já passaram em testes integrados. Os arquivos da API Socket.IO em andamento estão no workspace local. A próxima etapa integra o frontend do chat e valida duas sessões, seguida por agenda recíproca, avaliação pós-encontro, mural e correções visuais.

Use `npm ci`, configure `.env` a partir do exemplo, `npm run setup`, `npm run seed` e `npm run dev`. Testes em `backend/test/`. Veja o [mapa](PROJECT_MAP.md) e a [lista de próximas etapas](NEXT_STEPS.md).
