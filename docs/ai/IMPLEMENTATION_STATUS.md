# Estado da implementação

A fase 1 está funcional em ambiente local. **TESTADO** indica execução real. Os resultados por camada e os limites estão em [testes](../testes.md).

O [guia de instalação no Windows](../como-rodar-localmente.md) cobre a primeira configuração, a inicialização diária e a verificação de saúde.

| Área | Frontend | Backend e banco | Verificação e critério |
|---|---|---|---|
| Referências acadêmicas | TESTADO · 13 páginas Figma confrontadas com o React | TESTADO · DER, modelo, formulários, Canvas e divergências documentados | [Revisão](../revisao-academica.md). Originais identificáveis preservados localmente. |
| Setup | TESTADO · Vite e build no Windows | TESTADO · `/api/health`, migrações 001/002, seed separado | Setup e seed repetidos em instância isolada. Senha pendente na instância local de 5432. |
| Conta, perfil e habilidades | TESTADO · login, cadastro, três etapas e perfis | TESTADO · `/api/auth`, `/api/profile` e fotos em disco. `users`, `sessions`, `skills`, `user_skills` | Duas larguras na UI. API cobre senha, foto, vínculo, privacidade e limite concorrente de habilidades. Recuperação demonstrativa. |
| Matching | TESTADO · busca, cartões e iniciar conversa | TESTADO · `/api/suggestions`, `/api/users/:id`, `/api/matches`. `matches` e `match_participants` | Ordenação recíproca, par único, visibilidade e normalização. |
| Chat | TESTADO · duas sessões e aviso, chat/recibos | TESTADO · Socket.IO e `/api/matches/:id/messages`. `messages` | Acesso, presença, digitação, idempotência, persistência, logout e reinício. A regressão pelo proxy Vite passou. LAN em dois dispositivos segue como refinamento. |
| Agenda | TESTADO · proposta e aceite entre sessões | TESTADO · `/api/agenda`, aviso Socket.IO, tabela `appointments` | Reciprocidade, concorrência, alterações, conclusão, cancelamento e recuperação do estado. |
| Avaliações | TESTADO · envio na agenda móvel e comentário no perfil | TESTADO · `POST /api/agenda/:id/reviews`, tabela `reviews` | API valida avaliações mútuas, unicidade, prazo, média e ranking. |
| Mural | TESTADO · publicação e resposta na UI | TESTADO · `/api/challenges` e subrotas. `challenges` e `challenge_replies` | Teste cobre filtro, prazo, autorização, resposta pai e encerramento. |
| Documentação e Git | TESTADO · revisão de novos fluxos | TESTADO · checkpoints enfileirados na branch principal com push | Confirmar head remoto com `git ls-remote origin refs/heads/main`. |
| Infraestrutura, moderação e expansão | NÃO INICIADO | NÃO INICIADO | Fases posteriores, conforme [roadmap](../roadmap.md). |
