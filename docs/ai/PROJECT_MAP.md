# Mapa do projeto

- Login/cadastro, onboarding e sugestões ajustados em `frontend/src/`. A migração `002_normalize_demo_skills.sql` reconcilia chaves antigas.

- Avaliação em `backend/src/routes/reviews.js`, mural em `backend/src/routes/challenges.js` e `frontend/src/pages/Challenges.jsx`. A API calcula média e posição do perfil.

- As regras de interesse mútuo, janela de tempo e conflitos estão em `backend/src/repositories/agenda.js`; o calendário em `frontend/src/pages/Agenda.jsx`.

- O React usa `frontend/src/pages/Chat.jsx` e `frontend/src/realtime.jsx`. A API e o contrato estão em `backend/src/realtime.js` e `docs/api.md`.

- `README/` é a fonte acadêmica e visual. `docs/revisao-academica.md` documenta rastreabilidade e limitações de compartilhamento. `docs/casos-de-uso.md` e `docs/roadmap.md` orientam a implementação.

- A consulta PostgreSQL em `backend/src/repositories/matching.js` classifica compatibilidades. O frontend exibe perfis, avaliação e ações a partir dos dados da API.

- Os contratos de conta e perfil estão em `docs/api.md`. O React inicia o onboarding em três etapas após cadastro e retoma do passo persistido.

- O schema e o seed ficam em `backend/database/`. A API usa o pool em `backend/src/db.js`.

- O frontend em `frontend/` usa o proxy Vite para a API em `backend/`. O arquivo `.env.example` documenta a configuração inicial.

- `AGENTS.md` contém as regras de continuidade e versionamento.
- `docs/ai/` mantém estado, decisões e pendências.
