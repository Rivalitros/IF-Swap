# Próximos passos

- [x] Publicar o [passo a passo de instalação e execução no Windows](../como-rodar-localmente.md).
- [x] **IF-04 · Alta · Revisar originais.** Fonte `README/`. Critério de leitura dos sete documentos e de inspeção visual do Figma. Resultado em `docs/revisao-academica.md`.
- [x] **IF-05 · Alta · Finalizar chat.** Socket.IO, REST e React. Testes de autorização, reinício, deduplicação, presença, entrega e leitura.
- [x] **IF-06 · Alta · Entregar agenda local.** Depende do matching e chat. Testes de reciprocidade, duas reservas concorrentes, contraproposta e tempo.
- [x] **IF-07 · Alta · Avaliar encontros e publicar no mural.** Rotas `reviews.js` e `challenges.js`. Critérios de avaliação mútua, ranking, resposta encadeada e encerramento.
- [x] **IF-08 · Alta · Alinhar interface e dados de demonstração.** Depende do Figma em PDF. Verificação no Edge em duas larguras e teste da migração 002.
- [x] **IF-09 · Alta · Validar fase 1 e documentar a operação.** README, arquitetura, guia, roteiro de testes e commits por etapa.
- [x] Cobrir a fronteira do proxy Vite com teste automatizado de sessão, WebSocket, reconexão, histórico e agenda. [Testes](../testes.md).
- [x] Preparar `if_swap` e `if_swap_test` na instância local de 5432 e executar a suíte integrada.
- [ ] **IF-10 · Alta · Exercitar o modo LAN em dois dispositivos físicos.** Depende de rede autorizada e de `WEB_HOST` apontando para a interface de teste. Confirme o isolamento da API e do PostgreSQL pelo segundo dispositivo. Aceitação inclui login de ambas as contas, troca em tempo real, reconexão, aceite de agenda e confirmação nos dois calendários. [Roteiro LAN](../como-rodar-localmente.md#teste-em-dois-dispositivos).
- [ ] **IF-11 · Alta · Validar acessibilidade e uso escolar.** Depende de aquisição de feedback e testes de teclado, leitor de tela e larguras adicionais. Registre os resultados em `docs/testes.md` e corrija problemas reproduzíveis.
- [ ] **IF-12 · Média · Definir regras de moderação.** Proposta em Canvas e pesquisa. Dependências incluem definição de papéis, consentimento e fluxos. Critério de conclusão é plano revisado antes da implementação. Acompanhe em `docs/roadmap.md`.
