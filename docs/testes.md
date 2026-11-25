# Testes

## Execução

Em um PostgreSQL local, crie um banco exclusivo para testes cujo nome termine em `_test`. Com o usuário e a porta padrão, execute `createdb -h 127.0.0.1 -p 5432 -U postgres -W if_swap_test` ou crie o banco pelo pgAdmin. No `.env`, use `TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5432/if_swap_test` para reutilizar `PGPASSWORD`. Se a conta de testes tiver outra senha, inclua-a na URL com os caracteres reservados codificados. Cada teste integrado cria seu próprio schema, aplica migrações e remove apenas o schema que criou. O serviço local precisa estar iniciado. O seed é desnecessário para os testes automatizados.

```powershell
npm ci
npm test
npm run test:integration
npm run build
```

## Cenários automatizados

| Arquivo | Cenário |
|---|---|
| `passwords.test.js` | Salt scrypt independente, senha incorreta e normalização de acentos e espaços. |
| `integration/profile.test.js` | Saúde, cadastro, sessão, logout, validação de senha, upload, edição, onboarding e limite concorrente. |
| `integration/matching.test.js` | Reciprocidade, direção única, busca, visibilidade, criação simultânea do par e acesso. |
| `integration/chat.test.js` | Sessões simultâneas, autorização de sala, digitando, presença, idempotência, entrega, leitura, reinício e recuperação. |
| `integration/agenda.test.js` | Reciprocidade, participação, contraproposta, aceites concorrentes, evento Socket.IO, conclusão e cancelamento. |
| `integration/community.test.js` | Avaliação antes e depois do encontro, reputação, posição, prazo, resposta, réplica e encerramento de desafio. |
| `integration/migrations.test.js` | Migração de habilidades demonstrativas preserva vínculos e deduplica associações. |
| `frontend/test/proxy.test.js` | Vite encaminha login e sessão, conexão WebSocket com cabeçalho de origem, mensagem, reconexão com leitura do histórico e aceite da agenda. |

## Retomada no Windows

- Node.js 26.13.0 e npm 12.2.2. Instalação, dois testes unitários e build concluídos.
- PostgreSQL 19 isolado em loopback na porta 55432. Dois setups, migrações 001 e 002, dois seeds e sete testes integrados aprovados.
- PostgreSQL instalado na porta 5432. Setup e registro das migrações 001 e 002 verificados em `if_swap`. Sete testes integrados aprovados no banco separado `if_swap_test`.
- A regressão do proxy usou duas sessões na mesma máquina para verificar REST e Socket.IO via Vite.

## Validação da rede local

- Em 24 de novembro de 2026, o usuário confirmou a conclusão da **IF-10** em dois dispositivos físicos. O roteiro cobre login de duas contas, chat em tempo real, reconexão, aceite de agenda e confirmação nos dois calendários, além do isolamento das portas diretas da API e do PostgreSQL. [Roteiro LAN](como-rodar-localmente.md#teste-em-dois-dispositivos).

## Login e conversas recentes

- No Edge, a senha iniciou mascarada. O botão alternou a visibilidade por clique e teclado, preservou o texto digitado e permitiu concluir o login. O cadastro pela interface também foi verificado com conta fictícia no banco de testes.
- Uma mensagem de 2.000 caracteres sem espaços foi enviada via Socket.IO. Em 320, 390, 701 e 1.440 pixels, a prévia exibiu reticências e manteve o contador de não lidas dentro do cartão. O texto completo foi conferido ao abrir a conversa.
- Dois testes unitários, sete integrados e build concluídos.

## Avaliação por estrelas

- No Edge, em 320 e 1.440 pixels, as estrelas das sugestões abriram a avaliação no perfil e a Agenda permitiu avaliar pelo cartão do encontro.
- O perfil listou somente os encontros concluídos e ainda disponíveis com a pessoa selecionada. Com mais de um encontro, foi possível escolher qual avaliar.
- A seleção funcionou por clique e teclado. O envio com comentário multilinha atualizou a média e exibiu o comentário no perfil. O envio sem comentário e a rejeição de uma avaliação duplicada foram verificados.
- Dois testes unitários, sete integrados e build concluídos.

## Verificações da fase 1

- Dois testes unitários e seis integrados executados com sucesso. Usado PostgreSQL local isolado com dados fictícios.
- Instalação das dependências, setup e seed repetidos e build Vite concluído.
- O PostgreSQL de validação foi interrompido e retomado. O mesmo servidor Express respondeu 503 com a mensagem de banco indisponível e depois 200 em `/api/health`.
- Validação no Edge em 1440×900 e 390×844, com inspeção das telas comparadas aos PDFs. Fluxos executados de login, cadastro, onboarding e matching.
- Duas sessões no mesmo computador trocaram mensagem com aviso e confirmação de leitura, criaram e aceitaram proposta e utilizaram o mural. A avaliação foi enviada na agenda em largura móvel e seu comentário apareceu no perfil. O teste de avaliação mútua foi feito na API.
- A pesquisa de uso com a comunidade faz parte da IF-11. [Próximos passos](ai/NEXT_STEPS.md).
