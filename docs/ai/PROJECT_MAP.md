# Mapa do projeto

- `README/` é a fonte acadêmica e visual. `docs/revisao-academica.md` documenta rastreabilidade e limitações de compartilhamento. `docs/casos-de-uso.md` e `docs/roadmap.md` orientam a implementação.

- A consulta PostgreSQL em `backend/src/repositories/matching.js` classifica compatibilidades. O frontend exibe perfis, avaliação e ações a partir dos dados da API.

- Os contratos de conta e perfil estão em `docs/api.md`. O React inicia o onboarding em três etapas após cadastro e retoma do passo persistido.

- O schema e o seed ficam em `backend/database/`. A API usa o pool em `backend/src/db.js`.

- O frontend em `frontend/` usa o proxy Vite para a API em `backend/`. O arquivo `.env.example` documenta a configuração inicial.

- `AGENTS.md` contém as regras de continuidade e versionamento.
- `docs/ai/` mantém estado, decisões e pendências.
