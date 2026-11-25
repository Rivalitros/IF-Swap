# Revisão das referências do IF Swap

Os sete arquivos de `README/` foram revistos antes da retomada. O DER e as 13 páginas do protótipo foram renderizados e examinados visualmente, assim como as páginas do formulário de casos de uso e o Canvas. Os DOCX foram lidos pelo conteúdo XML e o TXT diretamente. O Canvas é o arquivo `BMC_IF_Swap.pdf` e o protótipo é `IF_Swap_Telas.pdf`, conforme os nomes entregues.

| Referência | Requisito aplicado | Comparação no checkpoint de matching |
|---|---|---|
| Formulário de definição | Troca gratuita, membros da escola, perfil com foto, até cinco habilidades por tipo, matching, agenda, avaliação mútua e mural | Contas, perfis e matching implementados. Agenda, avaliação e mural pendentes. Sem pagamentos. |
| Pesquisa de projetos e Canvas | Chat sem expor contatos, notificações, ranking e proposta de moderação | Sessões locais com scrypt, equivalentes à finalidade de autenticação proposta. Moderação institucional integra a fase 4 do prompt mestre. |
| Casos de uso 1 e 2 | Perfil preenchido, listas cruzadas e visualização da reputação | Matching usa interseções normalizadas no banco e prioriza reciprocidade. O cadastro local declara o vínculo escolar, sem validação institucional. |
| Casos de uso 3 e 4 | Interesse mútuo para agenda, contraproposta, reserva no calendário de ambos e solicitação de avaliação após o fim | Match existente ainda não distingue a reciprocidade para agendar. Implementar a regra na API e validar as transições temporalmente. |
| DER e modelo lógico | Dois participantes por match, mensagem lida, modalidade, até duas avaliações por encontro e respostas encadeadas | Par ordenado e view substituem a tabela de associação. `read_at` representa lida. Modalidade e FK para match seguem o DER. Unicidade por encontro/autor resolve o conflito do TXT com a avaliação mútua. A resposta pai usa FK composta para o mesmo desafio. |
| Figma, páginas 1–6 e 10 | Login/cadastro com cartão branco sobre fundo creme, cabeçalho móvel, navegação inferior, barra de busca, sugestões com duas direções de troca, estrelas e botões arredondados | Login dividido com painel verde, sidebar de altura total, chip adicional de compatibilidade e avaliação de uma estrela divergem. |
| Figma, páginas 7–9 e 11–13 | Barra de três segmentos, foto centralizada, chips preenchidos no ensino e contornados no aprendizado, controles abaixo do cartão no mobile | Onboarding funcional usa etapas numeradas, foto lateral e chips idênticos. |
| Figma, navegação | Sugestões, Conversas, Agenda, Mural e Meu perfil | Menu parcial. As páginas internas de Conversas, Agenda e Mural não estão representadas no PDF. Usar a identidade dos componentes documentados. |

## Adaptação e conferência

O React foi ajustado para o cartão central de autenticação, as três barras de onboarding, a foto central, os chips de ensino e aprendizado, o menu interno em desktop e inferior no celular e os cartões de sugestões com cinco estrelas e as duas direções. O cadastro inclui o vínculo escolar requerido pelo prompt. Os exemplos são dados fictícios do PostgreSQL. Os estados de erro, vazio e carregamento, a busca e a indicação de troca unidirecional complementam o PDF.

Em Edge, foram capturadas as telas de login, cadastro, etapas de configuração e sugestões em 1440×900 e 390×844. A conferência foi feita sobre a geometria dos componentes, navegação, ordem visual, estados e hierarquia. As páginas internas do chat, agenda e mural foram montadas com os mesmos componentes e tokens.

### Revisão para versionamento

Os formulários, PDFs e protótipo contêm combinações de nomes, turma, contatos pessoais ou metadados de autoria. Seus originais ficam em `README/` no computador e são preservados integralmente. O TXT com o modelo relacional foi revisado e versionado com os bytes do original. Em outro computador, obtenha os demais documentos pelo canal privado acadêmico e coloque-os em `README/`. A síntese nesta página permite continuar sem contatos pessoais ou reprodução dos protótipos em Git.

Na retomada a partir de `af22dd3`, esta cópia de `README/` continha somente `mudanca_mod_logico.txt`. O TXT foi relido e a comparação anterior foi consultada para as demais referências.
