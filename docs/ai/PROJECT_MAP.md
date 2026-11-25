# Mapa do projeto

| Caminho | Papel |
|---|---|
| `README/` e `docs/revisao-academica.md` | Originais acadêmicos e comparação com o código |
| `package.json` e `.env.example` | Workspaces, scripts e configuração da aplicação local |
| `frontend/vite.config.js` | Proxy da API e WebSocket para o processo Express |
| `frontend/src/App.jsx` e `Layout.jsx` | Sessão do React, roteador, navegação e avisos |
| `frontend/src/pages/Auth.jsx` e `Profile.jsx` | Entrada, criação de conta e configuração do perfil |
| `frontend/src/pages/Suggestions.jsx` | Cards, busca, reputação e perfil visível |
| `frontend/src/pages/Chat.jsx` e `realtime.jsx` | Histórico de conversa, envio, presença, digitação, recibos e reconexão |
| `frontend/src/pages/Agenda.jsx` e `Challenges.jsx` | Calendário, proposta, avaliação, mural e réplicas |
| `backend/src/app.js` e `server.js` | Composição do servidor, middleware, migrações na inicialização e relógio da agenda |
| `backend/src/realtime.js` | Socket.IO no servidor HTTP, autenticação e eventos |
| `backend/src/routes/` | Rotas de contas, perfil, matching, chat, agenda, avaliação e mural |
| `backend/src/repositories/` | Consultas, idempotência, agrupamento, autorização e transações |
| `backend/src/services/` | Senhas, sessões e perfil |
| `backend/database/` | Setup, migração, seeds e queries SQL de demonstração |
| `backend/test/` | Regressões unitárias e testes com PostgreSQL e Socket.IO reais |
| `frontend/test/proxy.test.js` | Teste integrado de REST e Socket.IO pelo proxy real do Vite |

O React usa `/api` por Fetch e troca eventos no mesmo servidor por Socket.IO. A API acessa o pool PostgreSQL em `backend/src/db.js`. Contratos em [API](../api.md) e dependências em [arquitetura](../arquitetura.md).
