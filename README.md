# IF Swap

O IF Swap é a plataforma de troca de habilidades do grupo 3 do Projeto Integrador do curso Técnico em Informática Integrado ao Ensino Médio do IFSP Campus Barretos. A comunidade escolar reúne pessoas que sabem ensinar e querem aprender, mas precisam de um espaço para descobrir interesses em comum e combinar encontros gratuitos.

O projeto atende estudantes, docentes e funcionários. Seus objetivos são facilitar a descoberta de habilidades, conectar perfis complementares, organizar encontros presenciais ou online, construir reputação por avaliação mútua e permitir pedidos de ajuda com prazo.

## O que você pode fazer

- Criar uma conta, configurar o perfil em três etapas e escolher até cinco habilidades que ensina e cinco que quer aprender.
- Buscar perfis compatíveis, identificar as duas direções da troca, consultar avaliações e iniciar uma conversa.
- Conversar em tempo real com histórico, presença, digitação e estados de entrega e leitura.
- Propor um encontro entre perfis com interesse mútuo, apresentar contraproposta e consultar os compromissos no calendário.
- Avaliar o par após o fim de um encontro concluído e consultar a reputação no perfil.
- Publicar desafios, responder, replicar respostas e acompanhar o prazo.

As telas de entrada, configuração e sugestões usam a referência Figma do grupo. A navegação fica na lateral em desktop e no rodapé em telas pequenas. Consulte o [guia do usuário](docs/guia-do-usuario.md).

## Arquitetura e diretórios

React com Vite e React Router renderiza as telas. O navegador usa Fetch e Socket.IO Client. O Vite encaminha chamadas ao Node.js com Express e Socket.IO, e somente o backend acessa o PostgreSQL por `pg`. O servidor guarda fotos na pasta local de uploads e usa sessões persistidas. O projeto utiliza JavaScript, CSS3, HTML5 e Plus Jakarta Sans fornecida por dependência local.

| Caminho | Conteúdo |
|---|---|
| `frontend/` | Aplicação React e configuração do Vite |
| `backend/src/` | API REST, Socket.IO, sessão, serviços e repositórios |
| `backend/database/` | Migrações SQL, setup e seed de demonstração |
| `backend/test/` | Testes unitários e de integração |
| `README/` | Referências acadêmicas locais e modelo lógico |
| `docs/` | [Arquitetura](docs/arquitetura.md), [API](docs/api.md), [banco](docs/banco-de-dados.md), [casos de uso](docs/casos-de-uso.md), [revisão](docs/revisao-academica.md) e continuidade em `docs/ai/` |
| `AGENTS.md` | Regras de manutenção, documentação e versionamento |

## Instalação no VS Code

Para a primeira instalação no Windows, siga o [passo a passo para rodar o IF Swap localmente](docs/como-rodar-localmente.md).

1. Instale uma versão LTS do Node.js a partir da 22.12, com npm. Reabra o terminal e confira com `node --version` e `npm --version`. [Download oficial do Node.js](https://nodejs.org/en/download)
2. Instale e inicie o serviço PostgreSQL no próprio computador. Tenha em mãos a porta, o usuário PostgreSQL e sua senha. No Windows, o instalador disponibiliza o servidor e o pgAdmin. [Instalação oficial do PostgreSQL no Windows](https://www.postgresql.org/download/windows/)
3. Abra a raiz do repositório no VS Code. Para continuar em outro computador, clone o repositório e abra a pasta clonada.

```powershell
git clone https://github.com/Rivalitros/IF-Swap.git
cd IF-Swap
npm ci
Copy-Item .env.example .env
```

Se a pasta já estiver aberta, comece em `npm ci`. Em Linux ou macOS, use `cp .env.example .env`. No `.env`, mantenha `PGHOST=127.0.0.1`, ajuste `PGPORT`, `PGUSER` e `PGPASSWORD` para a instância local e escolha `PGDATABASE`, cujo padrão é `if_swap`.

```powershell
npm run setup
npm run dev
```

Acesse **http://127.0.0.1:5173**. A API ouve em `127.0.0.1:3001` por padrão. Para rodar em terminais separados, use `npm run dev:api` e `npm run dev:web`. `npm run build` gera os arquivos estáticos em `frontend/dist/`; o fluxo documentado para usar a aplicação completa localmente é `npm run dev`.

O setup cria o banco se o usuário PostgreSQL tiver permissão. Quando não tiver, crie o banco informado em `PGDATABASE` pelo pgAdmin ou peça sua criação ao administrador, atribuindo a propriedade ao usuário configurado. Depois execute o setup novamente. O backend verifica a conexão na inicialização e aplica migrações pendentes em um banco já criado.

### Demonstração fictícia

```powershell
npm run seed
```

| Conta | Ensina | Quer aprender |
|---|---|---|
| `ana@demo.invalid` | Programação | Violão |
| `bruno@demo.invalid` | Violão | Programação |
| `clara@demo.invalid` | Matemática | Inglês |
| `diego@demo.invalid` | Inglês | Matemática |

A senha fictícia das quatro contas é `TrocaLocal123!`. Ana e Bruno já têm conversa, encontro concluído e avaliação de exemplo. Há também um desafio com resposta. O seed fica separado das migrações e pode ser repetido sem duplicar esses registros.

### Outra máquina na rede local

Com o firewall e as regras da rede permitindo, defina `WEB_HOST=0.0.0.0` em `.env`, reinicie o Vite e acesse `http://IP-DO-COMPUTADOR:5173` no outro dispositivo. Mantenha o backend e o PostgreSQL em loopback. O Vite encaminha API e Socket.IO pelo mesmo endereço usado pelo navegador.

## Testes

```powershell
npm test
npm run test:integration
npm run build
```

Antes dos testes integrados, crie um banco local com nome terminado em `_test` e defina `TEST_DATABASE_URL` no `.env`. As instruções e os resultados ficam em [testes](docs/testes.md).

## Solução de problemas

- **Erro ao iniciar o banco.** Inicie o serviço PostgreSQL, revise as variáveis `PG*` e execute `npm run setup`. A API tenta usar novamente o PostgreSQL quando o serviço retorna.
- **Porta ocupada.** Ajuste `PORT` ou `WEB_PORT` no `.env` e reinicie `npm run dev`. O Vite lê a mesma porta da API.
- **Sem sugestões.** Complete as três etapas e adicione habilidades. Os perfis elegíveis vêm do banco. A demonstração oferece dois pares recíprocos.
- **Agenda rejeitada.** Verifique se os dois perfis ainda têm interesse mútuo, se o horário é futuro e se a janela está livre para ambos.
- **Ambiente em outro computador.** O clone reconstrói o schema e os dados fictícios com setup e seed. Para dados reais, use o procedimento privado de backup e restauração descrito na [documentação do banco](docs/banco-de-dados.md).

## Limites e continuidade

A recuperação de senha é demonstrativa. O cadastro permite declarar o vínculo escolar, e a autenticação institucional está fora da fase local. A operação entre dois dispositivos físicos depende da rede e do firewall. O painel administrativo, as notificações externas e a preparação para operação online são etapas futuras. Consulte o [roadmap](docs/roadmap.md) e o [handoff](docs/ai/HANDOFF.md).

Créditos ao grupo 3 do Projeto Integrador, responsáveis pelo projeto acadêmico e pelos protótipos. A identificação completa consta nos originais acadêmicos preservados em `README/`.
