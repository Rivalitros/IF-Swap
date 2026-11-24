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

## Sugestões e perfis

| Método e caminho | Entrada e retorno |
|---|---|
| GET /suggestions?q= | Pesquisa opcional por pessoa, setor ou habilidade. Retorna até 100 perfis compatíveis com direção de troca, reputação e contagem. |
| GET /users/:id | Perfil visível, habilidades e até 50 avaliações recebidas. |
| POST /matches | `{ "userId": 2 }`. Cria ou recupera o match único do par. Uma nova conversa requer sugestão compatível. |
| GET /matches/:id | `{ "id": 1, "peer": { "id": 2, "name": "Bruno" } }`, com os demais campos do perfil básico. Acesso pelo par. |

## Conversas

| Método e caminho | Entrada e retorno |
|---|---|
| GET /matches | Conversas recentes do usuário, par, última mensagem e contador de não lidas. |
| GET /matches/:id/messages?before= | Até 50 mensagens em ordem ascendente. `next` é o cursor para uma página anterior, ou `null`. |

Socket.IO usa o cookie da sessão na mesma origem. Eventos de cliente usam acknowledgement `{ ok: true, data }` ou `{ ok: false, status, error }`. Cada operação valida sessão e pertencimento à conversa. Salas de conta encaminham eventos somente aos envolvidos.

| Cliente → servidor | Payload e resultado |
|---|---|
| chat:join / chat:leave | `{ matchId }`. A entrada retorna `{ peerId, online }`. |
| chat:send | `{ matchId, clientId, content }`. UUID gerado no cliente e texto de até 2000 caracteres. A resposta contém a mensagem persistida. Repetir o UUID com o mesmo texto retorna a mesma mensagem. |
| chat:delivered / chat:read | `{ matchId, ids }`, de 1 a 50 IDs. Marca mensagens recebidas do outro participante e retorna `{ updated }`. |
| chat:typing | `{ matchId, active }`. Requer entrada na sala. |

O servidor emite `chat:message` com o objeto persistido, `chat:receipt` com `{ matchId, messages }`, `chat:presence` com `{ userId, online }` e `chat:typing` com `{ matchId, userId, active }`. São três estados de mensagem. **Enviada** significa commit no banco. **Recebida** significa confirmação de uma sessão do destinatário. **Lida** significa carregada em uma conversa aberta e com a aba visível. Após reconectar, o cliente recarrega o histórico PostgreSQL e novas páginas podem ser consultadas; o Socket.IO sozinho não garante recuperação de eventos perdidos.

## Agenda

| Método e caminho | Entrada e retorno |
|---|---|
| GET /agenda | Encontros da sessão com par, horário, estado e indicador de avaliação. |
| POST /agenda | `{ matchId, startsAt, endsAt, location, modality }`. Retorna proposta em estado pendente, 201. Instantes ISO 8601 com offset. Modalidade `presencial` ou `online`. |
| PATCH /agenda/:id | `{ action }`, com `accept`, `decline`, `cancel`, `start` ou `complete`. Para `change`, acrescente o novo intervalo, local, modalidade e `reason` opcional. |

As propostas e aceitações exigem interesse mútuo. Só o outro participante responde à proposta ou apresenta contraproposta. O aceite reserva o intervalo nos dois calendários. Hora final exclusiva permite encontros contíguos. Um encontro confirmado ou em andamento é concluído pelo relógio do servidor após o fim. O evento `agenda:update` entrega `{ id, matchId, status }` aos participantes após persistência. A agenda recupera estados após reconexão.

## Avaliações e mural

| Método e caminho | Entrada e retorno |
|---|---|
| POST /agenda/:id/reviews | `{ "rating": 5, "comment": "Aprendi bastante." }`. Nota inteira de 1 a 5 e comentário opcional até 1000 caracteres. 201 uma vez por participante, após conclusão e fim do horário. |
| GET /users/:id | Também contém `rank`, posição entre os perfis públicos avaliados, por média real e quantidade de notas. |
| GET /challenges?status=&before= | Filtro opcional `aberto` ou `encerrado` e cursor opcional. Retorna `{items,next}` com até 30 desafios. |
| POST /challenges | `{ "description": "Preciso praticar funções.", "deadline": "2026-12-10" }`. Prazo em ISO e a partir do dia atual do PostgreSQL. Retorno 201 com ID. |
| GET /challenges/:id/replies | Retorna respostas ativas, com `parent_id` nulo para raízes. |
| POST /challenges/:id/replies | `{ "message": "Posso enviar exercícios.", "parentId": 12 }`. Pai opcional e do mesmo desafio. |
| PATCH /challenges/:id/close | Fecha desafio do solicitante. O prazo expirado ou encerramento impede novas respostas. |
