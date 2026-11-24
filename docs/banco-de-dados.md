# PostgreSQL local

A [migração inicial](../backend/database/migrations/001_initial.sql) é a fonte de verdade para colunas, tipos, índices e restrições. `npm run setup` cria o banco definido por `PGDATABASE`, quando permitido, e aplica migrações em transação com lock consultivo. `schema_migrations` registra cada arquivo aplicado. Para evoluir o schema, adicione um arquivo numerado. `npm run seed` inclui dados demonstrativos em uma transação separada.

| Modelo acadêmico | PostgreSQL | Relação e integridade |
|---|---|---|
| USUARIO | users | PK inteira. E-mail único em minúsculas. Curso/setor, vínculo, foto local, visibilidade e etapa de perfil. |
| HABILIDADE | skills | PK inteira. Nome normalizado único. Descrição e categoria opcionais. |
| USUARIO_HABILIDADE | user_skills | N:N, PK usuário/habilidade/tipo. Cinco posições únicas por tipo. O curso/setor vem do usuário. |
| MATCH e PARTICIPA | matches e view match_participants | Um par ordenado único de usuários. A view apresenta exatamente dois participantes por match. |
| MENSAGEM | messages | FK para match e remetente. UUID idempotente por match/remetente. Datas de recepção e leitura opcionais. |
| AGENDAMENTO | appointments | FK para match e proponente, intervalo com começo e fim, local, modalidade e estado. |
| AVALIACAO | reviews | FK para encontro, autor e destinatário. Nota inteira de 1 a 5, unicidade por encontro/autor. |
| MURAL_DESAFIO | challenges | FK para autor, descrição, prazo e estado. |
| RESPOSTA_MURAL | challenge_replies | FKs para autor e desafio. FK composta garante que a resposta pai pertença ao mesmo desafio. |
| Sessão técnica | sessions | Hash do token como PK, FK para usuário e expiração. |

A reputação é calculada pela média das notas recebidas. As autorizações por participante, transições de estado e conflitos de intervalos pertencem à API. A comparação com os documentos originais permanece pendente.
