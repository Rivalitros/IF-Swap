# Testes

## Execução

Em um PostgreSQL local, crie um banco exclusivo para testes cujo nome termine em `_test`. Configure o `TEST_DATABASE_URL` em `.env` usando a conta local e esse banco. Cada teste integrado cria seu próprio schema, aplica migrações e remove apenas o schema que criou. O serviço local precisa estar iniciado. O seed é desnecessário para os testes automatizados.

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

## Verificação desta versão

- Dois testes unitários e seis integrados executados com sucesso. Usado PostgreSQL local isolado com dados fictícios.
- Instalação das dependências, setup e seed repetidos e build Vite concluído.
- O PostgreSQL de validação foi interrompido e retomado. O mesmo servidor Express respondeu 503 com a mensagem de banco indisponível e depois 200 em `/api/health`.
- Validação no Edge em 1440×900 e 390×844, com inspeção das telas comparadas aos PDFs. Fluxos executados de login, cadastro, onboarding e matching.
- Duas sessões no mesmo computador trocaram mensagem com aviso e confirmação de leitura, criaram e aceitaram proposta e utilizaram o mural. A avaliação foi enviada na agenda em largura móvel e seu comentário apareceu no perfil. O teste de avaliação mútua foi feito na API.
- O ambiente LAN com dois dispositivos físicos e a pesquisa de uso com a comunidade estão na próxima fase.
