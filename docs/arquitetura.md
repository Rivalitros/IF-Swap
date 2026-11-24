# Arquitetura

O IF Swap usa dois processos locais. O navegador abre o React pelo servidor do Vite. Esse servidor aplica o proxy para rotas `/api` e `/socket.io` no Express. O Vite usa `WEB_PORT` e repassa as requisições para `PORT` em loopback. O Node.js é o único processo da aplicação que abre conexões com o PostgreSQL.

| Camada | Responsabilidade |
|---|---|
| `frontend/src/App.jsx` e `Layout.jsx` | Sessão, roteamento, navegação responsiva e avisos |
| `frontend/src/pages/` | Login, perfil, sugestões, chat, agenda e mural |
| `frontend/src/api.js` e `realtime.jsx` | Fetch JSON ou multipart e eventos Socket.IO |
| `backend/src/app.js` e `server.js` | Composição HTTP, bootstrap do banco, erros, origem, sessões e ciclo da agenda |
| `backend/src/routes/` | Validação de entradas e tradução HTTP |
| `backend/src/services/` | Hash de senha, sessão e gestão de perfil |
| `backend/src/repositories/` | Consultas parametrizadas, regras transacionais e reconstituição de resultados |
| `backend/src/realtime.js` | Sessão do socket, salas de conta e conversa, presença e confirmações |
| `backend/database/` | Migrações com lock consultivo e dados fictícios opcionais |

A sessão usa um token aleatório em cookie HttpOnly e guarda o hash e a expiração no PostgreSQL. As senhas recebem salt individual e hash scrypt. O mesmo login autoriza Socket.IO e REST. Os perfis públicos exibem nome, foto, setor, habilidades e reputação, enquanto e-mail é restrito à própria sessão.

A mensagem é gravada em transação antes do acknowledgement. O UUID do cliente torna reenvios idempotentes. Salas de conta levam mensagens e mudanças da agenda a várias abas, salas de conversa limitam digitação aos participantes inscritos e a API recupera o histórico quando um cliente volta. O calendário usa intervalos com fim exclusivo. Os participantes são bloqueados em ordem estável na transação de escrita para evitar duas reservas simultâneas.

A UI é servida localmente em HTTP. Plus Jakarta Sans é empacotada pelo Vite. O GitHub recebe código e documentação. Para uma futura implantação, o proxy deve preservar a mesma origem e oferecer HTTPS, e o armazenamento de fotos deve ter volume persistente e uma política de restauração. Veja [API](api.md), [banco](banco-de-dados.md) e [roadmap](roadmap.md).
