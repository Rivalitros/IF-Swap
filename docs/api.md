# API local

O React acessa o mesmo origin do navegador pelo proxy Vite. Os recursos usam JSON e o prefixo `/api`. O cadastro e o login retornam o perfil da sessão e definem `if_swap_session`, cookie HttpOnly, SameSite=Lax com validade de sete dias. Envie o cookie em requisições autenticadas.

| Método e caminho | Sessão | Entrada e retorno |
|---|---|---|
| GET /health | Livre | `{ "status": "ok", "database": "online" }` |
| POST /auth/register | Livre | `name, email, password, confirmation, department, affiliation`. Perfil, 201. |
| POST /auth/login | Livre | `email, password`. Perfil, 200. |
| POST /auth/logout | Opcional | Revoga a sessão e retorna 204. |
| GET /auth/me | Sim | Perfil com `skills.teach` e `skills.learn`. |
| PATCH /profile | Sim | `name, department, affiliation, is_public`. Perfil atualizado. |
| PUT /profile/photo | Sim | Multipart `photo`, PNG/JPEG/WebP até 3 MB. Perfil atualizado. |
| POST /profile/skills | Sim | `{ "kind": "teach", "name": "Violão" }`. Perfil atualizado. |
| DELETE /profile/skills/:kind/:id | Sim | Remove uma habilidade do tipo informado. Retorna perfil. |
| POST /profile/advance | Sim | `{ "step": 1 }` avança a etapa corrente correspondente. Retorna perfil. |
| GET /photos/:filename | Sim | Imagem de perfil local. |

`affiliation` aceita `aluno`, `professor` e `funcionario`. O tipo de habilidade é `teach` ou `learn`.

Erros HTTP usam `{ "error": "Mensagem legível." }`. Códigos usados incluem 400 (validação), 401 (sessão ausente ou inválida), 403 (origem ou ação proibida), 404 (recurso indisponível), 409 (conflito), 413 (limite do corpo), 500 (falha inesperada) e 503 (PostgreSQL indisponível).
