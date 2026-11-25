# Handoff

O IF Swap é a plataforma acadêmica de troca de habilidades do IFSP Campus Barretos. A fase 1 roda localmente com React/Vite, Node.js/Express, Socket.IO e PostgreSQL. A [revisão acadêmica](../revisao-academica.md) registra a leitura dos sete originais, a comparação visual de 13 páginas e as adaptações. O TXT do modelo está no Git. Os originais com dados identificáveis ficam na pasta `README/` local, íntegros.

**Checkpoint de partida desta retomada** · `af22dd3` em `main`, confirmado em `origin/main`. O histórico inclui a entrega da fase local em `3a4bb43`, a preservação do modelo lógico em `313ccf0` e o guia do Windows em `af22dd3`. Confirme o checkpoint mais recente com `git log -1 --oneline` e `git ls-remote origin refs/heads/main`. O remoto é `Rivalitros/IF-Swap`.

A retomada adicionou uma regressão integrada para o proxy do Vite. Ela verifica a sessão das duas contas, a troca de mensagens por WebSocket, a recuperação do histórico após reconectar e o aceite de agenda com aviso. O TXT era o único original acadêmico disponível nesta cópia. Os outros seis dependem da cópia privada do laboratório.

## Executar e conferir

O [guia de instalação no Windows](../como-rodar-localmente.md) é o ponto de entrada para a primeira configuração e a verificação da API.

1. Instale dependências com `npm ci` e copie `.env.example` para `.env`.
2. Aponte o `.env` ao PostgreSQL local. Execute `npm run setup`, opcionalmente `npm run seed`, então `npm run dev`.
3. Use `npm test`, `npm run test:integration` com `TEST_DATABASE_URL` e `npm run build`. Cenários e limitações estão em [testes](../testes.md).

A suíte cobre conta, perfil, matching, chat entre sessões, agenda com disputa de horário, avaliação, mural e migração de chaves do seed. Testes no Edge passaram em desktop e mobile. Durante a validação, a parada intencional do PostgreSQL isolado causou 503 com a mensagem esperada. O mesmo processo Node voltou a responder 200 após a volta do banco.

Na retomada no Windows, a instalação, o build, dois testes unitários e sete integrados passaram. Dois setups e dois seeds foram executados em PostgreSQL isolado em loopback na porta 55432. O `.env` local está preparado para a instância de 5432, com a senha de `postgres` pendente. Depois de configurar a senha localmente, execute o setup nessa instância e prepare o banco `if_swap_test`. [Testes](../testes.md).

O envio ao GitHub transfere código e documentação. Para dados de usuários, use [backup privado](../banco-de-dados.md#backup-e-restauração-privados). Visibilidade do remoto depende de consulta autenticada ao GitHub. A validação local usou dois contextos no mesmo navegador, e o teste entre dispositivos físicos permanece aberto.

A próxima etapa de **IF-10** é executar o roteiro em dois dispositivos físicos. Nesta máquina a instância 5432 escutava em todas as interfaces. Confirme o isolamento da porta antes de habilitar o modo LAN. [Próximos passos](NEXT_STEPS.md) · [Roteiro LAN](../como-rodar-localmente.md#teste-em-dois-dispositivos).
