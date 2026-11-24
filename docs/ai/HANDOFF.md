# Handoff

O IF Swap é a plataforma acadêmica de troca de habilidades do IFSP Campus Barretos. A fase 1 roda localmente com React/Vite, Node.js/Express, Socket.IO e PostgreSQL. A [revisão acadêmica](../revisao-academica.md) registra a leitura dos sete originais, a comparação visual de 13 páginas e as adaptações. O TXT do modelo está no Git. Os originais com dados identificáveis ficam na pasta `README/` local, íntegros.

**Último checkpoint anterior a este handoff** · `5240275` em `main`, enviado a `origin/main`. Os checkpoints de revisão, chat, agenda, avaliações, mural e alinhamento visual foram enviados. Confirme o hash mais recente com `git log -1 --oneline` e o remoto com `git ls-remote origin refs/heads/main`. O remoto preexistente é `Rivalitros/IF-Swap`.

A entrega fecha documentação de execução e testes, adiciona aviso de mensagens fora da conversa, encerra sockets quando a sessão acaba e mantém coerência ao navegar no onboarding durante uploads e edições. Principais arquivos alterados nesta etapa incluem `backend/src/realtime.js`, `frontend/src/Layout.jsx`, `frontend/src/pages/Profile.jsx`, `README.md` e `docs/`.

## Executar e conferir

1. Instale dependências com `npm ci` e copie `.env.example` para `.env`.
2. Aponte o `.env` ao PostgreSQL local. Execute `npm run setup`, opcionalmente `npm run seed`, então `npm run dev`.
3. Use `npm test`, `npm run test:integration` com `TEST_DATABASE_URL` e `npm run build`. Cenários e limitações estão em [testes](../testes.md).

A suíte cobre conta, perfil, matching, chat entre sessões, agenda com disputa de horário, avaliação, mural e migração de chaves do seed. Testes no Edge passaram em desktop e mobile. Durante a validação, a parada intencional do PostgreSQL isolado causou 503 com a mensagem esperada. O mesmo processo Node voltou a responder 200 após a volta do banco.

O envio ao GitHub transfere código e documentação. Para dados de usuários, use [backup privado](../banco-de-dados.md#backup-e-restauração-privados). Visibilidade do remoto depende de consulta autenticada ao GitHub. A validação local usou dois contextos no mesmo navegador, e o teste entre dispositivos físicos permanece aberto.

A próxima tarefa recomendada é **IF-10** em [NEXT_STEPS.md](NEXT_STEPS.md). Use o [mapa](PROJECT_MAP.md) e a [API](../api.md) para localizar os contratos.
